import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { SchemaItem } from '@/types/schema';
import { aiLogger } from '@/lib/aiLogger';
import puppeteer from 'puppeteer';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

interface BeautificationRequest {
  schema: SchemaItem[];
  blockName: string;
  formType?: string;
  iterationLimit?: number;
}

interface BeautificationIteration {
  iteration: number;
  screenshot: string;
  changes: SchemaChange[];
  reasoning: string;
  isComplete: boolean;
}

interface SchemaChange {
  unique_id: string;
  field: string;
  oldValue: any;
  newValue: any;
  reason: string;
}

// Function to render a block and capture screenshot
async function captureBlockScreenshot(html: string): Promise<string> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    
    // Create a full HTML page with styles
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            padding: 20px;
            background: #f9fafb;
          }
          .form-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            padding: 24px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .form-grid {
            display: grid;
            grid-template-columns: repeat(12, 1fr);
            gap: 16px;
          }
          .form-field {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .form-label {
            font-size: 14px;
            font-weight: 500;
            color: #374151;
          }
          .form-description {
            font-size: 12px;
            color: #6b7280;
          }
          .form-input {
            padding: 8px 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 14px;
            background: white;
            transition: all 0.2s;
          }
          .form-input:focus {
            outline: none;
            border-color: #8b5cf6;
            box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
          }
          .checkbox-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .checkbox-item {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .checkbox-input {
            width: 16px;
            height: 16px;
            accent-color: #8b5cf6;
          }
          .radio-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .radio-item {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .radio-input {
            width: 16px;
            height: 16px;
            accent-color: #8b5cf6;
          }
          .block-header {
            margin-bottom: 20px;
            padding: 12px 16px;
            border-radius: 6px;
            border-left: 4px solid;
          }
          .required-marker {
            color: #ef4444;
            margin-left: 4px;
          }
        </style>
      </head>
      <body>
        ${html}
      </body>
      </html>
    `;
    
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
    
    // Wait for rendering - using setTimeout instead of deprecated waitForTimeout
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Capture screenshot
    const screenshot = await page.screenshot({
      encoding: 'base64',
      fullPage: false,
      type: 'png'
    });
    
    return `data:image/png;base64,${screenshot}`;
  } finally {
    await browser.close();
  }
}

// Function to generate HTML for a schema block
function generateBlockHtml(schema: SchemaItem[], blockName: string): string {
  const blockItems = schema.filter(item => item.display_attributes.block === blockName);
  
  if (blockItems.length === 0) return '<div>No items in this block</div>';
  
  const blockStyle = blockItems[0]?.display_attributes.block_style;
  const colorTheme = blockStyle?.color_theme || 'gray';
  
  const colorMap = {
    blue: { bg: '#eff6ff', border: '#2563eb', text: '#1e40af' },
    green: { bg: '#f0fdf4', border: '#10b981', text: '#047857' },
    purple: { bg: '#faf5ff', border: '#8b5cf6', text: '#6b21a8' },
    orange: { bg: '#fff7ed', border: '#f97316', text: '#c2410c' },
    gray: { bg: '#f9fafb', border: '#6b7280', text: '#374151' }
  };
  
  const colors = colorMap[colorTheme] || colorMap.gray;
  
  let html = '<div class="form-container">';
  
  // Add block header
  if (blockStyle) {
    html += `
      <div class="block-header" style="background: ${colors.bg}; border-left-color: ${colors.border};">
        <h2 style="color: ${colors.text}; font-size: 18px; font-weight: 600; margin-bottom: 4px;">
          ${blockStyle.title || blockName}
        </h2>
        ${blockStyle.description ? `<p style="color: #6b7280; font-size: 14px;">${blockStyle.description}</p>` : ''}
      </div>
    `;
  }
  
  html += '<div class="form-grid">';
  
  // Render each field
  blockItems.forEach(item => {
    const width = item.display_attributes.width || 12;
    const gridSpan = `grid-column: span ${width};`;
    
    html += `<div class="form-field" style="${gridSpan}">`;
    
    // Label
    html += `<label class="form-label">
      ${item.display_attributes.display_name || item.unique_id}
      ${item.display_attributes.isRequired ? '<span class="required-marker">*</span>' : ''}
    </label>`;
    
    // Description
    if (item.display_attributes.description) {
      html += `<p class="form-description">${item.display_attributes.description}</p>`;
    }
    
    // Input field based on type
    switch (item.display_attributes.input_type) {
      case 'text':
      case 'text-area':
        const placeholder = item.display_attributes.placeholder || '';
        if (item.display_attributes.input_type === 'text-area') {
          html += `<textarea class="form-input" placeholder="${placeholder}" rows="3"></textarea>`;
        } else {
          html += `<input type="text" class="form-input" placeholder="${placeholder}" />`;
        }
        break;
        
      case 'checkbox':
        html += '<div class="checkbox-group">';
        const checkboxOptions = item.display_attributes.checkbox_options?.options || [];
        checkboxOptions.forEach(option => {
          html += `
            <label class="checkbox-item">
              <input type="checkbox" class="checkbox-input" />
              <span>${option.display_name}</span>
            </label>
          `;
        });
        html += '</div>';
        break;
        
      case 'radio':
        html += '<div class="radio-group">';
        const radioOptions = item.display_attributes.display_radio_options || [];
        radioOptions.forEach(option => {
          html += `
            <label class="radio-item">
              <input type="radio" name="${item.unique_id}" class="radio-input" />
              <span>${option}</span>
            </label>
          `;
        });
        html += '</div>';
        break;
        
      case 'signature':
        html += '<div style="border: 2px dashed #d1d5db; border-radius: 6px; padding: 20px; text-align: center; color: #6b7280;">Signature Field</div>';
        break;
        
      case 'fileUpload':
        html += '<div style="border: 2px dashed #d1d5db; border-radius: 6px; padding: 20px; text-align: center; color: #6b7280;">Drop files here or click to upload</div>';
        break;
        
      case 'info':
        html += `<div style="padding: 12px; background: #f3f4f6; border-radius: 6px; font-size: 14px; color: #4b5563;">
          ${item.display_attributes.display_name || 'Information'}
        </div>`;
        break;
    }
    
    html += '</div>';
  });
  
  html += '</div></div>';
  
  return html;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = aiLogger.generateRequestId();
  
  try {
    const body: BeautificationRequest = await request.json();
    const { schema, blockName, formType, iterationLimit = 3 } = body;
    
    if (!schema || !blockName) {
      return NextResponse.json(
        { error: 'Missing required fields: schema and blockName' },
        { status: 400 }
      );
    }
    
    console.log(`[${requestId}] Starting beautification for block: ${blockName}`);
    
    const iterations: BeautificationIteration[] = [];
    let currentSchema = [...schema];
    let isComplete = false;
    let iteration = 0;
    
    // Agentic loop for iterative improvement
    while (iteration < iterationLimit && !isComplete) {
      iteration++;
      console.log(`[${requestId}] Iteration ${iteration}/${iterationLimit}`);
      
      // Generate HTML and capture screenshot
      const html = generateBlockHtml(currentSchema, blockName);
      const screenshot = await captureBlockScreenshot(html);
      
      // Prepare the vision request
      const systemPrompt = `You are an expert UI/UX designer specializing in form design and visual aesthetics. You are working on beautifying a form block to make it more visually appealing, user-friendly, and professional.

CONTEXT:
- You are viewing a screenshot of a form block named "${blockName}"
- Form type: ${formType || 'General form'}
- This is iteration ${iteration} of ${iterationLimit}

YOUR TASK:
Analyze the current visual design and suggest specific improvements to the schema display attributes to enhance:
1. **PRIORITY: Fix jagged/uneven layouts** - Make fields align properly
2. **PRIORITY: Optimize field widths** - Fit multiple fields on same row where logical
3. Field grouping and logical flow
4. Form field widths and grid layout
5. Placeholder text helpfulness (only if missing)
6. Special input formatting for better UX
7. Checkbox/radio layout optimization

CRITICAL RULES:
1. **DO NOT change display_name unless it's completely unclear or wrong**
2. **DO NOT change descriptions unless they're missing or incorrect**
3. **FOCUS on width adjustments to create clean, aligned rows**
4. **Fields on the same row should align at the same level**
5. **Aim to fit fields into complete 12-width rows (e.g., 6+6, 4+4+4, 3+3+3+3)**
6. **Avoid jagged forms - each row should total exactly 12 width**
7. **Field alignment tip**: If fields on same row have different description lengths causing misalignment, either:
   - Group fields with similar description lengths together
   - Consider making fields full width (12) if descriptions vary greatly
   - Remove unnecessary descriptions to maintain alignment

AVAILABLE MODIFICATIONS (in order of priority):
- width: Adjust grid width (1-12) to create aligned rows
- special_input: Add formatting hints and layout options
- placeholder: Add example text ONLY if currently missing
- order: Reorder fields ONLY if it improves logical flow
- display_name: Change ONLY if current name is unclear/wrong
- description: Change ONLY if missing or incorrect
- isRequired: Mark important fields as required

SPECIAL INPUT OPTIONS EXPLAINED:

For TEXT fields, special_input.text can include:
- percentage: Shows % symbol, accepts percentage values
- phone: Formats as phone number (e.g., (555) 123-4567)
- date: Text date picker for "January 1, 2025" format
- numbered_date: Numeric date format like "01/01/2025"
- month_year: Shows month/year picker only
- currency: Formats as currency with $ symbol
- number: Accepts numbers only
- email: Validates email format
- url: Validates URL format

For CHECKBOX fields, special_input.checkbox can include:
- asRadio: boolean - When true, converts checkboxes to single-selection (like radio buttons)
- horizontal: number - Number of columns to arrange checkboxes in
  * horizontal: 1 = vertical stack (default)
  * horizontal: 2 = two columns side by side
  * horizontal: 3 = three columns
  * Example: 6 checkboxes with horizontal: 2 creates a 3x2 grid
  * Example: 2 checkboxes with horizontal: 2 shows them side by side

For RADIO fields, special_input.radio can include:
- layout: "vertical" | "horizontal" | "grid"
- columns: number - For grid layout, number of columns

For TEXT-AREA fields, special_input.textArea can include:
- minRows: Minimum visible rows
- maxRows: Maximum rows before scrolling
- autoResize: Automatically grows with content

For SIGNATURE fields, special_input.signature can include:
- dateFormat: Custom date format
- showInitials: Shows initials field alongside signature

For FILE UPLOAD fields, special_input.fileUpload can include:
- accept: File types (e.g., ".pdf,.doc")
- maxSize: Max file size in MB
- multiple: Allow multiple files
- maxFiles: Maximum number of files

LAYOUT RECOMMENDATIONS:
- **ALWAYS aim for rows that sum to 12**: 6+6, 4+4+4, 3+3+3+3, 8+4, etc.
- **Common patterns**:
  * First Name + Last Name: width 6 each
  * City + State + Zip: 5 + 3 + 4 or 6 + 3 + 3
  * Email + Phone: width 6 each
  * Address line: width 12
  * Short fields (age, apt#): width 3 or 4
- **Checkbox layout**: Use horizontal: 2 for yes/no pairs
- **Field alignment**: Fields on same row should have similar description lengths
- **Avoid orphaned fields**: Don't leave a single width:3 field alone

IMPORTANT CONSTRAINTS:
- DO NOT change the input_type of fields
- DO NOT change the unique_id of fields
- DO NOT move fields to different blocks
- DO NOT change checkbox/radio options structure
- Focus only on visual and UX improvements

RESPONSE FORMAT:
Return a JSON object with:
{
  "analysis": "Brief analysis of current design issues",
  "changes": [
    {
      "unique_id": "field_id",
      "modifications": {
        "display_name": "New friendly name",
        "description": "Helpful description",
        "width": 6,
        "placeholder": "Example: (555) 123-4567"
      },
      "reasoning": "Why this change improves the design"
    }
  ],
  "isComplete": boolean (true if design is optimal, false if more iterations needed),
  "overallAssessment": "Summary of improvements made"
}`;

      const userPrompt = `Please analyze this form block screenshot and suggest specific improvements to make it more beautiful, professional, and user-friendly. This is iteration ${iteration}.

Current block items summary:
${JSON.stringify(currentSchema.filter(s => s.display_attributes.block === blockName).map(s => ({
  unique_id: s.unique_id,
  display_name: s.display_attributes.display_name,
  input_type: s.display_attributes.input_type,
  width: s.display_attributes.width,
  order: s.display_attributes.order,
  description: s.display_attributes.description,
  placeholder: s.display_attributes.placeholder
})), null, 2)}`;

      // Call GPT-5 nano with vision
      const visionRequest = {
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: userPrompt },
              {
                type: 'image_url',
                image_url: {
                  url: screenshot
                }
              }
            ]
          }
        ] as OpenAI.Chat.ChatCompletionMessageParam[],
        reasoning_effort: 'medium' as const, // Medium is sufficient for layout optimization
        max_completion_tokens: 10000, // Reduced for faster response
      };
      
      console.log(`[${requestId}] Sending vision request to GPT-5 nano for iteration ${iteration}`);
      console.log(`[${requestId}] Request details:`, {
        model: visionRequest.model,
        reasoning_effort: visionRequest.reasoning_effort,
        max_completion_tokens: visionRequest.max_completion_tokens,
        messageCount: visionRequest.messages.length,
        hasImage: screenshot ? 'yes' : 'no',
        imageSize: screenshot ? screenshot.length : 0,
        systemPromptLength: systemPrompt.length,
        userPromptLength: userPrompt.length
      });
      
      // Log complete request details for debugging
      console.log(`[${requestId}] === COMPLETE REQUEST FOR ITERATION ${iteration} ===`);
      console.log(`[${requestId}] SYSTEM PROMPT:\n${systemPrompt}`);
      console.log(`[${requestId}] USER PROMPT:\n${userPrompt}`);
      console.log(`[${requestId}] SCREENSHOT (first 200 chars): ${screenshot.substring(0, 200)}...`);
      console.log(`[${requestId}] FULL SCREENSHOT DATA URL LENGTH: ${screenshot.length} characters`);
      
      let response;
      let retryCount = 0;
      const maxRetries = 2;
      
      while (retryCount <= maxRetries) {
        try {
          if (retryCount > 0) {
            console.log(`[${requestId}] Retry attempt ${retryCount} for iteration ${iteration}`);
            // Wait before retry with exponential backoff
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
          }
          
          response = await openai.chat.completions.create(visionRequest);
          console.log(`[${requestId}] Response received:`, {
            hasChoices: !!response.choices,
            choicesLength: response.choices?.length,
            hasContent: !!response.choices?.[0]?.message?.content,
            contentLength: response.choices?.[0]?.message?.content?.length || 0,
            finishReason: response.choices?.[0]?.finish_reason,
            usage: response.usage
          });
          
          // Success - break out of retry loop
          break;
        } catch (apiError: any) {
          console.error(`[${requestId}] OpenAI API error in iteration ${iteration}, attempt ${retryCount + 1}:`, apiError);
          console.error(`[${requestId}] Error details:`, {
            message: apiError?.message,
            status: apiError?.status,
            code: apiError?.code,
            type: apiError?.type,
            response: apiError?.response?.data
          });
          
          retryCount++;
          
          if (retryCount > maxRetries) {
            // Log the final failed request
            await aiLogger.logRequest({
              timestamp: new Date().toISOString(),
              requestId,
              request: {
                intent: `beautify-schema-iteration-${iteration}`,
                fieldType: 'multiple',
                groupType: 'beautification',
                hasScreenshot: true
              },
              response: {
                success: false,
                error: `OpenAI API error after ${maxRetries} retries: ${apiError?.message || 'Unknown error'}`
              },
              openAISent: visionRequest,
              openAIReceived: apiError?.response?.data || null,
              screenshot: screenshot ? screenshot.substring(0, 100) + '...' : undefined,
              duration: Date.now() - startTime
            });
            
            throw apiError;
          }
        }
      }
      
      const result = response?.choices?.[0]?.message?.content;
      
      if (!result) {
        console.error(`[${requestId}] No content in response for iteration ${iteration}`);
        console.error(`[${requestId}] Full response object:`, JSON.stringify(response, null, 2));
        
        // Log failed attempt
        await aiLogger.logRequest({
          timestamp: new Date().toISOString(),
          requestId,
          request: {
            intent: `beautify-schema-iteration-${iteration}`,
            fieldType: 'multiple',
            groupType: 'beautification',
            hasScreenshot: true
          },
          response: {
            success: false,
            error: 'No content in AI response'
          },
          openAISent: visionRequest,
          openAIReceived: response,
          screenshot: screenshot ? screenshot.substring(0, 100) + '...' : undefined,
          duration: Date.now() - startTime
        });
        
        throw new Error(`No response from GPT-5 nano in iteration ${iteration}`);
      }
      
      console.log(`[${requestId}] AI response content received, length: ${result.length}`);
      console.log(`[${requestId}] === COMPLETE AI RESPONSE FOR ITERATION ${iteration} ===`);
      console.log(`[${requestId}] FULL RESPONSE:\n${result}`);
      console.log(`[${requestId}] === END OF AI RESPONSE ===`);
      
      // Parse the response
      let beautificationPlan;
      try {
        beautificationPlan = JSON.parse(result);
        console.log(`[${requestId}] Successfully parsed JSON response`);
      } catch (parseError) {
        console.log(`[${requestId}] Failed to parse as direct JSON, attempting extraction`);
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            beautificationPlan = JSON.parse(jsonMatch[0]);
            console.log(`[${requestId}] Successfully extracted and parsed JSON from response`);
          } catch (extractError) {
            console.error(`[${requestId}] Failed to parse extracted JSON:`, extractError);
            throw new Error('Invalid JSON response from AI');
          }
        } else {
          console.error(`[${requestId}] No JSON found in response`);
          throw new Error('No JSON found in AI response');
        }
      }
      
      // Validate beautification plan structure
      if (!beautificationPlan || typeof beautificationPlan !== 'object') {
        console.error(`[${requestId}] Invalid beautification plan structure`);
        throw new Error('Invalid beautification plan structure');
      }
      
      console.log(`[${requestId}] Beautification plan:`, {
        hasChanges: !!beautificationPlan.changes,
        changesCount: beautificationPlan.changes?.length || 0,
        isComplete: beautificationPlan.isComplete,
        hasAnalysis: !!beautificationPlan.analysis,
        hasOverallAssessment: !!beautificationPlan.overallAssessment
      });
      
      // Apply the changes to schema
      const changes: SchemaChange[] = [];
      
      if (beautificationPlan.changes && Array.isArray(beautificationPlan.changes)) {
        console.log(`[${requestId}] Processing ${beautificationPlan.changes.length} changes`);
        beautificationPlan.changes.forEach((change: any) => {
          const itemIndex = currentSchema.findIndex(s => s.unique_id === change.unique_id);
          if (itemIndex !== -1) {
            const item = currentSchema[itemIndex];
            
            // Apply modifications
            if (change.modifications) {
              Object.entries(change.modifications).forEach(([key, value]) => {
                const oldValue = (item.display_attributes as any)[key];
                if (oldValue !== value) {
                  changes.push({
                    unique_id: change.unique_id,
                    field: key,
                    oldValue,
                    newValue: value,
                    reason: change.reasoning || 'Aesthetic improvement'
                  });
                  
                  // Apply the change
                  (item.display_attributes as any)[key] = value;
                }
              });
            }
          }
        });
      }
      
      // Record this iteration
      iterations.push({
        iteration,
        screenshot,
        changes,
        reasoning: beautificationPlan.overallAssessment || beautificationPlan.analysis || 'Design improvements applied',
        isComplete: beautificationPlan.isComplete || false
      });
      
      isComplete = beautificationPlan.isComplete || false;
      
      // Log iteration results
      console.log(`[${requestId}] Iteration ${iteration} complete. Changes: ${changes.length}, Complete: ${isComplete}`);
      
      // Minimal delay between iterations (just to prevent overwhelming)
      if (!isComplete && iteration < iterationLimit) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Log the complete beautification session
    await aiLogger.logRequest({
      timestamp: new Date().toISOString(),
      requestId,
      request: {
        intent: 'beautify-schema-block',
        fieldType: 'multiple',
        groupType: 'beautification',
        hasScreenshot: true
      },
      response: {
        success: true,
        data: {
          blockName,
          totalIterations: iterations.length,
          totalChanges: iterations.reduce((sum, iter) => sum + iter.changes.length, 0),
          completed: isComplete
        }
      },
      duration: Date.now() - startTime
    });
    
    console.log(`[${requestId}] Beautification complete in ${Date.now() - startTime}ms`);
    
    return NextResponse.json({
      success: true,
      schema: currentSchema,
      iterations,
      summary: {
        blockName,
        totalIterations: iterations.length,
        totalChanges: iterations.reduce((sum, iter) => sum + iter.changes.length, 0),
        completed: isComplete,
        duration: Date.now() - startTime
      }
    });
    
  } catch (error) {
    console.error(`[${requestId}] Error in beautify-schema API:`, error);
    
    await aiLogger.logError(requestId, error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to beautify schema'
    }, { status: 500 });
  }
}