'use client'

import '@react-sigma/core/lib/style.css'

import { SigmaContainer } from '@react-sigma/core'
import { useQuery } from '@tanstack/react-query'
import { MultiDirectedGraph } from 'graphology'
import { circular } from 'graphology-layout'
import { LoaderCircle } from 'lucide-react'
import { useMemo } from 'react'

import { useBatchEnsQuery } from '@/hooks/useEns'
import { Network, isTrustedSeed } from '@/lib/network'
import { cn } from '@/lib/utils'
import { ponderQueries } from '@/queries/ponder'

export interface NetworkGraphProps {
  network: Network
  className?: string
}

export function NetworkGraph({ network, className }: NetworkGraphProps) {
  const { isLoading, error, data } = useQuery({
    ...ponderQueries.attestationsGraph,
    refetchInterval: 10_000,
  })

  // Load ENS data
  const { data: ensData } = useBatchEnsQuery(
    data?.accounts.map((account) => account.account) || []
  )

  const graph = useMemo(() => {
    if (!data) {
      return null
    }

    // Create the graph
    const graph = new MultiDirectedGraph<{
      label: string
      size: number
      value: bigint
      sent: number
      received: number
      forceLabel: boolean
    }>()

    const maxValue = Number(
      data.accounts.reduce(
        (max, { value }) => (BigInt(value) > max ? BigInt(value) : max),
        0n
      )
    )
    const minValue = Number(
      data.accounts.reduce(
        (min, { value }) => (BigInt(value) < min ? BigInt(value) : min),
        BigInt(maxValue)
      )
    )
    const minSize = 5
    const maxSize = 15

    for (const { account, value, sent, received } of data.accounts) {
      graph.addNode(account, {
        label:
          (ensData?.[account]?.name ||
            `${account.slice(0, 6)}...${account.slice(-4)}`) +
          (isTrustedSeed(network, account) ? ' 🌱' : ''),
        value: BigInt(value),
        sent,
        received,
        // Set size to relative value, scaled to a range
        size:
          minSize +
          ((Number(value) - minValue) / (maxValue - minValue)) *
            (maxSize - minSize),
        forceLabel: true,
      })
    }
    for (const attestation of data.attestations) {
      graph.addEdgeWithKey(
        attestation.uid,
        attestation.attester,
        attestation.recipient,
        { label: attestation.decodedData?.confidence?.toString() || 'unknown' }
      )
    }

    // Assign layout.
    circular.assign(graph)

    return graph
  }, [data, ensData])

  if (isLoading) {
    return (
      <div className="w-full h-full flex justify-center items-center border border-border rounded-md p-4">
        <LoaderCircle size={24} className="animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="w-full h-full flex justify-center items-center border border-destructive rounded-md p-4">
        <p className="text-sm text-destructive">
          Error: {error?.message || 'No data'}
        </p>
      </div>
    )
  }

  return (
    <div className={cn('relative w-full h-full', className)}>
      {graph && (
        <SigmaContainer
          className="!bg-transparent border border-border rounded-md"
          settings={{
            allowInvalidContainer: true,
            renderLabels: true,
            // https://github.com/jacomyal/sigma.js/blob/main/packages/storybook/stories/3-additional-packages/edge-curve/parallel-edges.ts
            // defaultEdgeType: 'curved',
            // edgeProgramClasses: {
            //   curved: EdgeCurvedArrowProgram,
            // },
          }}
          graph={graph}
        />
      )}
    </div>
  )
}
