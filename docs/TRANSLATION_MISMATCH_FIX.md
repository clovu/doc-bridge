# Translation Count Mismatch Fix

## Problem

Translation requests were failing with the error:
```
Translation failed {"error":"OpenAITranslationProvider: expected 2 translations, got 1","isTimeout":false}
```

The system expected a certain number of translations (matching the number of segments), but the AI provider returned fewer translations.

## Root Cause Analysis

The issue occurs when:
1. **AI model combines segments**: The model might merge multiple segments into one translation
2. **AI model skips segments**: The model might not translate all segments
3. **Response truncation**: The model's response might be cut off due to token limits
4. **JSON parsing issues**: The extraction might fail to parse all translations

The original error message provided minimal debugging information, making it difficult to diagnose the root cause.

## Solution Implemented

### 1. Enhanced Error Messages (TDD Approach)

**Tests Added** (`packages/ai/tests/translation-mismatch.test.ts`):
- 9 new tests covering mismatch scenarios for both OpenAI and Claude providers
- Tests for fewer translations, more translations, and empty responses
- Verification that error messages contain useful debugging information

**Implementation Changes**:

#### OpenAI Provider (`packages/ai/src/openai-provider.ts`):
```typescript
if (translated.length !== segments.length) {
  const errorDetails = {
    expected: segments.length,
    received: translated.length,
    segments: segments.map((s, i) => `[${i}] ${s.substring(0, 50)}...`),
    translations: translated.map((t, i) => `[${i}] ${t.substring(0, 50)}...`),
  }

  this.logger?.error('OpenAITranslationProvider: translation count mismatch', errorDetails)

  throw new Error(
    `OpenAITranslationProvider: expected ${segments.length} translations, got ${translated.length}. ` +
    `Segments: ${JSON.stringify(errorDetails.segments)}. ` +
    `Translations: ${JSON.stringify(errorDetails.translations)}`,
  )
}
```

#### Claude Provider (`packages/ai/src/claude-provider.ts`):
Same enhancement applied with Claude-specific error messages.

### 2. Additional Debug Logging

Added debug logging to capture raw AI responses:

```typescript
this.logger?.debug('OpenAITranslationProvider: raw response', {
  contentLength: content.length,
  contentPreview: content.substring(0, 200),
})
```

This helps diagnose:
- Whether the AI returned incomplete JSON
- Whether the response was truncated
- What the actual AI output looked like

### 3. Enhanced JSON Extraction Error Logging

```typescript
try {
  translated = extractJSON(content)
} catch (err) {
  this.logger?.error('OpenAITranslationProvider: JSON extraction failed', {
    error: err instanceof Error ? err.message : String(err),
    contentPreview: content.substring(0, 200),
  })
  throw new Error(...)
}
```

## Benefits

### Before:
```
Error: OpenAITranslationProvider: expected 2 translations, got 1
```
- No information about what segments were requested
- No information about what translations were returned
- Difficult to debug

### After:
```
Error: OpenAITranslationProvider: expected 2 translations, got 1.
Segments: ["[0] This is the first segment to translate...", "[1] This is the second segment..."].
Translations: ["[0] Esta es la primera traducción combinada..."].
```
- Clear view of what was requested
- Clear view of what was returned
- Easy to see if segments were combined or skipped
- Logged to console for debugging

## Test Results

```
packages/ai: 128 tests passing (119 original + 9 new)
  - translation-mismatch.test.ts: 9 tests
    - OpenAI provider mismatch scenarios: 5 tests
    - Claude provider mismatch scenarios: 4 tests
```

## Usage

The enhanced error messages are automatically included when translation count mismatches occur. No code changes needed in calling code.

### Example Log Output:

```json
{
  "level": "error",
  "message": "OpenAITranslationProvider: translation count mismatch",
  "data": {
    "expected": 2,
    "received": 1,
    "segments": [
      "[0] This is the first segment to translate...",
      "[1] This is the second segment to translate..."
    ],
    "translations": [
      "[0] Esta es la traducción combinada de ambos segmentos..."
    ]
  }
}
```

## Next Steps for Production Debugging

When this error occurs in production, check the logs for:

1. **Segment count**: How many segments were requested?
2. **Segment content**: What were the segments? (first 50 chars shown)
3. **Translation count**: How many translations were returned?
4. **Translation content**: What did the AI return?
5. **Raw response preview**: What was the actual AI output?

### Common Patterns:

**Pattern 1: AI combines segments**
```
Segments: ["[0] Hello", "[1] World"]
Translations: ["[0] Hola Mundo"]
```
→ AI merged both segments into one translation

**Pattern 2: AI skips segments**
```
Segments: ["[0] Hello", "[1] World", "[2] Goodbye"]
Translations: ["[0] Hola", "[1] Adiós"]
```
→ AI skipped the second segment

**Pattern 3: Response truncation**
```
Raw response: {"contentLength": 4096, "contentPreview": "[\"Translation 1\", \"Translation 2\", \"Transl..."}
```
→ Response was cut off at token limit

## Potential Future Enhancements

If this error occurs frequently, consider:

1. **Automatic retry with smaller batches**: Split segments into smaller groups
2. **Segment size limits**: Warn or split when segments are too large
3. **Token estimation**: Estimate output tokens and adjust max_tokens accordingly
4. **Fallback to single-segment translation**: If batch fails, translate one at a time

## Files Modified

- `packages/ai/src/openai-provider.ts` - Enhanced error messages and logging
- `packages/ai/src/claude-provider.ts` - Enhanced error messages and logging
- `packages/ai/tests/translation-mismatch.test.ts` - New test file (9 tests)
- `packages/ai/tests/openai-provider.test.ts` - Updated logging test expectations
- `packages/ai/tests/claude-provider.test.ts` - Updated logging test expectations

## Backward Compatibility

✅ Fully backward compatible
- Error detection logic unchanged
- Error is still thrown when mismatch occurs
- Only error message content enhanced
- Existing error handling code continues to work
