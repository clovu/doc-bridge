import { Octokit } from 'octokit'

export async function getFileContent(
  token: string,
  owner: string,
  repo: string,
  path: string,
  ref?: string,
): Promise<{ content: string; sha: string }> {
  const octokit = new Octokit({ auth: token })
  const { data } = await octokit.rest.repos.getContent({
    owner,
    repo,
    path,
    ...(ref ? { ref } : {}),
  })

  const file = data as { content: string; sha: string; encoding: string }
  const content = Buffer.from(file.content, 'base64').toString('utf-8')
  return { content, sha: file.sha }
}

export async function createOrUpdateFile(
  token: string,
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  branch: string,
  sha?: string,
): Promise<void> {
  const octokit = new Octokit({ auth: token })
  await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content: Buffer.from(content).toString('base64'),
    branch,
    ...(sha ? { sha } : {}),
  })
}
