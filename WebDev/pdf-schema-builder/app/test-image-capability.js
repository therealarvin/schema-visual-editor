#!/usr/bin/env node

// Test script to verify GPT-5 nano image capability

const fs = require('fs');
const path = require('path');

// Create a simple test image with text
async function createTestImage() {
  const { createCanvas } = await import('canvas');
  const canvas = createCanvas(400, 200);
  const ctx = canvas.getContext('2d');
  
  // White background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, 400, 200);
  
  // Add test text
  ctx.fillStyle = 'black';
  ctx.font = '30px Arial';
  ctx.fillText('TEST IMAGE', 50, 50);
  ctx.fillText('Code: XYZ123', 50, 100);
  ctx.fillText('Can you read this?', 50, 150);
  
  // Convert to base64
  return canvas.toDataURL('image/png').split(',')[1];
}

async function testOpenAI() {
  console.log('Testing GPT-5 nano image capability...\n');
  
  // Load environment variables
  require('dotenv').config({ path: '.env.local' });
  
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY not found in .env.local');
    process.exit(1);
  }
  
  try {
    // Create test image
    const testImage = await createTestImage();
    console.log('✅ Test image created (base64 length:', testImage.length, ')\n');
    
    // Prepare request
    const requestBody = {
      model: 'gpt-5-nano',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that can analyze images. If you can see text in an image, please read it and include it in your response.'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Please look at this image and tell me what text you can see. If you cannot see any image or text, please say so.'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${testImage}`,
                detail: 'high'
              }
            }
          ]
        }
      ],
      max_completion_tokens: 1000,  // GPT-5 nano uses max_completion_tokens
      reasoning_effort: 'medium'  // Try with medium reasoning effort
      // temperature: 1 is the default and only supported value for GPT-5 nano
    };
    
    console.log('📤 Sending request to OpenAI GPT-5 nano...\n');
    console.log('Request structure:');
    console.log('- Model:', requestBody.model);
    console.log('- Message types:', requestBody.messages.map(m => 
      m.content && Array.isArray(m.content) 
        ? `${m.role}: [${m.content.map(c => c.type).join(', ')}]`
        : `${m.role}: text`
    ).join(', '));
    console.log('- Image format: data:image/png;base64,...');
    console.log('- Detail level: high\n');
    
    // Make request
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ API Error:', response.status, response.statusText);
      console.error('Response:', JSON.stringify(data, null, 2));
      process.exit(1);
    }
    
    console.log('📥 Response received from OpenAI:\n');
    
    if (data.choices && data.choices[0]?.message?.content) {
      const content = data.choices[0].message.content;
      console.log('AI Response:', content, '\n');
      
      // Check if AI could read the image
      const expectedText = ['TEST IMAGE', 'XYZ123', 'Can you read this'];
      const foundText = expectedText.filter(text => 
        content.toLowerCase().includes(text.toLowerCase())
      );
      
      if (foundText.length > 0) {
        console.log('✅ SUCCESS! GPT-5 nano CAN read images!');
        console.log('   Found text:', foundText.join(', '));
      } else {
        console.log('⚠️  WARNING: GPT-5 nano did not identify the text in the image');
        console.log('   This suggests image processing may not be working');
      }
    } else {
      console.error('❌ Unexpected response structure:', JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Check if canvas package is installed
try {
  require.resolve('canvas');
  testOpenAI();
} catch(e) {
  console.log('Installing canvas package for image generation...');
  require('child_process').execSync('npm install canvas', { stdio: 'inherit' });
  testOpenAI();
}