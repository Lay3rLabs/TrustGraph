'use client'

import { useQuery } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import { Hex } from 'viem'

import { ponderQueries } from '@/queries/ponder'
import type {
  AttestationCount,
  MerkleEntry as PonderMerkleEntry,
} from '@/queries/ponder'

import { useBatchEnsQuery } from './useEns'

export interface NetworkEntry {
  account: string
  ensName?: string
  value: string
  rank: number
  sent: number
  received: number
}

export function useNetwork() {
  // Fetch latest merkle tree with entries
  const {
    data: merkleTreeData,
    isLoading: merkleLoading,
    error: merkleError,
    refetch: refetchMerkle,
  } = useQuery({
    ...ponderQueries.latestMerkleTree,
    refetchInterval: 10_000,
  })

  // Fetch attestation counts
  const {
    data: attestationCounts,
    isLoading: attestationLoading,
    error: attestationError,
    refetch: refetchAttestations,
  } = useQuery({
    ...ponderQueries.attestationCounts,
    refetchInterval: 10_000,
  })

  // Fetch attestations graph
  const { refetch: refetchAttestationsGraph } = useQuery(ponderQueries.network)

  // Load ENS data
  const { data: ensData } = useBatchEnsQuery(
    merkleTreeData?.entries.map((entry) => entry.account as Hex) || []
  )

  // Create a map of attestation counts by account
  const merkleData = useMemo((): NetworkEntry[] => {
    if (!merkleTreeData?.entries?.length) {
      return []
    }

    const attestationMap = new Map<string, { sent: number; received: number }>()
    if (attestationCounts && Array.isArray(attestationCounts)) {
      attestationCounts.forEach((count: AttestationCount) => {
        attestationMap.set(count.account.toLowerCase(), {
          sent: count.sent,
          received: count.received,
        })
      })
    }

    // Transform ponder merkle entries to match the expected format with attestation data
    return merkleTreeData.entries
      .sort((a, b) => Number(BigInt(b.value) - BigInt(a.value)))
      .map((entry: PonderMerkleEntry, index: number) => {
        const attestationData = attestationMap.get(
          entry.account.toLowerCase()
        ) || {
          sent: 0,
          received: 0,
        }

        const ensName = ensData?.[entry.account]?.name || undefined

        return {
          account: entry.account,
          ...(ensName ? { ensName } : {}),
          value: entry.value,
          rank: index + 1,
          sent: attestationData.sent,
          received: attestationData.received,
        }
      })
  }, [merkleTreeData, attestationCounts, ensData])

  // Calculate derived values
  const totalValue = Number(merkleTreeData?.tree?.totalValue || '0')
  const totalParticipants = merkleTreeData?.tree?.numAccounts || 0
  const averageValue =
    totalValue && totalParticipants
      ? Number(totalValue) / Number(totalParticipants)
      : 0
  const medianValue =
    merkleData.length > 1
      ? Number(merkleData[Math.ceil(merkleData.length / 2)].value)
      : Number(merkleData[0]?.value || 0)

  // Combined loading state
  const isLoading = merkleLoading || attestationLoading

  // Combined error state
  const error = merkleError?.message || attestationError?.message || null

  // Refresh function
  const refresh = useCallback(async () => {
    await Promise.all([
      refetchMerkle(),
      refetchAttestations(),
      refetchAttestationsGraph(),
    ])
  }, [refetchMerkle, refetchAttestations, refetchAttestationsGraph])

  return {
    // Loading states
    isLoading,
    error,

    // Data (using same names as useMerkle for compatibility)
    merkleData,
    totalValue,
    totalParticipants,
    averageValue,
    medianValue,

    // Additional metadata from ponder
    merkleRoot: merkleTreeData?.tree?.root,
    ipfsHashCid: merkleTreeData?.tree?.ipfsHashCid,
    blockNumber: merkleTreeData?.tree?.blockNumber,
    timestamp: merkleTreeData?.tree?.timestamp,
    sources: merkleTreeData?.tree?.sources,

    // Actions
    refresh,
  }
}
