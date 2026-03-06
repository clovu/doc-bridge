import type { Metadata } from 'next'

import './globals.css'
import { AppClientProvider } from '@/lib/app-client-provider'
import { NextIntlClientProvider } from 'next-intl'

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
        <NextIntlClientProvider>
          <AppClientProvider>
            {children}
          </AppClientProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
