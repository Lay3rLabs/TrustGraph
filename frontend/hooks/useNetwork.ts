'use client'

import { useQuery } from '@tanstack/react-query'
import { useCallback } from 'react'

import { ponderQueries } from '@/queries/ponder'
import type {
  AttestationCount,
  MerkleEntry as PonderMerkleEntry,
} from '@/queries/ponder'

interface NetworkEntry {
  account: string
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
  } = useQuery(ponderQueries.latestMerkleTree)

  // Fetch attestation counts
  const {
    data: attestationCounts,
    isLoading: attestationLoading,
    error: attestationError,
    refetch: refetchAttestations,
  } = useQuery(ponderQueries.attestationCounts)

  // Create a map of attestation counts by account
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
  const transformedEntries: NetworkEntry[] =
    merkleTreeData?.entries?.map((entry: PonderMerkleEntry, index: number) => {
      const attestationData = attestationMap.get(
        entry.account.toLowerCase()
      ) || {
        sent: 0,
        received: 0,
      }

      return {
        account: entry.account,
        value: entry.value,
        rank: index + 1,
        sent: attestationData.sent,
        received: attestationData.received,
      }
    }) || []

  // Calculate derived values
  const totalRewards = merkleTreeData?.tree?.totalValue?.toString() || '0'
  const totalParticipants = merkleTreeData?.tree?.numAccounts || 0

  // Combined loading state
  const isLoading = merkleLoading || attestationLoading

  // Combined error state
  const error = merkleError?.message || attestationError?.message || null

  // Refresh function
  const refresh = useCallback(async () => {
    await Promise.all([refetchMerkle(), refetchAttestations()])
  }, [refetchMerkle, refetchAttestations])

  return {
    // Loading states
    isLoading,
    error,

    // Data (using same names as useMerkle for compatibility)
    MerkleData: transformedEntries,
    totalRewards,
    totalParticipants,

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
