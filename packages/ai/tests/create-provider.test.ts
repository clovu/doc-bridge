import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createProvider } from '../src/create-provider'
import { ClaudeTranslationProvider } from '../src/claude-provider'
import { OpenAITranslationProvider } from '../src/openai-provider'

vi.mock('openai', () => {
  return {
    default: vi.fn(),
  }
})

describe('createProvider', () => {
  it('returns ClaudeTranslationProvider for id="claude"', () => {
    const provider = createProvider({ id: 'claude' })
    expect(provider).toBeInstanceOf(ClaudeTranslationProvider)
  })

  it('returns OpenAITranslationProvider for id="openai"', () => {
    const provider = createProvider({ id: 'openai', apiKey: 'sk-test' })
    expect(provider).toBeInstanceOf(OpenAITranslationProvider)
  })

  it('returns OpenAITranslationProvider for id="custom" without protocol (backward compat)', () => {
    const provider = createProvider({
      id: 'custom',
      apiKey: 'sk-test',
      baseURL: 'https://example.com/v1',
    })
    expect(provider).toBeInstanceOf(OpenAITranslationProvider)
  })

  it('custom provider with protocol=claude uses ClaudeTranslationProvider', () => {
    const provider = createProvider({
      id: 'custom',
      apiKey: 'my-key',
      baseURL: 'https://anthropic-compatible.example.com/v1',
      protocol: 'claude',
    })
    expect(provider).toBeInstanceOf(ClaudeTranslationProvider)
  })

  it('custom provider with explicit protocol=openai uses OpenAITranslationProvider', () => {
    const provider = createProvider({
      id: 'custom',
      apiKey: 'my-key',
      baseURL: 'https://openai-compatible.example.com/v1',
      protocol: 'openai',
    })
    expect(provider).toBeInstanceOf(OpenAITranslationProvider)
  })

  it('custom provider with unknown protocol throws', () => {
    expect(() =>
      createProvider({
        id: 'custom',
        apiKey: 'my-key',
        baseURL: 'https://example.com/v1',
        protocol: 'unknown-xyz',
      }),
    ).toThrow('Unknown protocol provider: unknown-xyz')
  })

  it('throws "Unknown provider: <id>" for unknown id', () => {
    expect(() => createProvider({ id: 'bad' })).toThrow('Unknown provider: bad')
  })

  it('throws "Provider openai requires apiKey" when apiKey absent', () => {
    expect(() => createProvider({ id: 'openai' })).toThrow('Provider openai requires apiKey')
  })

  it('throws "Provider custom requires apiKey" when apiKey absent', () => {
    expect(() => createProvider({ id: 'custom', baseURL: 'https://example.com/v1' })).toThrow(
      'Provider custom requires apiKey',
    )
  })

  it('throws "Provider custom requires baseURL" when baseURL absent', () => {
    expect(() => createProvider({ id: 'custom', apiKey: 'sk-test' })).toThrow(
      'Provider custom requires baseURL',
    )
  })

  it('does not throw for claude with no apiKey (optional)', () => {
    expect(() => createProvider({ id: 'claude' })).not.toThrow()
  })

  it('does not throw for openai with no model (optional)', () => {
    expect(() => createProvider({ id: 'openai', apiKey: 'sk-test' })).not.toThrow()
  })

  // ── Regression: original route.ts always used ClaudeTranslationProvider ──────
  // When a custom provider config is supplied the result must NOT be a
  // ClaudeTranslationProvider, even if ANTHROPIC_API_KEY is set in the env.
  it('custom provider does NOT produce a ClaudeTranslationProvider (regression: was always Claude)', () => {
    const provider = createProvider({
      id: 'custom',
      apiKey: 'sk-test',
      baseURL: 'https://right.codes/codex/v1',
      model: 'gpt-5.2',
    })
    expect(provider).not.toBeInstanceOf(ClaudeTranslationProvider)
    expect(provider).toBeInstanceOf(OpenAITranslationProvider)
  })

  it('openai provider does NOT produce a ClaudeTranslationProvider', () => {
    const provider = createProvider({ id: 'openai', apiKey: 'sk-test' })
    expect(provider).not.toBeInstanceOf(ClaudeTranslationProvider)
    expect(provider).toBeInstanceOf(OpenAITranslationProvider)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// End-to-end: custom provider → OpenAI-compatible request
// Exercises the exact scenario from the bug report:
//   { id: 'custom', baseURL: 'https://right.codes/codex/v1', apiKey: 'sk-...', model: 'gpt-5.2' }
//   translated with targetLocale: 'zh'
// ──────────────────────────────────────────────────────────────────────────────

describe('custom provider end-to-end (id: "custom")', () => {
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

  it('routes translate request to custom baseURL, not default OpenAI URL', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(['你好']) } }],
    })
    const provider = createProvider({
      id: 'custom',
      apiKey: 'sk-04260c0a0445459597f2fd1184858c4c',
      baseURL: 'https://right.codes/codex/v1',
      model: 'gpt-5.2',
    })
    await provider.translate({ segments: ['Hello'], sourceLocale: 'en', targetLocale: 'zh' })
    expect(OpenAIConstructor).toHaveBeenCalledWith(
      expect.objectContaining({ baseURL: 'https://right.codes/codex/v1' }),
    )
    expect(OpenAIConstructor).not.toHaveBeenCalledWith(
      expect.objectContaining({ baseURL: expect.stringContaining('api.openai.com') }),
    )
  })

  it('sends the custom apiKey in the Authorization header', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(['你好']) } }],
    })
    const provider = createProvider({
      id: 'custom',
      apiKey: 'sk-04260c0a0445459597f2fd1184858c4c',
      baseURL: 'https://right.codes/codex/v1',
      model: 'gpt-5.2',
    })
    await provider.translate({ segments: ['Hello'], sourceLocale: 'en', targetLocale: 'zh' })
    expect(OpenAIConstructor).toHaveBeenCalledWith(
      expect.objectContaining({ apiKey: 'sk-04260c0a0445459597f2fd1184858c4c' }),
    )
  })

  it('sends the custom model in the request body', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(['你好']) } }],
    })
    const provider = createProvider({
      id: 'custom',
      apiKey: 'sk-04260c0a0445459597f2fd1184858c4c',
      baseURL: 'https://right.codes/codex/v1',
      model: 'gpt-5.2',
    })
    await provider.translate({ segments: ['Hello'], sourceLocale: 'en', targetLocale: 'zh' })
    const createCall = mockCreate.mock.calls[0][0]
    expect(createCall.model).toBe('gpt-5.2')
  })

  it('includes targetLocale "zh" in the system prompt', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(['你好']) } }],
    })
    const provider = createProvider({
      id: 'custom',
      apiKey: 'sk-04260c0a0445459597f2fd1184858c4c',
      baseURL: 'https://right.codes/codex/v1',
      model: 'gpt-5.2',
    })
    await provider.translate({ segments: ['Hello'], sourceLocale: 'en', targetLocale: 'zh' })
    const createCall = mockCreate.mock.calls[0][0]
    const systemMsg = createCall.messages.find((m: { role: string }) => m.role === 'system')
    expect(systemMsg?.content).toContain('zh')
    expect(systemMsg?.content).toContain('en')
  })

  it('includes sourceLocale "en" and targetLocale "zh" in the correct order in system prompt', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(['你好']) } }],
    })
    const provider = createProvider({
      id: 'custom',
      apiKey: 'sk-04260c0a0445459597f2fd1184858c4c',
      baseURL: 'https://right.codes/codex/v1',
      model: 'gpt-5.2',
    })
    await provider.translate({ segments: ['Hello'], sourceLocale: 'en', targetLocale: 'zh' })
    const createCall = mockCreate.mock.calls[0][0]
    const systemMsg = createCall.messages.find((m: { role: string }) => m.role === 'system')
    // Must say "from en to zh", not "from zh to en"
    expect(systemMsg?.content).toMatch(/from en to zh/i)
  })

  it('returns the translated segments from the custom provider response', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(['你好', '世界']) } }],
    })
    const provider = createProvider({
      id: 'custom',
      apiKey: 'sk-04260c0a0445459597f2fd1184858c4c',
      baseURL: 'https://right.codes/codex/v1',
      model: 'gpt-5.2',
    })
    const result = await provider.translate({
      segments: ['Hello', 'World'],
      sourceLocale: 'en',
      targetLocale: 'zh',
    })
    expect(result.segments).toEqual(['你好', '世界'])
  })

  it('custom provider with default model still uses custom baseURL and apiKey', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(['你好']) } }],
    })
    const provider = createProvider({
      id: 'custom',
      apiKey: 'sk-04260c0a0445459597f2fd1184858c4c',
      baseURL: 'https://right.codes/codex/v1',
      // no model → should default to gpt-4o but still use custom baseURL
    })
    await provider.translate({ segments: ['Hello'], sourceLocale: 'en', targetLocale: 'zh' })
    expect(OpenAIConstructor).toHaveBeenCalledWith(
      expect.objectContaining({ baseURL: 'https://right.codes/codex/v1' }),
    )
    expect(OpenAIConstructor).toHaveBeenCalledWith(
      expect.objectContaining({ apiKey: 'sk-04260c0a0445459597f2fd1184858c4c' }),
    )
  })
})
