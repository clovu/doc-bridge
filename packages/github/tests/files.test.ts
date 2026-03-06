import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getFileContent, createOrUpdateFile } from '../src/files'

const mockGetContent = vi.fn()
const mockCreateOrUpdateFileContents = vi.fn()
vi.mock('octokit', () => ({
  Octokit: vi.fn().mockImplementation(() => ({
    rest: {
      repos: {
        getContent: mockGetContent,
        createOrUpdateFileContents: mockCreateOrUpdateFileContents,
      },
    },
  })),
}))

describe('getFileContent', () => {
  beforeEach(() => vi.clearAllMocks())

  it('decodes base64 content to utf-8 string', async () => {
    const encoded = Buffer.from('Hello World').toString('base64')
    mockGetContent.mockResolvedValue({ data: { content: encoded, sha: 'abc', encoding: 'base64' } })
    const { content } = await getFileContent('token', 'owner', 'repo', 'README.md')
    expect(content).toBe('Hello World')
  })

  it('returns sha of the file', async () => {
    const encoded = Buffer.from('text').toString('base64')
    mockGetContent.mockResolvedValue({ data: { content: encoded, sha: 'file-sha', encoding: 'base64' } })
    const { sha } = await getFileContent('token', 'owner', 'repo', 'file.md')
    expect(sha).toBe('file-sha')
  })

  it('passes ref when provided', async () => {
    const encoded = Buffer.from('text').toString('base64')
    mockGetContent.mockResolvedValue({ data: { content: encoded, sha: 'sha', encoding: 'base64' } })
    await getFileContent('token', 'owner', 'repo', 'file.md', 'my-branch')
    expect(mockGetContent).toHaveBeenCalledWith(
      expect.objectContaining({ ref: 'my-branch' }),
    )
  })
})

describe('createOrUpdateFile', () => {
  beforeEach(() => vi.clearAllMocks())

  it('base64 encodes the content string', async () => {
    mockCreateOrUpdateFileContents.mockResolvedValue({})
    await createOrUpdateFile('token', 'owner', 'repo', 'file.md', 'Hello', 'msg', 'branch')
    const call = mockCreateOrUpdateFileContents.mock.calls[0][0] as Record<string, unknown>
    expect(call.content).toBe(Buffer.from('Hello').toString('base64'))
  })

  it('passes branch to the API', async () => {
    mockCreateOrUpdateFileContents.mockResolvedValue({})
    await createOrUpdateFile('token', 'owner', 'repo', 'file.md', 'text', 'msg', 'my-branch')
    expect(mockCreateOrUpdateFileContents).toHaveBeenCalledWith(
      expect.objectContaining({ branch: 'my-branch' }),
    )
  })

  it('passes sha when updating existing file', async () => {
    mockCreateOrUpdateFileContents.mockResolvedValue({})
    await createOrUpdateFile('token', 'owner', 'repo', 'file.md', 'text', 'msg', 'branch', 'existing-sha')
    expect(mockCreateOrUpdateFileContents).toHaveBeenCalledWith(
      expect.objectContaining({ sha: 'existing-sha' }),
    )
  })

  it('omits sha when creating new file', async () => {
    mockCreateOrUpdateFileContents.mockResolvedValue({})
    await createOrUpdateFile('token', 'owner', 'repo', 'file.md', 'text', 'msg', 'branch')
    const call = mockCreateOrUpdateFileContents.mock.calls[0][0] as Record<string, unknown>
    expect(call.sha).toBeUndefined()
  })

  it('uses provided commit message', async () => {
    mockCreateOrUpdateFileContents.mockResolvedValue({})
    await createOrUpdateFile('token', 'owner', 'repo', 'file.md', 'text', 'my commit msg', 'branch')
    expect(mockCreateOrUpdateFileContents).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'my commit msg' }),
    )
  })
})
