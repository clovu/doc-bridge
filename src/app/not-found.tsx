'use client'
import Link from 'next/link'

import { resolvePackage } from '@/services/package'
import { buttonVariants } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

const { bugs = '#' } = resolvePackage()

export default function NotFound() {
  const t = useTranslations()

  return (
    <main className="grid h-screen place-items-center bg-background px-6 py-24 sm:py-32 lg:px-8">
      <div className="text-center">
        <p className="text-base font-semibold text-indigo-400">404</p>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight text-balance text-accent-foreground sm:text-7xl">{t('not-found.title')}</h1>
        <p className="mt-6 text-lg font-medium text-pretty text-muted-foreground sm:text-xl/8">{t('not-found.desc')}</p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link replace href="/" className={buttonVariants({ variant: 'default' })}>{t('button.back_home')}</Link>
          <Link href={bugs} target="_blank" className="text-sm font-semibold text-white">{t('button.issue_contact')} <span aria-hidden="true">&rarr;</span></Link>
        </div>
      </div>
    </main>
  )
}
