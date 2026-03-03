import Link from 'next/link'
import { LocaleSwitcher } from './locale-switcher'
import { ThemeSwitcher } from './theme-switcher'
import { buttonVariants } from './ui/button'
import { availableLocales } from '@/i18n'
import { resolvePackage } from '@/services/package'

const { homepage } = resolvePackage()

export function Toolbar() {
  return <>
    <nav className="mt-6 justify-center text-xl gap-4 flex">
      <ThemeSwitcher />

      <LocaleSwitcher locales={availableLocales} />

      <Link
        href={homepage}
        target="_blank"
        className={buttonVariants({ variant: 'outline' })}
      >
        <span className="icon-[carbon--logo-github] size-5"></span>
      </Link>
    </nav>
  </>
}
