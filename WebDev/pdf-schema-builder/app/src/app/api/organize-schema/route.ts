import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { SchemaItem } from '@/types/schema';
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
    const { schema, formType } = body;

    if (!schema || !Array.isArray(schema) || schema.length === 0) {
      return NextResponse.json(
        { error: 'Invalid schema provided' },
        { status: 400 }
      );
    }

    // Prepare schema summary for the AI
    const schemaSummary = schema.map((item: SchemaItem, index: number) => ({
      index,
      unique_id: item.unique_id,
      display_name: item.display_attributes.display_name || item.unique_id,
      input_type: item.display_attributes.input_type,
      current_order: item.display_attributes.order,
      description: item.display_attributes.description,
      placeholder: item.display_attributes.placeholder,
      special_input: item.display_attributes.special_input,
      value_type: item.display_attributes.value.type,
      is_signature: item.display_attributes.input_type === 'signature',
      checkbox_options: item.display_attributes.checkbox_options?.options?.map(o => o.display_name),
      radio_options: item.display_attributes.display_radio_options
    }));
    
    const systemPrompt = `You are an AI assistant that specializes in organizing form schemas into logical blocks/sections for better user experience. Your task is to analyze schema items and group them into coherent sections.

AVAILABLE BLOCK CATEGORIES (use these exact block names):
1. "Personal Information" - Names, date of birth, SSN, identification
2. "Contact Details" - Phone, email, mailing address, emergency contacts
3. "Property Information" - Property address, type, features, condition
4. "Financial Details" - Price, rent, deposits, payment terms, financial qualifications
5. "Terms and Conditions" - Legal agreements, clauses, restrictions, rules
6. "Important Dates" - Move-in dates, lease terms, deadlines, effective dates
7. "Additional Information" - Notes, special requests, other details
8. "Signatures and Authorization" - Signature fields, initials, date signed

BLOCK COLORS (use these exact color_theme values):
- Personal Information: "blue"
- Contact Details: "green"
- Property Information: "purple"
- Financial Details: "orange"
- Terms and Conditions: "gray"
- Important Dates: "blue"
- Additional Information: "gray"
- Signatures and Authorization: "green"

ORGANIZATION RULES:
1. Group related fields together based on their purpose and content
2. Order blocks logically: Personal → Contact → Property → Financial → Terms → Dates → Additional → Signatures
3. Within each block, order fields logically (e.g., first name before last name)
4. Signature fields ALWAYS go in "Signatures and Authorization" block at the end
5. Keep checkbox/radio groups together
6. Date fields about timing/schedule go in "Important Dates"
7. Legal text and agreements go in "Terms and Conditions"

RESPONSE FORMAT:
Return a JSON object with an "items" array where each item has:
- index: number (original index from input)
- block: string (block category name from the list above)
- order: number (new global order starting from 1)
- block_order: number (order within the block, starting from 1 for each block)

Example response structure:
{
  "items": [
    {
      "index": 0,
      "block": "Personal Information",
      "order": 1,
      "block_order": 1
    },
    ...
  ],
  "blocks": [
    {
      "name": "Personal Information",
      "title": "Personal Information",
      "description": "Basic information about the applicant",
      "color_theme": "blue",
      "item_count": 5
    },
    ...
  ]
}

IMPORTANT:
- Every item MUST be assigned to a block
- Use the exact block names provided above
- Order should be sequential with no gaps
- Maintain logical flow within and across blocks`;

    const userPrompt = `Organize these ${schema.length} schema items into logical blocks:

${JSON.stringify(schemaSummary, null, 2)}

${formType ? `Form Type: ${formType}` : ''}

Analyze each field's display name and type to determine the appropriate block. Return a JSON response with the organized structure.`;

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    // Prepare OpenAI request
    const openAIRequest = {
      model: 'gpt-5-nano',
      messages,
      max_completion_tokens: 10000,
    };

    console.log(`[${requestId}] Sending schema organization request to OpenAI`);
    
    // Call OpenAI
    let response;
    try {
      response = await openai.chat.completions.create(openAIRequest);
      console.log(`[${requestId}] Response received from OpenAI`);
    } catch (apiError: any) {
      console.error(`[${requestId}] OpenAI API error:`, apiError);
      
      await aiLogger.logRequest({
        timestamp: new Date().toISOString(),
        requestId,
        request: {
          intent: 'organize-schema',
          fieldType: 'multiple',
          groupType: 'organization',
          hasScreenshot: false
        },
        response: {
          success: false,
          error: `OpenAI API error: ${apiError?.message || 'Unknown error'}`
        },
        openAISent: openAIRequest,
        openAIReceived: apiError?.response?.data || null,
        duration: Date.now() - startTime
      });
      
      throw apiError;
    }

    const result = response.choices?.[0]?.message?.content || null;
    if (!result) {
      throw new Error('No response from AI');
    }

    let parsed;
    try {
      parsed = JSON.parse(result);
    } catch {
      // Try to extract JSON from the response
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Invalid JSON response from AI');
      }
    }
    
    // Validate response structure
    if (!parsed.items || !Array.isArray(parsed.items)) {
      throw new Error('Invalid response structure: missing items array');
    }

    // Apply the organization to the original schema
    const organizedSchema = schema.map((item: SchemaItem, index: number) => {
      const orgInfo = parsed.items.find((i: any) => i.index === index);
      if (!orgInfo) {
        console.warn(`No organization info for item at index ${index}`);
        return item;
      }

      const blockInfo = parsed.blocks?.find((b: any) => b.name === orgInfo.block);
      
      return {
        ...item,
        display_attributes: {
          ...item.display_attributes,
          order: orgInfo.order,
          block: orgInfo.block,
          block_style: blockInfo ? {
            title: blockInfo.title || orgInfo.block,
            description: blockInfo.description,
            color_theme: blockInfo.color_theme
          } : undefined
        }
      };
    });

    // Sort by new order
    organizedSchema.sort((a: SchemaItem, b: SchemaItem) => 
      a.display_attributes.order - b.display_attributes.order
    );

    // Log successful request
    await aiLogger.logRequest({
      timestamp: new Date().toISOString(),
      requestId,
      request: {
        intent: 'organize-schema',
        fieldType: 'multiple',
        groupType: 'organization',
        hasScreenshot: false
      },
      response: {
        success: true,
        data: {
          blocks: parsed.blocks,
          itemCount: organizedSchema.length
        }
      },
      openAISent: openAIRequest,
      openAIReceived: response,
      duration: Date.now() - startTime
    });
    
    console.log(`[${requestId}] Successfully organized schema in ${Date.now() - startTime}ms`);
    
    return NextResponse.json({
      schema: organizedSchema,
      blocks: parsed.blocks || []
    });
  } catch (error) {
    console.error(`[${requestId}] Error in organize-schema API:`, error);
    
    await aiLogger.logError(requestId, error);
    
    // Return original schema on error
    return NextResponse.json({
      schema: body.schema || [],
      blocks: [],
      error: error instanceof Error ? error.message : 'Failed to organize schema'
    });
  }
}