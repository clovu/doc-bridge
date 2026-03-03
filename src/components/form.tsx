'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useRef } from 'react'

export function Form() {
  const t = useTranslations()
  const userName = useRef('')
  const router = useRouter()

  function goto() {
    if (!userName.current.trim()) return
    router.push(`/hi/${encodeURI(userName.current)}`)
  }

  return <>
    <Input
      autoComplete="false"
      placeholder={t('intro.whats-your-name')}
      className="px-4 py-2 w-full text-center"
      onChange={e => userName.current = e.target.value}
      maxLength={40}
    />
    <div>
      <Button
        variant="outline"
        onClick={goto}
        className="mt-3 text-sm w-37.5"
      >{t('button.go')}</Button>
    </div>
  </>
}
