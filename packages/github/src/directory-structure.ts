import { Octokit } from 'octokit'

export interface DirectoryStructure {
  files: string[]
  directories: string[]
  markdownFiles: string[]
}

/**
 * Gets the directory structure of a repository including all files,
 * directories, and specifically markdown files.
 */
export async function getDirectoryStructure(
  token: string,
  owner: string,
  repo: string,
  ref = 'HEAD',
): Promise<DirectoryStructure> {
  const octokit = new Octokit({ auth: token })
  const { data } = await octokit.rest.git.getTree({
    owner,
    repo,
    tree_sha: ref,
    recursive: '1',
  })

  const files: string[] = []
  const directoriesSet = new Set<string>()
  const markdownFiles: string[] = []

  for (const item of data.tree) {
    if (!item.path) continue

    if (item.type === 'blob') {
      files.push(item.path)

      // Check if it's a markdown file (case-insensitive)
      if (item.path.toLowerCase().endsWith('.md')) {
        markdownFiles.push(item.path)
      }

      // Extract directories from file path
      const parts = item.path.split('/')
      for (let i = 0; i < parts.length - 1; i++) {
        const dirPath = parts.slice(0, i + 1).join('/')
        directoriesSet.add(dirPath)
      }
    }
  }

  return {
    files,
    directories: Array.from(directoriesSet).sort(),
    markdownFiles,
  }
}
