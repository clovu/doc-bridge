import { describe, it, expect } from 'vitest'
import { parseDocument, reassembleDocument } from '../src/markdown-preserver'

describe('parseDocument', () => {
  it('parses plain text as a single translatable segment', () => {
    const { segments, template } = parseDocument('Hello world')
    expect(segments).toHaveLength(1)
    expect(segments[0].kind).toBe('translatable')
    expect(segments[0].content).toBe('Hello world')
    expect(template).toContain(segments[0].placeholder)
  })

  it('returns empty segments and template for empty string', () => {
    const { segments, template } = parseDocument('')
    expect(segments).toHaveLength(0)
    expect(template).toBe('')
  })

  it('extracts fenced code block as code-block segment', () => {
    const md = 'Before\n```\ncode here\n```\nAfter'
    const { segments } = parseDocument(md)
    const codeBlock = segments.find(s => s.kind === 'code-block')
    expect(codeBlock).toBeDefined()
    expect(codeBlock!.content).toContain('code here')
  })

  it('extracts fenced code block with language tag', () => {
    const md = '```typescript\nconst x = 1\n```'
    const { segments } = parseDocument(md)
    const codeBlock = segments.find(s => s.kind === 'code-block')
    expect(codeBlock).toBeDefined()
    expect(codeBlock!.content).toContain('const x = 1')
  })

  it('preserves code block content verbatim in segment', () => {
    const codeContent = '```\nfoo()\nbar()\n```'
    const { segments } = parseDocument(codeContent)
    const codeBlock = segments.find(s => s.kind === 'code-block')
    expect(codeBlock!.content).toBe(codeContent)
  })

  it('extracts inline code as inline-code segment', () => {
    const md = 'Use `npm install` to start'
    const { segments } = parseDocument(md)
    const inline = segments.find(s => s.kind === 'inline-code')
    expect(inline).toBeDefined()
    expect(inline!.content).toBe('`npm install`')
  })

  it('extracts bare URL as url segment', () => {
    const md = 'See https://example.com for details'
    const { segments } = parseDocument(md)
    const url = segments.find(s => s.kind === 'url')
    expect(url).toBeDefined()
    expect(url!.content).toBe('https://example.com')
  })

  it('extracts URL from markdown link, keeps link text as translatable', () => {
    const md = 'See [the docs](https://example.com/docs)'
    const { segments } = parseDocument(md)
    const url = segments.find(s => s.kind === 'url')
    const translatable = segments.find(s => s.kind === 'translatable')
    expect(url).toBeDefined()
    expect(url!.content).toBe('https://example.com/docs')
    expect(translatable).toBeDefined()
    expect(translatable!.content).toContain('the docs')
  })

  it('assigns unique placeholders to each segment', () => {
    const md = 'Text `code` more text'
    const { segments } = parseDocument(md)
    const placeholders = segments.map(s => s.placeholder)
    const unique = new Set(placeholders)
    expect(unique.size).toBe(placeholders.length)
  })

  it('template contains all placeholders in order', () => {
    const md = 'Before `code` after'
    const { segments, template } = parseDocument(md)
    for (const segment of segments) {
      expect(template).toContain(segment.placeholder)
    }
  })

  it('template does not contain original code block content', () => {
    const md = 'Intro\n```\nsecret code\n```\nEnd'
    const { template } = parseDocument(md)
    expect(template).not.toContain('secret code')
  })

  it('handles consecutive code blocks', () => {
    const md = '```\nfirst\n```\n\n```\nsecond\n```'
    const { segments } = parseDocument(md)
    const codeBlocks = segments.filter(s => s.kind === 'code-block')
    expect(codeBlocks).toHaveLength(2)
  })

  it('handles mixed content: text + code + text', () => {
    const md = 'Install with `npm i` then run the server'
    const { segments } = parseDocument(md)
    expect(segments.some(s => s.kind === 'inline-code')).toBe(true)
    expect(segments.some(s => s.kind === 'translatable')).toBe(true)
  })
})

describe('reassembleDocument', () => {
  it('replaces translatable placeholders with translated text', () => {
    const { segments, template } = parseDocument('Hello world')
    const seg = segments[0]
    const translations = new Map([[seg.placeholder, 'Hola mundo']])
    const result = reassembleDocument(template, segments, translations)
    expect(result).toBe('Hola mundo')
  })

  it('keeps code-block content verbatim (not translated)', () => {
    const md = 'Intro\n```\ncode\n```'
    const { segments, template } = parseDocument(md)
    const translations = new Map<string, string>()
    for (const s of segments) {
      if (s.kind === 'translatable') translations.set(s.placeholder, 'Introducción')
    }
    const result = reassembleDocument(template, segments, translations)
    expect(result).toContain('```\ncode\n```')
  })

  it('keeps inline-code content verbatim', () => {
    const md = 'Run `npm start`'
    const { segments, template } = parseDocument(md)
    const translations = new Map<string, string>()
    for (const s of segments) {
      if (s.kind === 'translatable') translations.set(s.placeholder, 'Ejecutar')
    }
    const result = reassembleDocument(template, segments, translations)
    expect(result).toContain('`npm start`')
  })

  it('keeps URL content verbatim', () => {
    const md = 'Visit https://example.com now'
    const { segments, template } = parseDocument(md)
    const translations = new Map<string, string>()
    for (const s of segments) {
      if (s.kind === 'translatable') translations.set(s.placeholder, 'Visitar')
    }
    const result = reassembleDocument(template, segments, translations)
    expect(result).toContain('https://example.com')
  })

  it('returns original document structure when translations are identity', () => {
    const md = 'Hello `world` https://x.com'
    const { segments, template } = parseDocument(md)
    const translations = new Map<string, string>()
    for (const s of segments) {
      if (s.kind === 'translatable') translations.set(s.placeholder, s.content)
    }
    const result = reassembleDocument(template, segments, translations)
    expect(result).toBe(md)
  })

  it('throws if a translatable placeholder has no translation', () => {
    const { segments, template } = parseDocument('Hello')
    // Do not provide any translations
    expect(() => reassembleDocument(template, segments, new Map())).toThrow()
  })
})
