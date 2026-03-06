'use server'

import { Locale } from 'next-intl'
import { cookies, headers } from 'next/headers'
import Negotiator from 'negotiator'
import { matchLocal } from '@docbridge/i18n'

const COOKIE_NAME = 'NEXT_LOCAL'

type LanguagePriorityList = readonly string[]

function parseAcceptLanguage(header: string): LanguagePriorityList {
  return new Negotiator({
    headers: { 'accept-language': header },
  }).languages()
}

export async function getUserLocale() {
  const store = await cookies()
  const userLocale = store.get(COOKIE_NAME)

  if (userLocale)
    return userLocale.value

  const headerStore = await headers()
  const languages = parseAcceptLanguage(headerStore.get('accept-language') ?? '')

  return matchLocal(languages)
}

export async function setUserLocale(locale: Locale) {
  const store = await cookies()
  store.set(COOKIE_NAME, locale)
}
