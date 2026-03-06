import { type NextRequest, NextResponse } from 'next/server'
import { getFileContent } from '@docbridge/github'
import { translateDocument, createLogger } from '@docbridge/core'
import { ClaudeTranslationProvider, createProvider } from '@docbridge/ai'
import { translateFilename } from '@/lib/translate-filename'

const logger = createLogger({
  enabled: process.env.NODE_ENV !== 'test',
  onLog: (level, message, data) => {
    const timestamp = new Date().toISOString()
    const logData = data ? ` ${JSON.stringify(data)}` : ''
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}${logData}`)
  },
})

interface TranslateBody {
  owner: string
  repo: string
  files: string[]
  targetLocale: string
  sourceLocale?: string
  provider?: { id: string; apiKey?: string; baseURL?: string; model?: string; protocol?: string }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get('gh_token')?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as TranslateBody
  const { owner, repo, files, targetLocale, sourceLocale = 'en', provider: providerConfig } = body

  logger.info('Translation request received', {
    owner,
    repo,
    fileCount: files.length,
    targetLocale,
    sourceLocale,
    providerId: providerConfig?.id || 'claude',
  })

  let provider
  if (!providerConfig || (providerConfig.id === 'claude' && !providerConfig.apiKey)) {
    provider = new ClaudeTranslationProvider(process.env.ANTHROPIC_API_KEY!, undefined, logger)
  } else {
    try {
      logger.info('Creating custom provider', { providerId: providerConfig.id })
      provider = createProvider(providerConfig, logger)
    } catch (err) {
      logger.error('Provider creation failed', {
        providerId: providerConfig.id,
        error: err instanceof Error ? err.message : String(err),
      })
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Invalid provider configuration' },
        { status: 400 },
      )
    }
  }

  let results
  try {
    results = await Promise.all(
      files.map(async (filePath) => {
        logger.debug('Processing file', { filePath })
        const { content } = await getFileContent(token, owner, repo, filePath)
        const { translated } = await translateDocument(content, {
          sourceLocale,
          targetLocale,
          translate: async (segments) => {
            const res = await provider.translate({ segments, sourceLocale, targetLocale })
            return res.segments
          },
        })
        const translatedPath = translateFilename(filePath, targetLocale)
        logger.debug('File processed', { filePath, translatedPath })
        return { originalPath: filePath, translatedPath, original: content, translated }
      }),
    )
    logger.info('Translation completed successfully', {
      fileCount: results.length,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Translation failed'
    logger.error('Translation failed', {
      error: message,
      isTimeout: /timed out/i.test(message),
    })
    if (/timed out/i.test(message)) {
      return NextResponse.json({ error: message }, { status: 504 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }

  return NextResponse.json({ results })
}
