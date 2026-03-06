'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface PRResult {
  number: number
  url: string
}

export default function PRPage() {
  const [pr] = useState<PRResult | null>(() => {
    const raw = sessionStorage.getItem('prResult')
    return raw ? (JSON.parse(raw) as PRResult) : null
  })

  if (!pr) {
    return (
      <main className="h-screen flex items-center justify-center">
        <p className="text-muted-foreground">No pull request data found.</p>
      </main>
    )
  }

  return (
    <main className="h-screen flex flex-col items-center justify-center gap-6 text-center px-4">
      <span className="icon-[carbon--checkmark-filled] size-16 text-green-500" />
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Pull Request Created!</h1>
        <p className="text-muted-foreground">PR #{pr.number} has been opened for review.</p>
      </div>
      <div className="flex gap-3">
        <Button asChild>
          <a href={pr.url} target="_blank" rel="noopener noreferrer">
            View Pull Request
          </a>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/repos">Back to Repositories</Link>
        </Button>
      </div>
    </main>
  )
}
