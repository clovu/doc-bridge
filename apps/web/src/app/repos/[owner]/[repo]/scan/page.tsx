import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getRepoTree } from '@docbridge/github'
import { scanMarkdownFiles } from '@docbridge/core'
import { FileSelector } from '@/components/file-selector'

interface Props {
  params: Promise<{ owner: string; repo: string }>
}

export default async function ScanPage({ params }: Props) {
  const { owner, repo } = await params
  const store = await cookies()
  const token = store.get('gh_token')?.value
  if (!token) redirect('/')

  const tree = await getRepoTree(token, owner, repo)
  const markdownFiles = scanMarkdownFiles(tree.map(item => item.path))

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">{owner}/{repo}</p>
          <h1 className="text-2xl font-semibold mt-1">Select Files to Translate</h1>
        </div>
        {markdownFiles.length === 0 ? (
          <p className="text-muted-foreground">No markdown files found in this repository.</p>
        ) : (
          <FileSelector
            files={markdownFiles}
            owner={owner}
            repo={repo}
          />
        )}
      </div>
    </main>
  )
}
