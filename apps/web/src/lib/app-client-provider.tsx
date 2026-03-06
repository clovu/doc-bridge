'use client'

import { ThemeProvider } from '@/components/theme-provider'

export function AppClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider enableSystem attribute="class">
      {children}
    </ThemeProvider>
  )
}
