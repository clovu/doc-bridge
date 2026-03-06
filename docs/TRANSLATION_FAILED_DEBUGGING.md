# Translation Failed - Debugging Guide

## Error Message
```
Translation failed {"error":"Translation failed","isTimeout":false}
```

## What This Means

After our recent error handling improvements, all translation errors now show the generic message "Translation failed" to users. The detailed error information is logged to the console for debugging.

## How to Debug

### Step 1: Check Server Console

Look at your terminal where you ran `pnpm dev`. You should see detailed error logs like:

```
=== Translation Error Details ===
Error: Translation failed
Provider: claude
Files: ["README.md"]
Target Locale: zh
Stack: [stack trace]
================================
```

### Step 2: Check Provider-Specific Logs

The AI provider (OpenAI or Claude) logs detailed error information:

**For JSON Parsing Errors:**
```javascript
[ERROR] OpenAITranslationProvider: JSON extraction failed
{
  error: "Failed to parse JSON array from response",
  contentPreview: "<p>HTML content instead of JSON...</p>"
}
```

**For Count Mismatch:**
```javascript
[ERROR] OpenAITranslationProvider: translation count mismatch
{
  expected: 2,
  received: 1,
  segments: ["[0] First segment", "[1] Second segment"],
  translations: ["[0] Only one translation"]
}
```

### Step 3: Common Issues and Solutions

#### Issue 1: Invalid API Key

**Symptoms:**
- Error mentions "401" or "Unauthorized"
- Error mentions "Invalid API key"

**Solution:**
```bash
# Check your .env.local file
cat apps/web/.env.local | grep ANTHROPIC_API_KEY

# Make sure it's set and valid
# Get a new key from: https://console.anthropic.com/
```

#### Issue 2: AI Returned HTML Instead of JSON

**Symptoms:**
- Error mentions "Failed to parse JSON"
- Content preview shows HTML tags like `<p>`, `<html>`, etc.

**Solution:**
This happens when the AI model returns formatted text instead of pure JSON. The provider should handle this automatically with the `extractJSON` function, but if it persists:

1. Try a different AI model
2. Check if the file content is too large
3. Try translating fewer files at once

#### Issue 3: Translation Count Mismatch

**Symptoms:**
- Error mentions "count mismatch"
- Expected vs received counts don't match

**Solution:**
The AI returned a different number of translations than requested. This can happen when:
- The AI misunderstood the instruction
- The content is too complex
- The AI combined or split segments

**Fix:**
1. Try translating smaller files
2. Use a more capable model (e.g., gpt-4o instead of gpt-3.5-turbo)
3. Check if the markdown has unusual formatting

#### Issue 4: Timeout

**Symptoms:**
- `isTimeout: true`
- Error mentions "timed out"

**Solution:**
```bash
# The default timeout is 120 seconds (2 minutes)
# For large files, you may need to:
# 1. Split the file into smaller parts
# 2. Translate fewer files at once
# 3. Use a faster model
```

#### Issue 5: Rate Limit

**Symptoms:**
- Error mentions "rate limit"
- Error mentions "429"

**Solution:**
- Wait a few minutes and try again
- Upgrade your API plan
- Translate fewer files at once

### Step 4: Enable Detailed Logging

If you need even more details, you can enable debug logging:

1. Open `apps/web/src/app/api/translate/route.ts`
2. The logger is already configured to log debug messages
3. Check your server console for `[DEBUG]` messages

### Step 5: Test with a Simple File

Try translating a very simple file first:

1. Create a test file: `test.md`
   ```markdown
   # Hello

   This is a test.
   ```

2. Try translating just this file
3. If it works, the issue is with the specific file you're trying to translate

## Quick Fixes

### Fix 1: Restart the Dev Server

Sometimes the issue is just a stale connection:
```bash
# Stop the server (Ctrl+C)
pnpm dev
```

### Fix 2: Check API Key

```bash
# Verify your API key is set
cd apps/web
grep ANTHROPIC_API_KEY .env.local
```

### Fix 3: Try a Different Provider

If using Claude, try OpenAI:
1. Get an OpenAI API key from https://platform.openai.com/
2. In the translation settings, select "OpenAI" provider
3. Enter your API key

### Fix 4: Reduce File Size

If translating a large file:
1. Split it into smaller files
2. Translate one section at a time
3. Combine the results manually

## Getting More Help

If you're still stuck, please provide:

1. **Server console output** (the detailed error logs)
2. **Which AI provider** you're using (Claude/OpenAI/Custom)
3. **File size** you're trying to translate
4. **Target language**
5. **Any error messages** from the browser console

## Example: Full Debug Session

```bash
# 1. Check environment
cd apps/web
cat .env.local | grep -E "ANTHROPIC|OPENAI"

# 2. Restart server with fresh logs
pnpm dev

# 3. Try translation and watch console output

# 4. Look for these log patterns:
# [INFO] Translation request received
# [DEBUG] Processing file
# [ERROR] Translation failed  <-- This is where the details are
```

## Related Documentation

- `docs/TRANSLATION_PROVIDER_ERROR_HANDLING.md` - Error handling implementation
- `docs/ERROR_HANDLING_SUMMARY.md` - Error handling summary
- `docs/LOGGING.md` - Logging configuration

## Prevention

To avoid translation failures:

1. **Use valid API keys** - Test them before translating
2. **Start small** - Translate one file first
3. **Check file size** - Large files may timeout
4. **Use appropriate models** - More capable models handle edge cases better
5. **Monitor rate limits** - Don't translate too many files at once

## Summary

The "Translation failed" message is intentionally generic to protect users from seeing internal error details. The actual error information is logged to the server console with full context for debugging. Check your server logs to see the specific error and follow the solutions above.
