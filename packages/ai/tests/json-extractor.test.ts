import { describe, it, expect } from 'vitest'
import { extractJSON } from '../src/json-extractor'

describe('extractJSON', () => {
  it('should extract pure JSON array', () => {
    const input = '["Hello", "World"]'
    const result = extractJSON(input)
    expect(result).toEqual(['Hello', 'World'])
  })

  it('should extract JSON array wrapped in markdown code block', () => {
    const input = '```json\n["Hello", "World"]\n```'
    const result = extractJSON(input)
    expect(result).toEqual(['Hello', 'World'])
  })

  it('should extract JSON array with text before', () => {
    const input = 'Here are the translations:\n["Hello", "World"]'
    const result = extractJSON(input)
    expect(result).toEqual(['Hello', 'World'])
  })

  it('should extract JSON array with text after', () => {
    const input = '["Hello", "World"]\nThese are the translations.'
    const result = extractJSON(input)
    expect(result).toEqual(['Hello', 'World'])
  })

  it('should extract JSON array with text before and after', () => {
    const input = 'Here you go:\n["Hello", "World"]\nDone!'
    const result = extractJSON(input)
    expect(result).toEqual(['Hello', 'World'])
  })

  it('should extract JSON array from markdown code block without language', () => {
    const input = '```\n["Hello", "World"]\n```'
    const result = extractJSON(input)
    expect(result).toEqual(['Hello', 'World'])
  })

  it('should handle JSON array with escaped quotes', () => {
    const input = '["He said \\"Hello\\"", "World"]'
    const result = extractJSON(input)
    expect(result).toEqual(['He said "Hello"', 'World'])
  })

  it('should handle JSON array with newlines in strings', () => {
    const input = '["Line 1\\nLine 2", "World"]'
    const result = extractJSON(input)
    expect(result).toEqual(['Line 1\nLine 2', 'World'])
  })

  it('should handle multiline JSON array', () => {
    const input = `[
  "Hello",
  "World"
]`
    const result = extractJSON(input)
    expect(result).toEqual(['Hello', 'World'])
  })

  it('should handle JSON array in markdown with explanation', () => {
    const input = `Sure! Here are the translations:

\`\`\`json
[
  "Hola",
  "Mundo"
]
\`\`\`

I hope this helps!`
    const result = extractJSON(input)
    expect(result).toEqual(['Hola', 'Mundo'])
  })

  it('should throw if no JSON array found', () => {
    const input = 'No JSON here'
    expect(() => extractJSON(input)).toThrow('No JSON array found')
  })

  it('should throw if JSON is not an array', () => {
    const input = '{"key": "value"}'
    expect(() => extractJSON(input)).toThrow('Expected JSON array')
  })

  it('should handle empty array', () => {
    const input = '[]'
    const result = extractJSON(input)
    expect(result).toEqual([])
  })

  it('should extract first JSON array if multiple present', () => {
    const input = '["First", "Array"] and ["Second", "Array"]'
    const result = extractJSON(input)
    expect(result).toEqual(['First', 'Array'])
  })

  it('should handle JSON array with unicode characters', () => {
    const input = '["你好", "世界"]'
    const result = extractJSON(input)
    expect(result).toEqual(['你好', '世界'])
  })

  it('should handle JSON array with special markdown characters', () => {
    const input = '["# Header", "**Bold**", "`code`"]'
    const result = extractJSON(input)
    expect(result).toEqual(['# Header', '**Bold**', '`code`'])
  })
})
