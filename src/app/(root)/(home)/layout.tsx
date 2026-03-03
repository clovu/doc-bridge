import { FootBar } from '@/components/foot'
import { PropsWithChildren } from 'react'

export default function DefaultLayout({ children }: PropsWithChildren) {
  return <div>
    {children}
    <FootBar> [Home Layout] </FootBar>
  </div>
}
