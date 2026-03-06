import { type NextRequest, NextResponse } from 'next/server'
import { getFileContent } from '@docbridge/github'
import { translateDocument } from '@docbridge/core'
import { ClaudeTranslationProvider } from '@docbridge/ai'
import { translateFilename } from '@/lib/translate-filename'

interface TranslateBody {
  owner: string
  repo: string
  files: string[]
  targetLocale: string
  sourceLocale?: string
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get('gh_token')?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as TranslateBody
  const { owner, repo, files, targetLocale, sourceLocale = 'en' } = body

  const provider = new ClaudeTranslationProvider(process.env.ANTHROPIC_API_KEY!)

  const results = await Promise.all(
    files.map(async (filePath) => {
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
      return { originalPath: filePath, translatedPath, original: content, translated }
    }),
  )

  return NextResponse.json({ results })
}
