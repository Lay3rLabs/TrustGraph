'use client'

import { useQuery } from '@tanstack/react-query'
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'

import { useBatchEnsQuery } from '@/hooks/useEns'
import { AttestationData } from '@/lib/attestation'
import { Network, NetworkEntry } from '@/lib/network'
import { ponderQueries } from '@/queries/ponder'

export type NetworkSimulationConfig = {
  enabled: boolean
  dampingFactor: number
  trustMultiplier: number
  trustShare: number
  trustDecay: number
}

export type NetworkContextType = {
  // Network
  network: Network

  // Loading states
  isLoading: boolean
  error: string | null

  // Data
  accountData: NetworkEntry[]
  attestationsData: AttestationData[] | undefined
  totalValue: number
  totalParticipants: number
  averageValue: number
  medianValue: number

  // Additional metadata from ponder
  merkleRoot: string | undefined
  ipfsHashCid: string | undefined
  blockNumber: string | undefined
  timestamp: string | undefined
  sources:
    | {
        name: string
        metadata: any
      }[]
    | undefined

  /** Refresh the network data. */
  refresh: () => Promise<void>

  /** Determine whether or not a given value is sufficient to be validated. */
  isValueValidated: (value: string | number | bigint) => boolean

  /** The simulation config for the network. */
  simulationConfig: NetworkSimulationConfig
  /** Set the simulation config for the network. */
  setSimulationConfig: (config: NetworkSimulationConfig) => void
}

export const NetworkContext = createContext<NetworkContextType | null>(null)

export const NetworkProvider = ({
  network,
  children,
}: {
  network: Network
  children: ReactNode
}) => {
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
    return Number(value) >= 75
  }, [])

  // Simulation config
  const [simulationConfig, setSimulationConfig] =
    useState<NetworkSimulationConfig>({
      enabled: false,
      dampingFactor: 0.85,
      trustMultiplier: 3,
      trustShare: 1,
      trustDecay: 0.8,
    })

  const value = {
    // Network
    network,

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

    // Utilities
    isValueValidated,

    // Simulation
    simulationConfig,
    setSimulationConfig,
  }

  return (
    <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
  )
}

export const useNetworkIfAvailable = () => useContext(NetworkContext)
export const useNetwork = () => {
  const context = useNetworkIfAvailable()
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider')
  }
  return context
}
