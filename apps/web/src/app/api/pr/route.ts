import { type NextRequest, NextResponse } from 'next/server'
import {
  getAuthenticatedUser,
  forkRepo,
  getDefaultBranchSha,
  createBranch,
  createOrUpdateFile,
  createPullRequest,
  buildPRBody,
} from '@docbridge/github'

interface PRFile {
  originalPath: string
  translatedPath: string
  content: string
}

interface PRBody {
  owner: string
  repo: string
  defaultBranch: string
  targetLocale: string
  files: PRFile[]
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get('gh_token')?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as PRBody
  const { owner, repo, defaultBranch, targetLocale, files } = body

  // 1. Get authenticated user
  const user = await getAuthenticatedUser(token)

  // 2. Fork the repository
  const fork = await forkRepo(token, owner, repo)

  // 3. Get the default branch SHA on the fork
  const sha = await getDefaultBranchSha(token, fork.owner, fork.repo, defaultBranch)

  // 4. Create translation branch
  const branchName = `docbridge/translate-en-${targetLocale}`
  await createBranch(token, fork.owner, fork.repo, branchName, sha)

  // 5. Commit each translated file
  for (const file of files) {
    const commitMessage = `docs: add ${targetLocale} translation of ${file.originalPath}`
    await createOrUpdateFile(
      token,
      fork.owner,
      fork.repo,
      file.translatedPath,
      file.content,
      commitMessage,
      branchName,
    )
  }

  // 6. Create pull request
  const prBody = buildPRBody(
    targetLocale,
    files.map(f => ({ original: f.originalPath, translated: f.translatedPath })),
  )

  const pr = await createPullRequest(token, owner, repo, {
    title: `[DocBridge] Add ${targetLocale} translations`,
    body: prBody,
    head: `${fork.owner}:${branchName}`,
    base: defaultBranch,
  })

  return NextResponse.json({ pr, author: user.login })
}
