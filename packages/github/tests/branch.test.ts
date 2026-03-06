import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getDefaultBranchSha, createBranch } from '../src/branch'

const mockGetRef = vi.fn()
const mockCreateRef = vi.fn()
vi.mock('octokit', () => ({
  Octokit: vi.fn().mockImplementation(() => ({
    rest: { git: { getRef: mockGetRef, createRef: mockCreateRef } },
  })),
}))

describe('getDefaultBranchSha', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns SHA from ref object', async () => {
    mockGetRef.mockResolvedValue({ data: { object: { sha: 'abc123' } } })
    const sha = await getDefaultBranchSha('token', 'owner', 'repo', 'main')
    expect(sha).toBe('abc123')
  })
})

describe('createBranch', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls git.createRef with refs/heads/ prefix', async () => {
    mockCreateRef.mockResolvedValue({})
    await createBranch('token', 'owner', 'repo', 'my-branch', 'sha123')
    expect(mockCreateRef).toHaveBeenCalledWith(
      expect.objectContaining({ ref: 'refs/heads/my-branch' }),
    )
  })

  it('passes sha as the ref target', async () => {
    mockCreateRef.mockResolvedValue({})
    await createBranch('token', 'owner', 'repo', 'my-branch', 'sha123')
    expect(mockCreateRef).toHaveBeenCalledWith(
      expect.objectContaining({ sha: 'sha123' }),
    )
  })
})
