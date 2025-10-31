'use client'

import { useQuery } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import { Hex } from 'viem'

import { ponderQueries } from '@/queries/ponder'

import { useBatchEnsQuery } from './useEns'

export interface NetworkEntry {
  account: Hex
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

  // Fetch network
  const {
    data: networkData,
    isLoading: networkLoading,
    error: networkError,
    refetch: refetchNetwork,
  } = useQuery({
    ...ponderQueries.network,
    refetchInterval: 10_000,
  })

  // Load ENS data
  const { data: ensData } = useBatchEnsQuery(
    networkData?.accounts.map(({ account }) => account) || []
  )

  // Transform network data to match the expected format
  const accountData = useMemo((): NetworkEntry[] => {
    if (!networkData?.accounts?.length) {
      return []
    }

    return networkData.accounts
      .sort((a, b) => Number(BigInt(b.value) - BigInt(a.value)))
      .map((account, index: number) => {
        const ensName = ensData?.[account.account]?.name || undefined

        return {
          ...account,
          ...(ensName ? { ensName } : {}),
          rank: index + 1,
        }
      })
  }, [networkData, ensData])

  // Calculate derived values
  const totalValue = Number(merkleTreeData?.tree?.totalValue || '0')
  const totalParticipants = merkleTreeData?.tree?.numAccounts || 0
  const averageValue =
    totalValue && totalParticipants
      ? Number(totalValue) / Number(totalParticipants)
      : 0
  const medianValue =
    accountData.length > 1
      ? Number(accountData[Math.ceil(accountData.length / 2)].value)
      : Number(accountData[0]?.value || 0)

  // Combined loading state
  const isLoading = merkleLoading || networkLoading

  // Combined error state
  const error = merkleError?.message || networkError?.message || null

  // Refresh function
  const refresh = useCallback(async () => {
    await Promise.all([refetchMerkle(), refetchNetwork()])
  }, [refetchMerkle, refetchNetwork])

  // Determine whether or not a given value is sufficient to be validated
  const isValueValidated = useCallback((value: string | number | bigint) => {
    return Number(value) >= 70
  }, [])

  return {
    // Loading states
    isLoading,
    error,

    // Data
    accountData,
    attestationsData: networkData?.attestations,
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

    // Utility functions
    isValueValidated,
  }
}
