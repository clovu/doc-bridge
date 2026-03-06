import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { listUserRepos } from '@docbridge/github'
import { Toolbar } from '@/components/toolbar'
import { RepoList } from '@/components/repo-list'
import { ReposPageTitle } from '@/components/repos-page-title'

export default async function ReposPage() {
  const store = await cookies()
  const token = store.get('gh_token')?.value
  if (!token) redirect('/')

  const repos = await listUserRepos(token)

  return (
    <main className="min-h-screen">
      <Toolbar />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <ReposPageTitle />
        <RepoList repos={repos} />
      </div>
    </main>
  )
}
