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
    
    const systemPrompt = `You are an AI assistant that specializes in translating complex legal and real estate terminology into simple, easy-to-understand questions for everyday users. You must ALWAYS return valid JSON with at least the display_name field.

YOUR PRIMARY TASK: Take ANY input - whether it's simple words, complex legal jargon, or technical real estate terms - and transform it into a clear, friendly question that a person with no real estate or legal knowledge can understand.

CRITICAL RULES FOR TRANSLATION:
1. ALWAYS interpret the underlying meaning of legal/technical terms before creating the question
2. Break down complex concepts into their simplest form
3. Ask yourself: "What is this really asking for?" then phrase it simply
4. Use everyday language that a teenager could understand
5. Make questions specific and actionable
6. Avoid ALL industry jargon in your output

TRANSLATION GUIDELINES:
- For location/area terms → Ask "Where" questions
- For date/time terms → Ask "When" questions  
- For person/entity terms → Ask "Who" questions
- For amounts/quantities → Ask "How much/many" questions
- For yes/no concepts → Ask "Do you" or "Will you" questions
- For descriptive information → Ask "What is" or "Please describe" questions

COMPLEX JARGON TRANSLATIONS:
- "market area for buyer/tenant representation" → "In which areas would you like to search for properties?"
- "earnest money deposit" → "How much money will you put down to show you're serious?"
- "contingency period" → "How many days do you need to inspect the property?"
- "fiduciary duty" → "Who is your agent representing?"
- "escrow instructions" → "Where should the deposit money be held?"
- "due diligence period" → "How long do you need to review everything?"
- "encumbrances" → "Are there any restrictions on the property?"
- "covenant, conditions, and restrictions (CC&Rs)" → "Are there any community rules to follow?"
- "power of attorney" → "Who can sign documents on your behalf?"
- "lease commencement date" → "When would you like to start renting?"
- "security deposit amount" → "How much deposit is required?"
- "right of first refusal" → "Do you want the first chance to buy if it's sold?"

FORMATTING RULES:
1. Questions should be 4-10 words when possible
2. Start with question words (What, When, Where, Who, How, Do you, Will you, etc.)
3. Use "you" and "your" to make it personal
4. Be specific about what information is needed
5. Only add a description if the question alone isn't clear enough
6. Width should be 1-12 (grid units), with most fields being 6 or 12
7. Placeholders should show realistic examples
8. ALWAYS return valid JSON with at least {"display_name": "..."}

Remember: Your user might be filling this form for the first time and has no idea what legal terms mean. Make it as simple as asking a friend for basic information.

IMPORTANT - Only use these EXACT properties (no other properties allowed):
- display_name: string (REQUIRED)
- description: string (optional)
- width: number 1-12 (optional)
- placeholder: string (optional, for text fields only)
- special_input: object (optional, see below)
- checkbox_options: object (optional, ONLY for checkbox fields, see below)

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
- checkbox.asRadio: boolean - When true, makes checkboxes behave like radio buttons (single selection only)
- checkbox.horizontal: number - Number of columns to arrange checkboxes in
  * 1 = vertical stacking (default)
  * 2 = two columns side by side
  * 3 = three columns
  * Example: If you have 2 yes/no checkboxes, set horizontal: 2 to show them side by side
  * Example: If you have 6 options, horizontal: 2 creates a 3x2 grid

For special_input on RADIO fields:
- radio.layout: "vertical" | "horizontal" | "grid"
- radio.columns: number - For grid layout, number of columns

CHECKBOX LAYOUT GUIDELINES:
- For yes/no questions or pairs of options, use horizontal: 2 to save vertical space
- For long lists (>4 options), consider horizontal: 2 or 3 for better use of space
- Use asRadio: true when the checkboxes should be mutually exclusive (only one can be selected)

For CHECKBOX fields ONLY, you can also provide checkbox_options to give better display names:
- checkbox_options.options: array of {display_name: string, value: string}
  - display_name: User-friendly label for this checkbox option
  - value: The original PDF field name (must match exactly)
  
When generating checkbox options:
1. Transform technical field names into clear, simple questions or labels
2. Remove underscores and make proper capitalization
3. For yes/no type fields, use clear "Yes" or "No" labels
4. For agreement fields, use action-oriented labels like "I agree to..."
5. Keep labels concise but clear

DO NOT add any other properties like "suggestions", "type", "format", etc.

Field Type: ${fieldType}
Group Type: ${groupType}
PDF Field Names: ${fieldNames}`;

    const userPrompt = `User Intent: "${intent}"

TASK: Transform this intent (which may contain complex legal or real estate jargon) into a simple, clear question that anyone can understand.

PROCESS:
1. First, identify if this contains technical/legal terms
2. If yes, translate the jargon into plain English
3. Then create a friendly question based on the plain English meaning
4. Make sure a person with zero real estate knowledge would understand

For example:
- If the intent mentions "market area" or "representation area" → This means where someone wants to look for properties
- If it mentions "earnest money" or "deposit" → This means money to show they're serious
- If it mentions "contingency" → This means conditions that must be met
- If it mentions "escrow" → This means a neutral third party holding money

Your response should be a question that sounds like you're helping a friend fill out a form, NOT a legal document.

Return ONLY a JSON object with these exact properties (no other properties):
- display_name: string (required) - A simple, clear question based on the translated intent
- description: string (optional) - Only if the question needs additional clarification
- width: number (optional) - Grid width from 1-12, default to 6 for most fields, 12 for large fields
- placeholder: string (optional) - Example text for text fields only

For checkbox fields, ALSO include:
- checkbox_options: object with "options" array
  Each option should have:
  - display_name: User-friendly label (e.g., "Yes", "I agree", "Include parking")
  - value: The exact PDF field name

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
    const validProperties = ['display_name', 'description', 'width', 'placeholder', 'special_input', 'checkbox_options'];
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