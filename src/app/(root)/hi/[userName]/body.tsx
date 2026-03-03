'use client'

import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

export function HiBody({ userName }: {userName?: string}) {
  const t = useTranslations()
  const { back } = useRouter()

  return <>
    <div className="icon-[carbon--pedestrian] inline-block text-5xl" />
    <p>{t('intro.hi', { name: userName ?? '' })}</p>
    <p className="text-sm opacity-75"><em>{t('intro.dynamic-route')}</em></p>

    <Button className="m-3 mt-6" onClick={back}>{t('button.back')}</Button>
  </>
}
