import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Toolbar } from '@/components/toolbar'

export default async function HomePage() {
  const store = await cookies()
  if (store.has('gh_token')) redirect('/repos')

  const clientId = process.env.GITHUB_CLIENT_ID ?? ''
  const scope = 'read:user,repo,public_repo'
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=${scope}`

  return (
    <main className="h-screen flex flex-col">
      <Toolbar />
      <div className="flex-1 flex items-center justify-center flex-col gap-6 text-center px-4">
        <span className="icon-[carbon--logo-github] size-20 text-foreground" />
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">DocBridge</h1>
          <p className="text-muted-foreground max-w-sm">
            Translate GitHub documentation into multiple languages and open pull requests automatically.
          </p>
        </div>
        <Button asChild size="lg">
          <a href={authUrl}>
            <span className="icon-[carbon--logo-github] size-4 mr-1" />
            Sign in with GitHub
          </a>
        </Button>
      </div>
    </main>
  )
}
