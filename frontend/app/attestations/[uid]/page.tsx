import { getPonderQueryOptions } from '@ponder/react'
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'

import { ponderClient } from '@/lib/ponder'
import { makeQueryClient } from '@/lib/query'
import { ponderQueryFns } from '@/queries/ponder'

import { AttestationDetailPage } from './component'

interface AttestationDetailPageProps {
  uid: `0x${string}`
}

// Incremental Static Regeneration
export const dynamic = 'force-static'

export default async function AttestationDetailPageServer({
  params,
}: {
  params: Promise<AttestationDetailPageProps>
}) {
  const { uid } = await params

  const queryClient = makeQueryClient()
  await queryClient.prefetchQuery(
    getPonderQueryOptions(ponderClient, ponderQueryFns.getAttestation(uid))
  )

  const dehydratedState = dehydrate(queryClient)

  return (
    <HydrationBoundary state={dehydratedState}>
      <AttestationDetailPage uid={uid} />
    </HydrationBoundary>
  )
}
