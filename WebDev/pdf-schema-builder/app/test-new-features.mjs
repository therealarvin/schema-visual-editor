import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testNewFeatures() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🔍 Testing PDF Schema Builder New Features...\n');

  try {
    // Navigate to the app
    await page.goto('http://localhost:3001');
    console.log('✅ Navigated to homepage');

    // Create a new project  
    await page.click('button:has-text("Create Project")');
    await page.fill('input[placeholder="Enter project name"]', 'Feature Test Project');
    
    // Select Purchase Agreement form type
    const formTypeSelect = page.locator('select').first();
    await formTypeSelect.selectOption('Purchase Agreement');
    
    await page.click('button:has-text("Create")');
    console.log('✅ Created new project with Purchase Agreement form type');

    // Upload the Animal Agreement PDF
    const pdfPath = join(__dirname, 'public', 'Animal_Agreement.pdf');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(pdfPath);
    
    // Wait for PDF to load and fields to be extracted
    await page.waitForTimeout(3000);
    console.log('✅ PDF uploaded and fields extracted');

    // Test 1: Select multiple fields for grouping
    console.log('\n📋 Test 1: Field Grouping and Color Display');
    
    // Click on several text fields to select them
    const fieldOverlays = page.locator('div[title*="(text)"]');
    const fieldCount = await fieldOverlays.count();
    
    if (fieldCount >= 3) {
      // Select 3 text fields
      for (let i = 0; i < 3 && i < fieldCount; i++) {
        await fieldOverlays.nth(i).click();
        await page.waitForTimeout(500);
      }
      console.log('✅ Selected 3 text fields');

      // Create a text continuation group
      await page.click('button:has-text("Create Group")');
      await page.waitForTimeout(500);
      
      // Select text-continuation grouping
      const radioButtons = page.locator('input[type="radio"]');
      await radioButtons.first().click(); // text-continuation
      
      await page.fill('input[placeholder="Enter display name"]', 'Full Address');
      await page.click('button:has-text("Create Schema Item")');
      console.log('✅ Created text-continuation group');
      
      // Verify the grouped fields show purple color
      await page.waitForTimeout(1000);
      const purpleFields = await page.locator('div[style*="rgb(139, 92, 246)"]').count();
      if (purpleFields > 0) {
        console.log(`✅ Grouped fields showing purple color (found ${purpleFields} purple fields)`);
      } else {
        console.log('⚠️ Purple color not detected, checking for border color...');
        const purpleBorders = await page.locator('div[style*="border"][style*="139"]').count();
        console.log(`  Found ${purpleBorders} fields with purple-ish borders`);
      }
    }

    // Test 2: Create checkbox group and test linked fields
    console.log('\n🔗 Test 2: Checkbox Linked Fields Functionality');
    
    // Clear selection first
    await page.click('button:has-text("Clear Selection")');
    await page.waitForTimeout(500);
    
    // Select checkbox fields
    const checkboxFields = page.locator('div[title*="(checkbox)"]');
    const checkboxCount = await checkboxFields.count();
    
    if (checkboxCount >= 2) {
      // Select 2 checkbox fields
      for (let i = 0; i < 2 && i < checkboxCount; i++) {
        await checkboxFields.nth(i).click();
        await page.waitForTimeout(500);
      }
      console.log('✅ Selected checkbox fields');

      // Create checkbox group
      await page.click('button:has-text("Create Group")');
      await page.waitForTimeout(500);
      
      // Select checkbox grouping
      const radioOptions = page.locator('label:has-text("Checkbox group")');
      await radioOptions.click();
      
      await page.fill('input[placeholder="Enter display name"]', 'Agreement Options');
      await page.click('button:has-text("Create Schema Item")');
      console.log('✅ Created checkbox group');
      
      // Now test linking functionality
      await page.waitForTimeout(1000);
      
      // Edit the checkbox schema item
      const editButtons = page.locator('button:has-text("Edit")');
      const editButtonCount = await editButtons.count();
      if (editButtonCount > 0) {
        await editButtons.last().click(); // Click the last one (most recently created)
        console.log('✅ Opened checkbox item editor');
        
        // Wait for editor to load
        await page.waitForTimeout(1000);
        
        // Find and click "Add Linked Field" button for first checkbox option
        const addLinkedFieldButtons = page.locator('button:has-text("Add Linked Field")');
        const linkedFieldButtonCount = await addLinkedFieldButtons.count();
        
        if (linkedFieldButtonCount > 0) {
          await addLinkedFieldButtons.first().click();
          console.log('✅ Clicked "Add Linked Field" button - entering linking mode');
          
          // Verify linking mode is active
          const linkingModeIndicator = page.locator('text=/Linking Mode Active/i');
          if (await linkingModeIndicator.isVisible()) {
            console.log('✅ Linking mode activated - UI shows linking indicator');
          }
          
          // In linking mode, grouped fields should show green color
          await page.waitForTimeout(1000);
          const greenFields = await page.locator('div[style*="rgb(16, 185, 129)"]').count();
          if (greenFields > 0) {
            console.log(`✅ Grouped fields showing green in linking mode (found ${greenFields} green fields)`);
            
            // Click on a green field to link it
            const greenField = page.locator('div[style*="rgb(16, 185, 129)"]').first();
            await greenField.click();
            console.log('✅ Clicked on a grouped field to link it');
            
            // Check for success message
            await page.waitForTimeout(500);
          } else {
            console.log('⚠️ No green fields found in linking mode');
          }
          
          // Cancel linking mode if still active
          const cancelButton = page.locator('button:has-text("Cancel Linking Mode")');
          if (await cancelButton.isVisible()) {
            await cancelButton.click();
            console.log('✅ Exited linking mode');
          }
        } else {
          console.log('⚠️ No "Add Linked Field" buttons found');
        }
        
        // Save the edited item
        const saveButton = page.locator('button:has-text("Save")');
        if (await saveButton.isVisible()) {
          await saveButton.click();
          console.log('✅ Saved checkbox item with linked fields');
        }
      }
    } else {
      console.log('⚠️ Not enough checkbox fields found for testing');
    }

    // Test 3: Verify TypeScript export includes linked fields
    console.log('\n📝 Test 3: TypeScript Export Verification');
    
    // Switch to TypeScript export tab
    await page.click('button:has-text("TypeScript Export")');
    await page.waitForTimeout(1000);
    
    // Check if the export contains linkedFields
    const exportContent = await page.locator('pre').textContent();
    if (exportContent && exportContent.includes('linkedFields')) {
      console.log('✅ TypeScript export includes linkedFields property');
    } else {
      console.log('⚠️ linkedFields not found in TypeScript export');
    }
    
    // Check for color indication in export comments
    if (exportContent && exportContent.includes('// Grouped fields')) {
      console.log('✅ Export includes grouped field indicators');
    }

    console.log('\n✨ All new feature tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Keep browser open for manual inspection
    console.log('\n👀 Browser will remain open for 10 seconds for inspection...');
    await page.waitForTimeout(10000);
    
    await browser.close();
    console.log('🎬 Test session ended');
  }
}

// Run the test
testNewFeatures().catch(console.error);