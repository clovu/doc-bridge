# JSON Extractor Usage Examples

## Basic Usage

```typescript
import { extractJSON } from '@docbridge/ai'

// Pure JSON
const result1 = extractJSON('["Hello", "World"]')
// Returns: ["Hello", "World"]

// With markdown
const result2 = extractJSON('```json\n["Hello", "World"]\n```')
// Returns: ["Hello", "World"]

// With explanation
const result3 = extractJSON('Here are the translations:\n["Hello", "World"]')
// Returns: ["Hello", "World"]
```

## Real-World Examples

### Example 1: Claude Response with Markdown
```typescript
const claudeResponse = `Sure! Here are the translations:

\`\`\`json
[
  "Hola",
  "Mundo"
]
\`\`\`

I hope this helps!`

const translations = extractJSON(claudeResponse)
// Returns: ["Hola", "Mundo"]
```

### Example 2: OpenAI Response with Explanation
```typescript
const openaiResponse = `I'll translate these for you:

["Bonjour", "le monde"]

These are the French translations.`

const translations = extractJSON(openaiResponse)
// Returns: ["Bonjour", "le monde"]
```

### Example 3: Formatted JSON
```typescript
const formattedResponse = `[
  "こんにちは",
  "世界"
]`

const translations = extractJSON(formattedResponse)
// Returns: ["こんにちは", "世界"]
```

## Error Handling

```typescript
import { extractJSON } from '@docbridge/ai'

try {
  const result = extractJSON(response)
  console.log('Translations:', result)
} catch (err) {
  if (err instanceof Error) {
    if (err.message.includes('No JSON array found')) {
      console.error('Response does not contain a JSON array')
    } else if (err.message.includes('Expected JSON array')) {
      console.error('Response contains JSON object, not array')
    } else {
      console.error('Failed to parse JSON:', err.message)
    }
  }
}
```

## Integration with Providers

The providers automatically use `extractJSON()` internally:

```typescript
import { ClaudeTranslationProvider } from '@docbridge/ai'

const provider = new ClaudeTranslationProvider('api-key')

// Provider handles any response format automatically
const result = await provider.translate({
  segments: ['Hello', 'World'],
  sourceLocale: 'en',
  targetLocale: 'es',
})

console.log(result.segments) // ["Hola", "Mundo"]
```

## Edge Cases Handled

### Multiple Arrays
```typescript
// Extracts the first array
const response = '["First", "Array"] and ["Second", "Array"]'
const result = extractJSON(response)
// Returns: ["First", "Array"]
```

### Nested Content
```typescript
// Handles complex nested structures
const response = '["Item with [brackets]", "Normal item"]'
const result = extractJSON(response)
// Returns: ["Item with [brackets]", "Normal item"]
```

### Unicode and Special Characters
```typescript
// Preserves all characters
const response = '["你好", "**Bold**", "`code`"]'
const result = extractJSON(response)
// Returns: ["你好", "**Bold**", "`code`"]
```

## Testing

```typescript
import { describe, it, expect } from 'vitest'
import { extractJSON } from '@docbridge/ai'

describe('Custom provider integration', () => {
  it('should handle custom LLM responses', () => {
    const customResponse = 'Translation result:\n["Custom", "Response"]'
    const result = extractJSON(customResponse)
    expect(result).toEqual(['Custom', 'Response'])
  })
})
```

## Performance Considerations

- **Fast**: Processes responses in O(n) time
- **Memory efficient**: No large intermediate structures
- **Early exit**: Stops at first valid JSON array
- **No regex backtracking**: Uses simple string operations

## Best Practices

1. **Always use try-catch** when calling `extractJSON()` directly
2. **Log original response** on errors for debugging
3. **Validate array length** matches expected segment count
4. **Check for empty arrays** if that's not expected
5. **Preserve original error messages** for troubleshooting

## Migration Guide

If you have custom providers using `JSON.parse()`:

### Before
```typescript
let translated: string[]
try {
  translated = JSON.parse(response) as string[]
} catch {
  throw new Error('Invalid JSON')
}

if (!Array.isArray(translated)) {
  throw new Error('Expected array')
}
```

### After
```typescript
import { extractJSON } from '@docbridge/ai'

let translated: string[]
try {
  translated = extractJSON(response)
} catch (err) {
  throw new Error(`Failed to extract JSON: ${err}`)
}
```

## Debugging

Enable logging to see what's being extracted:

```typescript
import { extractJSON } from '@docbridge/ai'

function debugExtractJSON(text: string): string[] {
  console.log('Input:', text.slice(0, 100))
  try {
    const result = extractJSON(text)
    console.log('Extracted:', result)
    return result
  } catch (err) {
    console.error('Extraction failed:', err)
    throw err
  }
}
```
