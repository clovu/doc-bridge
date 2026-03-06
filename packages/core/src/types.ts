export type SegmentKind = 'translatable' | 'code-block' | 'inline-code' | 'url'

export interface MarkdownSegment {
  kind: SegmentKind
  content: string
  placeholder: string
}

export interface ParsedDocument {
  template: string
  segments: MarkdownSegment[]
}

export interface TranslateDocumentOptions {
  sourceLocale: string
  targetLocale: string
  translate: (segments: string[]) => Promise<string[]>
}

export interface TranslateDocumentResult {
  translated: string
}
