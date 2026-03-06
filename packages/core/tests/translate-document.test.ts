import { describe, it, expect, vi } from 'vitest'
import { translateDocument } from '../src/translate-document'

describe('translateDocument', () => {
  it('calls translate with only translatable segment texts', async () => {
    const translate = vi.fn().mockResolvedValue(['Hola mundo'])
    await translateDocument('Hello world', {
      sourceLocale: 'en',
      targetLocale: 'es',
      translate,
    })
    expect(translate).toHaveBeenCalledWith(['Hello world'])
  })

  it('does not call translate with code block content', async () => {
    const translate = vi.fn().mockResolvedValue(['Intro'])
    await translateDocument('Intro\n```\nconst x = 1\n```', {
      sourceLocale: 'en',
      targetLocale: 'es',
      translate,
    })
    const [calledWith] = translate.mock.calls[0] as [string[]]
    expect(calledWith.some(s => s.includes('const x = 1'))).toBe(false)
  })

  it('does not call translate with inline code content', async () => {
    const translate = vi.fn().mockResolvedValue(['Run', ' to start'])
    await translateDocument('Run `npm start` to start', {
      sourceLocale: 'en',
      targetLocale: 'es',
      translate,
    })
    const [calledWith] = translate.mock.calls[0] as [string[]]
    expect(calledWith.some(s => s.includes('npm start'))).toBe(false)
  })

  it('does not call translate with URLs', async () => {
    const translate = vi.fn().mockResolvedValue(['Visit', ' now'])
    await translateDocument('Visit https://example.com now', {
      sourceLocale: 'en',
      targetLocale: 'es',
      translate,
    })
    const [calledWith] = translate.mock.calls[0] as [string[]]
    expect(calledWith.some(s => s.includes('https://'))).toBe(false)
  })

  it('calls translate exactly once (batches all segments)', async () => {
    const translate = vi.fn().mockResolvedValue(['a', 'b'])
    await translateDocument('First `code` second', {
      sourceLocale: 'en',
      targetLocale: 'es',
      translate,
    })
    expect(translate).toHaveBeenCalledTimes(1)
  })

  it('returns translated document with translated segments inserted', async () => {
    const translate = vi.fn().mockResolvedValue(['Hola mundo'])
    const result = await translateDocument('Hello world', {
      sourceLocale: 'en',
      targetLocale: 'es',
      translate,
    })
    expect(result.translated).toBe('Hola mundo')
  })

  it('preserves code blocks verbatim in result', async () => {
    const translate = vi.fn().mockResolvedValue(['Introducción'])
    const result = await translateDocument('Intro\n```\nconst x = 1\n```', {
      sourceLocale: 'en',
      targetLocale: 'es',
      translate,
    })
    expect(result.translated).toContain('```\nconst x = 1\n```')
  })

  it('preserves inline code verbatim in result', async () => {
    const translate = vi.fn().mockResolvedValue(['Ejecutar', ' para iniciar'])
    const result = await translateDocument('Run `npm start` to start', {
      sourceLocale: 'en',
      targetLocale: 'es',
      translate,
    })
    expect(result.translated).toContain('`npm start`')
  })

  it('returns empty string when input is empty string', async () => {
    const translate = vi.fn().mockResolvedValue([])
    const result = await translateDocument('', {
      sourceLocale: 'en',
      targetLocale: 'es',
      translate,
    })
    expect(result.translated).toBe('')
  })
})
