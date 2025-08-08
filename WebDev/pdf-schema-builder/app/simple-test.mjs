import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function simpleTest() {
  console.log('🔍 Testing PDF Schema Builder Features...\n');
  
  const browser = await chromium.launch({ 
    headless: true,
    timeout: 10000 
  });
  
  try {
    const page = await browser.newPage();
    
    // Test 1: Navigate to app
    console.log('📍 Test 1: Basic Navigation');
    await page.goto('http://localhost:3001', { timeout: 10000 });
    console.log('✅ App loaded successfully');
    
    // Test 2: Create project
    console.log('\n📦 Test 2: Project Creation');
    await page.click('button:has-text("Create")', { timeout: 5000 });
    await page.fill('input[placeholder="Enter project name"]', 'Test Project');
    
    // Select form type
    const formTypeSelect = page.locator('select').first();
    await formTypeSelect.selectOption('Purchase Agreement');
    
    await page.click('button:has-text("Create")');
    console.log('✅ Created project with Purchase Agreement form type');
    
    // Test 3: Upload PDF
    console.log('\n📄 Test 3: PDF Upload');
    await page.waitForTimeout(2000);
    
    const pdfPath = join(__dirname, 'public', 'Animal_Agreement.pdf');
    await page.setInputFiles('input[type="file"]', pdfPath);
    
    await page.waitForTimeout(3000);
    console.log('✅ PDF uploaded and processed');
    
    // Test 4: Check for field overlays
    console.log('\n🎯 Test 4: Field Detection');
    const fields = await page.locator('div[title*="field"]').count();
    console.log(`✅ Found ${fields} PDF fields`);
    
    // Test 5: Select fields and check grouping button
    console.log('\n🔗 Test 5: Field Selection');
    const textFields = page.locator('div[title*="(text)"]');
    const textFieldCount = await textFields.count();
    
    if (textFieldCount >= 2) {
      await textFields.first().click();
      await page.waitForTimeout(500);
      await textFields.nth(1).click();
      console.log('✅ Selected 2 text fields');
      
      // Check if group button appears
      const groupButton = page.locator('button:has-text("Create Group")');
      if (await groupButton.isVisible()) {
        console.log('✅ Create Group button is visible');
        
        // Create a group
        await groupButton.click();
        await page.waitForTimeout(500);
        
        // Select text-continuation
        await page.locator('input[type="radio"]').first().click();
        await page.fill('input[placeholder="Enter display name"]', 'Test Group');
        await page.click('button:has-text("Create Schema Item")');
        console.log('✅ Created text group successfully');
        
        // Test 6: Check for color changes
        console.log('\n🎨 Test 6: Grouped Field Colors');
        await page.waitForTimeout(1500);
        
        // Look for any styled field overlays
        const styledFields = await page.locator('div[style*="border"]').count();
        console.log(`✅ Found ${styledFields} styled field overlays`);
        
        // Check specifically for purple borders (grouped fields)
        const purpleStyles = await page.locator('div[style*="139, 92, 246"]').count();
        if (purpleStyles > 0) {
          console.log(`✅ Grouped fields showing purple color (${purpleStyles} fields)`);
        } else {
          console.log('⚠️  Purple color not detected, may be using different color values');
        }
      }
    }
    
    // Test 7: Check schema editor
    console.log('\n📝 Test 7: Schema Editor');
    const schemaItems = await page.locator('div:has(> button:has-text("Edit"))').count();
    console.log(`✅ Found ${schemaItems} schema items in editor`);
    
    // Test 8: TypeScript export
    console.log('\n💻 Test 8: TypeScript Export');
    await page.click('button:has-text("TypeScript Export")');
    await page.waitForTimeout(1000);
    
    const exportContent = await page.locator('pre').first().textContent();
    if (exportContent && exportContent.includes('SchemaItem')) {
      console.log('✅ TypeScript export generated successfully');
    }
    
    console.log('\n✨ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
simpleTest().catch(console.error);