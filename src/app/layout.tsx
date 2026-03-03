import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { ThemeProvider } from 'next-themes'

import './globals.css'

import { resolvePackage } from '@/services/package'

const { author, description } = resolvePackage()
export const metadata: Metadata = {
  title: 'Gratia',
  description,
  authors: [{ name: author, url: 'https://clovu.me' }],
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body>
        <ThemeProvider enableSystem attribute="class">
          <NextIntlClientProvider>
            {children}
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
