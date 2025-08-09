import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { aiLogger } from '@/lib/aiLogger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

interface CheckboxOption {
  fieldName: string;
  currentLabel?: string;
}

interface CheckboxLabelsRequest {
  checkboxOptions: CheckboxOption[];
  overallIntent: string;
  formType?: string;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = aiLogger.generateRequestId();
  
  try {
    const body: CheckboxLabelsRequest = await request.json();
    const { checkboxOptions, overallIntent, formType } = body;

    if (!checkboxOptions || !overallIntent) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log(`[${requestId}] Generating checkbox labels for ${checkboxOptions.length} options`);
    console.log(`[${requestId}] Overall intent: ${overallIntent}`);

    const systemPrompt = `You are an AI assistant that specializes in creating clear, user-friendly labels for checkbox options in forms. Your job is to transform technical field names into simple, understandable labels that everyday users can easily comprehend.

CRITICAL RULES:
1. ALWAYS create labels that are clear and jargon-free
2. Keep labels concise (1-4 words typically)
3. Use consistent capitalization (Title Case for options)
4. Make labels action-oriented when appropriate
5. For yes/no type fields, use "Yes" and "No" or similar clear opposites
6. For agreement fields, use phrases like "I agree" or "I accept"
7. Avoid technical terms, abbreviations, or legal jargon

CONTEXT AWARENESS:
- Consider the overall intent to understand what the checkbox group is asking
- Maintain consistency across related options
- Think about the user's perspective - what would make sense to them?

COMMON PATTERNS:
- For binary choices: "Yes" / "No"
- For agreements: "I agree to..." / "I accept..."
- For preferences: Use descriptive action phrases
- For selections: Use clear category names
- For time periods: Use natural language (e.g., "Morning", "Afternoon", "Evening")
- For frequency: "Daily", "Weekly", "Monthly", etc.

${formType ? `Form Type: ${formType}` : ''}

RESPONSE FORMAT:
Return a JSON object with a "labels" array containing objects with:
{
  "labels": [
    {
      "fieldName": "original_field_name",
      "displayName": "User Friendly Label",
      "reasoning": "Brief explanation of why this label was chosen"
    }
  ]
}`;

    const userPrompt = `Generate user-friendly display names for these checkbox options.

Overall Intent/Purpose: "${overallIntent}"

Checkbox Options to Label:
${checkboxOptions.map((opt, index) => 
  `${index + 1}. Field Name: "${opt.fieldName}"${opt.currentLabel ? ` (Current Label: "${opt.currentLabel}")` : ''}`
).join('\n')}

TASK:
1. Understand what the overall checkbox group is asking based on the intent
2. Create clear, simple labels for each option
3. Ensure labels work well together as a group
4. Make them understandable for someone with no technical knowledge

Remember: These labels will be shown to end users filling out a form, so they must be crystal clear and friendly.`;

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const openAIRequest = {
      model: 'gpt-5-nano',
      messages,
      reasoning_effort: 'low' as const, // Low is fine for simple label generation
      max_completion_tokens: 2000,
    };

    console.log(`[${requestId}] Sending request to OpenAI`);
    
    const response = await openai.chat.completions.create(openAIRequest);
    const result = response.choices?.[0]?.message?.content;
    
    if (!result) {
      throw new Error('No response from AI');
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
    
    // Validate response structure
    if (!parsed.labels || !Array.isArray(parsed.labels)) {
      throw new Error('Invalid response structure: missing labels array');
    }

    // Log successful request
    await aiLogger.logRequest({
      timestamp: new Date().toISOString(),
      requestId,
      request: {
        intent: overallIntent,
        fieldType: 'checkbox',
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
    
    console.log(`[${requestId}] Successfully generated ${parsed.labels.length} labels in ${Date.now() - startTime}ms`);
    
    return NextResponse.json(parsed);
  } catch (error) {
    console.error(`[${requestId}] Error in generate-checkbox-labels API:`, error);
    
    await aiLogger.logError(requestId, error);
    
    return NextResponse.json({
      labels: [],
      error: error instanceof Error ? error.message : 'Failed to generate labels'
    }, { status: 500 });
  }
}