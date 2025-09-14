'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  useAccount,
  useBalance,
  usePublicClient,
  useReadContract,
  useWriteContract,
} from 'wagmi'

import {
  merkleGovModuleAbi,
  merkleGovModuleAddress,
  mockUsdcAddress,
} from '@/lib/contracts'
import { writeEthContractAndWait } from '@/lib/utils'

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
  forVotes: bigint
  againstVotes: bigint
  abstainVotes: bigint
  executed: boolean
  cancelled: boolean
  merkleRoot: string
  description?: string // For UI purposes
  state: number // ProposalState enum
}

export enum ProposalState {
  Pending = 0,
  Active = 1,
  Defeated = 2,
  Succeeded = 3,
  Executed = 4,
  Cancelled = 5,
}

export enum VoteType {
  Against = 0,
  For = 1,
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

  // Get a single proposal with its actions
  const getProposal = useCallback(
    async (
      proposalId: number
    ): Promise<{ core: ProposalCore; actions: ProposalAction[] } | null> => {
      try {
        console.log(`Getting proposal ${proposalId}`)
        // This is a simplified implementation. In production, you'd use a subgraph or multicall
        // For now, we'll return a placeholder structure
        return {
          core: {
            id: BigInt(proposalId),
            proposer: '0x0000000000000000000000000000000000000000',
            startBlock: BigInt(0),
            endBlock: BigInt(0),
            forVotes: BigInt(0),
            againstVotes: BigInt(0),
            abstainVotes: BigInt(0),
            executed: false,
            cancelled: false,
            merkleRoot:
              '0x0000000000000000000000000000000000000000000000000000000000000000',
            description: 'Proposal data not loaded',
            state: 0,
          },
          actions: [],
        }
      } catch (err) {
        console.error(`Error getting proposal ${proposalId}:`, err)
        return null
      }
    },
    []
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
      const proposals: { core: ProposalCore; actions: ProposalAction[] }[] = []

      if (!publicClient) {
        console.error('Public client not available')
        return []
      }

      // Query each proposal individually
      for (let i = 1; i <= proposalCount; i++) {
        try {
          // Read proposal core data
          const proposalData = await publicClient.readContract({
            address: merkleGovModuleAddress,
            abi: merkleGovModuleAbi,
            functionName: 'proposals',
            args: [BigInt(i)],
          })

          // Read proposal actions
          const actions = await publicClient.readContract({
            address: merkleGovModuleAddress,
            abi: merkleGovModuleAbi,
            functionName: 'getActions',
            args: [BigInt(i)],
          })

          // Get proposal state
          const proposalState = await publicClient.readContract({
            address: merkleGovModuleAddress,
            abi: merkleGovModuleAbi,
            functionName: 'state',
            args: [BigInt(i)],
          })

          const [
            id,
            proposer,
            startBlock,
            endBlock,
            forVotes,
            againstVotes,
            abstainVotes,
            executed,
            cancelled,
            merkleRoot,
          ] = proposalData as [
            bigint,
            string,
            bigint,
            bigint,
            bigint,
            bigint,
            bigint,
            boolean,
            boolean,
            string
          ]

          const core: ProposalCore = {
            id: id,
            proposer: proposer,
            startBlock: startBlock,
            endBlock: endBlock,
            forVotes: forVotes,
            againstVotes: againstVotes,
            abstainVotes: abstainVotes,
            executed: executed,
            cancelled: cancelled,
            merkleRoot: merkleRoot,
            description: `Proposal ${i}`, // We don't store description in contract
            state: Number(proposalState),
          }

          const proposalActions: ProposalAction[] = (actions as any[]).map(
            (action: any) => ({
              target: action.target,
              value: BigInt(action.value).toString(),
              data: action.data,
              operation: Number(action.operation),
              description: `Action for ${action.target}`,
            })
          )

          proposals.push({ core, actions: proposalActions })
        } catch (err) {
          console.error(`Error fetching proposal ${i}:`, err)
        }
      }

      console.log(`Fetched ${proposals.length} proposals`)
      return proposals
    } catch (err) {
      console.error('Error getting all proposals:', err)
      return []
    }
  }, [proposalCount, publicClient])

  // Create proposal using MerkleGovModule
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
          args: [targets, values, calldatas, operations, description],
          account: address,
        })

        console.log('Gas estimate:', gasEstimate)

        // Get gas price
        const gasPrice = await publicClient.getGasPrice()

        console.log('Calling writeContract...')

        // Call writeContract and wait for it to return a hash
        await writeEthContractAndWait({
          address: merkleGovModuleAddress,
          abi: merkleGovModuleAbi,
          functionName: 'propose',
          args: [targets, values, calldatas, operations, description],
          gas: (gasEstimate * BigInt(120)) / BigInt(100), // Add 20% buffer
          gasPrice: gasPrice,
          nonce,
          type: 'legacy',
        })

        // Return a promise that resolves when the transaction hash is available
        return new Promise((resolve, reject) => {
          // Set up a listener for when writeHash changes
          const checkForHash = () => {
            if (writeHash) {
              console.log('Transaction hash received:', writeHash)
              resolve(writeHash)
              return
            }
            if (writeError) {
              console.error('Write error:', writeError)
              reject(writeError)
              return
            }
            // Check again in 100ms
            setTimeout(checkForHash, 100)
          }

          // Start checking
          setTimeout(checkForHash, 100)

          // Timeout after 30 seconds
          setTimeout(() => {
            reject(
              new Error('Transaction timeout - no response after 30 seconds')
            )
          }, 30000)
        })
      } catch (err: any) {
        console.error('Error creating proposal:', err)
        setError(
          `Failed to create proposal: ${
            err.message || err.shortMessage || 'Unknown error'
          }`
        )
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [
      isConnected,
      address,
      currentMerkleRoot,
      publicClient,
      writeContract,
      writeHash,
      writeError,
    ]
  )

  // Cast vote with merkle proof
  const castVote = useCallback(
    async (proposalId: number, support: VoteType): Promise<string | null> => {
      if (!isConnected || !address) {
        setError('Wallet not connected')
        return null
      }

      if (!userVotingPower) {
        setError(
          'No voting power found. Please check if you have governance tokens.'
        )
        return null
      }

      if (!publicClient) {
        setError('Public client not available')
        return null
      }

      try {
        setError(null)
        setIsLoading(true)

        console.log('Casting vote with:', {
          proposalId: BigInt(proposalId),
          voteType: support,
          votingPower: userVotingPower.value,
          rewardToken: mockUsdcAddress,
          proof: userVotingPower.proof,
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
            BigInt(userVotingPower.value),
            mockUsdcAddress,
            userVotingPower.proof as `0x${string}`[],
          ],
          account: address,
        })

        // Get gas price
        const gasPrice = await publicClient.getGasPrice()

        // Call writeContract
        await writeEthContractAndWait({
          address: merkleGovModuleAddress,
          abi: merkleGovModuleAbi,
          functionName: 'castVote',
          args: [
            BigInt(proposalId),
            support,
            BigInt(userVotingPower.value),
            mockUsdcAddress,
            userVotingPower.proof as `0x${string}`[],
          ],
          gas: (gasEstimate * BigInt(120)) / BigInt(100),
          gasPrice: gasPrice,
          nonce,
          type: 'legacy',
        })

        // Return promise that resolves when the transaction hash is available
        return new Promise((resolve, reject) => {
          const checkForHash = () => {
            if (writeHash) {
              console.log('Vote transaction hash received:', writeHash)
              resolve(writeHash)
              return
            }
            if (writeError) {
              console.error('Vote write error:', writeError)
              reject(writeError)
              return
            }
            setTimeout(checkForHash, 100)
          }

          setTimeout(checkForHash, 100)

          setTimeout(() => {
            reject(
              new Error(
                'Vote transaction timeout - no response after 30 seconds'
              )
            )
          }, 30000)
        })
      } catch (err: any) {
        console.error('Error casting vote:', err)
        setError(
          `Failed to cast vote: ${
            err.message || err.shortMessage || 'Unknown error'
          }`
        )
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [
      isConnected,
      address,
      userVotingPower,
      merkleData,
      publicClient,
      writeContract,
      writeHash,
      writeError,
    ]
  )

  // No queuing in MerkleGovModule - proposals go directly from Succeeded to executable
  const queueProposal = useCallback(async () => {
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

        // Call writeContract
        await writeEthContractAndWait({
          address: merkleGovModuleAddress,
          abi: merkleGovModuleAbi,
          functionName: 'execute',
          args: [BigInt(proposalId)],
          gas: (gasEstimate * BigInt(120)) / BigInt(100),
          gasPrice: gasPrice,
          nonce,
          type: 'legacy',
        })

        // Return promise that resolves when the transaction hash is available
        return new Promise((resolve, reject) => {
          const checkForHash = () => {
            if (writeHash) {
              console.log('Execute transaction hash received:', writeHash)
              resolve(writeHash)
              return
            }
            if (writeError) {
              console.error('Execute write error:', writeError)
              reject(writeError)
              return
            }
            setTimeout(checkForHash, 100)
          }

          setTimeout(checkForHash, 100)

          setTimeout(() => {
            reject(
              new Error(
                'Execute transaction timeout - no response after 30 seconds'
              )
            )
          }, 30000)
        })
      } catch (err: any) {
        console.error('Error executing proposal:', err)
        setError(
          `Failed to execute proposal: ${
            err.message || err.shortMessage || 'Unknown error'
          }`
        )
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
      case ProposalState.Defeated:
        return 'Defeated'
      case ProposalState.Succeeded:
        return 'Succeeded'
      case ProposalState.Executed:
        return 'Executed'
      case ProposalState.Cancelled:
        return 'Cancelled'
      default:
        return 'Unknown'
    }
  }

  const canCreateProposal = (): boolean => {
    // In MerkleGovModule, anyone can create a proposal if merkle root is set
    return (
      currentMerkleRoot !== undefined &&
      currentMerkleRoot !==
        '0x0000000000000000000000000000000000000000000000000000000000000000'
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
