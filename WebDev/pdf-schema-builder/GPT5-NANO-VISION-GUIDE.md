# GPT-5 Nano Vision API Guide

## Overview
GPT-5 Nano is OpenAI's lightweight vision-capable model, optimized for speed and cost-efficiency. Released August 7, 2025, it supports both text and image inputs at extremely competitive pricing.

## Pricing
- **Input**: $0.05 per 1M tokens
- **Output**: $0.40 per 1M tokens
- **Image tokens**: ~500-600 tokens for a typical image

## Key API Requirements

### Required Parameters
- **`model`**: Must be `"gpt-5-nano"`
- **`reasoning_effort`**: Required parameter unique to GPT-5 models
  - Options: `"low"`, `"medium"`, `"high"`
  - Use `"low"` for simple text extraction
  - Use `"medium"` or `"high"` for complex analysis
- **`max_completion_tokens`**: Maximum tokens for response (not `max_tokens`)

### Unsupported Parameters
- **`temperature`**: Only default value (1.0) supported
- **`max_tokens`**: Use `max_completion_tokens` instead
- **`detail`**: Image detail parameter not needed

## Image Format

### Base64 Encoding (Recommended for local files)
```javascript
const imageBuffer = fs.readFileSync('image.png');
const base64Image = imageBuffer.toString('base64');
const imageUrl = `data:image/png;base64,${base64Image}`;
```

### URL Format (For web images)
```javascript
const imageUrl = "https://example.com/image.png";
```

## Complete Example

### Installation
```bash
npm install openai
```

### Basic Implementation
```javascript
const OpenAI = require('openai');
const fs = require('fs');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function analyzeImage(imagePath) {
  // Read and encode image
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');

  // Send to GPT-5 Nano
  const response = await openai.chat.completions.create({
    model: "gpt-5-nano",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "What do you see in this image?"
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
    reasoning_effort: "low",  // Required!
    max_completion_tokens: 300
  });

  return response.choices[0].message.content;
}
```

## Common Use Cases

### Text Extraction
```javascript
const response = await openai.chat.completions.create({
  model: "gpt-5-nano",
  messages: [{
    role: "user",
    content: [
      { type: "text", text: "Extract all text from this image" },
      { type: "image_url", image_url: { url: imageData } }
    ]
  }],
  reasoning_effort: "low",
  max_completion_tokens: 500
});
```

### Image Description
```javascript
const response = await openai.chat.completions.create({
  model: "gpt-5-nano",
  messages: [{
    role: "user",
    content: [
      { type: "text", text: "Describe this image in detail" },
      { type: "image_url", image_url: { url: imageData } }
    ]
  }],
  reasoning_effort: "medium",
  max_completion_tokens: 300
});
```

### Multiple Images
```javascript
const response = await openai.chat.completions.create({
  model: "gpt-5-nano",
  messages: [{
    role: "user",
    content: [
      { type: "text", text: "Compare these two images" },
      { type: "image_url", image_url: { url: image1Data } },
      { type: "image_url", image_url: { url: image2Data } }
    ]
  }],
  reasoning_effort: "high",
  max_completion_tokens: 500
});
```

## Error Handling

### Common Errors and Solutions

#### Unsupported Parameter Error
```javascript
// ❌ Wrong
{
  model: "gpt-5-nano",
  max_tokens: 300,  // Error: Use max_completion_tokens
  temperature: 0.5  // Error: Only default supported
}

// ✅ Correct
{
  model: "gpt-5-nano",
  max_completion_tokens: 300,
  reasoning_effort: "low"
}
```

#### Empty Response
If GPT-5 Nano returns empty responses, ensure:
1. `reasoning_effort` parameter is included
2. Using `max_completion_tokens` not `max_tokens`
3. Image is properly base64 encoded

## Cost Optimization Tips

1. **Use "low" reasoning effort** for simple tasks like text extraction
2. **Compress images** before sending (PNG/JPEG compression)
3. **Resize large images** - GPT-5 Nano handles standard resolutions well
4. **Batch related queries** in single conversations when possible

## Limitations

- **Input**: Maximum 272,000 tokens per request
- **Output**: Maximum 128,000 tokens per response
- **Images**: Maximum 20MB per image, up to 20 images per request
- **Temperature**: Cannot be customized (always 1.0)
- **Response format**: Text only (cannot generate images)

## Full Working Example

```javascript
const OpenAI = require('openai');
const fs = require('fs');

async function extractTextFromImage() {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    // Read image file
    const imageBuffer = fs.readFileSync('document.png');
    const base64Image = imageBuffer.toString('base64');

    // Call GPT-5 Nano
    const response = await openai.chat.completions.create({
      model: "gpt-5-nano",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all text from this document image"
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
      reasoning_effort: "low",
      max_completion_tokens: 1000
    });

    console.log('Extracted text:', response.choices[0].message.content);
    console.log('Tokens used:', response.usage.total_tokens);
    
    // Calculate cost
    const cost = (response.usage.prompt_tokens / 1000000 * 0.05) + 
                 (response.usage.completion_tokens / 1000000 * 0.40);
    console.log('Cost: $', cost.toFixed(6));

  } catch (error) {
    console.error('Error:', error.message);
  }
}

extractTextFromImage();
```

## Quick Reference

| Parameter | Required | Value | Notes |
|-----------|----------|-------|-------|
| `model` | ✅ | `"gpt-5-nano"` | Model identifier |
| `reasoning_effort` | ✅ | `"low"`, `"medium"`, `"high"` | GPT-5 specific |
| `max_completion_tokens` | ✅ | Number | Not `max_tokens` |
| `messages` | ✅ | Array | Standard format |
| `temperature` | ❌ | - | Not supported |
| `max_tokens` | ❌ | - | Use `max_completion_tokens` |

## Additional Resources

- [OpenAI GPT-5 Announcement](https://openai.com/index/introducing-gpt-5/)
- [API Documentation](https://platform.openai.com/docs/models/gpt-5-nano)
- Pricing: $0.05/1M input, $0.40/1M output tokens