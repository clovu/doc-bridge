import { match as matchIntl } from '@formatjs/intl-localematcher'
import type { Locale } from 'next-intl'

// Static imports for locale files - works reliably in all environments
import en from '../locales/en.json'
import zh from '../locales/zh.json'

// Define locales with static imports
const locales = {
  en: () => Promise.resolve(en as Record<string, unknown>),
  zh: () => Promise.resolve(zh as Record<string, unknown>),
} as const satisfies Record<string, () => Promise<Record<string, unknown>>>

export const availableLocales = Object.keys(locales) as Locale[]

export const DEFAULT_LOCALE = 'en' as const

export function matchLocal(requestedLocales: readonly string[]) {
  return matchIntl([...requestedLocales], availableLocales, DEFAULT_LOCALE)
}

export function getMessageLoader(locale: string) {
  const loader = locales[locale as keyof typeof locales] ?? locales[DEFAULT_LOCALE]

  if (!loader) {
    console.error(`No locale loader found for: ${locale}, falling back to ${DEFAULT_LOCALE}`)
    return locales[DEFAULT_LOCALE]
  }

  return loader
}
