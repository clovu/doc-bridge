'use client'
import { useRef, useTransition } from 'react'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { setUserLocale } from '@/services/locale'

interface Props {
  locales: string[]
}

export function LocaleSwitcher({ locales }: Readonly<Props>) {
  const locale = useLocale()
  const index = useRef(locales.findIndex(it => it === locale) ?? 0)
  const [isPending, startTransition] = useTransition()

  function switcher() {
    startTransition(() => {
      const locale = locales[index.current++]
      ?? locales[
        index.current = 0
      ]

      setUserLocale(locale)
    })
  }

  if (isPending)
    return <Button variant="outline">
      <Spinner />
    </Button>

  return <Button variant="outline" onClick={switcher}>
    <span className="icon-[carbon--language] size-5"/>
  </Button>
}
