const { createCanvas } = require('canvas');
const fs = require('fs');
const OpenAI = require('openai');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'app', '.env.local') });

async function createTestImage() {
  const canvas = createCanvas(800, 400);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 800, 400);

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Hello GPT Vision!', 400, 100);

  ctx.font = '36px Arial';
  ctx.fillText('Can you read this text?', 400, 200);

  ctx.font = '24px Arial';
  ctx.fillText('Test timestamp: ' + new Date().toLocaleString(), 400, 300);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('test-image.png', buffer);
  console.log('Test image created: test-image.png');
  
  return buffer;
}

async function testGPTVision() {
  try {
    console.log('Creating test image...');
    const imageBuffer = await createTestImage();
    const base64Image = imageBuffer.toString('base64');

    console.log('\nInitializing OpenAI client...');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log('Sending image to GPT-5 Nano...');
    console.log('Note: Testing GPT-5 Nano with reasoning_effort parameter');
    
    // Try with reasoning_effort parameter specific to GPT-5
    const response = await openai.chat.completions.create({
      model: "gpt-5-nano",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "What text appears in this image? List all the text you can see."
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
      reasoning_effort: "low",  // GPT-5 specific parameter
      max_completion_tokens: 300
    });

    console.log('\n=== GPT-5 Nano Response ===');
    console.log(response.choices[0].message.content);
    console.log('\n=== Token Usage ===');
    console.log('Prompt tokens:', response.usage.prompt_tokens);
    console.log('Completion tokens:', response.usage.completion_tokens);
    console.log('Total tokens:', response.usage.total_tokens);

  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('API Error Details:', error.response.data);
    }
  }
}

testGPTVision();