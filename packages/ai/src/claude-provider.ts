import Anthropic from '@anthropic-ai/sdk'
import type { TranslationProvider, TranslationRequest, TranslationResponse } from './types'

const MODEL = 'claude-haiku-4-5-20251001'

export class ClaudeTranslationProvider implements TranslationProvider {
  private client: Anthropic

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey })
  }

  async translate(request: TranslationRequest): Promise<TranslationResponse> {
    const { segments, sourceLocale, targetLocale } = request

    const system = `You are a professional technical documentation translator.
Translate text from ${sourceLocale} to ${targetLocale}.
Rules:
- Preserve all markdown formatting exactly as-is.
- Do not translate code, variable names, or technical identifiers.
- Translate only the meaning, nothing else.
- Return translations as a JSON array of strings in exactly the same order as the input.
- Output only the JSON array, no explanation.`

    const userContent = `Translate the following segments:\n${JSON.stringify(segments)}`

    const message = await this.client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system,
      messages: [{ role: 'user', content: userContent }],
    })

    const text = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('')

    let translated: string[]
    try {
      translated = JSON.parse(text) as string[]
    } catch {
      throw new Error(`ClaudeTranslationProvider: response is not valid JSON: ${text.slice(0, 100)}`)
    }

    if (!Array.isArray(translated)) {
      throw new Error(`ClaudeTranslationProvider: expected JSON array, got ${typeof translated}`)
    }

    if (translated.length !== segments.length) {
      throw new Error(
        `ClaudeTranslationProvider: expected ${segments.length} translations, got ${translated.length}`,
      )
    }

    return { segments: translated }
  }
}
