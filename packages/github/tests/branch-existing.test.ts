import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createBranch } from '../src/branch'

const mockCreateRef = vi.fn()
const mockGetRef = vi.fn()
const mockUpdateRef = vi.fn()
vi.mock('octokit', () => ({
  Octokit: vi.fn().mockImplementation(() => ({
    rest: {
      git: {
        createRef: mockCreateRef,
        getRef: mockGetRef,
        updateRef: mockUpdateRef,
      },
    },
  })),
}))

describe('createBranch - existing branch handling', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates existing branch when createRef fails with 422', async () => {
    mockCreateRef.mockRejectedValue({ status: 422 })
    mockUpdateRef.mockResolvedValue({ data: {} })

    await createBranch('token', 'owner', 'repo', 'existing-branch', 'new-sha')

    expect(mockUpdateRef).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: 'owner',
        repo: 'repo',
        ref: 'heads/existing-branch',
        sha: 'new-sha',
        force: true,
      }),
    )
  })

  it('throws error when createRef fails with non-422 status', async () => {
    mockCreateRef.mockRejectedValue({ status: 500, message: 'Server error' })

    await expect(
      createBranch('token', 'owner', 'repo', 'branch', 'sha'),
    ).rejects.toThrow()
  })
})
