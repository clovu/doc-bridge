import { getRequestConfig } from 'next-intl/server'

import { getMessageLoader } from './config'
import { getUserLocale } from '@/services/locale'

export default getRequestConfig(async () => {
  const locale = await getUserLocale()
  const loader = getMessageLoader(locale)
  const messages = await Promise.try(loader)

  return {
    locale,
    messages: messages ?? {},
  }
})
