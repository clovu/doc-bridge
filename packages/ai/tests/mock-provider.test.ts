import { describe, it, expect } from 'vitest'
import { MockTranslationProvider } from '../src/mock-provider'

describe('MockTranslationProvider', () => {
  it('returns [MOCK:text] for unknown segments', async () => {
    const provider = new MockTranslationProvider()
    const result = await provider.translate({
      segments: ['Hello'],
      sourceLocale: 'en',
      targetLocale: 'es',
    })
    expect(result.segments).toEqual(['[MOCK:Hello]'])
  })

  it('returns mapped value for known segments', async () => {
    const provider = new MockTranslationProvider(new Map([['Hello', 'Hola']]))
    const result = await provider.translate({
      segments: ['Hello'],
      sourceLocale: 'en',
      targetLocale: 'es',
    })
    expect(result.segments).toEqual(['Hola'])
  })

  it('returns segments in same order as input', async () => {
    const provider = new MockTranslationProvider(
      new Map([['a', 'A'], ['b', 'B'], ['c', 'C']]),
    )
    const result = await provider.translate({
      segments: ['c', 'a', 'b'],
      sourceLocale: 'en',
      targetLocale: 'es',
    })
    expect(result.segments).toEqual(['C', 'A', 'B'])
  })

  it('handles empty segments array', async () => {
    const provider = new MockTranslationProvider()
    const result = await provider.translate({
      segments: [],
      sourceLocale: 'en',
      targetLocale: 'es',
    })
    expect(result.segments).toEqual([])
  })

  it('mixes known and unknown segments', async () => {
    const provider = new MockTranslationProvider(new Map([['Hello', 'Hola']]))
    const result = await provider.translate({
      segments: ['Hello', 'World'],
      sourceLocale: 'en',
      targetLocale: 'es',
    })
    expect(result.segments).toEqual(['Hola', '[MOCK:World]'])
  })
})
