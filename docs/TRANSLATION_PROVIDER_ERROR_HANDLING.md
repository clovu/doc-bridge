# Translation Provider Error Handling Fix

## Problem

When OpenAITranslationProvider or ClaudeTranslationProvider failed to parse a response (e.g., invalid JSON or HTML content), the UI displayed raw error messages that exposed internal implementation details to users.

### Example Error (Before)
```
OpenAITranslationProvider: Failed to parse JSON array from response: [ "<p align="center">English | <a href="README.zh-CN.md">中文</a></p>\n\n# Clean Maven Failed
```

This exposed:
- Internal provider names
- Raw response content
- Implementation details

## Solution

Following TDD principles, we implemented error message sanitization:

1. **UI**: Always show generic `"Translation failed"` message
2. **Console**: Log detailed error information for debugging

## Changes Made

### 1. OpenAITranslationProvider (`packages/ai/src/openai-provider.ts`)

**Before:**
```typescript
throw new Error(
  `OpenAITranslationProvider: ${err instanceof Error ? err.message : String(err)}: ${content.slice(0, 100)}`,
)
```

**After:**
```typescript
this.logger?.error('OpenAITranslationProvider: JSON extraction failed', {
  error: err instanceof Error ? err.message : String(err),
  contentPreview: content.substring(0, 200),
})
throw new Error('Translation failed')
```

**Count Mismatch - Before:**
```typescript
throw new Error(
  `OpenAITranslationProvider: expected ${segments.length} translations, got ${translated.length}. ` +
  `Segments: ${JSON.stringify(errorDetails.segments)}. ` +
  `Translations: ${JSON.stringify(errorDetails.translations)}`,
)
```

**Count Mismatch - After:**
```typescript
this.logger?.error('OpenAITranslationProvider: translation count mismatch', errorDetails)
throw new Error('Translation failed')
```

### 2. ClaudeTranslationProvider (`packages/ai/src/claude-provider.ts`)

Applied the same changes for consistency across all providers.

## Test Coverage

### New Tests Added

#### OpenAITranslationProvider (`tests/openai-provider.test.ts`)
- ✅ `throws generic "Translation failed" for JSON parsing errors`
- ✅ `does not expose internal error details in thrown error`
- ✅ `logs detailed error to console for debugging`
- ✅ `throws generic error for count mismatch`
- ✅ `logs detailed count mismatch to console`

#### ClaudeTranslationProvider (`tests/claude-provider.test.ts`)
- ✅ `throws generic "Translation failed" for JSON parsing errors`
- ✅ `does not expose internal error details in thrown error`
- ✅ `logs detailed error to console for debugging`
- ✅ `throws generic error for count mismatch`
- ✅ `logs detailed count mismatch to console`

### Updated Tests

#### Translation Mismatch Tests (`tests/translation-mismatch.test.ts`)
Updated all tests to expect generic `"Translation failed"` message instead of detailed error messages.

## Verification

### Test Results
```bash
pnpm --filter @docbridge/ai test
```
**Result**: ✅ 138 tests passed

### Linting
```bash
pnpm lint
```
**Result**: ✅ No errors

## User Experience

### Before
```
Error: OpenAITranslationProvider: Failed to parse JSON array from response: [ "<p align="center">English | <a href="README.zh-CN.md">中文</a></p>
```

### After
```
Error: Translation failed
```

## Developer Experience

### Console Logs (for debugging)

When JSON extraction fails:
```javascript
{
  level: 'error',
  message: 'OpenAITranslationProvider: JSON extraction failed',
  data: {
    error: 'Failed to parse JSON array from response',
    contentPreview: '<p align="center">English | <a href="README.zh-CN.md">中文</a></p>\n\n# Clean Maven Failed...'
  }
}
```

When count mismatch occurs:
```javascript
{
  level: 'error',
  message: 'OpenAITranslationProvider: translation count mismatch',
  data: {
    expected: 2,
    received: 1,
    segments: ['[0] First segment', '[1] Second segment'],
    translations: ['[0] Only one translation']
  }
}
```

## Benefits

1. **Better UX**: Users see clean, generic error messages
2. **Better DX**: Developers get detailed logs for debugging
3. **Security**: No internal implementation details exposed
4. **Consistency**: Same behavior across all providers
5. **Maintainability**: Centralized error handling logic

## Compatibility

- ✅ No breaking changes to API
- ✅ Existing multi-model AI provider logic unchanged
- ✅ Successful translation behavior unchanged
- ✅ Multi-file, multi-language workflow preserved

## TDD Process Followed

1. **Red**: Wrote failing tests that expect generic error messages
2. **Green**: Implemented minimal changes to make tests pass
3. **Refactor**: Applied same pattern to ClaudeTranslationProvider for consistency
4. **Verify**: All 138 tests passing

## Related Files

### Modified
- `packages/ai/src/openai-provider.ts`
- `packages/ai/src/claude-provider.ts`
- `packages/ai/tests/openai-provider.test.ts`
- `packages/ai/tests/claude-provider.test.ts`
- `packages/ai/tests/translation-mismatch.test.ts`

### Unchanged
- `packages/ai/src/mock-provider.ts` (no error handling needed)
- `packages/ai/src/registry.ts`
- `packages/ai/src/create-provider.ts`
- All other packages

## Future Improvements

1. **Error Categories**: Distinguish between different error types (network, parsing, API)
2. **Retry Logic**: Automatic retry for transient errors
3. **Error Codes**: Structured error codes for programmatic handling
4. **Telemetry**: Send anonymized error metrics for monitoring

## Summary

This fix ensures users never see internal error details while developers retain full debugging information through console logs. The implementation follows TDD principles and maintains backward compatibility with all existing functionality.
