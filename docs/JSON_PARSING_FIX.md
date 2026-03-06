# JSON Parsing Fix

## Problem
Translation requests were failing with "response is not valid JSON" errors even though the provider responses contained valid translations. This occurred when LLM responses included:
- Markdown code blocks wrapping the JSON
- Explanatory text before or after the JSON array
- Formatted/multiline JSON

## Root Cause
The providers were using `JSON.parse()` directly on the response text, which fails if there's any text before or after the JSON array. LLMs sometimes add helpful explanations or wrap responses in markdown code blocks, causing parsing to fail.

## Solution
Implemented a robust `extractJSON()` function that:
1. Removes markdown code blocks (```json...```)
2. Finds the first valid JSON array in the response
3. Extracts and parses only the JSON array
4. Handles various response formats gracefully

## Changes Made

### New Module: `packages/ai/src/json-extractor.ts`
- `extractJSON(text: string): string[]` - Robust JSON extraction
- Handles markdown code blocks, explanatory text, multiline JSON
- 16 comprehensive tests covering edge cases

### Updated Providers
- `ClaudeTranslationProvider` - Uses `extractJSON()` instead of `JSON.parse()`
- `OpenAITranslationProvider` - Uses `extractJSON()` instead of `JSON.parse()`
- Both providers now handle malformed responses gracefully

### Test Coverage
- Added 5 new tests per provider for robust JSON parsing
- Tests cover: markdown blocks, text before/after, multiline JSON, explanations
- Total: 26 new tests (16 for extractor + 10 for providers)

## Test Results

```
✓ packages/core:   60 tests passing (unchanged)
✓ packages/ai:    119 tests passing (+26 new)
✓ packages/github: 38 tests passing (unchanged)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total:            217 tests passing
```

## Examples

### Before (Failed)
```
Response: "Here are the translations:\n[\"Hola\", \"Mundo\"]"
Error: "OpenAITranslationProvider: response is not valid JSON"
```

### After (Success)
```
Response: "Here are the translations:\n[\"Hola\", \"Mundo\"]"
Result: ["Hola", "Mundo"] ✓
```

### Supported Formats
```javascript
// Pure JSON
'["Hello", "World"]'

// Markdown code block
'```json\n["Hello", "World"]\n```'

// With explanation
'Here are the translations:\n["Hello", "World"]'

// Multiline formatted
'[\n  "Hello",\n  "World"\n]'

// Complex response
'Sure! Here are the translations:\n\n```json\n["Hello", "World"]\n```\n\nI hope this helps!'
```

## Files Modified

### New Files
- `packages/ai/src/json-extractor.ts`
- `packages/ai/tests/json-extractor.test.ts`

### Modified Files
- `packages/ai/src/claude-provider.ts` - Use extractJSON
- `packages/ai/src/openai-provider.ts` - Use extractJSON
- `packages/ai/src/index.ts` - Export extractJSON
- `packages/ai/tests/claude-provider.test.ts` - Add robust parsing tests
- `packages/ai/tests/openai-provider.test.ts` - Add robust parsing tests

## Backward Compatibility
- No breaking changes
- All existing tests pass
- Providers still validate array length and content
- Error messages remain informative
