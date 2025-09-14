'use client'

import { useCallback, useEffect, useState } from 'react'
import { useReadContract } from 'wagmi'

import {
  mockUsdcAddress,
  rewardDistributorAbi,
  rewardDistributorAddress,
} from '@/lib/contracts'

interface LeaderboardEntry {
  account: string
  value: string
  rank: number
}

interface MerkleTreeData {
  tree: Array<{
    account: string
    value: string
    proof: string[]
  }>
  metadata: {
    total_value: string
    sources?: Array<{
      name: string
      metadata: { address: string }
    }>
  }
}

const cidToUrl = (cid: string): string => {
  return `/api/ipfs/${cid}`
}

export function useLeaderboard() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([])
  const [totalRewards, setTotalRewards] = useState<string>('0')
  const [totalParticipants, setTotalParticipants] = useState<number>(0)
  const [tokenSymbol, setTokenSymbol] = useState<string>('TOKEN')

  const contractAddress = rewardDistributorAddress

  // Read IPFS hash CID from contract
  const {
    data: ipfsHashCid,
    isLoading: isLoadingHash,
    refetch: refetchHash,
  } = useReadContract({
    address: contractAddress,
    abi: rewardDistributorAbi,
    functionName: 'ipfsHashCid',
    query: { enabled: !!contractAddress },
  })

  // Fetch and process leaderboard data from IPFS
  const loadLeaderboardData = useCallback(async () => {
    if (!ipfsHashCid || ipfsHashCid === '') {
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Fetch merkle tree data from IPFS via Next.js API route
      const ipfsUrl = cidToUrl(ipfsHashCid as string)
      console.log(`Fetching leaderboard data from: ${ipfsUrl}`)

      const response = await fetch(ipfsUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch IPFS data: ${response.status}`)
      }

      const data: MerkleTreeData = await response.json()

      // Sort by claimable amount (descending) and create leaderboard entries
      const sortedEntries = data.tree
        .map((entry) => ({
          ...entry,
          rank: 0, // Will be set after sorting
        }))
        .sort((a, b) => {
          // Sort by claimable amount in descending order
          const aClaimable = BigInt(a.value)
          const bClaimable = BigInt(b.value)
          return bClaimable > aClaimable ? 1 : bClaimable < aClaimable ? -1 : 0
        })
        .map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }))

      setLeaderboardData(sortedEntries)
      setTotalRewards(data.metadata.total_value)
      setTotalParticipants(data.tree.length)

      // Fetch token symbol
      try {
        const tokenResponse = await fetch(
          `/api/token-symbol/${mockUsdcAddress}`
        )
        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json()
          setTokenSymbol(tokenData.symbol || 'TOKEN')
        }
      } catch (err) {
        console.error('Error fetching token symbol:', err)
        setTokenSymbol('TOKEN')
      }
    } catch (err) {
      console.error('Error loading leaderboard data:', err)
      setError('Failed to load leaderboard data from IPFS')
    } finally {
      setIsLoading(false)
    }
  }, [ipfsHashCid])

  // Load data when IPFS hash changes
  useEffect(() => {
    loadLeaderboardData()
  }, [loadLeaderboardData])

  // Refresh function
  const refresh = useCallback(async () => {
    await refetchHash()
    await loadLeaderboardData()
  }, [refetchHash, loadLeaderboardData])

  return {
    // Loading states
    isLoading: isLoading || isLoadingHash,
    error,

    // Data
    leaderboardData,
    totalRewards,
    totalParticipants,
    tokenSymbol,

    // Actions
    refresh,

    // Contract info
    contractAddress,
  }
}
