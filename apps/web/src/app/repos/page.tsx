import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { listUserRepos } from '@docbridge/github'
import { Toolbar } from '@/components/toolbar'
import { RepoList } from '@/components/repo-list'
import { useTranslations } from 'next-intl'

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

const ReposPageTitle = () => {
  const t = useTranslations()
  return <h1 className="text-2xl font-semibold mb-6">{t('repos.title')}</h1>
}
