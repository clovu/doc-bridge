import { Octokit } from 'octokit'
import type { GitHubRepo } from './types'

interface RawRepo {
  id: number
  name: string
  full_name: string
  owner: { login: string }
  private: boolean
  description: string | null
  default_branch: string
  updated_at: string | null
}

export async function listUserRepos(token: string): Promise<GitHubRepo[]> {
  const octokit = new Octokit({ auth: token })
  const raw = await octokit.paginate(octokit.rest.repos.listForAuthenticatedUser, {
    per_page: 100,
    sort: 'updated',
  }) as RawRepo[]

  return raw
    .map(r => ({
      id: r.id,
      name: r.name,
      fullName: r.full_name,
      owner: r.owner.login,
      private: r.private,
      description: r.description,
      defaultBranch: r.default_branch,
      updatedAt: r.updated_at,
    }))
    .sort((a, b) => {
      if (!a.updatedAt) return 1
      if (!b.updatedAt) return -1
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
}
