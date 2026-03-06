import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getDirectoryStructure } from '../src/directory-structure'

const mockGetTree = vi.fn()
vi.mock('octokit', () => ({
  Octokit: vi.fn().mockImplementation(() => ({
    rest: { git: { getTree: mockGetTree } },
  })),
}))

describe('getDirectoryStructure', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should return all files and directories', async () => {
    mockGetTree.mockResolvedValue({
      data: {
        tree: [
          { path: 'README.md', type: 'blob', sha: 'abc' },
          { path: 'docs', type: 'tree', sha: 'def' },
          { path: 'docs/guide.md', type: 'blob', sha: 'ghi' },
        ],
      },
    })

    const result = await getDirectoryStructure('token', 'owner', 'repo')

    expect(result.files).toHaveLength(2)
    expect(result.directories).toHaveLength(1)
    expect(result.markdownFiles).toHaveLength(2)
  })

  it('should filter markdown files correctly', async () => {
    mockGetTree.mockResolvedValue({
      data: {
        tree: [
          { path: 'README.md', type: 'blob', sha: 'a' },
          { path: 'package.json', type: 'blob', sha: 'b' },
          { path: 'docs/guide.md', type: 'blob', sha: 'c' },
          { path: 'src/index.ts', type: 'blob', sha: 'd' },
        ],
      },
    })

    const result = await getDirectoryStructure('token', 'owner', 'repo')

    expect(result.markdownFiles).toHaveLength(2)
    expect(result.markdownFiles).toEqual(['README.md', 'docs/guide.md'])
  })

  it('should extract unique directories from file paths', async () => {
    mockGetTree.mockResolvedValue({
      data: {
        tree: [
          { path: 'docs/api/endpoints.md', type: 'blob', sha: 'a' },
          { path: 'docs/api/auth.md', type: 'blob', sha: 'b' },
          { path: 'docs/guide.md', type: 'blob', sha: 'c' },
          { path: 'README.md', type: 'blob', sha: 'd' },
        ],
      },
    })

    const result = await getDirectoryStructure('token', 'owner', 'repo')

    expect(result.directories).toContain('docs')
    expect(result.directories).toContain('docs/api')
    expect(result.directories.length).toBeGreaterThanOrEqual(2)
  })

  it('should handle empty repository', async () => {
    mockGetTree.mockResolvedValue({
      data: { tree: [] },
    })

    const result = await getDirectoryStructure('token', 'owner', 'repo')

    expect(result.files).toHaveLength(0)
    expect(result.directories).toHaveLength(0)
    expect(result.markdownFiles).toHaveLength(0)
  })

  it('should handle repository with no markdown files', async () => {
    mockGetTree.mockResolvedValue({
      data: {
        tree: [
          { path: 'package.json', type: 'blob', sha: 'a' },
          { path: 'src/index.ts', type: 'blob', sha: 'b' },
        ],
      },
    })

    const result = await getDirectoryStructure('token', 'owner', 'repo')

    expect(result.files).toHaveLength(2)
    expect(result.markdownFiles).toHaveLength(0)
  })

  it('should use provided ref parameter', async () => {
    mockGetTree.mockResolvedValue({
      data: { tree: [] },
    })

    await getDirectoryStructure('token', 'owner', 'repo', 'feature-branch')

    expect(mockGetTree).toHaveBeenCalledWith(
      expect.objectContaining({ tree_sha: 'feature-branch' }),
    )
  })

  it('should default to HEAD when no ref provided', async () => {
    mockGetTree.mockResolvedValue({
      data: { tree: [] },
    })

    await getDirectoryStructure('token', 'owner', 'repo')

    expect(mockGetTree).toHaveBeenCalledWith(
      expect.objectContaining({ tree_sha: 'HEAD' }),
    )
  })

  it('should handle nested directory structures', async () => {
    mockGetTree.mockResolvedValue({
      data: {
        tree: [
          { path: 'a/b/c/d/file.md', type: 'blob', sha: 'a' },
          { path: 'a/b/other.md', type: 'blob', sha: 'b' },
        ],
      },
    })

    const result = await getDirectoryStructure('token', 'owner', 'repo')

    expect(result.directories).toContain('a')
    expect(result.directories).toContain('a/b')
    expect(result.directories).toContain('a/b/c')
    expect(result.directories).toContain('a/b/c/d')
  })

  it('should handle files with .MD extension (uppercase)', async () => {
    mockGetTree.mockResolvedValue({
      data: {
        tree: [
          { path: 'README.MD', type: 'blob', sha: 'a' },
          { path: 'GUIDE.Md', type: 'blob', sha: 'b' },
        ],
      },
    })

    const result = await getDirectoryStructure('token', 'owner', 'repo')

    expect(result.markdownFiles).toHaveLength(2)
  })

  it('should handle missing path/type/sha gracefully', async () => {
    mockGetTree.mockResolvedValue({
      data: {
        tree: [
          { path: 'valid.md', type: 'blob', sha: 'a' },
          { type: 'blob', sha: 'b' },
          { path: 'no-sha.md', type: 'blob' },
        ],
      },
    })

    const result = await getDirectoryStructure('token', 'owner', 'repo')

    expect(result.files.length).toBeGreaterThanOrEqual(1)
    expect(result.markdownFiles).toContain('valid.md')
  })
})
