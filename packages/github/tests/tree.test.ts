import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getRepoTree } from '../src/tree'

const mockGetTree = vi.fn()
vi.mock('octokit', () => ({
  Octokit: vi.fn().mockImplementation(() => ({
    rest: { git: { getTree: mockGetTree } },
  })),
}))

describe('getRepoTree', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls git.getTree with recursive option', async () => {
    mockGetTree.mockResolvedValue({ data: { tree: [] } })
    await getRepoTree('token', 'owner', 'repo')
    expect(mockGetTree).toHaveBeenCalledWith(
      expect.objectContaining({ recursive: '1' }),
    )
  })

  it('passes owner and repo to API', async () => {
    mockGetTree.mockResolvedValue({ data: { tree: [] } })
    await getRepoTree('token', 'myowner', 'myrepo')
    expect(mockGetTree).toHaveBeenCalledWith(
      expect.objectContaining({ owner: 'myowner', repo: 'myrepo' }),
    )
  })

  it('defaults tree_sha to HEAD', async () => {
    mockGetTree.mockResolvedValue({ data: { tree: [] } })
    await getRepoTree('token', 'owner', 'repo')
    expect(mockGetTree).toHaveBeenCalledWith(
      expect.objectContaining({ tree_sha: 'HEAD' }),
    )
  })

  it('uses provided ref as tree_sha', async () => {
    mockGetTree.mockResolvedValue({ data: { tree: [] } })
    await getRepoTree('token', 'owner', 'repo', 'abc123')
    expect(mockGetTree).toHaveBeenCalledWith(
      expect.objectContaining({ tree_sha: 'abc123' }),
    )
  })

  it('returns only blob-type items', async () => {
    mockGetTree.mockResolvedValue({
      data: {
        tree: [
          { path: 'README.md', type: 'blob', sha: 'abc' },
          { path: 'src', type: 'tree', sha: 'def' },
        ],
      },
    })
    const items = await getRepoTree('token', 'owner', 'repo')
    expect(items).toHaveLength(1)
    expect(items[0].type).toBe('blob')
  })

  it('maps path and sha correctly', async () => {
    mockGetTree.mockResolvedValue({
      data: {
        tree: [{ path: 'docs/guide.md', type: 'blob', sha: 'sha123' }],
      },
    })
    const items = await getRepoTree('token', 'owner', 'repo')
    expect(items[0].path).toBe('docs/guide.md')
    expect(items[0].sha).toBe('sha123')
  })
})
