import { getPonderQueryOptions } from '@ponder/react'
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { Hex } from 'viem'
import { getEnsAddressQueryOptions, getEnsNameQueryOptions } from 'wagmi/query'

import { ponderClient } from '@/lib/ponder'
import { makeQueryClient } from '@/lib/query'
import { mightBeEnsName } from '@/lib/utils'
import { makeWagmiConfig } from '@/lib/wagmi'
import { ponderQueries, ponderQueryFns } from '@/queries/ponder'

import { AccountProfilePage } from './component'

// Incremental Static Regeneration
export const dynamic = 'force-static'
export const revalidate = 86_400 // 1 day

export default async function AccountProfilePageServer({
  params,
}: {
  params: Promise<{ address: string }>
}) {
  const { address: _address } = await params

  const queryClient = makeQueryClient()
  const wagmiConfig = makeWagmiConfig()

  // Resolve address from ENS name if necessary.
  const address = mightBeEnsName(_address)
    ? ((await queryClient
        .fetchQuery(
          getEnsAddressQueryOptions(wagmiConfig, {
            name: _address,
            chainId: 1,
          })
        )
        .catch(() => _address)) as Hex)
    : (_address as Hex)

  await Promise.all([
    // ENS name
    queryClient.prefetchQuery(
      getEnsNameQueryOptions(wagmiConfig, {
        address,
        chainId: 1,
      })
    ),

    // Network
    queryClient.prefetchQuery(ponderQueries.latestMerkleTree),
    queryClient.prefetchQuery(ponderQueries.attestationCounts),

    // Account stats
    queryClient.prefetchQuery(
      getPonderQueryOptions(
        ponderClient,
        ponderQueryFns.getAttestationsGiven(address)
      )
    ),
    queryClient.prefetchQuery(
      getPonderQueryOptions(
        ponderClient,
        ponderQueryFns.getAttestationsReceived(address)
      )
    ),
  ])

  const dehydratedState = dehydrate(queryClient)

  return (
    <HydrationBoundary state={dehydratedState}>
      <AccountProfilePage address={_address} />
    </HydrationBoundary>
  )
}
