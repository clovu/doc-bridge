# Translation Prompt Improvement - Segment Count Enforcement

## Problem

DeepSeek models (both `deepseek-reasoner` and `deepseek-chat`) were consistently combining multiple translation segments into a single segment, causing translation count mismatch errors.

### Example Error
```
[ERROR] OpenAITranslationProvider: translation count mismatch
{
  expected: 9,
  received: 1,
  segments: ["[0] <p align=\"center\">English...", "[1] These files...", ...],
  translations: ["[0] <p align=\"center\">English | <a href=\"README.zh-CN.md\">中文</a></p>..."]
}
```

The AI returned 1 combined translation instead of 9 separate segments.

## Root Cause

The original prompt said:
```
- Return translations as a JSON array of strings in exactly the same order as the input.
```

This was ambiguous - models could interpret it as:
1. ✅ Return N separate translations (correct)
2. ❌ Combine everything and return as an array with 1 element (what DeepSeek did)

## Solution

Enhanced the system prompt to be more explicit about maintaining segment count:

### Before
```typescript
const system = `You are a professional technical documentation translator.
Translate text from ${sourceLocale} to ${targetLocale}.
Rules:
- Preserve all markdown formatting exactly as-is.
- Do not translate code, variable names, or technical identifiers.
- Translate only the meaning, nothing else.
- Return translations as a JSON array of strings in exactly the same order as the input.
- Output only the JSON array, no explanation.`
```

### After
```typescript
const system = `You are a professional technical documentation translator.
Translate text from ${sourceLocale} to ${targetLocale}.
Rules:
- Preserve all markdown formatting exactly as-is.
- Do not translate code, variable names, or technical identifiers.
- Translate only the meaning, nothing else.
- Return translations as a JSON array of strings in exactly the same order as the input.
- CRITICAL: The output array MUST have exactly ${segments.length} element${segments.length === 1 ? '' : 's'}, one for each input segment.
- Do NOT combine multiple segments into one.
- Do NOT split one segment into multiple.
- Output only the JSON array, no explanation.`
```

## Changes Made

### Files Modified
1. `packages/ai/src/openai-provider.ts` - Enhanced prompt
2. `packages/ai/src/claude-provider.ts` - Enhanced prompt (for consistency)

### Key Improvements
1. **Explicit count requirement**: "MUST have exactly N elements"
2. **Dynamic count**: Uses `${segments.length}` to show exact number
3. **Negative instructions**: "Do NOT combine" and "Do NOT split"
4. **Emphasis**: "CRITICAL:" prefix to highlight importance

## Testing

### Test Results
```bash
pnpm --filter @docbridge/ai test
```
**Result**: ✅ 138 tests passing

### TypeScript Compilation
```bash
pnpm --filter @docbridge/ai exec tsc --noEmit
```
**Result**: ✅ No errors

## Expected Behavior

### Before (DeepSeek models)
```
Input: 9 segments
Output: 1 combined segment
Result: ❌ Translation count mismatch error
```

### After (All models)
```
Input: 9 segments
Output: 9 separate segments
Result: ✅ Translation successful
```

## Compatibility

- ✅ No breaking changes
- ✅ Backward compatible with existing translations
- ✅ Works with all providers (OpenAI, Claude, DeepSeek, Custom)
- ✅ All existing tests pass

## Benefits

1. **Better instruction clarity**: Models understand exactly what's expected
2. **Reduced errors**: Fewer count mismatch errors with DeepSeek models
3. **Consistent behavior**: All models follow the same strict format
4. **Dynamic feedback**: Shows exact count needed in the prompt

## Testing with DeepSeek

To test the improvement:

1. **Restart your dev server** (to pick up the new code):
   ```bash
   # Stop the server (Ctrl+C)
   pnpm dev
   ```

2. **Try translating again** with DeepSeek:
   - Provider: DeepSeek
   - Model: `deepseek-chat` or `deepseek-reasoner`
   - The translation should now maintain segment count

3. **Check the logs** to verify:
   ```
   [INFO] OpenAITranslationProvider: response received
   {
     translatedCount: 9  // Should match input count
   }
   ```

## Alternative: Use Claude

If DeepSeek still has issues, Claude is recommended:
- Provider: Claude (Anthropic)
- Model: (default)
- API Key: (leave empty, uses ANTHROPIC_API_KEY)
- Claude has excellent instruction-following and rarely has count mismatch issues

## Related Documentation

- `docs/TRANSLATION_PROVIDER_ERROR_HANDLING.md` - Error handling implementation
- `docs/TRANSLATION_FAILED_DEBUGGING.md` - Debugging guide
- `docs/ERROR_HANDLING_SUMMARY.md` - Error handling summary

## Summary

The prompt has been enhanced to explicitly require maintaining the exact segment count. This should resolve the translation count mismatch issues with DeepSeek models while maintaining compatibility with all other providers.

**Action Required**: Restart your dev server and try translating again with DeepSeek.
