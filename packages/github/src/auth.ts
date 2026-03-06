import { Octokit } from 'octokit'
import type { GitHubUser } from './types'

export async function getAuthenticatedUser(token: string): Promise<GitHubUser> {
  const octokit = new Octokit({ auth: token })
  const { data } = await octokit.rest.users.getAuthenticated()
  return {
    login: data.login,
    name: data.name ?? null,
    avatarUrl: data.avatar_url,
  }
}
