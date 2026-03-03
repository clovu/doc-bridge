'use client'
import { Card, CardContent } from '@/components/ui/card'
import { PropsWithChildren } from 'react'

export function Wrap({ children }: PropsWithChildren) {
  return (
    <Card
      className="w-95 m-auto"
    >
      <CardContent className="relative">
        {children}
      </CardContent>
    </Card>
  )
}
