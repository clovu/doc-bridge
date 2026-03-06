import { describe, it, expect, vi, beforeEach } from 'vitest'
import Anthropic from '@anthropic-ai/sdk'
import { ClaudeTranslationProvider } from '../src/claude-provider'
import type { Logger } from '@docbridge/core'

// Mock the Anthropic SDK
const mockCreate = vi.fn()
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  })),
}))

const EXPECTED_MODEL = 'claude-haiku-4-5-20251001'

function makeResponse(text: string) {
  return { content: [{ type: 'text', text }] }
}

describe('ClaudeTranslationProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses model claude-haiku-4-5-20251001', async () => {
    mockCreate.mockResolvedValue(makeResponse(JSON.stringify(['Hola'])))
    const provider = new ClaudeTranslationProvider('test-key')
    await provider.translate({ segments: ['Hello'], sourceLocale: 'en', targetLocale: 'es' })
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: EXPECTED_MODEL }),
    )
  })

  it('sends segments as JSON array in user prompt', async () => {
    const segments = ['Hello', 'World']
    mockCreate.mockResolvedValue(makeResponse(JSON.stringify(['Hola', 'Mundo'])))
    const provider = new ClaudeTranslationProvider('test-key')
    await provider.translate({ segments, sourceLocale: 'en', targetLocale: 'es' })
    const call = mockCreate.mock.calls[0][0] as { messages: Array<{ content: string }> }
    const userContent = call.messages[0].content
    expect(userContent).toContain(JSON.stringify(segments))
  })

  it('includes sourceLocale and targetLocale in system prompt', async () => {
    mockCreate.mockResolvedValue(makeResponse(JSON.stringify(['Bonjour'])))
    const provider = new ClaudeTranslationProvider('test-key')
    await provider.translate({ segments: ['Hello'], sourceLocale: 'en', targetLocale: 'fr' })
    const call = mockCreate.mock.calls[0][0] as { system: string }
    expect(call.system).toContain('en')
    expect(call.system).toContain('fr')
  })

  it('returns parsed array of translated segments', async () => {
    const translated = ['Hola', 'Mundo']
    mockCreate.mockResolvedValue(makeResponse(JSON.stringify(translated)))
    const provider = new ClaudeTranslationProvider('test-key')
    const result = await provider.translate({
      segments: ['Hello', 'World'],
      sourceLocale: 'en',
      targetLocale: 'es',
    })
    expect(result.segments).toEqual(translated)
  })

  it('concatenates multiple text content blocks from response', async () => {
    mockCreate.mockResolvedValue({
      content: [
        { type: 'text', text: '["He' },
        { type: 'text', text: 'llo"]' },
      ],
    })
    const provider = new ClaudeTranslationProvider('test-key')
    const result = await provider.translate({
      segments: ['Hello'],
      sourceLocale: 'en',
      targetLocale: 'es',
    })
    expect(result.segments).toEqual(['Hello'])
  })

  it('throws if response is not a JSON array', async () => {
    mockCreate.mockResolvedValue(makeResponse('not json'))
    const provider = new ClaudeTranslationProvider('test-key')
    await expect(
      provider.translate({ segments: ['Hello'], sourceLocale: 'en', targetLocale: 'es' }),
    ).rejects.toThrow()
  })

  it('throws if response array length differs from input', async () => {
    mockCreate.mockResolvedValue(makeResponse(JSON.stringify(['one', 'two'])))
    const provider = new ClaudeTranslationProvider('test-key')
    await expect(
      provider.translate({ segments: ['Hello'], sourceLocale: 'en', targetLocale: 'es' }),
    ).rejects.toThrow(/expected 1.*got 2/i)
  })

  it('passes timeoutMs to Anthropic client constructor', async () => {
    mockCreate.mockResolvedValue(makeResponse(JSON.stringify(['Hola'])))
    new ClaudeTranslationProvider('test-key', 90_000)
    expect(vi.mocked(Anthropic)).toHaveBeenCalledWith(
      expect.objectContaining({ apiKey: 'test-key', timeout: 90_000 }),
    )
  })

  it('uses default timeout of 120_000ms when none is specified', async () => {
    mockCreate.mockResolvedValue(makeResponse(JSON.stringify(['Hola'])))
    new ClaudeTranslationProvider('test-key')
    expect(vi.mocked(Anthropic)).toHaveBeenCalledWith(
      expect.objectContaining({ timeout: 120_000 }),
    )
  })

  it('throws a descriptive error when the Anthropic request times out', async () => {
    const timeoutError = new Error('Request timeout')
    timeoutError.name = 'APITimeoutError'
    mockCreate.mockRejectedValue(timeoutError)
    const provider = new ClaudeTranslationProvider('test-key')
    await expect(
      provider.translate({ segments: ['Hello'], sourceLocale: 'en', targetLocale: 'es' }),
    ).rejects.toThrow(/timed out after 120000ms/i)
  })

  it('timeout error message includes the configured timeoutMs value', async () => {
    const timeoutError = new Error('Request timeout')
    timeoutError.name = 'APITimeoutError'
    mockCreate.mockRejectedValue(timeoutError)
    const provider = new ClaudeTranslationProvider('test-key', 45_000)
    await expect(
      provider.translate({ segments: ['Hello'], sourceLocale: 'en', targetLocale: 'es' }),
    ).rejects.toThrow(/timed out after 45000ms/i)
  })

  it('re-throws non-timeout errors unchanged', async () => {
    const otherError = new Error('Some network error')
    mockCreate.mockRejectedValue(otherError)
    const provider = new ClaudeTranslationProvider('test-key')
    await expect(
      provider.translate({ segments: ['Hello'], sourceLocale: 'en', targetLocale: 'es' }),
    ).rejects.toThrow('Some network error')
  })

  describe('logging', () => {
    it('logs API call with model and segment count', async () => {
      const logs: Array<{ level: string; message: string; data?: unknown }> = []
      const mockLogger: Logger = {
        info: (msg, data) => logs.push({ level: 'info', message: msg, data }),
        error: (msg, data) => logs.push({ level: 'error', message: msg, data }),
        debug: (msg, data) => logs.push({ level: 'debug', message: msg, data }),
      }

      mockCreate.mockResolvedValue(makeResponse(JSON.stringify(['Hola'])))
      const provider = new ClaudeTranslationProvider('test-key', undefined, mockLogger)
      await provider.translate({ segments: ['Hello'], sourceLocale: 'en', targetLocale: 'es' })

      expect(logs).toHaveLength(2)
      expect(logs[0]).toMatchObject({
        level: 'info',
        message: 'ClaudeTranslationProvider: API call',
      })
      expect(logs[0].data).toMatchObject({
        model: EXPECTED_MODEL,
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

      mockCreate.mockResolvedValue(makeResponse(JSON.stringify(['Hola', 'Mundo'])))
      const provider = new ClaudeTranslationProvider('test-key', undefined, mockLogger)
      await provider.translate({
        segments: ['Hello', 'World'],
        sourceLocale: 'en',
        targetLocale: 'es',
      })

      expect(logs).toHaveLength(2)
      expect(logs[1]).toMatchObject({
        level: 'info',
        message: 'ClaudeTranslationProvider: response received',
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

      const apiError = new Error('API error')
      mockCreate.mockRejectedValue(apiError)
      const provider = new ClaudeTranslationProvider('test-key', undefined, mockLogger)

      await expect(
        provider.translate({ segments: ['Hello'], sourceLocale: 'en', targetLocale: 'es' }),
      ).rejects.toThrow()

      expect(logs.some(log => log.level === 'error')).toBe(true)
      const errorLog = logs.find(log => log.level === 'error')
      expect(errorLog?.message).toContain('ClaudeTranslationProvider: error')
    })

    it('logs timeout errors', async () => {
      const logs: Array<{ level: string; message: string; data?: unknown }> = []
      const mockLogger: Logger = {
        info: (msg, data) => logs.push({ level: 'info', message: msg, data }),
        error: (msg, data) => logs.push({ level: 'error', message: msg, data }),
        debug: (msg, data) => logs.push({ level: 'debug', message: msg, data }),
      }

      const timeoutError = new Error('Request timeout')
      timeoutError.name = 'APITimeoutError'
      mockCreate.mockRejectedValue(timeoutError)
      const provider = new ClaudeTranslationProvider('test-key', 60_000, mockLogger)

      await expect(
        provider.translate({ segments: ['Hello'], sourceLocale: 'en', targetLocale: 'es' }),
      ).rejects.toThrow(/timed out/)

      expect(logs.some(log => log.level === 'error')).toBe(true)
      const errorLog = logs.find(log => log.level === 'error')
      expect(errorLog?.data).toMatchObject({
        timeoutMs: 60_000,
      })
    })

    it('works without logger', async () => {
      mockCreate.mockResolvedValue(makeResponse(JSON.stringify(['Hola'])))
      const provider = new ClaudeTranslationProvider('test-key')
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
      mockCreate.mockResolvedValue(makeResponse('```json\n["Hola", "Mundo"]\n```'))
      const provider = new ClaudeTranslationProvider('test-key')
      const result = await provider.translate({
        segments: ['Hello', 'World'],
        sourceLocale: 'en',
        targetLocale: 'es',
      })
      expect(result.segments).toEqual(['Hola', 'Mundo'])
    })

    it('should handle response with explanation before JSON', async () => {
      mockCreate.mockResolvedValue(makeResponse('Here are the translations:\n["Hola", "Mundo"]'))
      const provider = new ClaudeTranslationProvider('test-key')
      const result = await provider.translate({
        segments: ['Hello', 'World'],
        sourceLocale: 'en',
        targetLocale: 'es',
      })
      expect(result.segments).toEqual(['Hola', 'Mundo'])
    })

    it('should handle response with explanation after JSON', async () => {
      mockCreate.mockResolvedValue(makeResponse('["Hola", "Mundo"]\nThese are the Spanish translations.'))
      const provider = new ClaudeTranslationProvider('test-key')
      const result = await provider.translate({
        segments: ['Hello', 'World'],
        sourceLocale: 'en',
        targetLocale: 'es',
      })
      expect(result.segments).toEqual(['Hola', 'Mundo'])
    })

    it('should handle multiline formatted JSON', async () => {
      const response = '[\n  "Hola",\n  "Mundo"\n]'
      mockCreate.mockResolvedValue(makeResponse(response))
      const provider = new ClaudeTranslationProvider('test-key')
      const result = await provider.translate({
        segments: ['Hello', 'World'],
        sourceLocale: 'en',
        targetLocale: 'es',
      })
      expect(result.segments).toEqual(['Hola', 'Mundo'])
    })

    it('should handle response with markdown and explanation', async () => {
      const response = 'Sure! Here are the translations:\n\n```json\n["Hola", "Mundo"]\n```\n\nI hope this helps!'
      mockCreate.mockResolvedValue(makeResponse(response))
      const provider = new ClaudeTranslationProvider('test-key')
      const result = await provider.translate({
        segments: ['Hello', 'World'],
        sourceLocale: 'en',
        targetLocale: 'es',
      })
      expect(result.segments).toEqual(['Hola', 'Mundo'])
    })
  })
})
