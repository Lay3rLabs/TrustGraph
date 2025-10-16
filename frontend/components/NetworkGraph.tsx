'use client'

import '@react-sigma/core/lib/style.css'

import { SigmaContainer } from '@react-sigma/core'
import { useQuery } from '@tanstack/react-query'
import { MultiDirectedGraph } from 'graphology'
import { circular } from 'graphology-layout'
import { LoaderCircle } from 'lucide-react'
import { useMemo } from 'react'

import { useBatchEnsQuery } from '@/hooks/useEns'
import { Network } from '@/lib/network'
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
      sent: number
      received: number
      forceLabel: boolean
    }>()

    for (const { account, sent, received } of data.accounts) {
      graph.addNode(account, {
        label:
          ensData?.[account]?.name ||
          `${account.slice(0, 6)}...${account.slice(-4)}`,
        size: 10,
        sent,
        received,
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

    // Set size to number of attestations (degrees)
    const minDegree = graph
      .nodes()
      .reduce((min, node) => Math.min(min, graph.degree(node)), Infinity)
    const maxDegree = graph
      .nodes()
      .reduce((max, node) => Math.max(max, graph.degree(node)), 0)
    const minSize = 5
    const maxSize = 15
    graph.forEachNode((node) => {
      const degree = graph.degree(node)
      graph.setNodeAttribute(
        node,
        'size',
        minSize +
          ((degree - minDegree) / (maxDegree - minDegree)) * (maxSize - minSize)
      )
    })

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
