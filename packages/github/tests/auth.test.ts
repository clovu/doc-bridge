import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getAuthenticatedUser } from '../src/auth'

const mockGetAuthenticated = vi.fn()
vi.mock('octokit', () => ({
  Octokit: vi.fn().mockImplementation(() => ({
    rest: { users: { getAuthenticated: mockGetAuthenticated } },
  })),
}))

describe('getAuthenticatedUser', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns login from response', async () => {
    mockGetAuthenticated.mockResolvedValue({
      data: { login: 'octocat', name: 'The Octocat', avatar_url: 'https://example.com/avatar.png' },
    })
    const user = await getAuthenticatedUser('token')
    expect(user.login).toBe('octocat')
  })

  it('maps name from response', async () => {
    mockGetAuthenticated.mockResolvedValue({
      data: { login: 'octocat', name: 'The Octocat', avatar_url: 'https://example.com/avatar.png' },
    })
    const user = await getAuthenticatedUser('token')
    expect(user.name).toBe('The Octocat')
  })

  it('allows null name', async () => {
    mockGetAuthenticated.mockResolvedValue({
      data: { login: 'octocat', name: null, avatar_url: 'https://example.com/avatar.png' },
    })
    const user = await getAuthenticatedUser('token')
    expect(user.name).toBeNull()
  })

  it('maps avatar_url to avatarUrl', async () => {
    mockGetAuthenticated.mockResolvedValue({
      data: { login: 'octocat', name: null, avatar_url: 'https://example.com/avatar.png' },
    })
    const user = await getAuthenticatedUser('token')
    expect(user.avatarUrl).toBe('https://example.com/avatar.png')
  })

  it('throws when API call fails', async () => {
    mockGetAuthenticated.mockRejectedValue(new Error('API error'))
    await expect(getAuthenticatedUser('token')).rejects.toThrow('API error')
  })
})
