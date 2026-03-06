import { Octokit } from 'octokit'
import type { GitHubTreeItem } from './types'

export async function getRepoTree(
  token: string,
  owner: string,
  repo: string,
  ref = 'HEAD',
): Promise<GitHubTreeItem[]> {
  const octokit = new Octokit({ auth: token })
  const { data } = await octokit.rest.git.getTree({
    owner,
    repo,
    tree_sha: ref,
    recursive: '1',
  })

  return (data.tree as Array<{ path?: string; type?: string; sha?: string }>)
    .filter(item => item.type === 'blob')
    .map(item => ({
      path: item.path ?? '',
      type: 'blob' as const,
      sha: item.sha ?? '',
    }))
}
