import { type NextRequest, NextResponse } from 'next/server'
import { getDirectoryStructure } from '@docbridge/github'
import {
  detectMultiLangPattern,
  buildDirectoryTree,
  suggestPlacement,
  type DirectoryNode,
  type PathSuggestion,
} from '@docbridge/core'

interface PlacementRequestBody {
  owner: string
  repo: string
  files: Array<{ originalPath: string }>
  targetLocale: string
  ref?: string
}

interface PlacementSuggestion {
  originalPath: string
  suggestion: PathSuggestion
}

interface PlacementResponse {
  tree: DirectoryNode
  suggestions: PlacementSuggestion[]
  allFiles: string[]
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get('gh_token')?.value
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json() as PlacementRequestBody
    const { owner, repo, files, targetLocale, ref } = body

    // Validate input
    if (!owner || !repo || !files || files.length === 0 || !targetLocale) {
      return NextResponse.json(
        { error: 'Missing required fields: owner, repo, files, targetLocale' },
        { status: 400 },
      )
    }

    // 1. Fetch repository directory structure
    const structure = await getDirectoryStructure(token, owner, repo, ref)

    // 2. Build directory tree for UI
    const tree = buildDirectoryTree(structure.files)

    // 3. Detect multi-language pattern
    const pattern = detectMultiLangPattern(structure.markdownFiles)

    // 4. Generate placement suggestions for each file
    const suggestions: PlacementSuggestion[] = files.map(file => {
      const suggestion = suggestPlacement(
        file.originalPath,
        targetLocale,
        pattern,
        tree,
        structure.markdownFiles,
      )

      return {
        originalPath: file.originalPath,
        suggestion,
      }
    })

    return NextResponse.json({
      tree,
      suggestions,
      allFiles: structure.files,
    } as PlacementResponse)
  } catch (error: unknown) {
    console.error('Placement suggestion failed:', error)
    const message = error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
      ? error.message
      : 'Failed to generate placement suggestions'
    const status = error && typeof error === 'object' && 'status' in error && typeof error.status === 'number'
      ? error.status
      : 500
    return NextResponse.json({ error: message }, { status })
  }
}
