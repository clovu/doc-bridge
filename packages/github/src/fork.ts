import { Octokit } from 'octokit'

export async function forkRepo(
  token: string,
  owner: string,
  repo: string,
): Promise<{ owner: string; repo: string }> {
  const octokit = new Octokit({ auth: token })

  try {
    const { data } = await octokit.rest.repos.createFork({ owner, repo })
    return {
      owner: data.owner.login,
      repo: data.name,
    }
  } catch (error: unknown) {
    // If fork already exists (422), get the existing fork
    if (error && typeof error === 'object' && 'status' in error && error.status === 422) {
      const { data: user } = await octokit.rest.users.getAuthenticated()
      const { data: existingFork } = await octokit.rest.repos.get({
        owner: user.login,
        repo,
      })
      return {
        owner: existingFork.owner.login,
        repo: existingFork.name,
      }
    }
    throw error
  }
}
