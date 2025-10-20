import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { notFound } from 'next/navigation'

import { NETWORKS } from '@/lib/network'
import { makeQueryClient } from '@/lib/query'
import { ponderQueries } from '@/queries/ponder'

import { NetworkPage } from './component'

export const revalidate = 3_600 // 1 hour

export async function generateStaticParams() {
  return NETWORKS.map((network) => ({
    id: network.id,
  }))
}

export default async function NetworkPageServer({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const network = NETWORKS.find((network) => network.id === id)
  if (!network) {
    notFound()
  }

  const queryClient = makeQueryClient()

  await Promise.all([
    // Network
    queryClient.prefetchQuery(ponderQueries.latestMerkleTree),
    queryClient.prefetchQuery(ponderQueries.attestationCounts),
  ])

  const dehydratedState = dehydrate(queryClient)

  return (
    <HydrationBoundary state={dehydratedState}>
      <NetworkPage network={network} />
    </HydrationBoundary>
  )
}
