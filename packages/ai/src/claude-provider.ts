import Anthropic from '@anthropic-ai/sdk'
import type { TranslationProvider, TranslationRequest, TranslationResponse } from './types'
import type { Logger } from '@docbridge/core'
import { extractJSON } from './json-extractor'

const MODEL = 'claude-haiku-4-5-20251001'
const DEFAULT_TIMEOUT_MS = 120_000

export class ClaudeTranslationProvider implements TranslationProvider {
  private client: Anthropic
  private timeoutMs: number
  private logger?: Logger

  constructor(apiKey: string, timeoutMs = DEFAULT_TIMEOUT_MS, logger?: Logger) {
    this.timeoutMs = timeoutMs
    this.logger = logger
    this.client = new Anthropic({ apiKey, timeout: timeoutMs })
  }

  async translate(request: TranslationRequest): Promise<TranslationResponse> {
    const { segments, sourceLocale, targetLocale } = request

    this.logger?.info('ClaudeTranslationProvider: API call', {
      model: MODEL,
      segmentCount: segments.length,
      sourceLocale,
      targetLocale,
    })

    const system = `You are a professional technical documentation translator.
Translate text from ${sourceLocale} to ${targetLocale}.
Rules:
- Preserve all markdown formatting exactly as-is.
- Do not translate code, variable names, or technical identifiers.
- Translate only the meaning, nothing else.
- Return translations as a JSON array of strings in exactly the same order as the input.
- Output only the JSON array, no explanation.`

    const userContent = `Translate the following segments:\n${JSON.stringify(segments)}`

    let message: Anthropic.Message
    try {
      message = await this.client.messages.create({
        model: MODEL,
        max_tokens: 4096,
        system,
        messages: [{ role: 'user', content: userContent }],
      })
    } catch (err) {
      if (err instanceof Error && err.name === 'APITimeoutError') {
        this.logger?.error('ClaudeTranslationProvider: error', {
          error: 'timeout',
          timeoutMs: this.timeoutMs,
        })
        throw new Error(`ClaudeTranslationProvider: timed out after ${this.timeoutMs}ms`)
      }
      this.logger?.error('ClaudeTranslationProvider: error', {
        error: err instanceof Error ? err.message : String(err),
      })
      throw err
    }

    const text = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('')

    let translated: string[]
    try {
      translated = extractJSON(text)
    } catch (err) {
      throw new Error(
        `ClaudeTranslationProvider: ${err instanceof Error ? err.message : String(err)}: ${text.slice(0, 100)}`,
      )
    }

    if (translated.length !== segments.length) {
      throw new Error(
        `ClaudeTranslationProvider: expected ${segments.length} translations, got ${translated.length}`,
      )
    }

    this.logger?.info('ClaudeTranslationProvider: response received', {
      translatedCount: translated.length,
    })

    return { segments: translated }
  }
}
