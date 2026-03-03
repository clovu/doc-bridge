import { join, basename } from 'node:path'
import process from 'node:process'
import { readFile } from 'node:fs/promises'
import { match as matchIntl } from '@formatjs/intl-localematcher'

import { globSync } from 'glob'
import { Locale } from 'next-intl'

const localesPath = join(process.cwd(), 'locales')

const result = globSync(join(localesPath, '*.json'))

class LocaleLoader {
  private locales = new Map<Locale, Record<string, string>>()

  public loadLocaleCache = async (path: string) => {
    if (this.locales.has(path)) return this.locales.get(path)

    const raw = await readFile(path, 'utf-8')
    const result = JSON.parse(raw) as Record<string, string>

    this.locales.set(path, result)

    return result
  }

}

const { loadLocaleCache } = new LocaleLoader()

const locales = Object.fromEntries(
  result.map((path) => [basename(path, '.json'), () => loadLocaleCache(path)]),
) as Record<Locale, () => Promise<Record<string, string> | undefined>>

export const availableLocales = Object.keys(locales)

export const DEFAULT_LOCALE = 'en'

export function matchLocal(requestedLocales: readonly string[]) {
  return matchIntl(requestedLocales, availableLocales, DEFAULT_LOCALE)
}

export function getMessageLoader(locale: string) {
  return locales[locale] ?? locales[DEFAULT_LOCALE]
}
