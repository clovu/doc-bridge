'use client'

import { ThemeProvider } from '@/components/theme-provider'
import { NextIntlClientProvider } from 'next-intl'

export function AppClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider enableSystem attribute="class">
      <NextIntlClientProvider>
        {children}
      </NextIntlClientProvider>
    </ThemeProvider>
  )
}
