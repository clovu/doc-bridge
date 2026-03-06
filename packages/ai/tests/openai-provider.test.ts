import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OpenAITranslationProvider } from '../src/openai-provider'
import type { Logger } from '@docbridge/core'

vi.mock('openai', () => {
  return {
    default: vi.fn(),
  }
})

describe('OpenAITranslationProvider', () => {
  let mockCreate: ReturnType<typeof vi.fn>
  let OpenAIConstructor: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    mockCreate = vi.fn()
    OpenAIConstructor = vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    }))
    const openaiModule = await import('openai')
    vi.mocked(openaiModule.default).mockImplementation(OpenAIConstructor as never)
  })

  it('initializes OpenAI client with default baseURL', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(['Hola']) } }],
    })
    const provider = new OpenAITranslationProvider('sk-test')
    await provider.translate({ segments: ['Hello'], sourceLocale: 'en', targetLocale: 'es' })
    expect(OpenAIConstructor).toHaveBeenCalledWith({
      apiKey: 'sk-test',
      baseURL: 'https://api.openai.com/v1',
      timeout: 120000,
    })
  })

  it('passes apiKey to OpenAI constructor', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(['Hola']) } }],
    })
    const provider = new OpenAITranslationProvider('sk-mykey')
    await provider.translate({ segments: ['Hello'], sourceLocale: 'en', targetLocale: 'es' })
    expect(OpenAIConstructor).toHaveBeenCalledWith(
      expect.objectContaining({ apiKey: 'sk-mykey' }),
    )
  })

  it('sends segments as JSON array in user message', async () => {
    const segments = ['Hello', 'World']
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(['Hola', 'Mundo']) } }],
    })
    const provider = new OpenAITranslationProvider('sk-test')
    await provider.translate({ segments, sourceLocale: 'en', targetLocale: 'es' })
    const createCall = mockCreate.mock.calls[0][0]
    const userMessage = createCall.messages.find((m: { role: string }) => m.role === 'user')
    expect(userMessage?.content).toContain(JSON.stringify(segments))
  })

  it('includes sourceLocale and targetLocale in system prompt', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(['Bonjour']) } }],
    })
    const provider = new OpenAITranslationProvider('sk-test')
    await provider.translate({ segments: ['Hello'], sourceLocale: 'en', targetLocale: 'fr' })
    const createCall = mockCreate.mock.calls[0][0]
    const systemMessage = createCall.messages.find((m: { role: string }) => m.role === 'system')
    expect(systemMessage?.content).toContain('en')
    expect(systemMessage?.content).toContain('fr')
  })

  it('uses provided model in request', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(['Hola']) } }],
    })
    const provider = new OpenAITranslationProvider('sk-test', 'gpt-4-turbo')
    await provider.translate({ segments: ['Hello'], sourceLocale: 'en', targetLocale: 'es' })
    const createCall = mockCreate.mock.calls[0][0]
    expect(createCall.model).toBe('gpt-4-turbo')
  })

  it('uses custom baseURL when provided', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(['Hola']) } }],
    })
    const provider = new OpenAITranslationProvider('sk-test', undefined, 'https://custom.api.com/v1')
    await provider.translate({ segments: ['Hello'], sourceLocale: 'en', targetLocale: 'es' })
    expect(OpenAIConstructor).toHaveBeenCalledWith(
      expect.objectContaining({ baseURL: 'https://custom.api.com/v1' }),
    )
  })

  it('returns parsed array of translated segments', async () => {
    const translated = ['Hola', 'Mundo']
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(translated) } }],
    })
    const provider = new OpenAITranslationProvider('sk-test')
    const result = await provider.translate({
      segments: ['Hello', 'World'],
      sourceLocale: 'en',
      targetLocale: 'es',
    })
    expect(result.segments).toEqual(translated)
  })

  it('throws if response content is not valid JSON', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'not json' } }],
    })
    const provider = new OpenAITranslationProvider('sk-test')
    await expect(
      provider.translate({ segments: ['Hello'], sourceLocale: 'en', targetLocale: 'es' }),
    ).rejects.toThrow()
  })

  it('throws if response array length differs from input', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(['one', 'two']) } }],
    })
    const provider = new OpenAITranslationProvider('sk-test')
    await expect(
      provider.translate({ segments: ['Hello'], sourceLocale: 'en', targetLocale: 'es' }),
    ).rejects.toThrow(/expected 1.*got 2/i)
  })

  it('throws a meaningful error when the API returns an error', async () => {
    const error = new Error('Invalid API key') as Error & { status: number }
    error.status = 401
    mockCreate.mockRejectedValue(error)
    const provider = new OpenAITranslationProvider('sk-bad-key')
    await expect(
      provider.translate({ segments: ['Hello'], sourceLocale: 'en', targetLocale: 'es' }),
    ).rejects.toThrow(/OpenAITranslationProvider.*401/i)
  })

  it('uses default model gpt-4o when no model is specified', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(['Hola']) } }],
    })
    const provider = new OpenAITranslationProvider('sk-test')
    await provider.translate({ segments: ['Hello'], sourceLocale: 'en', targetLocale: 'es' })
    const createCall = mockCreate.mock.calls[0][0]
    expect(createCall.model).toBe('gpt-4o')
  })

  it('passes timeout to OpenAI client', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(['Hola']) } }],
    })
    const provider = new OpenAITranslationProvider('sk-test')
    await provider.translate({ segments: ['Hello'], sourceLocale: 'en', targetLocale: 'es' })
    expect(OpenAIConstructor).toHaveBeenCalledWith(
      expect.objectContaining({ timeout: 120000 }),
    )
  })

  it('throws a descriptive error when request times out', async () => {
    const timeoutError = new Error('Request timed out') as Error & { code: string }
    timeoutError.code = 'ETIMEDOUT'
    mockCreate.mockRejectedValue(timeoutError)
    const provider = new OpenAITranslationProvider('sk-test')
    await expect(
      provider.translate({ segments: ['Hello'], sourceLocale: 'en', targetLocale: 'es' }),
    ).rejects.toThrow(/timed out after 120000ms/i)
  })

  it('timeout error message includes the configured timeoutMs value', async () => {
    const timeoutError = new Error('Request timed out') as Error & { code: string }
    timeoutError.code = 'ETIMEDOUT'
    mockCreate.mockRejectedValue(timeoutError)
    const provider = new OpenAITranslationProvider('sk-test', undefined, undefined, 30_000)
    await expect(
      provider.translate({ segments: ['Hello'], sourceLocale: 'en', targetLocale: 'es' }),
    ).rejects.toThrow(/timed out after 30000ms/i)
  })

  it('accepts a custom timeoutMs and passes it to OpenAI client', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(['Hola']) } }],
    })
    const provider = new OpenAITranslationProvider('sk-test', undefined, undefined, 60_000)
    await provider.translate({ segments: ['Hello'], sourceLocale: 'en', targetLocale: 'es' })
    expect(OpenAIConstructor).toHaveBeenCalledWith(
      expect.objectContaining({ timeout: 60_000 }),
    )
  })

  it('re-throws non-timeout errors unchanged', async () => {
    const otherError = new Error('DNS lookup failed')
    mockCreate.mockRejectedValue(otherError)
    const provider = new OpenAITranslationProvider('sk-test')
    await expect(
      provider.translate({ segments: ['Hello'], sourceLocale: 'en', targetLocale: 'es' }),
    ).rejects.toThrow('DNS lookup failed')
  })

  describe('logging', () => {
    it('logs API call with model, baseURL, and segment count', async () => {
      const logs: Array<{ level: string; message: string; data?: unknown }> = []
      const mockLogger: Logger = {
        info: (msg, data) => logs.push({ level: 'info', message: msg, data }),
        error: (msg, data) => logs.push({ level: 'error', message: msg, data }),
        debug: (msg, data) => logs.push({ level: 'debug', message: msg, data }),
      }

      mockCreate.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(['Hola']) } }],
      })
      const provider = new OpenAITranslationProvider('sk-test', 'gpt-4', 'https://api.openai.com/v1', undefined, mockLogger)
      await provider.translate({ segments: ['Hello'], sourceLocale: 'en', targetLocale: 'es' })

      expect(logs).toHaveLength(2)
      expect(logs[0]).toMatchObject({
        level: 'info',
        message: 'OpenAITranslationProvider: API call',
      })
      expect(logs[0].data).toMatchObject({
        model: 'gpt-4',
        baseURL: 'https://api.openai.com/v1',
        segmentCount: 1,
        sourceLocale: 'en',
        targetLocale: 'es',
      })
    })

    it('logs successful response', async () => {
      const logs: Array<{ level: string; message: string; data?: unknown }> = []
      const mockLogger: Logger = {
        info: (msg, data) => logs.push({ level: 'info', message: msg, data }),
        error: (msg, data) => logs.push({ level: 'error', message: msg, data }),
        debug: (msg, data) => logs.push({ level: 'debug', message: msg, data }),
      }

      mockCreate.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(['Hola', 'Mundo']) } }],
      })
      const provider = new OpenAITranslationProvider('sk-test', undefined, undefined, undefined, mockLogger)
      await provider.translate({
        segments: ['Hello', 'World'],
        sourceLocale: 'en',
        targetLocale: 'es',
      })

      expect(logs).toHaveLength(2)
      expect(logs[1]).toMatchObject({
        level: 'info',
        message: 'OpenAITranslationProvider: response received',
      })
      expect(logs[1].data).toMatchObject({
        translatedCount: 2,
      })
    })

    it('logs errors', async () => {
      const logs: Array<{ level: string; message: string; data?: unknown }> = []
      const mockLogger: Logger = {
        info: (msg, data) => logs.push({ level: 'info', message: msg, data }),
        error: (msg, data) => logs.push({ level: 'error', message: msg, data }),
        debug: (msg, data) => logs.push({ level: 'debug', message: msg, data }),
      }

      const apiError = new Error('API error') as Error & { status: number }
      apiError.status = 500
      mockCreate.mockRejectedValue(apiError)
      const provider = new OpenAITranslationProvider('sk-test', undefined, undefined, undefined, mockLogger)

      await expect(
        provider.translate({ segments: ['Hello'], sourceLocale: 'en', targetLocale: 'es' }),
      ).rejects.toThrow()

      expect(logs.some(log => log.level === 'error')).toBe(true)
      const errorLog = logs.find(log => log.level === 'error')
      expect(errorLog?.message).toContain('OpenAITranslationProvider: error')
    })

    it('logs timeout errors', async () => {
      const logs: Array<{ level: string; message: string; data?: unknown }> = []
      const mockLogger: Logger = {
        info: (msg, data) => logs.push({ level: 'info', message: msg, data }),
        error: (msg, data) => logs.push({ level: 'error', message: msg, data }),
        debug: (msg, data) => logs.push({ level: 'debug', message: msg, data }),
      }

      const timeoutError = new Error('Request timed out') as Error & { code: string }
      timeoutError.code = 'ETIMEDOUT'
      mockCreate.mockRejectedValue(timeoutError)
      const provider = new OpenAITranslationProvider('sk-test', undefined, undefined, 45_000, mockLogger)

      await expect(
        provider.translate({ segments: ['Hello'], sourceLocale: 'en', targetLocale: 'es' }),
      ).rejects.toThrow(/timed out/)

      expect(logs.some(log => log.level === 'error')).toBe(true)
      const errorLog = logs.find(log => log.level === 'error')
      expect(errorLog?.data).toMatchObject({
        timeoutMs: 45_000,
      })
    })

    it('works without logger', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(['Hola']) } }],
      })
      const provider = new OpenAITranslationProvider('sk-test')
      const result = await provider.translate({
        segments: ['Hello'],
        sourceLocale: 'en',
        targetLocale: 'es',
      })
      expect(result.segments).toEqual(['Hola'])
    })
  })

  describe('robust JSON parsing', () => {
    it('should handle response wrapped in markdown code block', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: '```json\n["Hola", "Mundo"]\n```' } }],
      })
      const provider = new OpenAITranslationProvider('sk-test')
      const result = await provider.translate({
        segments: ['Hello', 'World'],
        sourceLocale: 'en',
        targetLocale: 'es',
      })
      expect(result.segments).toEqual(['Hola', 'Mundo'])
    })

    it('should handle response with explanation before JSON', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'Here are the translations:\n["Hola", "Mundo"]' } }],
      })
      const provider = new OpenAITranslationProvider('sk-test')
      const result = await provider.translate({
        segments: ['Hello', 'World'],
        sourceLocale: 'en',
        targetLocale: 'es',
      })
      expect(result.segments).toEqual(['Hola', 'Mundo'])
    })

    it('should handle response with explanation after JSON', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: '["Hola", "Mundo"]\nThese are the Spanish translations.' } }],
      })
      const provider = new OpenAITranslationProvider('sk-test')
      const result = await provider.translate({
        segments: ['Hello', 'World'],
        sourceLocale: 'en',
        targetLocale: 'es',
      })
      expect(result.segments).toEqual(['Hola', 'Mundo'])
    })

    it('should handle multiline formatted JSON', async () => {
      const response = '[\n  "Hola",\n  "Mundo"\n]'
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: response } }],
      })
      const provider = new OpenAITranslationProvider('sk-test')
      const result = await provider.translate({
        segments: ['Hello', 'World'],
        sourceLocale: 'en',
        targetLocale: 'es',
      })
      expect(result.segments).toEqual(['Hola', 'Mundo'])
    })

    it('should handle response with markdown and explanation', async () => {
      const response = 'Sure! Here are the translations:\n\n```json\n["Hola", "Mundo"]\n```\n\nI hope this helps!'
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: response } }],
      })
      const provider = new OpenAITranslationProvider('sk-test')
      const result = await provider.translate({
        segments: ['Hello', 'World'],
        sourceLocale: 'en',
        targetLocale: 'es',
      })
      expect(result.segments).toEqual(['Hola', 'Mundo'])
    })
  })
})
