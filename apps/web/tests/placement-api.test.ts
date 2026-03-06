import { describe, it, expect } from 'vitest'
import { POST } from '../src/app/api/placement/route'
import { NextRequest } from 'next/server'

describe('Placement API', () => {
  it('should return 401 when no token provided', async () => {
    const request = new NextRequest('http://localhost:3000/api/placement', {
      method: 'POST',
      body: JSON.stringify({
        owner: 'test',
        repo: 'test',
        files: [{ originalPath: 'README.md' }],
        targetLocale: 'zh',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return 400 when missing required fields', async () => {
    const request = new NextRequest('http://localhost:3000/api/placement', {
      method: 'POST',
      headers: {
        Cookie: 'gh_token=test_token',
      },
      body: JSON.stringify({
        owner: 'test',
        repo: 'test',
      }),
    })

    // Mock the cookie
    Object.defineProperty(request, 'cookies', {
      value: {
        get: (name: string) => name === 'gh_token' ? { value: 'test_token' } : undefined,
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Missing required fields')
  })
})
