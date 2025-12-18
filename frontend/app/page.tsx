import { HydrationBoundary, dehydrate } from '@tanstack/react-query'

import { NETWORKS } from '@/lib/config'
import { makeQueryClient } from '@/lib/query'
import { ponderQueries } from '@/queries/ponder'

import { HomePage } from './component'

export const revalidate = 3_600 // 1 hour

export default async function HomePageServer() {
  const queryClient = makeQueryClient()

  // Prefetch network data for all networks in parallel
  await Promise.all(
    NETWORKS.map((network) =>
      queryClient.prefetchQuery(
        ponderQueries.network(network.contracts.merkleSnapshot)
      )
    )
  )

  const dehydratedState = dehydrate(queryClient)

  return (
    <HydrationBoundary state={dehydratedState}>
      <HomePage />
    </HydrationBoundary>
  )
}
