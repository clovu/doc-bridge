'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface Props {
  files: string[]
  owner: string
  repo: string
}

export function FileSelector({ files, owner, repo }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())

  function toggle(file: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(file)) next.delete(file)
      else next.add(file)
      return next
    })
  }

  function selectAll() {
    setSelected(new Set(files))
  }

  function deselectAll() {
    setSelected(new Set())
  }

  function handleContinue() {
    const params = new URLSearchParams()
    for (const f of selected) params.append('file', f)
    router.push(`/repos/${owner}/${repo}/translate?${params.toString()}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={selectAll} className="text-sm underline-offset-4 hover:underline text-muted-foreground">
          Select all
        </button>
        <span className="text-muted-foreground">·</span>
        <button onClick={deselectAll} className="text-sm underline-offset-4 hover:underline text-muted-foreground">
          Deselect all
        </button>
      </div>

      <ul className="space-y-1 border border-border rounded-xl overflow-hidden">
        {files.map(file => (
          <li key={file}>
            <label className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50">
              <input
                type="checkbox"
                checked={selected.has(file)}
                onChange={() => toggle(file)}
                className="rounded"
              />
              <span className="text-sm font-mono">{file}</span>
            </label>
          </li>
        ))}
      </ul>

      <Button
        onClick={handleContinue}
        disabled={selected.size === 0}
      >
        Continue ({selected.size} file{selected.size !== 1 ? 's' : ''})
      </Button>
    </div>
  )
}
