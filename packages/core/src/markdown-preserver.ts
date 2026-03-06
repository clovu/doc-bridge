import type { MarkdownSegment, ParsedDocument } from './types'

// Guillemet-wrapped placeholders avoid collisions with normal markdown text
const makePlaceholder = (index: number) => `\u00ABBLOCk_${index}\u00BB`

// Regex patterns (ordered by priority)
const FENCED_CODE_BLOCK = /^```[\s\S]*?^```/gm
const INLINE_CODE = /`[^`\n]+`/g
const MARKDOWN_LINK = /\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g
const BARE_URL = /https?:\/\/[^\s)\]]+/g

export function parseDocument(markdown: string): ParsedDocument {
  if (!markdown) return { template: '', segments: [] }

  const segments: MarkdownSegment[] = []
  let index = 0

  const addSegment = (kind: MarkdownSegment['kind'], content: string): string => {
    const placeholder = makePlaceholder(index++)
    segments.push({ kind, content, placeholder })
    return placeholder
  }

  // We do a single-pass replacement by building a list of ranges to replace.
  // Each range has: { start, end, replacement, kind }
  interface Range {
    start: number
    end: number
    kind: MarkdownSegment['kind']
    content: string
  }
  const ranges: Range[] = []

  // 1. Fenced code blocks (highest priority)
  {
    const re = new RegExp(FENCED_CODE_BLOCK.source, 'gm')
    let m: RegExpExecArray | null
    while ((m = re.exec(markdown)) !== null) {
      ranges.push({ start: m.index, end: m.index + m[0].length, kind: 'code-block', content: m[0] })
    }
  }

  // Helper: check if position is inside an already-captured range
  const isCovered = (start: number, end: number) =>
    ranges.some(r => start < r.end && end > r.start)

  // 2. Markdown links [text](url) — extract URL portion
  {
    const re = new RegExp(MARKDOWN_LINK.source, 'g')
    let m: RegExpExecArray | null
    while ((m = re.exec(markdown)) !== null) {
      if (isCovered(m.index, m.index + m[0].length)) continue
      // The URL is group 2. We need its position within the match.
      const urlStart = m.index + m[0].indexOf(m[2])
      const urlEnd = urlStart + m[2].length
      ranges.push({ start: urlStart, end: urlEnd, kind: 'url', content: m[2] })
    }
  }

  // 3. Inline code
  {
    const re = new RegExp(INLINE_CODE.source, 'g')
    let m: RegExpExecArray | null
    while ((m = re.exec(markdown)) !== null) {
      if (isCovered(m.index, m.index + m[0].length)) continue
      ranges.push({ start: m.index, end: m.index + m[0].length, kind: 'inline-code', content: m[0] })
    }
  }

  // 4. Bare URLs
  {
    const re = new RegExp(BARE_URL.source, 'g')
    let m: RegExpExecArray | null
    while ((m = re.exec(markdown)) !== null) {
      if (isCovered(m.index, m.index + m[0].length)) continue
      ranges.push({ start: m.index, end: m.index + m[0].length, kind: 'url', content: m[0] })
    }
  }

  // Sort by start position
  ranges.sort((a, b) => a.start - b.start)

  // Build template by walking through the string
  let template = ''
  let cursor = 0

  for (const range of ranges) {
    if (range.start > cursor) {
      // Translatable text between cursor and this range
      const text = markdown.slice(cursor, range.start)
      if (text.trim()) {
        template += addSegment('translatable', text)
      } else {
        // Preserve whitespace-only gaps literally (don't create empty translatable segments)
        template += text
      }
    }
    // Non-translatable range
    template += addSegment(range.kind, range.content)
    cursor = range.end
  }

  // Remaining text after last range
  if (cursor < markdown.length) {
    const text = markdown.slice(cursor)
    if (text.trim()) {
      template += addSegment('translatable', text)
    } else {
      template += text
    }
  }

  return { template, segments }
}

export function reassembleDocument(
  template: string,
  segments: MarkdownSegment[],
  translations: Map<string, string>,
): string {
  let result = template

  for (const segment of segments) {
    let replacement: string

    if (segment.kind === 'translatable') {
      if (!translations.has(segment.placeholder)) {
        throw new Error(
          `Missing translation for placeholder ${segment.placeholder} (content: "${segment.content.slice(0, 40)}")`,
        )
      }
      replacement = translations.get(segment.placeholder)!
    } else {
      replacement = segment.content
    }

    result = result.replace(segment.placeholder, replacement)
  }

  return result
}
