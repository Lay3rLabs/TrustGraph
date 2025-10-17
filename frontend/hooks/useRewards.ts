'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  useAccount,
  useBalance,
  useReadContract,
  useWatchContractEvent,
  useWriteContract,
} from 'wagmi'

import {
  // enovaAddress,
  merkleSnapshotAbi,
  merkleSnapshotAddress,
  merkleSnapshotConfig,
  // rewardDistributorAbi,
  // rewardDistributorAddress,
} from '@/lib/contracts'
import { parseErrorMessage } from '@/lib/error'
import { txToast } from '@/lib/tx'

const rewardDistributorAddress = '0x0000000000000000000000000000000000000000'
const rewardDistributorAbi = [] as any
const enovaAddress = '0x0000000000000000000000000000000000000000'

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

interface PendingReward {
  account: string
  value: string
  proof: string[]
}

interface RewardClaim {
  account: string
  value: string
  claimed: string
  timestamp: number
  transactionHash: string
}

const cidToUrl = (cid: string): string => {
  return `/api/ipfs/${cid}`
}

export function useRewards() {
  const { address, isConnected } = useAccount()
  const { writeContract, isPending: isWriting } = useWriteContract()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentIpfsHash, setCurrentIpfsHash] = useState<string>('')
  const [merkleData, setMerkleData] = useState<MerkleTreeData | null>(null)
  const [pendingReward, setPendingReward] = useState<PendingReward | null>(null)
  const [claimHistory, setClaimHistory] = useState<RewardClaim[]>([])
  const [tokenSymbol, setTokenSymbol] = useState<string>('TOKEN')

  // Read merkle root from contract
  const {
    data: merkleRoot,
    isLoading: isLoadingRoot,
    refetch: refetchMerkleRoot,
  } = useReadContract({
    address: rewardDistributorAddress,
    abi: rewardDistributorAbi,
    functionName: 'root',
    query: {
      enabled: !!rewardDistributorAddress,
    },
  })

  // Read IPFS hash CID from contract
  const {
    data: ipfsHashCid,
    isLoading: isLoadingHash,
    refetch: refetchIpfsHash,
  } = useReadContract({
    address: rewardDistributorAddress,
    abi: rewardDistributorAbi,
    functionName: 'ipfsHashCid',
    query: {
      enabled: !!rewardDistributorAddress,
    },
  })

  // Read claimed amount for connected user
  const { data: claimedAmount, refetch: refetchClaimed } = useReadContract({
    address: rewardDistributorAddress,
    abi: rewardDistributorAbi,
    functionName: 'claimed',
    args: address ? [address, enovaAddress] : undefined,
    query: {
      enabled: !!address,
    },
  })

  // Use mock USDC for collateral balance
  const { data: rewardBalance, refetch: refetchRewardBalance } = useBalance({
    address: address,
    token: enovaAddress,
  })

  // Watch for MerkleRootUpdated events to trigger data refresh
  const handleMerkleRootUpdated = useCallback(() => {
    console.log('🌳 MerkleRootUpdated event detected - refreshing reward data')
    refetchMerkleRoot()
    refetchIpfsHash()
    refetchClaimed()
    refetchRewardBalance()
  }, [refetchMerkleRoot, refetchIpfsHash, refetchClaimed, refetchRewardBalance])

  useWatchContractEvent({
    ...merkleSnapshotConfig,
    eventName: 'MerkleRootUpdated',
    onLogs: handleMerkleRootUpdated,
  })

  // Fetch merkle data from IPFS
  useEffect(() => {
    const loadMerkleData = async () => {
      if (!ipfsHashCid || ipfsHashCid === '') {
        return
      }

      try {
        setIsLoading(true)
        setCurrentIpfsHash(ipfsHashCid as string)

        // Fetch merkle tree data from IPFS via Next.js API route
        const ipfsUrl = cidToUrl(ipfsHashCid as string)
        console.log(`Fetching merkle data from: ${ipfsUrl}`)

        const response = await fetch(ipfsUrl)
        if (!response.ok) {
          throw new Error(`Failed to fetch IPFS data: ${response.status}`)
        }

        const data: MerkleTreeData = await response.json()
        setMerkleData(data)

        // Find pending reward for current user
        if (address && data.tree) {
          const userReward = data.tree.find(
            (reward) => reward.account.toLowerCase() === address.toLowerCase()
          )
          setPendingReward(userReward || null)
        }
      } catch (err) {
        console.error('Error loading merkle data:', err)
        setError('Failed to load reward data from IPFS')
      } finally {
        setIsLoading(false)
      }
    }

    loadMerkleData()
  }, [ipfsHashCid, address])

  // Fetch token symbol when we have reward token address
  useEffect(() => {
    const fetchTokenSymbol = async () => {
      try {
        const response = await fetch(`/api/token-symbol/${enovaAddress}`)
        if (response.ok) {
          const data = await response.json()
          setTokenSymbol(data.symbol || 'TOKEN')
        }
      } catch (err) {
        console.error('Error fetching token symbol:', err)
        setTokenSymbol('TOKEN')
      }
    }

    fetchTokenSymbol()
  }, [])

  // Trigger merkle update
  const triggerUpdate = useCallback(async () => {
    if (!isConnected) {
      setError('Wallet not connected')
      return null
    }

    try {
      setError(null)

      const [{ transactionHash }] = await txToast({
        tx: {
          address: merkleSnapshotAddress,
          abi: merkleSnapshotAbi,
          functionName: 'trigger',
        },
        successMessage: 'Reward update triggered!',
      })

      console.log('Reward update triggered:', transactionHash)

      return transactionHash
    } catch (err: any) {
      console.error('Error triggering reward update:', err)
      setError(`Failed to trigger update: ${parseErrorMessage(err)}`)
      return null
    }
  }, [isConnected, merkleSnapshotAddress, writeContract])

  // Claim rewards
  const claim = useCallback(async () => {
    if (!address || !pendingReward || !isConnected) {
      setError('Missing requirements for claim')
      return null
    }

    try {
      setError(null)

      const [{ transactionHash }] = await txToast({
        tx: {
          address: rewardDistributorAddress,
          abi: rewardDistributorAbi,
          functionName: 'claim',
          args: [
            address,
            BigInt(pendingReward.value),
            pendingReward.proof as `0x${string}`[],
          ],
        },
        successMessage: 'Rewards claimed!',
      })

      // Add to claim history
      const newClaim: RewardClaim = {
        ...pendingReward,
        claimed: pendingReward.value,
        timestamp: Date.now(),
        transactionHash,
      }
      setClaimHistory((prev) => [...prev, newClaim])

      // Refresh claimed amount
      await refetchClaimed()

      console.log('Rewards claimed:', transactionHash)

      return transactionHash
    } catch (err: any) {
      console.error('Error claiming rewards:', err)
      setError(`Failed to claim rewards: ${parseErrorMessage(err)}`)
      return null
    }
  }, [
    address,
    pendingReward,
    isConnected,
    rewardDistributorAddress,
    writeContract,
    refetchClaimed,
  ])

  const refresh = useCallback(async () => {
    await Promise.all([
      refetchMerkleRoot(),
      refetchIpfsHash(),
      refetchClaimed(),
      refetchRewardBalance(),
    ])
  }, [refetchMerkleRoot, refetchIpfsHash, refetchClaimed, refetchRewardBalance])

  return {
    // Loading states
    isLoading: isLoading || isLoadingRoot || isLoadingHash || isWriting,
    error,

    // Data
    merkleRoot: merkleRoot as string,
    currentIpfsHash,
    merkleData,
    pendingReward,
    claimedAmount: claimedAmount?.toString() || '0',
    claimHistory,
    tokenSymbol,
    rewardBalance,

    // Actions
    claim,
    triggerUpdate,
    refresh,

    // Contract info
    contractAddress: rewardDistributorAddress,
  }
}
