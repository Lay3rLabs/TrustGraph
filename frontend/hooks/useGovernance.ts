'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  useAccount,
  useBalance,
  usePublicClient,
  useReadContract,
  useWriteContract,
} from 'wagmi'

import { merkleGovModuleAbi, merkleGovModuleAddress } from '@/lib/contracts'
import { parseErrorMessage } from '@/lib/error'
import { txToast } from '@/lib/tx'

// Types matching the MerkleGovModule contract structs
export interface ProposalAction {
  target: string
  value: string
  data: string
  operation: number // Operation enum (0 = Call, 1 = DelegateCall)
  description?: string // For UI purposes
}

export interface ProposalCore {
  id: bigint
  proposer: string
  startBlock: bigint
  endBlock: bigint
  yesVotes: bigint
  noVotes: bigint
  abstainVotes: bigint
  executed: boolean
  cancelled: boolean
  merkleRoot: string
  totalVotingPower: bigint
  description?: string // For UI purposes
  state: number // ProposalState enum
}

export enum ProposalState {
  Pending = 0,
  Active = 1,
  Rejected = 2,
  Passed = 3,
  Executed = 4,
  Cancelled = 5,
}

export enum VoteType {
  No = 0,
  Yes = 1,
  Abstain = 2,
}

// IPFS helpers (reused from useRewards)
const cidToUrl = (cid: string): string => {
  return `/api/ipfs/${cid}`
}

interface MerkleTreeData {
  tree: Array<{
    account: string
    value: string
    proof: string[]
  }>
  metadata: {
    total_value: string
  }
}

interface VotingPowerEntry {
  account: string
  value: string
  proof: string[]
}

