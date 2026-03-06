import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ClaudeTranslationProvider } from '../src/claude-provider'

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
})
