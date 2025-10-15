'use client'

import { useCallback, useEffect, useState } from 'react'
import { useReadContract } from 'wagmi'

import { merkleGovModuleAbi, merkleGovModuleAddress } from '@/lib/contracts'

interface MerkleEntry {
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

export function useMerkle() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [merkleData, setMerkleData] = useState<MerkleEntry[]>([])
  const [totalRewards, setTotalRewards] = useState<string>('0')
  const [totalParticipants, setTotalParticipants] = useState<number>(0)

  // Read IPFS hash CID from contract
  const {
    data: ipfsHashCid,
    isLoading: isLoadingHash,
    refetch: refetchHash,
  } = useReadContract({
    address: merkleGovModuleAddress,
    abi: merkleGovModuleAbi,
    functionName: 'ipfsHashCid',
    query: { enabled: !!merkleGovModuleAddress },
  })

  // Fetch and process Merkle data from IPFS
  const loadMerkleData = useCallback(async () => {
    if (!ipfsHashCid || ipfsHashCid === '') {
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Fetch merkle tree data from IPFS via Next.js API route
      const ipfsUrl = cidToUrl(ipfsHashCid as string)
      console.log(`Fetching Merkle data from: ${ipfsUrl}`)

      const response = await fetch(ipfsUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch IPFS data: ${response.status}`)
      }

      const data: MerkleTreeData = await response.json()

      // Sort by claimable amount (descending) and create Merkle entries
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

      setMerkleData(sortedEntries)
      setTotalRewards(data.metadata.total_value)
      setTotalParticipants(data.tree.length)
    } catch (err) {
      console.error('Error loading Merkle data:', err)
      setError('Failed to load Merkle data from IPFS')
    } finally {
      setIsLoading(false)
    }
  }, [ipfsHashCid])

  // Load data when IPFS hash changes
  useEffect(() => {
    loadMerkleData()
  }, [loadMerkleData])

  // Refresh function
  const refresh = useCallback(async () => {
    await refetchHash()
    await loadMerkleData()
  }, [refetchHash, loadMerkleData])

  return {
    // Loading states
    isLoading: isLoading || isLoadingHash,
    error,

    // Data
    merkleData,
    totalRewards,
    totalParticipants,

    // Actions
    refresh,

    // Contract info
    contractAddress: merkleGovModuleAddress,
  }
}
