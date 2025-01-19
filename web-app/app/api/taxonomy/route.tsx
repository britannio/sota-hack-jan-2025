import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';

const systemPrompt = `You will be converting specifications for a Language Model Program (LMP) into a structured JSON format. The specifications will be provided in a specific format, and your task is to organize this information into a JSON structure with predefined categories.

Follow these steps to convert the specifications into JSON:

1. Parse the input specifications, identifying the following sections:
    - Dimensions (numbered)
    - Subdimensions (bulleted under each dimension)
    - Decision Logic (for each dimension)
    - Objective (for each dimension)
    - Summary (at the end)
2. Create a JSON structure with the following top-level keys:
    - "dimensions": An array of dimension objects
    - "summary": A string containing the summary
3. For each dimension, create an object with the following structure:
{
  "name": "Dimension name",
  "subdimensions": ["subdimension1", "subdimension2", ...],
  "decision_logic": "Decision logic text",
  "objective": "Objective text"
}`;

export async function POST(req: Request) {
  try {
    const { taxonomy } = await req.json();
    console.log('Received taxonomy:', taxonomy);

    // Make sure we have an API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('Missing ANTHROPIC_API_KEY');
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY is not set' },
        { status: 500 }
      );
    }

    console.log('Generating text with Claude...');
    
    const result = await generateText({
      model: anthropic('claude-3-5-sonnet-20240620'),
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `${taxonomy}\n\nPlease convert these specifications into a JSON structure following the format described above.`
        }
      ],
      temperature: 0,
      maxTokens: 4096,
    });

    console.log('Claude response:', result.text);

    // Try to parse the response as JSON directly
    try {
      const parsedJson = JSON.parse(result.text);
      console.log('Successfully parsed JSON:', parsedJson);
      return NextResponse.json(parsedJson);
    } catch (parseError) {
      console.error('Initial JSON parse error:', parseError);
      
      // If direct parsing fails, try to find JSON in the response
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsedJson = JSON.parse(jsonMatch[0]);
          console.log('Successfully parsed JSON from match:', parsedJson);
          return NextResponse.json(parsedJson);
        } catch (matchParseError) {
          console.error('JSON match parse error:', matchParseError);
        }
      }
      
      return NextResponse.json(
        { error: `Failed to parse response as JSON: ${parseError.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in taxonomy API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred during your request.' },
      { status: 500 }
    );
  }
}