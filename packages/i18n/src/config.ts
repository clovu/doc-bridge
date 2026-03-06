import { join, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFile } from 'node:fs/promises'
import { match as matchIntl } from '@formatjs/intl-localematcher'
import { globSync } from 'glob'
import type { Locale } from 'next-intl'

const _dirname = dirname(fileURLToPath(import.meta.url))
const localesPath = join(_dirname, '..', 'locales')

const result = globSync(join(localesPath, '*.json'))

class LocaleLoader {
  private locales = new Map<string, Record<string, unknown>>()

  loadLocaleCache = async (path: string) => {
    if (this.locales.has(path)) return this.locales.get(path)

    const raw = await readFile(path, 'utf-8')
    const parsed = JSON.parse(raw) as Record<string, unknown>

    this.locales.set(path, parsed)

    return parsed
  }
}

const { loadLocaleCache } = new LocaleLoader()

const locales = Object.fromEntries(
  result.map(path => [basename(path, '.json'), () => loadLocaleCache(path)]),
) as Record<Locale, () => Promise<Record<string, unknown> | undefined>>

export const availableLocales = Object.keys(locales)

export const DEFAULT_LOCALE = 'en'

export function matchLocal(requestedLocales: readonly string[]) {
  return matchIntl([...requestedLocales], availableLocales, DEFAULT_LOCALE)
}

export function getMessageLoader(locale: string) {
  return locales[locale] ?? locales[DEFAULT_LOCALE]
}
