import type { TranslationProvider, TranslationRequest, TranslationResponse } from './types'
import OpenAI from 'openai'
import type { Logger } from '@docbridge/core'
import { extractJSON } from './json-extractor'

const DEFAULT_BASE_URL = 'https://api.openai.com/v1'
const DEFAULT_MODEL = 'gpt-4o'
const DEFAULT_TIMEOUT_MS = 120_000

export class OpenAITranslationProvider implements TranslationProvider {
  private client: OpenAI
  private model: string
  private timeoutMs: number
  private baseURL: string
  private logger?: Logger

  constructor(apiKey: string, model?: string, baseURL?: string, timeoutMs?: number, logger?: Logger) {
    this.model = model ?? DEFAULT_MODEL
    this.timeoutMs = timeoutMs ?? DEFAULT_TIMEOUT_MS
    this.baseURL = baseURL ?? DEFAULT_BASE_URL
    this.logger = logger
    this.client = new OpenAI({
      apiKey,
      baseURL: this.baseURL,
      timeout: this.timeoutMs,
    })
  }

  async translate(request: TranslationRequest): Promise<TranslationResponse> {
    const { segments, sourceLocale, targetLocale } = request

    this.logger?.info('OpenAITranslationProvider: API call', {
      model: this.model,
      baseURL: this.baseURL,
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

    let response: OpenAI.Chat.Completions.ChatCompletion
    try {
      response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userContent },
        ],
      })
    } catch (err) {
      const isAPIError = err && typeof err === 'object' && 'status' in err
      const hasTimeoutCode = err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'ETIMEDOUT'

      if (hasTimeoutCode) {
        this.logger?.error('OpenAITranslationProvider: error', {
          error: 'timeout',
          timeoutMs: this.timeoutMs,
        })
        throw new Error(`OpenAITranslationProvider: timed out after ${this.timeoutMs}ms`)
      }
      if (isAPIError && 'status' in err) {
        const status = (err as { status: number }).status
        this.logger?.error('OpenAITranslationProvider: error', {
          error: `API error ${status}`,
          status,
        })
        throw new Error(`OpenAITranslationProvider: API error ${status}`)
      }
      this.logger?.error('OpenAITranslationProvider: error', {
        error: err instanceof Error ? err.message : String(err),
      })
      throw err
    }

    const content = response.choices[0].message.content

    if (!content) {
      throw new Error('OpenAITranslationProvider: empty response content')
    }

    let translated: string[]
    try {
      translated = extractJSON(content)
    } catch (err) {
      throw new Error(
        `OpenAITranslationProvider: ${err instanceof Error ? err.message : String(err)}: ${content.slice(0, 100)}`,
      )
    }

    if (translated.length !== segments.length) {
      throw new Error(
        `OpenAITranslationProvider: expected ${segments.length} translations, got ${translated.length}`,
      )
    }

    this.logger?.info('OpenAITranslationProvider: response received', {
      translatedCount: translated.length,
    })

    return { segments: translated }
  }
}
