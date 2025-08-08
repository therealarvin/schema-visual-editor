#!/usr/bin/env node

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testWebsiteImageCapability() {
  console.log('🧪 Testing GPT-5 nano image capability in PDF Schema Builder...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--no-sandbox']
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    if (msg.text().includes('AI') || msg.text().includes('image') || msg.text().includes('SUCCESS')) {
      console.log('Browser console:', msg.text());
    }
  });
  
  try {
    // Navigate to the app
    console.log('1️⃣ Navigating to PDF Schema Builder...');
    await page.goto('http://localhost:3005');
    await page.waitForLoadState('networkidle');
    
    // Create a new project
    console.log('2️⃣ Creating new project...');
    await page.fill('input[placeholder="Project name"]', 'Test Image Project');
    await page.fill('input[placeholder="Form type"]', 'test_form');
    await page.click('button:has-text("Create")');
    
    // Wait for project page to load
    await page.waitForURL(/\/[a-z0-9-]+$/);
    console.log('   Project created:', page.url());
    
    // Upload the PDF
    console.log('3️⃣ Uploading PDF...');
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, 'public', 'test.pdf'));
    
    // Wait for PDF to load
    await page.waitForTimeout(3000);
    console.log('   PDF uploaded and rendered');
    
    // Check if fields are visible
    const fields = await page.locator('[data-field-name]').count();
    console.log(`   Found ${fields} form fields in PDF`);
    
    if (fields === 0) {
      console.log('❌ No form fields found in PDF. Cannot test image capability.');
      await browser.close();
      return;
    }
    
    // Select a few text fields to group
    console.log('4️⃣ Selecting fields to group...');
    const fieldElements = await page.locator('[data-field-name]').all();
    
    // Click on first 2-3 text fields
    let selectedCount = 0;
    for (let i = 0; i < Math.min(3, fieldElements.length); i++) {
      const field = fieldElements[i];
      const fieldName = await field.getAttribute('data-field-name');
      
      // Check if it's likely a text field (not checkbox/radio)
      const bbox = await field.boundingBox();
      if (bbox && bbox.width > 50) { // Text fields are usually wider
        await field.click();
        selectedCount++;
        console.log(`   Selected field: ${fieldName}`);
        
        if (selectedCount >= 2) break;
      }
    }
    
    if (selectedCount < 2) {
      console.log('❌ Could not select enough text fields. Need at least 2.');
      await browser.close();
      return;
    }
    
    // Click Create Group button
    console.log('5️⃣ Creating field group...');
    await page.click('button:has-text("Create Group")');
    await page.waitForTimeout(500);
    
    // Select group type
    await page.selectOption('select', 'text-continuation');
    
    // Enter intent - this will trigger AI with screenshot
    console.log('6️⃣ Entering intent (this will trigger AI with screenshot)...');
    await page.fill('textarea[placeholder*="Describe what this field is for"]', 
      'Customer full name that needs to be entered across multiple boxes');
    
    // Click Create Group to trigger AI
    console.log('7️⃣ Triggering AI generation with screenshot...');
    await page.click('button:has-text("Create Group"):last-of-type');
    
    // Wait for AI processing
    console.log('   Waiting for AI to process...');
    await page.waitForTimeout(2000);
    
    // Check for AI processing indicator
    const aiProcessing = await page.locator('text=/AI is generating/i').isVisible().catch(() => false);
    if (aiProcessing) {
      console.log('   ✅ AI processing started');
      await page.waitForSelector('text=/AI is generating/i', { state: 'hidden', timeout: 30000 });
      console.log('   ✅ AI processing completed');
    }
    
    // Check for success/warning alerts
    await page.waitForTimeout(1000);
    
    // Check if any dialog appeared
    page.on('dialog', async dialog => {
      const message = dialog.message();
      console.log('\n📢 Alert from app:', message);
      
      if (message.includes('SUCCESS') && message.includes('CAN read images')) {
        console.log('\n✅ SUCCESS! GPT-5 nano successfully processed the screenshot!');
        console.log('   The AI was able to read the image content.');
      } else if (message.includes('did not read the test text')) {
        console.log('\n⚠️  WARNING: GPT-5 nano did not process the screenshot');
        console.log('   The AI generated attributes from text only.');
      }
      
      await dialog.accept();
    });
    
    // Wait a bit for any alerts
    await page.waitForTimeout(3000);
    
    // Check the generated schema item
    console.log('\n8️⃣ Checking generated schema...');
    const schemaItems = await page.locator('[style*="border: 1px solid #d1d5db"]').count();
    if (schemaItems > 0) {
      console.log(`   ✅ Schema item created (${schemaItems} items)`);
      
      // Get the display name that was generated
      const displayName = await page.locator('strong').first().textContent();
      console.log(`   Generated display name: "${displayName}"`);
    }
    
    // Check AI logs if available
    console.log('\n9️⃣ Checking AI logs...');
    const logsButton = await page.locator('button:has-text("AI Logs")').isVisible().catch(() => false);
    if (logsButton) {
      await page.click('button:has-text("AI Logs")');
      await page.waitForTimeout(1000);
      console.log('   AI Logs opened - check for image processing details');
    }
    
    console.log('\n✅ Test completed! Check the browser window for results.');
    console.log('   The app should have processed the screenshot with GPT-5 nano.');
    
    // Keep browser open for manual inspection
    console.log('\n⏸️  Browser will stay open for 10 seconds for inspection...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
    console.log('\n🏁 Test finished');
  }
}

// Run the test
testWebsiteImageCapability().catch(console.error);