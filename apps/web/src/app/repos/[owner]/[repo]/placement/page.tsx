'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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

export default function PlacementPage() {
  const router = useRouter()
  const [results, setResults] = useState<TranslationResult[]>([])
  const [meta, setMeta] = useState<TranslationMeta | null>(null)
  const [suggestions, setSuggestions] = useState<PlacementSuggestion[]>([])
  const [selectedPaths, setSelectedPaths] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
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

      // Fetch placement suggestions
      try {
        const response = await fetch('/api/placement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            owner: parsedMeta.owner,
            repo: parsedMeta.repo,
            files: parsedResults.map(r => ({ originalPath: r.originalPath })),
            targetLocale: parsedMeta.targetLocale,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to fetch placement suggestions')
        }

        const data = await response.json() as {
          suggestions: PlacementSuggestion[]
        }

        setSuggestions(data.suggestions)

        // Initialize selected paths with AI suggestions
        const initial: Record<string, string> = {}
        for (const s of data.suggestions) {
          initial[s.originalPath] = s.suggestion.targetPath
        }
        setSelectedPaths(initial)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [router])

  async function handleSubmit() {
    if (!meta) return
    setIsSubmitting(true)
    setError(null)

    try {
      // Update translation results with selected paths
      const files = results.map(r => ({
        originalPath: r.originalPath,
        translatedPath: selectedPaths[r.originalPath] || r.translatedPath,
        content: r.translated,
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
      router.push(`/repos/${meta.owner}/${meta.repo}/pr`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <main className="h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Spinner className="mx-auto" />
          <div>
            <p className="font-medium">Analyzing repository structure...</p>
            <p className="text-sm text-muted-foreground mt-1">
              AI is suggesting optimal placement for your translated files
            </p>
          </div>
        </div>
      </main>
    )
  }

  if (error && !suggestions.length) {
    return (
      <main className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col">
      <div className="border-b px-4 py-3 flex items-center gap-4">
        <h1 className="font-semibold">Select Translation Placement</h1>
        <div className="ml-auto flex items-center gap-3">
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button variant="outline" onClick={() => router.back()}>
            Back
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <><Spinner className="mr-2" /> Creating PR...</> : 'Create Pull Request'}
          </Button>
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="text-sm text-muted-foreground mb-6">
            Review the AI-suggested placement for your translated files. You can customize the path for each file if needed.
          </div>

          {suggestions.map((s) => {
            const result = results.find(r => r.originalPath === s.originalPath)
            if (!result) return null

            return (
              <Card key={s.originalPath} className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium">{s.originalPath}</span>
                      <Badge variant={
                        s.suggestion.confidence === 'high' ? 'default' :
                          s.suggestion.confidence === 'medium' ? 'secondary' : 'outline'
                      }>
                        {s.suggestion.confidence} confidence
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Suggested path:</span>
                        <div className="mt-1 p-2 bg-muted rounded font-mono text-xs">
                          {s.suggestion.targetPath}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {s.suggestion.reason}
                        </p>
                      </div>

                      {s.suggestion.alternatives.length > 0 && (
                        <details className="text-sm">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            Show {s.suggestion.alternatives.length} alternative{s.suggestion.alternatives.length > 1 ? 's' : ''}
                          </summary>
                          <div className="mt-2 space-y-1">
                            {s.suggestion.alternatives.map(alt => (
                              <button
                                key={alt}
                                onClick={() => setSelectedPaths(prev => ({ ...prev, [s.originalPath]: alt }))}
                                className={`block w-full text-left p-2 rounded font-mono text-xs hover:bg-muted ${selectedPaths[s.originalPath] === alt ? 'bg-primary/10 border border-primary' : 'bg-muted/50'
                                }`}
                              >
                                {alt}
                              </button>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </main>
  )
}
