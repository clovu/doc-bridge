import { parseDocument, reassembleDocument } from './markdown-preserver'
import type { TranslateDocumentOptions, TranslateDocumentResult } from './types'

export async function translateDocument(
  markdown: string,
  options: TranslateDocumentOptions,
): Promise<TranslateDocumentResult> {
  if (!markdown) return { translated: '' }

  const parsed = parseDocument(markdown)
  const translatableSegments = parsed.segments.filter(s => s.kind === 'translatable')

  if (translatableSegments.length === 0) {
    const translations = new Map<string, string>()
    return { translated: reassembleDocument(parsed.template, parsed.segments, translations) }
  }

  const texts = translatableSegments.map(s => s.content)
  const translatedTexts = await options.translate(texts)

  const translations = new Map<string, string>(
    translatableSegments.map((s, i) => [s.placeholder, translatedTexts[i]]),
  )

  const translated = reassembleDocument(parsed.template, parsed.segments, translations)
  return { translated }
}
