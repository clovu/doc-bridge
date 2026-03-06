'use client'

import { useRouter, useSearchParams, useParams } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { LanguageSelector } from '@/components/language-selector'

const SUPPORTED_LANGUAGES = [
  { code: 'zh', label: 'Chinese (Simplified)' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ru', label: 'Russian' },
  { code: 'ar', label: 'Arabic' },
  { code: 'hi', label: 'Hindi' },
]

export default function TranslatePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { owner, repo } = useParams<{ owner: string; repo: string }>()
  const files = searchParams.getAll('file')
  const [targetLocale, setTargetLocale] = useState('')
  const [isTranslating, setIsTranslating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleTranslate() {
    if (!targetLocale || files.length === 0) return

    setIsTranslating(true)
    setError(null)

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo, files, targetLocale }),
      })

      if (!response.ok) throw new Error('Translation failed')

      const data = await response.json() as { results: unknown[] }

      sessionStorage.setItem('translationResults', JSON.stringify(data.results))
      sessionStorage.setItem('translationMeta', JSON.stringify({ owner, repo, targetLocale }))

      router.push(`/repos/${owner}/${repo}/review`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setIsTranslating(false)
    }
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold mb-6">Translation Settings</h1>

        <div className="space-y-6">
          <div>
            <p className="text-sm font-medium mb-2">Selected files ({files.length})</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {files.map(f => <li key={f}>{f}</li>)}
            </ul>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Target language</p>
            <LanguageSelector
              languages={SUPPORTED_LANGUAGES}
              value={targetLocale}
              onChange={setTargetLocale}
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <Button
            onClick={handleTranslate}
            disabled={!targetLocale || isTranslating}
          >
            {isTranslating ? (
              <><Spinner className="mr-2" /> Translating...</>
            ) : (
              'Translate'
            )}
          </Button>
        </div>
      </div>
    </main>
  )
}
