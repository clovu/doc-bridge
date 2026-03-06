'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { TranslationEditor } from '@/components/translation-editor'
import { PlacementModal } from '@/components/placement-modal'
import type { PathSuggestion } from '@docbridge/core'

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

interface PlacementSuggestion {
  originalPath: string
  suggestion: PathSuggestion
}

export default function ReviewPage() {
  const router = useRouter()
  const [results, setResults] = useState<TranslationResult[]>([])
  const [meta, setMeta] = useState<TranslationMeta | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [editedTranslations, setEditedTranslations] = useState<Record<string, string>>({})
  const [showPlacementModal, setShowPlacementModal] = useState(false)
  const [placementSuggestions, setPlacementSuggestions] = useState<PlacementSuggestion[]>([])
  const [isCreatingPR, setIsCreatingPR] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('translationResults')
    const metaRaw = sessionStorage.getItem('translationMeta')
    if (!raw || !metaRaw) {
      router.push('/')
      return
    }
    const parsedResults = JSON.parse(raw) as TranslationResult[]
    const parsedMeta = JSON.parse(metaRaw) as TranslationMeta

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

    // Fetch placement suggestions and show modal
    setError(null)
    try {
      const response = await fetch('/api/placement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: meta.owner,
          repo: meta.repo,
          files: updatedResults.map(r => ({ originalPath: r.originalPath })),
          targetLocale: meta.targetLocale,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch placement suggestions')
      }

      const data = await response.json() as { suggestions: PlacementSuggestion[] }
      setPlacementSuggestions(data.suggestions)
      setShowPlacementModal(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  async function handlePlacementSubmit(selectedPaths: Record<string, string>) {
    if (!meta) return

    setIsCreatingPR(true)
    setError(null)

    try {
      const files = results.map(r => ({
        originalPath: r.originalPath,
        translatedPath: selectedPaths[r.originalPath] || r.translatedPath,
        content: editedTranslations[r.translatedPath] ?? r.translated,
      }))

      const response = await fetch('/api/pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: meta.owner,
          repo: meta.repo,
          defaultBranch: meta.defaultBranch ?? 'main',
          targetLocale: meta.targetLocale,
          files,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create PR' }))
        throw new Error(errorData.error || 'Failed to create PR')
      }

      const data = await response.json() as { pr: { url: string; number: number } }
      sessionStorage.setItem('prResult', JSON.stringify(data.pr))
      setShowPlacementModal(false)
      router.push(`/repos/${meta.owner}/${meta.repo}/pr`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsCreatingPR(false)
    }
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
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button onClick={handleSubmit}>
            Create Pull Request
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

      <PlacementModal
        open={showPlacementModal}
        onOpenChange={setShowPlacementModal}
        suggestions={placementSuggestions}
        onSubmit={handlePlacementSubmit}
        isSubmitting={isCreatingPR}
      />
    </main>
  )
}
