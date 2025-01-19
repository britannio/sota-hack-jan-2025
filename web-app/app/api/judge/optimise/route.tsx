import { createClient } from '@/utils/supabase/server'
import { anthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { projectId } = await request.json()
        const supabase = await createClient()

        // 1. Get model_evaluation data (joined with synthetic_data)
        const { data: modelEvaluation, error: modelEvaluationError } = await supabase
            .from('model_evaluation')
            .select(`
        id,
        model_output,
        judge_critique_text,
        judge_pass,
        expert_critique_text,
        expert_pass,
        improved_output,
        synthetic_data (
          data
        )
      `)
            .eq('project_id', projectId)

        if (modelEvaluationError) {
            throw new Error(`Failed to fetch model evaluations: ${modelEvaluationError.message}`)
        }

        // Filter the data in JavaScript
        const filteredEvaluations = modelEvaluation.filter(evaluation => 
            evaluation.expert_critique_text || // has expert critique
            evaluation.improved_output || // has improved output
            evaluation.judge_pass !== evaluation.expert_pass // judge and expert disagree
        ).filter(evaluation => 
            evaluation.expert_critique_text !== '' // exclude empty expert critiques
        )

        // 2. Get current judge prompt from the project
        const { data: project, error: projectError } = await supabase
            .from('project')
            .select('judge_prompt')
            .eq('id', projectId)
            .single()

        if (projectError) {
            throw new Error(`Failed to fetch project: ${projectError.message}`)
        }


        const judgePrompt = project.judge_prompt ?? "You are an evaluator for an unknown model with advanced capabilities to judge whether the output produced is good or not."

        // 3. Supply data to LLM to generate new judge prompt
        const prompt = `You are an AI prompt optimization expert.
Based on the following evaluation data, suggest improvements to the judge prompt so that decisions it makes are more accurate and aligned with expert judgments.

Current judge prompt:
${judgePrompt}

Data samples where the expert either provided a critique, an improved output, or disagreed with the judge:
${filteredEvaluations.map(modelEvaluationToXmlPrompt).join('\n')}

Please analyze the cases where:
1. Expert provided critique (expert_critique_text)
2. Judge and expert disagreed on pass/fail (judge_pass != expert_pass)
3. Improved outputs were provided by a human domain expert.

Suggest specific improvements to the judge prompt to better align with expert judgments.
Start by thinking step by step in <thinking> tags then output the improved prompt in <prompt> tags.`


        const result = await generateText({
            model: anthropic('claude-3-5-sonnet-latest'),
            messages: [{ role: 'user', content: prompt }],
            maxTokens: 8192,
        })

        const resultText = result.text
        const improvedPrompt = resultText.match(/<prompt>([\s\S]*?)<\/prompt>/)?.[1]

        console.log(`IMPROVED PROMPT: ${improvedPrompt}`)


        // Update the project with the new judge prompt
        const { error: updateError } = await supabase
            .from('project')
            .update({ judge_prompt: improvedPrompt })
            .eq('id', projectId)

        if (updateError) {
            throw new Error(`Failed to update project: ${updateError.message}`)
        }

        return NextResponse.json({ success: true, improvedPrompt })
    } catch (error) {
        console.error('Judge error:', error)
        return NextResponse.json({ error: 'Failed to judge' }, { status: 500 })
    }
}


function modelEvaluationToXmlPrompt(modelEvaluation: any) {
    return `
    <model_evaluation>
        <model_output>${modelEvaluation.model_output ?? 'EMPTY'}</model_output>
        <judge_critique_text>${modelEvaluation.judge_critique_text ?? 'EMPTY'}</judge_critique_text>
        <judge_pass>${modelEvaluation.judge_pass ?? 'EMPTY'}</judge_pass>
        <expert_critique_text>${modelEvaluation.expert_critique_text ?? 'EMPTY'}</expert_critique_text>
        <expert_pass>${modelEvaluation.expert_pass ?? 'EMPTY'}</expert_pass>
        <improved_output>${modelEvaluation.improved_output ?? 'EMPTY'}</improved_output>
    </model_evaluation>
    `
}