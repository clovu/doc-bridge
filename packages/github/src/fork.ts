import { Octokit } from 'octokit'

export async function forkRepo(
  token: string,
  owner: string,
  repo: string,
): Promise<{ owner: string; repo: string }> {
  const octokit = new Octokit({ auth: token })
  const { data } = await octokit.rest.repos.createFork({ owner, repo })
  return {
    owner: data.owner.login,
    repo: data.name,
  }
}
