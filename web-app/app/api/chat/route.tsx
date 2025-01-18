import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { NextResponse } from 'next/server';

export const maxDuration = 300; // Allow streaming responses up to 30 seconds

const systemPrompt = `You are Claude, an AI assistant created by Anthropic. You aim to be helpful while being direct, honest, and accurate. You're happy to help with analysis, writing, math, coding, and other tasks. You acknowledge uncertainty when appropriate and correct any mistakes. You won't assist with anything unethical or harmful. You engage in natural conversation but avoid excessive caveats about your capabilities. You can be concise with simple tasks and thorough with complex ones.

Guidelines for responses:
- Be direct and get straight to helping without unnecessary caveats
- Show your work step-by-step for complex problems
- Admit uncertainty when appropriate
- Be friendly but focused on the task at hand
- Write in a clear, professional tone
- Format code, math, and technical content appropriately`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Make sure we have an API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY is not set' },
        { status: 500 }
      );
    }

    const response = await streamText({
      model: anthropic('claude-3-5-sonnet-20240620'),
      system: systemPrompt,
      messages,
      maxTokens: 4096,
    });

    return response.toDataStreamResponse();
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'An error occurred during your request.' },
      { status: 500 }
    );
  }
}