import { describe, it, expect, vi, beforeEach } from 'vitest'
import { forkRepo } from '../src/fork'

const mockCreateFork = vi.fn()
const mockGetRepo = vi.fn()
const mockGetAuthenticated = vi.fn()
vi.mock('octokit', () => ({
  Octokit: vi.fn().mockImplementation(() => ({
    rest: {
      repos: { createFork: mockCreateFork, get: mockGetRepo },
      users: { getAuthenticated: mockGetAuthenticated },
    },
  })),
}))

describe('forkRepo - existing fork handling', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns existing fork when createFork fails with 422', async () => {
    const existingFork = { owner: { login: 'me' }, name: 'repo' }
    mockCreateFork.mockRejectedValue({ status: 422 })
    mockGetAuthenticated.mockResolvedValue({ data: { login: 'me' } })
    mockGetRepo.mockResolvedValue({ data: existingFork })

    const result = await forkRepo('token', 'upstream', 'repo')

    expect(result.owner).toBe('me')
    expect(result.repo).toBe('repo')
  })

  it('throws error when createFork fails with non-422 status', async () => {
    mockCreateFork.mockRejectedValue({ status: 500, message: 'Server error' })

    await expect(forkRepo('token', 'upstream', 'repo')).rejects.toThrow()
  })
})
