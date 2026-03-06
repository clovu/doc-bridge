'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import type { GitHubRepo } from '@docbridge/github'

interface Props {
  repos: GitHubRepo[]
}

export function RepoList({ repos }: Props) {
  const [query, setQuery] = useState('')

  const filtered = repos.filter(
    r =>
      r.name.toLowerCase().includes(query.toLowerCase()) ||
      (r.description ?? '').toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search repositories..."
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      {filtered.length === 0 && (
        <p className="text-muted-foreground text-sm text-center py-8">No repositories found.</p>
      )}
      <ul className="space-y-2">
        {filtered.map(repo => (
          <li
            key={repo.id}
            className="flex items-center justify-between p-4 rounded-xl border border-border bg-card"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{repo.name}</span>
                {repo.private && (
                  <span className="text-xs border border-border rounded px-1.5 py-0.5 text-muted-foreground">
                    Private
                  </span>
                )}
              </div>
              {repo.description && (
                <p className="text-sm text-muted-foreground truncate mt-0.5">{repo.description}</p>
              )}
            </div>
            <Link
              href={`/repos/${repo.owner}/${repo.name}/scan`}
              className="ml-4 shrink-0 text-sm font-medium underline-offset-4 hover:underline"
            >
              Select
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
