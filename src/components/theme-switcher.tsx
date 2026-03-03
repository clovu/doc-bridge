'use client'

import { useTheme } from 'next-themes'
import { Button } from './ui/button'

function WsitchIcon({ theme }: { theme?: string }) {
  if (theme === 'light') return <span className="icon-[carbon--sun] size-5" suppressHydrationWarning/>
  if (theme === 'dark') return <span className="icon-[carbon--moon] size-5" suppressHydrationWarning/>
  return <span className="icon-[carbon--airplay-filled] size-5" suppressHydrationWarning/>
}

const ThemeMapper = {
  dark: 'light',
  light: 'dark',
} as Record<string, string>

export function ThemeSwitcher() {
  const { theme, setTheme, systemTheme } = useTheme()

  function switchTheme() {
    const next = theme === 'system' ? systemTheme : theme
    setTheme(ThemeMapper[next ?? 'dark'])
  }

  return <Button variant="outline" onClick={switchTheme} suppressHydrationWarning>
    <WsitchIcon theme={theme} />
  </Button>
}
