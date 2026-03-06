export interface GitHubUser {
  login: string
  name: string | null
  avatarUrl: string
}

export interface GitHubRepo {
  id: number
  name: string
  fullName: string
  owner: string
  private: boolean
  description: string | null
  defaultBranch: string
  updatedAt: string | null
}

export interface GitHubTreeItem {
  path: string
  type: 'blob' | 'tree'
  sha: string
}

export interface CreatePullRequestResult {
  number: number
  url: string
  title: string
}
