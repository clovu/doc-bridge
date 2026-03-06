'use client'

import { useTranslations } from 'next-intl'

export const ReposPageTitle = () => {
  const t = useTranslations()
  return <h1 className="text-2xl font-semibold mb-6">{t('repos.title')}</h1>
}
