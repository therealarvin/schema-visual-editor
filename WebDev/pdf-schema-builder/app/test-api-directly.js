#!/usr/bin/env node

// Test the API endpoint directly with a known working image

const fs = require('fs');
const path = require('path');

async function createTestImage() {
  const { createCanvas } = await import('canvas');
  const canvas = createCanvas(400, 200);
  const ctx = canvas.getContext('2d');
  
  // White background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, 400, 200);
  
  // Add test text with yellow background
  ctx.fillStyle = 'rgba(255, 255, 0, 0.9)';
  ctx.fillRect(10, 10, 380, 50);
  
  ctx.fillStyle = 'black';
  ctx.font = 'bold 20px Arial';
  ctx.fillText('TEST IMAGE: Can you read this? Code: ABC789', 20, 40);
  
  // Add form field mockup
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(50, 80, 300, 40);
  ctx.strokeStyle = '#8b5cf6';
  ctx.lineWidth = 3;
  ctx.strokeRect(50, 80, 300, 40);
  
  ctx.fillStyle = 'black';
  ctx.font = '16px Arial';
  ctx.fillText('Example Form Field', 60, 105);
  
  // Return as full data URL
  return canvas.toDataURL('image/png');
}

async function testAPI() {
  console.log('Testing API endpoint directly...\n');
  
  try {
    // Create test image
    const testImageDataUrl = await createTestImage();
    console.log('✅ Test image created');
    console.log('   Format: Full data URL (data:image/png;base64,...)');
    console.log('   First 50 chars:', testImageDataUrl.substring(0, 50));
    console.log('   Total length:', testImageDataUrl.length, '\n');
    
    // Prepare request
    const requestBody = {
      intent: 'Create a phone number field for the contact form',
      fieldType: 'text',
      groupType: 'text-same-value',
      screenshot: testImageDataUrl, // Send full data URL
      pdfContext: [
        { name: 'phone', type: 'text', page: 1 }
      ]
    };
    
    console.log('📤 Sending request to API...\n');
    
    // Make request to local API (try both ports)
    const port = process.env.PORT || 3001;
    const response = await fetch(`http://localhost:${port}/api/generate-field-attributes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('Response status:', response.status, response.statusText);
    
    const data = await response.json();
    
    console.log('\n📥 Response from API:');
    console.log(JSON.stringify(data, null, 2));
    
    // Check if AI could read the test text
    if (data.image_text_seen) {
      console.log('\n✅ SUCCESS! AI read the test text from image:');
      console.log('   ', data.image_text_seen);
    } else {
      console.log('\n⚠️  WARNING: AI did not report seeing the test text');
      console.log('   This suggests image processing may not be working');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Check if canvas package is installed
try {
  require.resolve('canvas');
  testAPI();
} catch(e) {
  console.log('Installing canvas package for image generation...');
  require('child_process').execSync('npm install canvas', { stdio: 'inherit' });
  testAPI();
}