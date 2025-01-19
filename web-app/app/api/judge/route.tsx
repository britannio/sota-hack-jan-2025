import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { evaluationId } = await request.json()
        
        // Simulate judging delay
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Get supabase instance
        const supabase = await createClient()
        
        // Update the evaluation with mock judge results
        // TODO: Replace with actual judge logic
        await supabase
            .from('model_evaluation')
            .update({
                judge_critique_text: 'This is a mock critique',
                judge_pass: Math.random() > 0.5,
                judging: false
            })
            .eq('id', evaluationId)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Judge error:', error)
        return NextResponse.json({ error: 'Failed to judge' }, { status: 500 })
    }
}
