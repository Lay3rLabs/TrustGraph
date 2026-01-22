import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { notFound } from 'next/navigation'

import { NetworkProvider } from '@/contexts/NetworkContext'
import { VISIBLE_NETWORKS } from '@/lib/config'
import { makeQueryClient } from '@/lib/query'

import { DistributePage } from './component'

export const revalidate = 3_600 // 1 hour

export async function generateStaticParams() {
  return VISIBLE_NETWORKS.map((network) => ({
    id: network.id,
  }))
}

export default async function DistributePageServer({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const network = VISIBLE_NETWORKS.find((network) => network.id === id)
  if (!network) {
    notFound()
  }

  const queryClient = makeQueryClient()

  // Merkle tree data is loaded client-side after querying the latest snapshot root
  const dehydratedState = dehydrate(queryClient)

  return (
    <HydrationBoundary state={dehydratedState}>
      <NetworkProvider network={network}>
        <DistributePage />
      </NetworkProvider>
    </HydrationBoundary>
  )
}
