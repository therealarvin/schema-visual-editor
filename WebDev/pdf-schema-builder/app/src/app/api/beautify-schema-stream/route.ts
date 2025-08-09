import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { SchemaItem } from '@/types/schema';
import { aiLogger } from '@/lib/aiLogger';
import puppeteer from 'puppeteer';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Same interfaces as before
interface BeautificationRequest {
  schema: SchemaItem[];
  blockName: string;
  formType?: string;
  iterationLimit?: number;
}

interface SchemaChange {
  unique_id: string;
  field: string;
  oldValue: any;
  newValue: any;
  reason: string;
}

// Same helper functions
async function captureBlockScreenshot(html: string): Promise<string> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    
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
    await new Promise(resolve => setTimeout(resolve, 500));
    
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
  
  blockItems.forEach(item => {
    const width = item.display_attributes.width || 12;
    const gridSpan = `grid-column: span ${width};`;
    
    html += `<div class="form-field" style="${gridSpan}">`;
    
    html += `<label class="form-label">
      ${item.display_attributes.display_name || item.unique_id}
      ${item.display_attributes.isRequired ? '<span class="required-marker">*</span>' : ''}
    </label>`;
    
    if (item.display_attributes.description) {
      html += `<p class="form-description">${item.display_attributes.description}</p>`;
    }
    
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
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const startTime = Date.now();
      const requestId = aiLogger.generateRequestId();
      
      function sendEvent(type: string, data: any) {
        const event = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(event));
      }
      
      try {
        const body: BeautificationRequest = await request.json();
        const { schema, blockName, formType, iterationLimit = 3 } = body;
        
        if (!schema || !blockName) {
          sendEvent('error', { message: 'Missing required fields' });
          controller.close();
          return;
        }
        
        console.log(`[${requestId}] Starting streaming beautification for block: ${blockName}`);
        sendEvent('start', { blockName, iterationLimit });
        
        let currentSchema = [...schema];
        let isComplete = false;
        let iteration = 0;
        
        while (iteration < iterationLimit && !isComplete) {
          iteration++;
          console.log(`[${requestId}] Starting iteration ${iteration}/${iterationLimit}`);
          sendEvent('iteration-start', { iteration, total: iterationLimit });
          
          // Generate HTML and capture screenshot
          const html = generateBlockHtml(currentSchema, blockName);
          sendEvent('status', { message: 'Capturing screenshot...' });
          const screenshot = await captureBlockScreenshot(html);
          sendEvent('screenshot', { iteration, screenshot });
          
          // Prepare vision request
          const systemPrompt = `You are an expert UI/UX designer specializing in form design. Analyze the form block and suggest specific improvements.

CONTEXT:
- Block name: "${blockName}"
- Form type: ${formType || 'General form'}
- Iteration ${iteration} of ${iterationLimit}

YOUR TASK:
Analyze the visual design and suggest improvements to:
1. **PRIORITY: Fix jagged layouts** - Align fields properly
2. **PRIORITY: Optimize widths** - Create complete 12-width rows
3. Field grouping and logical flow
4. Special input formatting for better UX
5. Checkbox/radio layout optimization

CRITICAL RULES:
1. **DO NOT change display_name unless unclear/wrong**
2. **DO NOT change descriptions unless missing/incorrect**
3. **FOCUS on width adjustments for clean rows**
4. **Each row should sum to exactly 12 width**
5. **Avoid jagged forms**

AVAILABLE MODIFICATIONS (priority order):
- width: Adjust to create aligned rows (MAIN FOCUS)
- special_input: Add formatting/layout options
- placeholder: ONLY if missing
- order: ONLY if improves flow
- display_name: ONLY if unclear
- description: ONLY if missing

SPECIAL INPUT OPTIONS:

For TEXT fields, special_input.text:
- percentage: Shows % symbol
- phone: Phone number format
- date: Text date "January 1, 2025"
- numbered_date: "01/01/2025"
- month_year: Month/year only
- currency: $ formatting
- number: Numbers only
- email: Email validation
- url: URL validation

For CHECKBOX fields, special_input.checkbox:
- asRadio: true = single selection only
- horizontal: number of columns
  * 1 = vertical (default)
  * 2 = two columns
  * 3 = three columns
  * Example: 2 checkboxes + horizontal: 2 = side by side

For RADIO fields, special_input.radio:
- layout: "vertical" | "horizontal" | "grid"
- columns: for grid layout

For TEXT-AREA, special_input.textArea:
- minRows: minimum rows
- maxRows: max before scroll
- autoResize: grows with content

LAYOUT PATTERNS:
- **ALWAYS make rows sum to 12**: 6+6, 4+4+4, 8+4, etc.
- First + Last Name: 6+6
- City + State + Zip: 5+3+4 or 6+3+3
- Email + Phone: 6+6
- Address: 12
- Short fields: 3 or 4
- **Avoid orphans**: Don't leave single small fields alone

RESPONSE FORMAT:
{
  "analysis": "Detailed analysis of current design",
  "changes": [
    {
      "unique_id": "field_id",
      "modifications": {
        "display_name": "New name",
        "description": "Help text",
        "width": 6,
        "placeholder": "Example"
      },
      "reasoning": "Why this improves the design"
    }
  ],
  "isComplete": boolean,
  "overallAssessment": "Summary of improvements"
}`;

          const userPrompt = `Analyze this form block and suggest improvements. Iteration ${iteration}.

Current fields:
${JSON.stringify(currentSchema.filter(s => s.display_attributes.block === blockName).map(s => ({
  unique_id: s.unique_id,
  display_name: s.display_attributes.display_name,
  input_type: s.display_attributes.input_type,
  width: s.display_attributes.width,
  order: s.display_attributes.order,
  description: s.display_attributes.description,
  placeholder: s.display_attributes.placeholder
})), null, 2)}`;

          sendEvent('status', { message: 'Analyzing with AI...' });
          
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
            reasoning_effort: 'medium' as const,  // Faster for layout optimization
            max_completion_tokens: 8000,  // Reduced for speed
          };
          
          try {
            const response = await openai.chat.completions.create(visionRequest);
            const result = response.choices?.[0]?.message?.content;
            
            if (!result) {
              throw new Error('No response from AI');
            }
            
            sendEvent('ai-response', { iteration, response: result });
            
            let beautificationPlan;
            try {
              beautificationPlan = JSON.parse(result);
            } catch {
              const jsonMatch = result.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                beautificationPlan = JSON.parse(jsonMatch[0]);
              } else {
                throw new Error('Invalid JSON response');
              }
            }
            
            sendEvent('analysis', { 
              iteration, 
              analysis: beautificationPlan.analysis || beautificationPlan.overallAssessment 
            });
            
            // Apply changes
            const changes: SchemaChange[] = [];
            
            if (beautificationPlan.changes && Array.isArray(beautificationPlan.changes)) {
              beautificationPlan.changes.forEach((change: any) => {
                const itemIndex = currentSchema.findIndex(s => s.unique_id === change.unique_id);
                if (itemIndex !== -1) {
                  const item = currentSchema[itemIndex];
                  
                  if (change.modifications) {
                    Object.entries(change.modifications).forEach(([key, value]) => {
                      const oldValue = (item.display_attributes as any)[key];
                      if (oldValue !== value) {
                        changes.push({
                          unique_id: change.unique_id,
                          field: key,
                          oldValue,
                          newValue: value,
                          reason: change.reasoning || 'Improvement'
                        });
                        
                        (item.display_attributes as any)[key] = value;
                      }
                    });
                  }
                }
              });
            }
            
            sendEvent('changes', { iteration, changes });
            sendEvent('iteration-complete', { 
              iteration, 
              changesCount: changes.length,
              isComplete: beautificationPlan.isComplete || false,
              reasoning: beautificationPlan.overallAssessment || beautificationPlan.analysis
            });
            
            isComplete = beautificationPlan.isComplete || false;
            
            if (!isComplete && iteration < iterationLimit) {
              await new Promise(resolve => setTimeout(resolve, 100));  // Minimal delay
            }
            
          } catch (error: any) {
            console.error(`[${requestId}] Error in iteration ${iteration}:`, error);
            sendEvent('iteration-error', { 
              iteration, 
              error: error.message 
            });
          }
        }
        
        sendEvent('complete', { 
          schema: currentSchema,
          totalIterations: iteration,
          duration: Date.now() - startTime
        });
        
      } catch (error: any) {
        console.error(`Stream error:`, error);
        sendEvent('error', { message: error.message });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}