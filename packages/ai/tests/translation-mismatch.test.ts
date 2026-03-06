import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OpenAITranslationProvider } from '../src/openai-provider'
import { ClaudeTranslationProvider } from '../src/claude-provider'

vi.mock('openai', () => ({
  default: vi.fn(),
}))

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn(),
}))

/**
 * Tests for translation count mismatch scenarios
 * These tests ensure providers handle cases where the AI model
 * returns fewer or more translations than requested
 */

describe('Translation Count Mismatch', () => {
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
      ;(openaiModule.default as unknown as ReturnType<typeof vi.fn>).mockImplementation(OpenAIConstructor as never)
    })

    it('throws descriptive error when AI returns fewer translations than segments', async () => {
      // AI returns only 1 translation when 2 segments were requested
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(['Translation 1']) } }],
      })

      const provider = new OpenAITranslationProvider('sk-test')

      await expect(
        provider.translate({
          segments: ['Segment 1', 'Segment 2'],
          sourceLocale: 'en',
          targetLocale: 'es',
        }),
      ).rejects.toThrow(/expected 2 translations, got 1/)
    })

    it('throws descriptive error when AI returns more translations than segments', async () => {
      // AI returns 3 translations when only 2 segments were requested
      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify(['Translation 1', 'Translation 2', 'Translation 3']),
          },
        }],
      })

      const provider = new OpenAITranslationProvider('sk-test')

      await expect(
        provider.translate({
          segments: ['Segment 1', 'Segment 2'],
          sourceLocale: 'en',
          targetLocale: 'es',
        }),
      ).rejects.toThrow(/expected 2 translations, got 3/)
    })

    it('includes segment information in error for debugging', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(['Only one']) } }],
      })

      const provider = new OpenAITranslationProvider('sk-test')

      try {
        await provider.translate({
          segments: ['First segment', 'Second segment'],
          sourceLocale: 'en',
          targetLocale: 'es',
        })
        expect.fail('Should have thrown an error')
      } catch (err) {
        expect(err).toBeInstanceOf(Error)
        const error = err as Error
        // Error should contain useful debugging info
        expect(error.message).toContain('expected 2 translations, got 1')
      }
    })

    it('handles empty response array', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify([]) } }],
      })

      const provider = new OpenAITranslationProvider('sk-test')

      await expect(
        provider.translate({
          segments: ['Segment 1'],
          sourceLocale: 'en',
          targetLocale: 'es',
        }),
      ).rejects.toThrow(/expected 1 translations, got 0/)
    })

    it('succeeds when translation count matches segment count', async () => {
      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify(['Translation 1', 'Translation 2', 'Translation 3']),
          },
        }],
      })

      const provider = new OpenAITranslationProvider('sk-test')

      const result = await provider.translate({
        segments: ['Segment 1', 'Segment 2', 'Segment 3'],
        sourceLocale: 'en',
        targetLocale: 'es',
      })

      expect(result.segments).toEqual(['Translation 1', 'Translation 2', 'Translation 3'])
    })
  })

  describe('ClaudeTranslationProvider', () => {
    let mockCreate: ReturnType<typeof vi.fn>
    let AnthropicConstructor: ReturnType<typeof vi.fn>

    beforeEach(async () => {
      mockCreate = vi.fn()
      AnthropicConstructor = vi.fn().mockImplementation(() => ({
        messages: {
          create: mockCreate,
        },
      }))
      const anthropicModule = await import('@anthropic-ai/sdk')
      ;(anthropicModule.default as unknown as ReturnType<typeof vi.fn>).mockImplementation(AnthropicConstructor as never)
    })

    it('throws descriptive error when AI returns fewer translations than segments', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify(['Translation 1']) }],
      })

      const provider = new ClaudeTranslationProvider('sk-test')

      await expect(
        provider.translate({
          segments: ['Segment 1', 'Segment 2'],
          sourceLocale: 'en',
          targetLocale: 'es',
        }),
      ).rejects.toThrow(/expected 2 translations, got 1/)
    })

    it('throws descriptive error when AI returns more translations than segments', async () => {
      mockCreate.mockResolvedValue({
        content: [{
          type: 'text',
          text: JSON.stringify(['Translation 1', 'Translation 2', 'Translation 3']),
        }],
      })

      const provider = new ClaudeTranslationProvider('sk-test')

      await expect(
        provider.translate({
          segments: ['Segment 1', 'Segment 2'],
          sourceLocale: 'en',
          targetLocale: 'es',
        }),
      ).rejects.toThrow(/expected 2 translations, got 3/)
    })

    it('handles empty response array', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify([]) }],
      })

      const provider = new ClaudeTranslationProvider('sk-test')

      await expect(
        provider.translate({
          segments: ['Segment 1'],
          sourceLocale: 'en',
          targetLocale: 'es',
        }),
      ).rejects.toThrow(/expected 1 translations, got 0/)
    })

    it('succeeds when translation count matches segment count', async () => {
      mockCreate.mockResolvedValue({
        content: [{
          type: 'text',
          text: JSON.stringify(['Translation 1', 'Translation 2', 'Translation 3']),
        }],
      })

      const provider = new ClaudeTranslationProvider('sk-test')

      const result = await provider.translate({
        segments: ['Segment 1', 'Segment 2', 'Segment 3'],
        sourceLocale: 'en',
        targetLocale: 'es',
      })

      expect(result.segments).toEqual(['Translation 1', 'Translation 2', 'Translation 3'])
    })
  })
})
