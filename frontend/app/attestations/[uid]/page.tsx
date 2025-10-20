import { getPonderQueryOptions } from '@ponder/react'
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { Hex } from 'viem'
import { getEnsNameQueryOptions } from 'wagmi/query'

import { ponderClient } from '@/lib/ponder'
import { makeQueryClient } from '@/lib/query'
import { makeWagmiConfig } from '@/lib/wagmi'
import { ponderQueryFns } from '@/queries/ponder'

import { AttestationDetailPage } from './component'

// Incremental Static Regeneration
export const dynamic = 'force-static'

export default async function AttestationDetailPageServer({
  params,
}: {
  params: Promise<{ uid: Hex }>
}) {
  const { uid } = await params

  const queryClient = makeQueryClient()

  const attestation = await queryClient
    .fetchQuery(
      getPonderQueryOptions(ponderClient, ponderQueryFns.getAttestation(uid))
    )
    .catch(() => null)

  // Resolve ENS names.
  if (attestation) {
    const wagmiConfig = makeWagmiConfig()
    await Promise.all([
      queryClient.prefetchQuery(
        getEnsNameQueryOptions(wagmiConfig, {
          address: attestation.attester,
          chainId: 1,
        })
      ),
      queryClient.prefetchQuery(
        getEnsNameQueryOptions(wagmiConfig, {
          address: attestation.recipient,
          chainId: 1,
        })
      ),
    ])
  }

  const dehydratedState = dehydrate(queryClient)

  return (
    <HydrationBoundary state={dehydratedState}>
      <AttestationDetailPage uid={uid} />
    </HydrationBoundary>
  )
}
