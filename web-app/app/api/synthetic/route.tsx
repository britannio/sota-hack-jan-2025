// app/api/synthetic/route.ts
import { createClient } from '@/utils/supabase/server';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';

const systemPrompt = `You are a synthetic data generator. You output example queries based on the specific parameters (subdomains) that are given for the scenario. Aim to be as faithful and characteristic as possible to the parameters.`;

export async function POST(req: Request) {
  try {
    const { jsonContext, scenario, projectId } = await req.json();
    
    // Remove objectives from JSON context
    const contextWithoutObjectives = {
      ...jsonContext,
      dimensions: jsonContext.dimensions.map(dim => ({
        name: dim.name,
        subdimensions: dim.subdimensions,
        decision_logic: dim.decision_logic
      }))
    };

    const prompt = `Here's the JSON input describing the dimensions and their subdimensions you will generate an input for:
<json_input>
${JSON.stringify(contextWithoutObjectives, null, 2)}
</json_input>

Interpret this JSON input as follows:
1. The "dimensions" array contains objects representing different aspects of a scenario that you should use as context to inform your input generation.
2. Each dimension has a "name", "subdimensions" array, and "decision_logic" that acts as context for your input generation.
3. The "summary" provides an overview of the scenario and the context of these dimensions - this should provide context about what your synthetic generation will do.

Now, consider the following specific subdimensions that will define your output:
<subdimensions>${scenario}</subdimensions>

Your task is to create a synthetic input example based on these above subdimensions. The prompt should:
1. Generate a theoretical example synthetic input that is characterised well by the subdimensions.
2. Ensure this is around a paragraph or several hundred characters.
3. Tailor the input to the subdimensions with characteristic detail (differentiated from the other subdimensions).`;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY is not set' },
        { status: 500 }
      );
    }

    const result = await generateText({
      model: anthropic('claude-3-5-sonnet-20240620'),
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      maxTokens: 500,
    });

    const supabase = await createClient();
    const { error } = await supabase
      .from('synthetic_data')
      .insert([{
        project_id: projectId,
        data: result.text
      }]);

    if (error) {    
        return NextResponse.json(
            { error: 'Database insert failed' },
            { status: 500 }
        );
        }

    return NextResponse.json({ response: result.text });
  } catch (error) {
    console.error('Error in scenario processing:', error);
    return NextResponse.json(
      { error: 'An error occurred during scenario processing.' },
      { status: 500 }
    );
  }
}