export function useGovernance() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const {
    writeContract,
    isPending: isWriting,
    error: writeError,
    data: writeHash,
  } = useWriteContract({
    mutation: {
      onSuccess: (hash) => {
        console.log(`✅ Proposal transaction submitted: ${hash}`)
      },
      onError: (error) => {
        console.error('Proposal transaction failed:', error)
      },
    },
  })

  // Local state
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [merkleData, setMerkleData] = useState<MerkleTreeData | null>(null)
  const [userVotingPower, setUserVotingPower] =
    useState<VotingPowerEntry | null>(null)

  // Read basic governance parameters from MerkleGovModule
  const { data: proposalCount } = useReadContract({
    address: merkleGovModuleAddress,
    abi: merkleGovModuleAbi,
    functionName: 'proposalCount',
  })

  const { data: votingDelay } = useReadContract({
    address: merkleGovModuleAddress,
    abi: merkleGovModuleAbi,
    functionName: 'votingDelay',
  })

  const { data: votingPeriod } = useReadContract({
    address: merkleGovModuleAddress,
    abi: merkleGovModuleAbi,
    functionName: 'votingPeriod',
  })

  const { data: quorum } = useReadContract({
    address: merkleGovModuleAddress,
    abi: merkleGovModuleAbi,
    functionName: 'quorum',
  })

  const { data: currentMerkleRoot } = useReadContract({
    address: merkleGovModuleAddress,
    abi: merkleGovModuleAbi,
    functionName: 'currentMerkleRoot',
  })

  // Read IPFS hash from MerkleGovModule
  const { data: ipfsHashCid, isLoading: isLoadingHashCid } = useReadContract({
    address: merkleGovModuleAddress,
    abi: merkleGovModuleAbi,
    functionName: 'ipfsHashCid',
  })
  // Get the Safe address from the module's target
  const { data: safeAddress } = useReadContract({
    address: merkleGovModuleAddress,
    abi: merkleGovModuleAbi,
    functionName: 'target',
  })

  // Read Safe ETH balance using useBalance hook
  const { data: safeBalanceData } = useBalance({
    address: safeAddress as `0x${string}`,
  })

  // Fetch merkle data from IPFS
  useEffect(() => {
    const loadMerkleData = async () => {
      if (
        !ipfsHashCid ||
        isLoadingHashCid ||
        ipfsHashCid ===
          '0000000000000000000000000000000000000000000000000000000000000000'
      ) {
        return
      }

      try {
        setIsLoading(true)

        // Convert hex to base58 CID if needed, or use hex directly
        const ipfsUrl = cidToUrl(ipfsHashCid)
        console.log(`Fetching governance merkle data from: ${ipfsUrl}`)

        const response = await fetch(ipfsUrl)
        if (!response.ok) {
          throw new Error(`Failed to fetch IPFS data: ${response.status}`)
        }

        const data: MerkleTreeData = await response.json()
        setMerkleData(data)

        console.log(address, data)

        // Find voting power for current user
        if (address && data.tree) {
          const userPower = data.tree.find(
            (entry) => entry.account.toLowerCase() === address.toLowerCase()
          )
          console.log('Found user voting power:', userPower)
          setUserVotingPower(userPower || null)
        } else {
          console.log('No address or tree data:', {
            address,
            treeLength: data.tree?.length,
          })
        }
      } catch (err) {
        console.error('Error loading governance merkle data:', err)
        setError('Failed to load governance data from IPFS')
      } finally {
        setIsLoading(false)
      }
    }

    loadMerkleData()
  }, [ipfsHashCid, address])

  // Get a single proposal with its actions using the contract's getProposal function
  const getProposal = useCallback(
    async (
      proposalId: number
    ): Promise<{ core: ProposalCore; actions: ProposalAction[] } | null> => {
      if (!publicClient) {
        console.error('Public client not available')
        return null
      }

      try {
        console.log(`Getting proposal ${proposalId}`)

        // Call the contract's getProposal function which returns (Proposal, ProposalState, ProposalAction[])
        const result = await publicClient.readContract({
          address: merkleGovModuleAddress,
          abi: merkleGovModuleAbi,
          functionName: 'getProposal',
          args: [BigInt(proposalId)],
        })

        const [proposalData, proposalState, actions] = result as [
          {
            id: bigint
            proposer: string
            startBlock: bigint
            endBlock: bigint
            yesVotes: bigint
            noVotes: bigint
            abstainVotes: bigint
            executed: boolean
            cancelled: boolean
            merkleRoot: string
            totalVotingPower: bigint
          },
          number,
          Array<{
            target: string
            value: bigint
            data: string
            operation: number
          }>
        ]

        const core: ProposalCore = {
          id: proposalData.id,
          proposer: proposalData.proposer,
          startBlock: proposalData.startBlock,
          endBlock: proposalData.endBlock,
          yesVotes: proposalData.yesVotes,
          noVotes: proposalData.noVotes,
          abstainVotes: proposalData.abstainVotes,
          executed: proposalData.executed,
          cancelled: proposalData.cancelled,
          merkleRoot: proposalData.merkleRoot,
          totalVotingPower: proposalData.totalVotingPower,
          description: `Proposal ${proposalId}`,
          state: Number(proposalState),
        }

        const proposalActions: ProposalAction[] = actions.map((action) => ({
          target: action.target,
          value: action.value.toString(),
          data: action.data,
          operation: Number(action.operation),
          description: `Action for ${action.target}`,
        }))

        return { core, actions: proposalActions }
      } catch (err) {
        console.error(`Error getting proposal ${proposalId}:`, err)
        return null
      }
    },
    [publicClient]
  )

  // Get all proposals (by querying from 1 to proposalCount)
  const getAllProposals = useCallback(async (): Promise<
    { core: ProposalCore; actions: ProposalAction[] }[]
  > => {
    try {
      if (!proposalCount || proposalCount === 0n) {
        console.log('No proposals to fetch')
        return []
      }

      console.log(`Getting all ${proposalCount} proposals`)
      const allProposals: { core: ProposalCore; actions: ProposalAction[] }[] =
        []

      // Query each proposal using getProposal
      for (let i = 1; i <= proposalCount; i++) {
        const proposal = await getProposal(i)
        if (proposal) {
          allProposals.push(proposal)
        }
      }

      console.log(`Fetched ${allProposals.length} proposals`)
      return allProposals
    } catch (err) {
      console.error('Error getting all proposals:', err)
      return []
    }
  }, [proposalCount, getProposal])

  // Create proposal using MerkleGovModule (requires merkle proof for membership)
  const createProposal = useCallback(
    async (
      actions: ProposalAction[],
      description: string
    ): Promise<string | null> => {
      console.log('createProposal called with:', { actions, description })

      if (!isConnected || !address) {
        console.log('Wallet not connected')
        setError('Wallet not connected')
        return null
      }

      if (
        !currentMerkleRoot ||
        currentMerkleRoot ===
          '0x0000000000000000000000000000000000000000000000000000000000000000'
      ) {
        console.log('No merkle root set', { currentMerkleRoot })
        setError('No merkle root set. Governance not initialized.')
        return null
      }

      if (!userVotingPower) {
        setError(
          'No voting power found. Only members of the merkle tree can create proposals.'
        )
        return null
      }

      if (!publicClient) {
        setError('Public client not available')
        return null
      }

      try {
        console.log('Starting proposal creation...')
        setError(null)
        setIsLoading(true)

        // Convert actions to the format expected by MerkleGovModule
        const targets = actions.map((action) => action.target as `0x${string}`)
        const values = actions.map((action) => BigInt(action.value || '0'))
        const calldatas = actions.map((action) => action.data as `0x${string}`)
        const operations = actions.map((action) => action.operation || 0)

        console.log('Proposal parameters:', {
          targets,
          values,
          calldatas,
          operations,
          description,
          votingPower: userVotingPower.value,
          proof: userVotingPower.proof,
        })

        // Get current nonce
        const nonce = await publicClient.getTransactionCount({
          address: address,
          blockTag: 'pending',
        })

        // Estimate gas for the transaction
        const gasEstimate = await publicClient.estimateContractGas({
          address: merkleGovModuleAddress,
          abi: merkleGovModuleAbi,
          functionName: 'propose',
          args: [
            targets,
            values,
            calldatas,
            operations,
            description,
            BigInt(userVotingPower.value),
            userVotingPower.proof as `0x${string}`[],
          ],
          account: address,
        })

        console.log('Gas estimate:', gasEstimate)

        // Get gas price
        const gasPrice = await publicClient.getGasPrice()

        const [receipt] = await txToast({
          tx: {
            address: merkleGovModuleAddress,
            abi: merkleGovModuleAbi,
            functionName: 'propose',
            args: [
              targets,
              values,
              calldatas,
              operations,
              description,
              BigInt(userVotingPower.value),
              userVotingPower.proof as `0x${string}`[],
            ],
            gas: (gasEstimate * 120n) / 100n, // Add 20% buffer
            gasPrice,
            nonce,
            type: 'legacy',
          },
          successMessage: 'Proposal created!',
        })

        return receipt.transactionHash
      } catch (err: any) {
        console.error('Error creating proposal:', err)
        setError(`Failed to create proposal: ${parseErrorMessage(err)}`)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [
      isConnected,
      address,
      currentMerkleRoot,
      userVotingPower,
      publicClient,
      writeContract,
      writeHash,
      writeError,
    ]
  )

  // Helper to get voting power for a specific merkle root (used for voting on proposals)
  const getVotingPowerForMerkleRoot = useCallback(
    async (
      merkleRoot: string,
      voterAddress: string
    ): Promise<VotingPowerEntry | null> => {
      if (!publicClient) return null

      // If it matches the current merkle root, use the already-loaded data
      if (merkleRoot === currentMerkleRoot && merkleData) {
        const entry = merkleData.tree.find(
          (e) => e.account.toLowerCase() === voterAddress.toLowerCase()
        )
        return entry || null
      }

      // Otherwise, we need to find the IPFS CID for this merkle root by querying events
      try {
        console.log(`Looking up merkle data for root: ${merkleRoot}`)

        // Query MerkleRootUpdated events to find the CID for this root
        const logs = await publicClient.getLogs({
          address: merkleGovModuleAddress,
          event: {
            type: 'event',
            name: 'MerkleRootUpdated',
            inputs: [
              { type: 'bytes32', name: 'root', indexed: true },
              { type: 'bytes32', name: 'ipfsHash', indexed: true },
              { type: 'string', name: 'ipfsHashCid', indexed: false },
              { type: 'uint256', name: 'totalValue', indexed: false },
            ],
          },
          args: {
            root: merkleRoot as `0x${string}`,
          },
          fromBlock: 'earliest',
          toBlock: 'latest',
        })

        if (logs.length === 0) {
          console.error(`No MerkleRootUpdated event found for root: ${merkleRoot}`)
          return null
        }

        // Get the IPFS CID from the event
        const ipfsCid = (logs[0] as any).args.ipfsHashCid as string
        console.log(`Found IPFS CID for merkle root: ${ipfsCid}`)

        // Fetch the merkle data from IPFS
        const ipfsUrl = cidToUrl(ipfsCid)
        const response = await fetch(ipfsUrl)
        if (!response.ok) {
          throw new Error(`Failed to fetch IPFS data: ${response.status}`)
        }

        const data: MerkleTreeData = await response.json()

        // Find the user's entry
        const entry = data.tree.find(
          (e) => e.account.toLowerCase() === voterAddress.toLowerCase()
        )
        return entry || null
      } catch (err) {
        console.error('Error fetching merkle data for root:', err)
        return null
      }
    },
    [publicClient, currentMerkleRoot, merkleData]
  )

  // Cast vote with merkle proof (uses the proposal's snapshotted merkle root)
  const castVote = useCallback(
    async (proposalId: number, support: VoteType): Promise<string | null> => {
      if (!isConnected || !address) {
        setError('Wallet not connected')
        return null
      }

      if (!publicClient) {
        setError('Public client not available')
        return null
      }

      try {
        setError(null)
        setIsLoading(true)

        // Get the proposal to find its snapshotted merkle root
        const proposal = await getProposal(proposalId)
        if (!proposal) {
          setError('Proposal not found')
          return null
        }

        // Get voting power for the proposal's merkle root (not the current one)
        const votingPower = await getVotingPowerForMerkleRoot(
          proposal.core.merkleRoot,
          address
        )

        if (!votingPower) {
          setError(
            'No voting power found for this proposal. You may not have been a member when it was created.'
          )
          return null
        }

        console.log('Casting vote with:', {
          proposalId: BigInt(proposalId),
          voteType: support,
          proposalMerkleRoot: proposal.core.merkleRoot,
          votingPower: votingPower.value,
          proof: votingPower.proof,
        })

        // Get current nonce
        const nonce = await publicClient.getTransactionCount({
          address: address,
          blockTag: 'pending',
        })

        // Estimate gas
        const gasEstimate = await publicClient.estimateContractGas({
          address: merkleGovModuleAddress,
          abi: merkleGovModuleAbi,
          functionName: 'castVote',
          args: [
            BigInt(proposalId),
            support,
            BigInt(votingPower.value),
            votingPower.proof as `0x${string}`[],
          ],
          account: address,
        })

        // Get gas price
        const gasPrice = await publicClient.getGasPrice()

        // Call writeContract
        const [receipt] = await txToast({
          tx: {
            address: merkleGovModuleAddress,
            abi: merkleGovModuleAbi,
            functionName: 'castVote',
            args: [
              BigInt(proposalId),
              support,
              BigInt(votingPower.value),
              votingPower.proof as `0x${string}`[],
            ],
            gas: (gasEstimate * 120n) / 100n,
            gasPrice,
            nonce,
            type: 'legacy',
          },
          successMessage: 'Vote cast!',
        })

        return receipt.transactionHash
      } catch (err: any) {
        console.error('Error casting vote:', err)
        setError(`Failed to cast vote: ${parseErrorMessage(err)}`)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [
      isConnected,
      address,
      publicClient,
      getProposal,
      getVotingPowerForMerkleRoot,
    ]
  )

  // No queuing in MerkleGovModule - proposals go directly from Passed to executable
  const queueProposal = useCallback(async (_proposalId: number) => {
    console.log(
      'Queue not supported in MerkleGovModule - proposals are directly executable when succeeded'
    )
    return null
  }, [])

  // Execute proposal
  const executeProposal = useCallback(
    async (proposalId: number): Promise<string | null> => {
      if (!isConnected || !address) {
        setError('Wallet not connected')
        return null
      }

      if (!publicClient) {
        setError('Public client not available')
        return null
      }

      try {
        setError(null)
        setIsLoading(true)

        console.log('Executing proposal:', proposalId)

        // Get current nonce
        const nonce = await publicClient.getTransactionCount({
          address: address,
          blockTag: 'pending',
        })

        // Estimate gas
        const gasEstimate = await publicClient.estimateContractGas({
          address: merkleGovModuleAddress,
          abi: merkleGovModuleAbi,
          functionName: 'execute',
          args: [BigInt(proposalId)],
          account: address,
        })

        // Get gas price
        const gasPrice = await publicClient.getGasPrice()

        const [receipt] = await txToast({
          tx: {
            address: merkleGovModuleAddress,
            abi: merkleGovModuleAbi,
            functionName: 'execute',
            args: [BigInt(proposalId)],
            gas: (gasEstimate * 120n) / 100n,
            gasPrice,
            nonce,
            type: 'legacy',
          },
          successMessage: 'Proposal executed!',
        })

        return receipt.transactionHash
      } catch (err: any) {
        console.error('Error executing proposal:', err)
        setError(`Failed to execute proposal: ${parseErrorMessage(err)}`)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [isConnected, address, publicClient, writeContract, writeHash, writeError]
  )

  // Helper functions
  const formatVotingPower = (amount: string | undefined) => {
    if (!amount || amount === '0') return '0'
    const value = BigInt(amount)
    const formatted = Number(value) / Math.pow(10, 18)
    return formatted.toFixed(6)
  }

  const getProposalStateText = (state: number): string => {
    switch (state) {
      case ProposalState.Pending:
        return 'Pending'
      case ProposalState.Active:
        return 'Active'
      case ProposalState.Rejected:
        return 'Rejected'
      case ProposalState.Passed:
        return 'Passed'
      case ProposalState.Executed:
        return 'Executed'
      case ProposalState.Cancelled:
        return 'Cancelled'
      default:
        return 'Unknown'
    }
  }

  const canCreateProposal = (): boolean => {
    // In MerkleGovModule, only members of the merkle tree can create proposals
    return (
      currentMerkleRoot !== undefined &&
      currentMerkleRoot !==
        '0x0000000000000000000000000000000000000000000000000000000000000000' &&
      userVotingPower !== null
    )
  }

  return {
    // Loading states
    isLoading: isLoading || isWriting,
    error,

    // Governance parameters
    proposalCounter: proposalCount ? Number(proposalCount) : 0,
    proposalThreshold: '0', // No threshold in MerkleGovModule
    votingDelay: votingDelay ? Number(votingDelay) : 0,
    votingPeriod: votingPeriod ? Number(votingPeriod) : 0,
    quorumBasisPoints: quorum ? Number(quorum) * 100 : 0, // Convert to basis points
    safeBalance: safeBalanceData?.value
      ? safeBalanceData.value.toString()
      : '0',
    safeAddress: safeAddress as string,

    // User data
    userVotingPower,
    merkleData,
    canCreateProposal: canCreateProposal(),

    // Actions
    createProposal,
    castVote,
    queueProposal,
    executeProposal,
    getAllProposals,
    getProposal,

    // Utilities
    formatVotingPower,
    getProposalStateText,

    // Contract addresses
    merkleGovAddress: merkleGovModuleAddress,
    merkleVoteAddress: merkleGovModuleAddress, // Same contract now
  }
}
