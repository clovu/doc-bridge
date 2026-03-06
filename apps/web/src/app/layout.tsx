import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { ThemeProvider } from 'next-themes'

import './globals.css'

export const metadata: Metadata = {
  title: 'DocBridge',
  description: 'Automatically translate repository documents and open localized PRs with AI.',
  authors: [{ name: 'Clover You', url: 'https://clovu.me' }],
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
