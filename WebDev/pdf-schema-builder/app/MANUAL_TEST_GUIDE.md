# Manual Test Guide for GPT-5 nano Image Capability

## Test Steps

1. **Open the app**
   - Navigate to http://localhost:3005
   
2. **Create a project**
   - Enter project name: "Test Image"
   - Enter form type: "test_form"
   - Click "Create"

3. **Upload a PDF**
   - Click "Choose File"
   - Select any PDF with form fields (e.g., test.pdf in public folder)
   - Wait for PDF to load

4. **Select fields to group**
   - Click on 2-3 text fields in the PDF
   - They should turn blue when selected

5. **Create a group with AI**
   - Click "Create Group" button
   - Select "Text Continuation" as group type
   - In the "Field Intent" box, enter: "Customer full name"
   - Click the "Create Group" button

6. **Watch for AI processing**
   - You should see "AI is generating field attributes using GPT-5 nano..."
   - Wait for completion

7. **Check the result**
   - You should see an alert dialog:
     - ✅ If it says "SUCCESS! GPT-5 nano CAN read images!" - Image processing is working!
     - ⚠️ If it says "GPT-5 nano did not read the test text" - Image processing failed

8. **Verify in console**
   - Open browser DevTools (F12)
   - Check Console tab for messages about image processing
   - Look for "AI successfully read image text" messages

## What's Being Tested

The app adds a yellow test overlay with "TEST IMAGE: Can you read this? Code: ABC789" to screenshots before sending to GPT-5 nano. If the AI can read this text, it confirms image processing is working.

## Expected Result

With the fixes applied:
- GPT-5 nano should successfully read the test text
- You should see the SUCCESS alert
- The AI will generate better field attributes using visual context from the screenshot

## API Configuration

The working configuration for GPT-5 nano:
```javascript
{
  model: 'gpt-5-nano',
  messages: [...],
  max_completion_tokens: 1000,  // Not max_tokens
  reasoning_effort: 'medium'     // Helps with images
  // No temperature parameter (only supports default of 1)
}
```