# AI Request/Response Logging

## Overview
Comprehensive logging system for tracking all AI requests and responses, including screenshots, for debugging and analysis.

## Features

### 1. Automatic Request Logging
- Every AI request is logged with a unique request ID
- Captures request parameters, intent, field type, and context
- Records OpenAI API request/response details
- Tracks request duration and success/failure status
- Saves screenshots separately when provided

### 2. Log Storage Structure
```
ai-logs/
├── logs/
│   ├── ai-requests-YYYY-MM-DD.jsonl    # Daily log file (JSONL format)
│   ├── req_*-details.json              # Pretty-printed individual requests
│   └── req_*-error.json                # Error details when failures occur
└── screenshots/
    └── req_*.png                        # Screenshot images (when provided)
```

### 3. Log Viewer UI
- **Location**: Floating button in bottom-right corner (development mode only)
- **Features**:
  - View recent logs with success/failure status
  - Click to see detailed request/response data
  - View screenshots when available
  - Generate summary reports
  - Clear all logs

### 4. API Endpoints

#### GET /api/ai-logs
Query parameters:
- `action=recent&limit=N` - Get N most recent logs
- `action=details&requestId=X` - Get detailed log for request X
- `action=screenshot&requestId=X` - Get screenshot for request X
- `action=summary` - Generate summary report
- `action=list` - List all log files

#### DELETE /api/ai-logs?all=true
Clear all logs and screenshots

## Configuration

### Environment Variables (.env.local)
```bash
# Enable/disable logging
AI_LOGGING_ENABLED=true

# Directory for logs (relative to project root)
AI_LOGS_DIR=ai-logs
```

## Log Entry Structure

```json
{
  "timestamp": "2025-08-08T05:58:47.910Z",
  "requestId": "req_1754632725771_m440p3oml",
  "request": {
    "intent": "phone number for emergency contact",
    "fieldType": "text",
    "groupType": "text-continuation",
    "pdfContext": [...],
    "hasScreenshot": false
  },
  "response": {
    "success": true,
    "data": {
      "display_name": "Emergency Contact Phone",
      "width": 6,
      ...
    }
  },
  "openAIRequest": {...},
  "openAIResponse": {...},
  "screenshot": "screenshots/req_*.png",
  "duration": 2139
}
```

## Usage Examples

### View Recent Logs
```bash
curl "http://localhost:3006/api/ai-logs?action=recent&limit=10"
```

### Get Specific Log Details
```bash
curl "http://localhost:3006/api/ai-logs?action=details&requestId=req_1754632725771_m440p3oml"
```

### View Screenshot
```bash
curl "http://localhost:3006/api/ai-logs?action=screenshot&requestId=req_1754632725771_m440p3oml" > screenshot.png
```

### Generate Summary Report
```bash
curl "http://localhost:3006/api/ai-logs?action=summary"
```

### Clear All Logs
```bash
curl -X DELETE "http://localhost:3006/api/ai-logs?all=true"
```

## Debugging Benefits

1. **Track AI Performance**: Monitor response times and success rates
2. **Debug Failures**: See exact requests that failed and why
3. **Analyze Patterns**: Understand common intents and field types
4. **Verify Screenshots**: Check what visual context was sent to AI
5. **Audit Trail**: Complete history of AI interactions

## Security Considerations

- Logs are stored locally only (not synced to git via .gitignore)
- Contains sensitive data (API requests/responses)
- Should be cleared periodically in production
- Viewer UI only appears in development mode

## Troubleshooting

### Logs Not Appearing
1. Check `AI_LOGGING_ENABLED=true` in `.env.local`
2. Verify `ai-logs` directory has write permissions
3. Check browser console for errors

### Screenshot Not Saving
1. Ensure screenshot is valid base64 encoded PNG
2. Check `ai-logs/screenshots/` directory exists
3. Verify sufficient disk space

### Performance Impact
- Logging adds ~10-20ms overhead per request
- Screenshots are saved asynchronously
- JSONL format allows efficient streaming of large logs

## Summary Reports
Generated summaries include:
- Total requests count
- Success/failure rates
- Average response duration
- Field type distribution
- Recent errors list

## Development Tips

1. Use request IDs to correlate logs with user actions
2. Enable verbose logging during development
3. Clear logs regularly to save disk space
4. Use summary reports for performance analysis
5. Check screenshots to verify UI context