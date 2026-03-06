import { describe, it, expect, vi, beforeEach } from 'vitest'
import { listUserRepos } from '../src/repos'

const mockPaginate = vi.fn()
vi.mock('octokit', () => ({
  Octokit: vi.fn().mockImplementation(() => ({
    paginate: mockPaginate,
    rest: { repos: { listForAuthenticatedUser: vi.fn() } },
  })),
}))

const makeRepo = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  name: 'my-repo',
  full_name: 'octocat/my-repo',
  owner: { login: 'octocat' },
  private: false,
  description: 'A test repo',
  default_branch: 'main',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

describe('listUserRepos', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns repos mapped from API response', async () => {
    mockPaginate.mockResolvedValue([makeRepo()])
    const repos = await listUserRepos('token')
    expect(repos).toHaveLength(1)
    expect(repos[0].name).toBe('my-repo')
  })

  it('maps full_name to fullName', async () => {
    mockPaginate.mockResolvedValue([makeRepo()])
    const repos = await listUserRepos('token')
    expect(repos[0].fullName).toBe('octocat/my-repo')
  })

  it('maps owner.login to owner', async () => {
    mockPaginate.mockResolvedValue([makeRepo()])
    const repos = await listUserRepos('token')
    expect(repos[0].owner).toBe('octocat')
  })

  it('maps default_branch to defaultBranch', async () => {
    mockPaginate.mockResolvedValue([makeRepo()])
    const repos = await listUserRepos('token')
    expect(repos[0].defaultBranch).toBe('main')
  })

  it('maps private field', async () => {
    mockPaginate.mockResolvedValue([makeRepo({ private: true })])
    const repos = await listUserRepos('token')
    expect(repos[0].private).toBe(true)
  })

  it('sorts by updatedAt descending', async () => {
    mockPaginate.mockResolvedValue([
      makeRepo({ id: 1, name: 'older', updated_at: '2024-01-01T00:00:00Z' }),
      makeRepo({ id: 2, name: 'newer', updated_at: '2024-06-01T00:00:00Z' }),
    ])
    const repos = await listUserRepos('token')
    expect(repos[0].name).toBe('newer')
    expect(repos[1].name).toBe('older')
  })

  it('returns empty array when no repos', async () => {
    mockPaginate.mockResolvedValue([])
    const repos = await listUserRepos('token')
    expect(repos).toEqual([])
  })
})
