/**
 * GPT-5 Nano Vision API Example
 * Demonstrates how to send images to GPT-5 Nano for text extraction
 * 
 * Key requirements for GPT-5 Nano vision:
 * - Use "gpt-5-nano" as the model name
 * - Use "max_completion_tokens" instead of "max_tokens"
 * - Include "reasoning_effort" parameter (low/medium/high)
 * - No custom temperature support (uses default of 1)
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const OpenAI = require('openai');
const path = require('path');

// Load API key from .env.local file
require('dotenv').config({ path: path.join(__dirname, 'app', '.env.local') });

async function createTestImage() {
  const canvas = createCanvas(800, 400);
  const ctx = canvas.getContext('2d');

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 800, 400);

  // Add various text elements
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Hello GPT-5 Nano Vision!', 400, 100);

  ctx.font = '36px Arial';
  ctx.fillText('This is a test of image reading', 400, 200);

  ctx.font = '24px Arial';
  ctx.fillText('Generated at: ' + new Date().toLocaleString(), 400, 300);

  // Save as PNG
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('test-image.png', buffer);
  console.log('✅ Test image created: test-image.png');
  
  return buffer;
}

async function testGPT5NanoVision() {
  try {
    // Create test image
    console.log('Creating test image with text...');
    const imageBuffer = await createTestImage();
    
    // Convert to base64
    const base64Image = imageBuffer.toString('base64');

    // Initialize OpenAI client
    console.log('\nInitializing OpenAI client...');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Send image to GPT-5 Nano
    console.log('Sending image to GPT-5 Nano...\n');
    
    const response = await openai.chat.completions.create({
      model: "gpt-5-nano",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Read all the text you see in this image and list each line."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      reasoning_effort: "low",  // Required for GPT-5 models (low/medium/high)
      max_completion_tokens: 300  // GPT-5 uses this instead of max_tokens
    });

    // Display results
    console.log('='.repeat(50));
    console.log('GPT-5 NANO VISION RESPONSE');
    console.log('='.repeat(50));
    console.log(response.choices[0].message.content);
    
    console.log('\n' + '='.repeat(50));
    console.log('TOKEN USAGE');
    console.log('='.repeat(50));
    console.log(`Input tokens:      ${response.usage.prompt_tokens}`);
    console.log(`Output tokens:     ${response.usage.completion_tokens}`);
    console.log(`Total tokens:      ${response.usage.total_tokens}`);
    
    // Calculate cost (GPT-5 Nano pricing)
    const inputCost = (response.usage.prompt_tokens / 1000000) * 0.05;
    const outputCost = (response.usage.completion_tokens / 1000000) * 0.40;
    const totalCost = inputCost + outputCost;
    
    console.log('\n' + '='.repeat(50));
    console.log('ESTIMATED COST (GPT-5 Nano Pricing)');
    console.log('='.repeat(50));
    console.log(`Input cost:        $${inputCost.toFixed(6)}`);
    console.log(`Output cost:       $${outputCost.toFixed(6)}`);
    console.log(`Total cost:        $${totalCost.toFixed(6)}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('API Error Details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
console.log('GPT-5 Nano Vision API Test');
console.log('=' .repeat(50));
testGPT5NanoVision();