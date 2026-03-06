'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { TranslationEditor } from '@/components/translation-editor'

interface TranslationResult {
  originalPath: string
  translatedPath: string
  original: string
  translated: string
}

interface TranslationMeta {
  owner: string
  repo: string
  targetLocale: string
  defaultBranch?: string
}

export default function ReviewPage() {
  const router = useRouter()
  const [results, setResults] = useState<TranslationResult[]>([])
  const [meta, setMeta] = useState<TranslationMeta | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [editedTranslations, setEditedTranslations] = useState<Record<string, string>>({})

  useEffect(() => {
    const raw = sessionStorage.getItem('translationResults')
    const metaRaw = sessionStorage.getItem('translationMeta')
    if (!raw || !metaRaw) {
      router.push('/')
      return
    }
    const parsedResults = JSON.parse(raw) as TranslationResult[]
    const parsedMeta = JSON.parse(metaRaw) as TranslationMeta
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResults(parsedResults)

    setMeta(parsedMeta)
    const initial: Record<string, string> = {}
    for (const r of parsedResults) {
      initial[r.translatedPath] = r.translated
    }

    setEditedTranslations(initial)
  }, [router])

  async function handleSubmit() {
    if (!meta) return

    // Save edited translations to sessionStorage
    const updatedResults = results.map(r => ({
      ...r,
      translated: editedTranslations[r.translatedPath] ?? r.translated,
    }))
    sessionStorage.setItem('translationResults', JSON.stringify(updatedResults))

    // Navigate to placement selection page
    router.push(`/repos/${meta.owner}/${meta.repo}/placement`)
  }

  if (results.length === 0) {
    return (
      <main className="h-screen flex items-center justify-center">
        <Spinner />
      </main>
    )
  }

  const current = results[activeIndex]

  return (
    <main className="min-h-screen flex flex-col">
      <div className="border-b px-4 py-3 flex items-center gap-4">
        <h1 className="font-semibold">Review Translation</h1>
        <div className="flex gap-2 ml-4">
          {results.map((r, i) => (
            <button
              key={r.translatedPath}
              onClick={() => setActiveIndex(i)}
              className={`text-sm px-3 py-1 rounded-full border ${i === activeIndex ? 'bg-primary text-primary-foreground border-transparent' : 'border-border'}`}
            >
              {r.originalPath.split('/').at(-1)}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Button onClick={handleSubmit}>
            Continue to Placement
          </Button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-2 divide-x">
        <TranslationEditor
          label="Original"
          value={current.original}
          readOnly
        />
        <TranslationEditor
          label="Translated"
          value={editedTranslations[current.translatedPath] ?? current.translated}
          onChange={(v) => setEditedTranslations(prev => ({ ...prev, [current.translatedPath]: v }))}
        />
      </div>
    </main>
  )
}
