# GPT-5 Nano AI Integration

## Overview
The PDF Schema Builder now uses OpenAI's GPT-5 nano model to intelligently generate field attributes based on user intent rather than requiring manual entry of display names and settings.

## How It Works

### User Flow
1. User selects PDF fields and clicks "Create Group"
2. User enters an **intent description** (e.g., "contractor name for lawn service")
3. System captures a screenshot of the PDF area with highlighted fields
4. GPT-5 nano processes the intent and generates appropriate field attributes
5. Generated attributes are applied to the schema item

### AI-Generated Attributes
- **display_name**: Clear, professional field name (2-5 words)
- **description**: Additional context (only when needed)
- **width**: Grid width (1-12 units)
- **placeholder**: Helpful example text
- **special_input**: Field-specific settings (email validation, phone formatting, etc.)

## Technical Implementation

### Key Files
- `/src/lib/aiService.ts` - AI service module with screenshot capture
- `/src/app/api/generate-field-attributes/route.ts` - Secure API endpoint
- `/src/components/FieldGrouping.tsx` - Intent input UI
- `/src/components/SchemaEditor.tsx` - AI integration with loading state

### GPT-5 Nano Configuration
```javascript
{
  model: 'gpt-5-nano',
  max_completion_tokens: 1000,  // Includes reasoning tokens
  reasoning_effort: 'low'        // Fast response for simple tasks
}
```

### Important Notes
- GPT-5 nano is a reasoning model that uses internal thinking tokens
- Temperature parameter is not supported (always uses default of 1)
- Must use `max_completion_tokens` instead of `max_tokens`
- Supports `reasoning_effort` parameter (low/medium/high)

## API Examples

### Text Field
**Intent**: "contractor name for lawn service"
**Generated**:
```json
{
  "display_name": "Contractor Name",
  "width": 6,
  "placeholder": "e.g., Ace Landscaping",
  "special_input": {
    "type": "name",
    "auto_capitalize": true
  }
}
```

### Email Field
**Intent**: "customer email address for sending invoices"
**Generated**:
```json
{
  "display_name": "Customer Email",
  "width": 6,
  "placeholder": "customer@example.com",
  "special_input": {
    "type": "email",
    "inputMode": "email",
    "autocomplete": "email",
    "pattern": ".+@.+\\..+"
  }
}
```

### Checkbox Group
**Intent**: "select services needed for property maintenance"
**Generated**:
```json
{
  "display_name": "Maintenance Services",
  "description": "Select all services required",
  "width": 12,
  "special_input": {
    "type": "checkbox_group",
    "options": [...]
  }
}
```

## Cost
- GPT-5 nano: $0.05/1M input tokens, $0.40/1M output tokens
- Extremely cost-effective for this use case
- Typical request uses ~100-200 tokens total

## Security
- API key stored in `.env.local` (never exposed to client)
- All OpenAI calls made through server-side API route
- Fallback to manual entry if AI fails

## Development
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Environment Variables
```bash
# .env.local
OPENAI_API_KEY=your_api_key_here
```

## Troubleshooting
- If AI returns empty responses, check token limits
- GPT-5 nano doesn't support temperature parameter
- Use `reasoning_effort: 'low'` for faster responses
- Increase `max_completion_tokens` if responses are cut off