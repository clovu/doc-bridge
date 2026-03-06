export interface TranslationRequest {
  segments: readonly string[]
  sourceLocale: string
  targetLocale: string
}

export interface TranslationResponse {
  segments: string[]
}

export interface TranslationProvider {
  translate(request: TranslationRequest): Promise<TranslationResponse>
}
