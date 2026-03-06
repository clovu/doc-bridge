import { Octokit } from 'octokit'

export async function getDefaultBranchSha(
  token: string,
  owner: string,
  repo: string,
  branch: string,
): Promise<string> {
  const octokit = new Octokit({ auth: token })
  const { data } = await octokit.rest.git.getRef({
    owner,
    repo,
    ref: `heads/${branch}`,
  })
  return data.object.sha
}

export async function createBranch(
  token: string,
  owner: string,
  repo: string,
  branchName: string,
  sha: string,
): Promise<void> {
  const octokit = new Octokit({ auth: token })

  try {
    await octokit.rest.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha,
    })
  } catch (error: unknown) {
    // If branch already exists (422), update it to the new SHA
    if (error && typeof error === 'object' && 'status' in error && error.status === 422) {
      await octokit.rest.git.updateRef({
        owner,
        repo,
        ref: `heads/${branchName}`,
        sha,
        force: true,
      })
      return
    }
    throw error
  }
}
