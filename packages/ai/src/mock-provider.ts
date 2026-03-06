import type { TranslationProvider, TranslationRequest, TranslationResponse } from './types'

export class MockTranslationProvider implements TranslationProvider {
  private translations: Map<string, string>

  constructor(translations: Map<string, string> = new Map()) {
    this.translations = translations
  }

  async translate(request: TranslationRequest): Promise<TranslationResponse> {
    const segments = request.segments.map(
      s => this.translations.get(s) ?? `[MOCK:${s}]`,
    )
    return { segments }
  }
}
