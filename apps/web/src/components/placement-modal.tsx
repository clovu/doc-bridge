'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import type { PathSuggestion } from '@docbridge/core'

interface PlacementSuggestion {
  originalPath: string
  suggestion: PathSuggestion
}

interface PlacementModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  suggestions: PlacementSuggestion[]
  onSubmit: (selectedPaths: Record<string, string>) => Promise<void>
  isSubmitting: boolean
}

export function PlacementModal({
  open,
  onOpenChange,
  suggestions,
  onSubmit,
  isSubmitting,
}: PlacementModalProps) {
  // Initialize with AI suggestions
  const initialPaths = suggestions.reduce((acc, s) => {
    acc[s.originalPath] = s.suggestion.targetPath
    return acc
  }, {} as Record<string, string>)

  const [selectedPaths, setSelectedPaths] = useState<Record<string, string>>(initialPaths)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [expandedAlternatives, setExpandedAlternatives] = useState<Record<string, boolean>>({})

  // Update selected paths when suggestions change
  useEffect(() => {
    const initial: Record<string, string> = {}
    for (const s of suggestions) {
      initial[s.originalPath] = s.suggestion.targetPath
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedPaths(initial)
  }, [suggestions])

  function validatePath(path: string): string | null {
    if (!path || path.trim() === '') {
      return 'Path cannot be empty'
    }

    if (path.includes('..') || path.includes('//')) {
      return 'Invalid path: contains illegal characters'
    }

    return null
  }

  function handlePathChange(originalPath: string, newPath: string) {
    setSelectedPaths(prev => ({ ...prev, [originalPath]: newPath }))

    const error = validatePath(newPath)
    if (error) {
      setErrors(prev => ({ ...prev, [originalPath]: error }))
    } else {
      setErrors(prev => {
        const updated = { ...prev }
        delete updated[originalPath]
        return updated
      })
    }
  }

  function toggleAlternatives(originalPath: string) {
    setExpandedAlternatives(prev => ({
      ...prev,
      [originalPath]: !prev[originalPath],
    }))
  }

  function selectAlternative(originalPath: string, alternativePath: string) {
    handlePathChange(originalPath, alternativePath)
  }

  async function handleSubmit() {
    await onSubmit(selectedPaths)
  }

  const hasErrors = Object.keys(errors).length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Translation Placement</DialogTitle>
          <DialogDescription>
            Review the AI-suggested placement for your translated files. You can customize the path for each file if needed.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {suggestions.map((s) => (
            <Card key={s.originalPath} className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{s.originalPath}</span>
                  <Badge
                    variant={
                      s.suggestion.confidence === 'high'
                        ? 'default'
                        : s.suggestion.confidence === 'medium'
                          ? 'secondary'
                          : 'outline'
                    }
                  >
                    {s.suggestion.confidence} confidence
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Suggested path:</span>
                    <Input
                      value={selectedPaths[s.originalPath] || ''}
                      onChange={(e) => handlePathChange(s.originalPath, e.target.value)}
                      className="mt-1 font-mono text-xs"
                    />
                    {errors[s.originalPath] && (
                      <p className="text-xs text-destructive mt-1">
                        {errors[s.originalPath]}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {s.suggestion.reason}
                    </p>
                  </div>

                  {s.suggestion.alternatives.length > 0 && (
                    <div className="text-sm">
                      <button
                        onClick={() => toggleAlternatives(s.originalPath)}
                        className="text-muted-foreground hover:text-foreground cursor-pointer text-xs"
                      >
                        Show {s.suggestion.alternatives.length} alternative
                        {s.suggestion.alternatives.length > 1 ? 's' : ''}
                      </button>

                      {expandedAlternatives[s.originalPath] && (
                        <div className="mt-2 space-y-1">
                          {s.suggestion.alternatives.map((alt) => (
                            <button
                              key={alt}
                              onClick={() => selectAlternative(s.originalPath, alt)}
                              className={`block w-full text-left p-2 rounded font-mono text-xs hover:bg-muted ${
                                selectedPaths[s.originalPath] === alt
                                  ? 'bg-primary/10 border border-primary'
                                  : 'bg-muted/50'
                              }`}
                            >
                              {alt}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Back
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || hasErrors}>
            {isSubmitting ? (
              <>
                <Spinner className="mr-2" /> Creating PR...
              </>
            ) : (
              'Create Pull Request'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
