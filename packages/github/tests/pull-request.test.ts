import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildPRBody, createPullRequest } from '../src/pull-request'

const mockCreate = vi.fn()
vi.mock('octokit', () => ({
  Octokit: vi.fn().mockImplementation(() => ({
    rest: { pulls: { create: mockCreate } },
  })),
}))

describe('buildPRBody', () => {
  it('includes language in output', () => {
    const body = buildPRBody('zh', [{ original: 'README.md', translated: 'README.zh.md' }])
    expect(body).toContain('zh')
  })

  it('includes original and translated file paths in table rows', () => {
    const body = buildPRBody('zh', [{ original: 'README.md', translated: 'README.zh.md' }])
    expect(body).toContain('README.md')
    expect(body).toContain('README.zh.md')
  })

  it('includes DocBridge attribution footer', () => {
    const body = buildPRBody('zh', [])
    expect(body).toContain('DocBridge')
  })

  it('handles multiple files', () => {
    const body = buildPRBody('ja', [
      { original: 'README.md', translated: 'README.ja.md' },
      { original: 'docs/guide.md', translated: 'docs/guide.ja.md' },
    ])
    expect(body).toContain('docs/guide.md')
    expect(body).toContain('docs/guide.ja.md')
  })
})

describe('createPullRequest', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns PR number and URL', async () => {
    mockCreate.mockResolvedValue({ data: { number: 42, html_url: 'https://github.com/pr/42', title: 'My PR' } })
    const result = await createPullRequest('token', 'owner', 'repo', {
      title: 'My PR', body: 'body', head: 'fork:branch', base: 'main',
    })
    expect(result.number).toBe(42)
    expect(result.url).toBe('https://github.com/pr/42')
  })

  it('returns PR title', async () => {
    mockCreate.mockResolvedValue({ data: { number: 1, html_url: 'https://x', title: 'PR Title' } })
    const result = await createPullRequest('token', 'owner', 'repo', {
      title: 'PR Title', body: '', head: 'fork:branch', base: 'main',
    })
    expect(result.title).toBe('PR Title')
  })

  it('passes title, body, head, base to API', async () => {
    mockCreate.mockResolvedValue({ data: { number: 1, html_url: 'https://x', title: 't' } })
    await createPullRequest('token', 'owner', 'repo', {
      title: 'T', body: 'B', head: 'fork:br', base: 'main',
    })
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'T', body: 'B', head: 'fork:br', base: 'main' }),
    )
  })
})
