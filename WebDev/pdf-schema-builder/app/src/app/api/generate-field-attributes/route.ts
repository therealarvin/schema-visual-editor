import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { aiLogger } from '@/lib/aiLogger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = aiLogger.generateRequestId();
  
  let body: any = {};
  
  try {
    body = await request.json();
    const { intent, fieldType, screenshot, pdfContext, groupType } = body;

    if (!intent || !fieldType || !groupType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Extract just the field names from pdfContext for the system prompt
    const fieldNames = pdfContext.map((f: { name: string }) => f.name).join(', ');
    
    const systemPrompt = `You are an AI assistant that generates form field attributes based on user intent. You must ALWAYS return valid JSON with at least the display_name field.

Rules:
1. Transform the user's intent into a clear QUESTION or descriptive label that anyone can understand
2. Display names should be phrased as questions when appropriate (e.g., "What is your phone number?" instead of just "phone")
3. Use simple, everyday language - avoid technical or real estate jargon
4. Make it conversational and friendly, as if asking a person to fill out a form
5. For yes/no fields, phrase as a question (e.g., "Do you have pets?" instead of "pets")
6. For information fields, be specific about what you're asking for
7. Keep questions concise but complete (typically 3-8 words)
8. Only add a description if additional clarification is needed beyond the question
9. Width should be 1-12 (grid units), with most fields being 6 or 12
10. Placeholders should be helpful examples, not instructions
11. ALWAYS return valid JSON with at least {"display_name": "..."}
12. The JSON must be parseable and contain display_name as a required field

Examples of good transformations:
- Intent: "phone" → Display: "What is your phone number?"
- Intent: "emergency contact" → Display: "Who should we contact in an emergency?"
- Intent: "move in date" → Display: "When would you like to move in?"
- Intent: "smoking" → Display: "Do you smoke?"
- Intent: "monthly income" → Display: "What is your monthly income?"
- Intent: "previous address" → Display: "What was your previous address?"

IMPORTANT - Only use these EXACT properties (no other properties allowed):
- display_name: string (REQUIRED)
- description: string (optional)
- width: number 1-12 (optional)
- placeholder: string (optional, for text fields only)
- special_input: object (optional, see below)

For special_input on TEXT fields, ONLY use these exact properties:
- text.percentage: boolean
- text.phone: boolean
- text.date: boolean
- text.numbered_date: boolean
- text.month_year: boolean
- text.currency: boolean
- text.number: boolean
- text.email: boolean
- text.url: boolean

For special_input on CHECKBOX fields:
- checkbox.asRadio: boolean
- checkbox.horizontal: number

For special_input on RADIO fields:
- radio.layout: "vertical" | "horizontal" | "grid"
- radio.columns: number

DO NOT add any other properties like "suggestions", "type", "format", etc.

Field Type: ${fieldType}
Group Type: ${groupType}
PDF Field Names: ${fieldNames}`;

    const userPrompt = `User Intent: "${intent}"

Transform this intent into a clear, friendly question or label that anyone can understand, especially someone unfamiliar with real estate or technical terms.

IMPORTANT: 
- Turn the intent into a QUESTION when appropriate (most cases)
- Use simple, conversational language
- Make it sound like you're asking a friend to fill out a form
- Be specific about what information you need

Return ONLY a JSON object with these exact properties (no other properties):
- display_name: string (required) - A clear question or label based on the intent
- description: string (optional) - Only if the question needs additional clarification
- width: number (optional) - Grid width from 1-12, default to 6 for most fields, 12 for large fields
- placeholder: string (optional) - Example text for text fields only

For text fields, if special formatting is needed, use special_input with ONLY these properties:
- special_input.text.phone: true (for phone numbers)
- special_input.text.email: true (for email addresses)
- special_input.text.date: true (for dates like "January 1, 2025")
- special_input.text.numbered_date: true (for dates like "01/01/2025")
- special_input.text.currency: true (for money amounts)
- special_input.text.number: true (for numbers only)
- special_input.text.percentage: true (for percentages)

Example valid response:
{
  "display_name": "Phone Number",
  "width": 6,
  "placeholder": "(555) 123-4567",
  "special_input": {
    "text": {
      "phone": true
    }
  }
}`;

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    // Screenshot capability removed - focusing on intent-based generation only
    if (screenshot) {
      console.log(`[${requestId}] Ignoring screenshot - using intent-based generation only`);
    }

    // Prepare OpenAI request - Using GPT-5 nano for efficient processing
    const openAIRequest = {
      model: 'gpt-5-nano',  // Using GPT-5 nano as requested
      messages,
      max_completion_tokens: 10000,  // Increased to allow complete responses
    };

    // Log the request before sending
    console.log(`[${requestId}] Sending request to OpenAI with Chat Completions API`);
    console.log(`[${requestId}] Request model: ${openAIRequest.model}`);
    console.log(`[${requestId}] Number of messages: ${openAIRequest.messages.length}`);
    
    // Use standard Chat Completions API
    let response;
    try {
      response = await openai.chat.completions.create(openAIRequest);
      console.log(`[${requestId}] Response received from OpenAI`);
    } catch (apiError: any) {
      console.error(`[${requestId}] OpenAI API error:`, apiError);
      console.error(`[${requestId}] Error details:`, apiError?.response?.data || apiError?.message);
      
      // Log the failed request
      await aiLogger.logRequest({
        timestamp: new Date().toISOString(),
        requestId,
        request: {
          intent,
          fieldType,
          groupType,
          hasScreenshot: !!screenshot
        },
        response: {
          success: false,
          error: `OpenAI API error: ${apiError?.message || 'Unknown error'}`
        },
        openAISent: openAIRequest,
        openAIReceived: apiError?.response?.data || null,
        screenshot: screenshot ? screenshot.substring(0, 100) + '...' : undefined,
        duration: Date.now() - startTime
      });
      
      throw apiError;
    }

    // Response received successfully
    console.log(`[${requestId}] Response structure:`, JSON.stringify({
      hasChoices: 'choices' in response,
      choicesLength: response.choices?.length,
      firstChoice: response.choices?.[0],
      messageContent: response.choices?.[0]?.message?.content?.substring(0, 100)
    }, null, 2));
    
    const result = response.choices?.[0]?.message?.content || null;
    if (!result) {
      // Log exactly what we sent and received
      await aiLogger.logRequest({
        timestamp: new Date().toISOString(),
        requestId,
        request: {
          intent,
          fieldType,
          groupType,
          hasScreenshot: !!screenshot
        },
        response: {
          success: false,
          error: `No response content from AI. Debug: choices=${response.choices?.length}, content=${response.choices?.[0]?.message?.content?.substring(0, 50)}`
        },
        openAISent: openAIRequest,  // Exactly what we sent to OpenAI
        openAIReceived: response,    // Exactly what we got back
        screenshot: screenshot ? screenshot.substring(0, 100) + '...' : undefined,
        duration: Date.now() - startTime
      });
      throw new Error('No response from AI');
    }

    let parsed;
    try {
      parsed = JSON.parse(result);
    } catch {
      // Try to extract JSON from the response if it's wrapped in text
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Invalid JSON response from AI');
      }
    }
    
    // Validate and clean the response
    if (!parsed.display_name) {
      // Log exactly what we sent and received
      await aiLogger.logRequest({
        timestamp: new Date().toISOString(),
        requestId,
        request: {
          intent,
          fieldType,
          groupType,
          hasScreenshot: !!screenshot
        },
        response: {
          success: false,
          error: 'Invalid AI response: missing display_name',
          data: parsed
        },
        openAISent: openAIRequest,  // Exactly what we sent to OpenAI
        openAIReceived: response,    // Exactly what we got back
        screenshot,
        duration: Date.now() - startTime
      });
      throw new Error('Invalid AI response: missing display_name');
    }

    // Validate and clean the response - remove invalid properties
    const validProperties = ['display_name', 'description', 'width', 'placeholder', 'special_input'];
    const cleaned: Record<string, unknown> = {};
    
    for (const key of validProperties) {
      if (key in parsed && parsed[key] !== '' && parsed[key] !== null) {
        cleaned[key] = parsed[key];
      }
    }
    
    // Validate special_input structure if present
    if (cleaned.special_input && typeof cleaned.special_input === 'object') {
      const specialInput = cleaned.special_input as Record<string, unknown>;
      const validSpecialInput: Record<string, unknown> = {};
      
      // Only keep valid special_input properties based on field type
      if (fieldType === 'text' && specialInput.text) {
        const validTextProps = ['percentage', 'phone', 'date', 'numbered_date', 'month_year', 'currency', 'number', 'email', 'url'];
        const textInput: Record<string, unknown> = {};
        const original = specialInput.text as Record<string, unknown>;
        
        for (const prop of validTextProps) {
          if (prop in original) {
            textInput[prop] = original[prop];
          }
        }
        
        if (Object.keys(textInput).length > 0) {
          validSpecialInput.text = textInput;
        }
      } else if (fieldType === 'checkbox' && specialInput.checkbox) {
        const validCheckboxProps = ['asRadio', 'horizontal'];
        const checkboxInput: Record<string, unknown> = {};
        const original = specialInput.checkbox as Record<string, unknown>;
        
        for (const prop of validCheckboxProps) {
          if (prop in original) {
            checkboxInput[prop] = original[prop];
          }
        }
        
        if (Object.keys(checkboxInput).length > 0) {
          validSpecialInput.checkbox = checkboxInput;
        }
      } else if (fieldType === 'radio' && specialInput.radio) {
        const validRadioProps = ['layout', 'columns'];
        const radioInput: Record<string, unknown> = {};
        const original = specialInput.radio as Record<string, unknown>;
        
        for (const prop of validRadioProps) {
          if (prop in original) {
            radioInput[prop] = original[prop];
          }
        }
        
        if (Object.keys(radioInput).length > 0) {
          validSpecialInput.radio = radioInput;
        }
      }
      
      if (Object.keys(validSpecialInput).length > 0) {
        cleaned.special_input = validSpecialInput;
      } else {
        delete cleaned.special_input;
      }
    }
    
    parsed = cleaned;
    
    // Log exactly what we sent and received
    await aiLogger.logRequest({
      timestamp: new Date().toISOString(),
      requestId,
      request: {
        intent,
        fieldType,
        groupType,
        hasScreenshot: !!screenshot
      },
      response: {
        success: true,
        data: parsed
      },
      openAISent: openAIRequest,  // Exactly what we sent to OpenAI (includes system prompt)
      openAIReceived: response,    // Exactly what we got back
      screenshot,
      duration: Date.now() - startTime
    });
    
    console.log(`[${requestId}] Successfully generated attributes in ${Date.now() - startTime}ms`);
    
    return NextResponse.json(parsed);
  } catch (error) {
    console.error(`[${requestId}] Error in generate-field-attributes API:`, error);
    
    // Log the error
    await aiLogger.logError(requestId, error);
    
    // Use the body we already parsed at the beginning
    await aiLogger.logRequest({
      timestamp: new Date().toISOString(),
      requestId,
      request: {
        intent: body.intent || 'unknown',
        fieldType: body.fieldType || 'unknown',
        groupType: body.groupType || 'unknown',
        hasScreenshot: !!body.screenshot
      },
      response: {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      // Note: openAISent may not exist if we errored before creating the request
      screenshot: body.screenshot,
      duration: Date.now() - startTime
    });
    
    // Return a fallback response
    return NextResponse.json({
      display_name: 'Field',
      width: 12
    });
  }
}