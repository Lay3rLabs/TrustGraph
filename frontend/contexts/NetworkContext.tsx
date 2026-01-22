'use client'

import { usePonderQuery } from '@ponder/react'
import { useQuery } from '@tanstack/react-query'
import {
  Dispatch,
  ReactNode,
  SetStateAction,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { Hex, zeroAddress } from 'viem'

import { useBatchEnsQuery } from '@/hooks/useEns'
import { usePageRankComputerModule } from '@/hooks/usePageRankComputer'
import { AttestationData } from '@/lib/attestation'
import { isTrustedSeed } from '@/lib/network'
import { Network, NetworkEntry } from '@/lib/types'
import { PageRankGraphComputer } from '@/lib/wasm/pagerank/pagerank'
import { ponderQueries, ponderQueryFns } from '@/queries/ponder'

export type NetworkSimulationConfig = {
  enabled: boolean
  dampingFactor: number
  trustMultiplier: number
  trustShare: number
  trustDecay: number
  maxIterations: number
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
  gnosisSafe?: {
    address: Hex
    owners: Hex[]
    threshold: number
  }

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

  /** Determine whether or not a given address is a trusted seed for the network. */
  isTrustedSeed: (address: string) => boolean

  /** The simulation config for the network. */
  simulationConfig: NetworkSimulationConfig
  /** Set the simulation config for the network. */
  setSimulationConfig: Dispatch<SetStateAction<NetworkSimulationConfig>>
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
    data: _merkleTreeData,
    isLoading: merkleLoading,
    error: merkleError,
    refetch: refetchMerkle,
  } = useQuery({
    ...ponderQueries.latestMerkleTree(network.contracts.merkleSnapshot),
    refetchInterval: 10_000,
  })

  // Fetch network
  const {
    data: _networkData,
    isLoading: networkLoading,
    error: networkError,
    refetch: refetchNetwork,
  } = useQuery({
    ...ponderQueries.network(network.contracts.merkleSnapshot),
    refetchInterval: 10_000,
  })

  // Fetch Gnosis Safe (if available)
  const { data: gnosisSafeData, isLoading: gnosisSafeLoading } = usePonderQuery(
    {
      queryFn: ponderQueryFns.getGnosisSafe(
        network.contracts.safe?.proxy || zeroAddress
      ),
      live: false,
      refetchInterval: 30_000,
      enabled: !!network.contracts.safe?.proxy,
    }
  )

  // Simulation config
  const [simulationConfig, setSimulationConfig] =
    useState<NetworkSimulationConfig>({
      enabled: false,
      dampingFactor: 0.85,
      trustMultiplier: 3,
      trustShare: 1,
      trustDecay: 0.8,
      maxIterations: 100,
    })

  const pagerankModule = usePageRankComputerModule()
  const [computer, setComputer] = useState<PageRankGraphComputer | null>(null)
  const [simulatedResults, setSimulatedResults] = useState<Record<
    string,
    bigint
  > | null>(null)
  useEffect(() => {
    if (!pagerankModule || !_networkData || !simulationConfig.enabled) {
      return
    }

    const computer = new pagerankModule.PageRankGraphComputer(false)
    _networkData.attestations.forEach((attestation) => {
      computer.addEdge(
        attestation.attester,
        attestation.recipient,
        Number(attestation.decodedData?.confidence || 0)
      )
    })
    setComputer(computer)

    return () => computer.free()
  }, [pagerankModule, _networkData, simulationConfig.enabled])

  useEffect(() => {
    if (!pagerankModule || !computer || !simulationConfig.enabled) {
      return
    }

    try {
      const scores = computer.calculatePagerank(
        new pagerankModule.PageRankConfig(
          simulationConfig.dampingFactor,
          simulationConfig.maxIterations,
          1e-6,
          0,
          100,
          new pagerankModule.TrustConfig(
            network.pagerank.trustedSeeds,
            simulationConfig.trustMultiplier,
            simulationConfig.trustShare,
            simulationConfig.trustDecay
          )
        )
      )
      const points = computer.distributePoints(scores, 10_000n)
      setSimulatedResults(
        Object.fromEntries(
          points
            .entries()
            .map(([address, points]) => [address.toLowerCase(), points])
        )
      )
      // Array.from(points.entries())
      //   .sort((a, b) => Number(b[1] - a[1]))
      //   .forEach(([address, points], index) => {
      //     console.log(`#${index + 1} ${address}: ${points}`)
      //   })
    } catch (error) {
      console.error('error running pagerank computation', error)
    }
  }, [pagerankModule, computer, simulationConfig])

  // Use simulated or real data based on the simulation config
  const { networkData, merkleTreeData } = useMemo((): {
    networkData: typeof _networkData
    merkleTreeData: typeof _merkleTreeData
  } => {
    if (!simulationConfig.enabled || !simulatedResults) {
      return {
        networkData: _networkData,
        merkleTreeData: _merkleTreeData,
      }
    }

    console.log('simulatedResults:', simulatedResults)

    const networkData: typeof _networkData = _networkData && {
      accounts: _networkData.accounts.map((account) => ({
        ...account,
        value:
          simulatedResults[account.account.toLowerCase()]?.toString() || '0',
      })),
      attestations: _networkData.attestations,
    }

    const merkleTreeData: typeof _merkleTreeData = _merkleTreeData && {
      tree: {
        ..._merkleTreeData.tree,
        root: '<simulated>',
        ipfsHash: '<simulated>',
        ipfsHashCid: '<simulated>',
        totalValue:
          networkData?.accounts
            .reduce((acc, account) => acc + BigInt(account.value), 0n)
            .toString() || '0',
        blockNumber: '0',
        timestamp: '0',
      },
      entries: _merkleTreeData.entries.map((entry) => ({
        ...entry,
        proof: [],
        value: simulatedResults[entry.account.toLowerCase()]?.toString() || '0',
      })),
    }

    return {
      networkData,
      merkleTreeData,
    }
  }, [
    simulationConfig.enabled,
    simulatedResults,
    _merkleTreeData,
    _networkData,
  ])

  // Load ENS data
  const { data: ensData } = useBatchEnsQuery(
    networkData?.accounts.map(({ account }) => account) || []
  )

  // Transform network data to match the expected format
  const accountData = useMemo(() => {
    if (!networkData?.accounts?.length) {
      return []
    }

    const accountData = networkData.accounts
      .sort((a, b) => Number(BigInt(b.value) - BigInt(a.value)))
      .map((account, index: number): NetworkEntry => {
        const ensName = ensData?.[account.account]?.name || undefined

        return {
          ...account,
          ...(ensName ? { ensName } : {}),
          rank: index + 1,
        }
      })

    return accountData
  }, [networkData, ensData])

  // Calculate derived values
  const totalValue = Number(merkleTreeData?.tree?.totalValue || 0)
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
  const isLoading = merkleLoading || networkLoading || gnosisSafeLoading

  // Combined error state
  const error = merkleError?.message || networkError?.message || null

  // Refresh function
  const refresh = useCallback(async () => {
    await Promise.all([refetchMerkle(), refetchNetwork()])
  }, [refetchMerkle, refetchNetwork])

  // Determine whether or not a given address is a trusted seed for the network
  const isTrustedNetworkSeed = useCallback(
    (address: string) => isTrustedSeed(network, address),
    [network.pagerank.trustedSeeds]
  )

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
    gnosisSafe: gnosisSafeData && {
      address: gnosisSafeData.address,
      owners: gnosisSafeData.owners,
      threshold: Number(gnosisSafeData.threshold),
    },

    // Additional metadata from ponder
    merkleRoot: merkleTreeData?.tree?.root,
    ipfsHashCid: merkleTreeData?.tree?.ipfsHashCid,
    blockNumber: merkleTreeData?.tree?.blockNumber,
    timestamp: merkleTreeData?.tree?.timestamp,
    sources: merkleTreeData?.tree?.sources,

    // Actions
    refresh,

    // Utilities
    isTrustedSeed: isTrustedNetworkSeed,

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
