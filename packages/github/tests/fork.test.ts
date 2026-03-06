import { describe, it, expect, vi, beforeEach } from 'vitest'
import { forkRepo } from '../src/fork'

const mockCreateFork = vi.fn()
const mockGetRepo = vi.fn()
vi.mock('octokit', () => ({
  Octokit: vi.fn().mockImplementation(() => ({
    rest: {
      repos: { createFork: mockCreateFork, get: mockGetRepo },
    },
  })),
}))

describe('forkRepo', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls repos.createFork with owner and repo', async () => {
    mockCreateFork.mockResolvedValue({ data: { owner: { login: 'me' }, name: 'repo' } })
    mockGetRepo.mockResolvedValue({ data: { owner: { login: 'me' }, name: 'repo' } })
    await forkRepo('token', 'upstream', 'repo')
    expect(mockCreateFork).toHaveBeenCalledWith(
      expect.objectContaining({ owner: 'upstream', repo: 'repo' }),
    )
  })

  it('returns the forked owner login and repo name', async () => {
    mockCreateFork.mockResolvedValue({ data: { owner: { login: 'me' }, name: 'my-fork' } })
    mockGetRepo.mockResolvedValue({ data: { owner: { login: 'me' }, name: 'my-fork' } })
    const result = await forkRepo('token', 'upstream', 'repo')
    expect(result.owner).toBe('me')
    expect(result.repo).toBe('my-fork')
  })
})
