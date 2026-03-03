import { Metadata } from 'next'

import { HiBody } from './body'
import { Toolbar } from '@/components/toolbar'

interface Props {
  params: Promise<{ userName: string }>
}

export async function generateMetadata(
  { params }: Props,
) {
  const { userName } = await params

  return {
    title: 'Hi, ' + decodeURI(userName),
  } as Metadata
}

export default async function SayHi({ params }: Props) {
  const { userName } = await params

  return <>
    <HiBody userName={decodeURI(userName)} />

    <Toolbar />
  </>
}
