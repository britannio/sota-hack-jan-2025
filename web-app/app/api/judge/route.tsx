import { createClient } from '@/utils/supabase/server'
import { anthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { evaluationId } = await request.json()
    // Get model_evaluation
    const supabase = await createClient()
    const { data: modelEvaluation, error: modelEvaluationError } = await supabase
      .from('model_evaluation')
      .select('*')
      .eq('id', evaluationId)
      .single()
    if (modelEvaluationError) throw modelEvaluationError

    const projectId = modelEvaluation.project_id!
    const modelId = modelEvaluation.model_id!

    const { data: project, error: projectError } = await supabase
      .from('project')
      .select('judge_prompt')
      .eq('id', projectId)
      .single()
    if (projectError) throw projectError
    let judgePrompt = project.judge_prompt ??
      `The judge prompt is not set so make your best estimate for the correctness of this system output.
Ensure that you mention this in your critique message`


    const { data: syntheticData, error: synteticDataError } = await supabase
      .from('synthetic_data')
      .select('data')
      .eq('id', modelEvaluation.synthetic_data_id!)
      .single()
    if (synteticDataError) throw synteticDataError

    judgePrompt += judgePromptTrailing
      .replace('{{SYNTHETIC_DATA}}', syntheticData.data || "")
      .replace('{{MODEL_OUTPUT}}',
        modelEvaluation.model_output ?? 'NO OUTPUT PRODUCED BY THE MODEL')

    const response = await generateText({
      model: anthropic('claude-3-5-sonnet-latest'),
      messages: [
        { role: 'user', content: judgePrompt }
      ],
      maxTokens: 8192,
    })

    let critique = response.text
    // remove closing </critique>
    critique = critique.replace(/<\/critique>/, '')
    // parse the critique as json
    const critiqueJson = JSON.parse(critique)
    const critiqueMessage = critiqueJson.critique
    const pass = critiqueJson.outcome === 'good'

    await supabase
      .from('model_evaluation')
      .update({
        judge_critique_text: critiqueMessage,
        judge_pass: pass,
        judging: false
      })
      .eq('id', evaluationId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Judge error:', error)
    return NextResponse.json({ error: 'Failed to judge' }, { status: 500 })
  }
}


const judgePromptTrailing = `
Here are some example evaluations for a different task where a DSL is evaluated:

<examples>

<example-1>
<input>show me traces where ip is 10.0.2.90</input>
<output>
{
  "breakdowns": ["trace.trace_id"],
  "calculations": [{"op": "COUNT"}],
  "filters": [{"column": "net.host.ip", "op": "=", "value": "10.0.2.90"}]
}
</output>
<critique>
{
  "critique": "The query correctly filters for traces with an IP address of 10.0.2.90 
   and counts the occurrences of those traces, grouped by trace.trace_id. The response 
   is good as it meets the requirement of showing traces from a specific IP address 
   without additional complexities.",
  "outcome": "good"
}
</critique>
</example-1>

<example-2>
<input>show me slowest trace</input>
<output>
{
  "calculations": [{"column": "duration_ms", "op": "MAX"}],
  "orders": [{"column": "duration_ms", "op": "MAX", "order": "descending"}],
  "limit": 1
}
</output>
<critique>
{
  "critique": "While the query attempts to find the slowest trace using MAX(duration_ms) 
   and ordering correctly, it fails to group by trace.trace_id. Without this grouping, 
   the query only shows the MAX(duration_ms) measurement over time, not the actual 
   slowest trace.",
  "outcome": "bad"
}
</critique>
</example-2>

<example-3>
<input>count window-hash where window-hash exists per hour</input>
<output>
{
  "breakdowns": ["window-hash"],
  "calculations": [{"op": "COUNT"}],
  "filters": [{"column": "window-hash", "op": "exists"}],
  "time_range": 3600
}
</output>
<critique>
{
  "critique": "While the query correctly counts window-hash occurrences, the time_range 
   of 3600 seconds (1 hour) is insufficient for per-hour analysis. When we say 'per hour', 
   we need a time_range of at least 36000 seconds to show meaningful hourly patterns.",
  "outcome": "bad"
}
</critique>
</example-3>

</examples>

For the following language model program input and generated output, first write a detailed critique explaining your reasoning,
then provide a pass/fail judgment in the same format as above.
Note that the task differs from the examples above so the critique should be tailored to the task.

<input>
{{SYNTHETIC_DATA}}
</input>
<output>
{{MODEL_OUTPUT}}
</output>
<critique>`