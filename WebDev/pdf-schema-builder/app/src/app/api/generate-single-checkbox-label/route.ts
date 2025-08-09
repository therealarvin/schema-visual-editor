import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { aiLogger } from '@/lib/aiLogger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

interface SingleCheckboxLabelRequest {
  fieldName: string;
  intent: string;
  formType?: string;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = aiLogger.generateRequestId();
  let body: SingleCheckboxLabelRequest | undefined;
  
  try {
    body = await request.json();
    const { fieldName, intent, formType } = body;

    if (!fieldName || !intent) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log(`[${requestId}] Generating label for: ${fieldName}`);
    console.log(`[${requestId}] Intent: ${intent}`);

    const systemPrompt = `You are an AI assistant that creates clear, concise checkbox labels for forms. Your job is to transform a description of what a checkbox does into a simple, user-friendly label.

CRITICAL RULES:
1. Keep labels SHORT (1-5 words maximum)
2. Use action-oriented language when appropriate
3. Remove unnecessary words like "User", "Tenant", "Property" if context is clear
4. Use Title Case for labels
5. Make it crystal clear what selecting the checkbox means
6. Avoid technical jargon completely

COMMON PATTERNS:
- For notifications/timing: Use the timing directly (e.g., "Last day of month", "Weekly updates")
- For amenities/features: Just name the feature (e.g., "Swimming pool", "Parking")
- For agreements: Use "I agree to..." or just the action (e.g., "Receive newsletters")
- For yes/no: Use "Yes" or the positive action
- For payments: State who pays (e.g., "Tenant pays", "Included in rent")

${formType ? `Form Type: ${formType}` : ''}

RESPONSE FORMAT:
Return a JSON object with:
{
  "displayName": "Short Clear Label",
  "reasoning": "Brief explanation"
}`;

    const userPrompt = `Create a short, clear checkbox label based on this description:

Field Name: "${fieldName}"
What this checkbox means: "${intent}"

Generate a label that is:
1. Very short (1-5 words)
2. Crystal clear to any user
3. Action-oriented if applicable
4. Free of jargon

Examples of good labels:
- "Last day of month" (not "Send renewal notice on the last day of each month")
- "Swimming pool" (not "Property has a swimming pool available")
- "Parking included" (not "Parking space is included with rental")
- "Receive updates" (not "User agrees to receive email updates")`;

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const openAIRequest = {
      model: 'gpt-5-nano',
      messages,
      reasoning_effort: 'low' as const, // Simple task
      max_completion_tokens: 500, // Small response needed
    };

    console.log(`[${requestId}] Sending request to OpenAI with model: ${openAIRequest.model}`);
    
    let response;
    try {
      response = await openai.chat.completions.create(openAIRequest);
    } catch (openAIError) {
      console.error(`[${requestId}] OpenAI API error:`, openAIError);
      if (openAIError instanceof Error) {
        throw new Error(`OpenAI API error: ${openAIError.message}`);
      }
      throw openAIError;
    }
    
    console.log(`[${requestId}] OpenAI response received:`, {
      choices: response.choices?.length || 0,
      model: response.model,
      usage: response.usage
    });
    
    const result = response.choices?.[0]?.message?.content;
    
    if (!result) {
      console.error(`[${requestId}] Empty response from OpenAI:`, response);
      throw new Error('No response from AI - empty content');
    }

    let parsed;
    try {
      parsed = JSON.parse(result);
    } catch {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Invalid JSON response from AI');
      }
    }
    
    // Validate response
    if (!parsed.displayName) {
      throw new Error('Invalid response: missing displayName');
    }

    // Log successful request
    await aiLogger.logRequest({
      timestamp: new Date().toISOString(),
      requestId,
      request: {
        intent: intent,
        fieldType: 'checkbox-single',
        groupType: 'label-generation',
        hasScreenshot: false
      },
      response: {
        success: true,
        data: parsed
      },
      openAISent: openAIRequest,
      openAIReceived: response,
      duration: Date.now() - startTime
    });
    
    console.log(`[${requestId}] Generated label: "${parsed.displayName}" in ${Date.now() - startTime}ms`);
    
    return NextResponse.json(parsed);
  } catch (error) {
    console.error(`[${requestId}] Error generating label:`, error);
    
    await aiLogger.logError(requestId, error);
    
    // Return original field name as fallback
    return NextResponse.json({
      displayName: body?.fieldName || 'Checkbox',
      reasoning: 'Error occurred, using original field name',
      error: error instanceof Error ? error.message : 'Failed to generate label'
    }, { status: 200 }); // Return 200 with fallback
  }
}