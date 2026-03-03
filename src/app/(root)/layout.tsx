import { Wrap } from './wrap'

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="px-4 py-10 text-center text-gray-700 dark:text-gray-200">
      <Wrap>
        {children}
      </Wrap>
    </main>
  )
}
