import { ponder } from 'ponder:registry'
import {
  merkleGovModule,
  merkleGovModuleProposal,
  merkleGovModuleVote,
} from 'ponder:schema'

import { merkleGovModuleAbi } from '../../frontend/lib/contracts'

// Helper type for proposal actions
type ProposalAction = {
  target: string
  value: string
  data: string
  operation: number
}

// Setup: Initialize the module state from the contract
ponder.on('merkleGovModule:setup', async ({ context }) => {
  try {
    const address = context.contracts.merkleGovModule.address!

    // Read all relevant state from the contract
    const [
      merkleSnapshotContract,
      currentMerkleRoot,
      ipfsHash,
      ipfsHashCid,
      totalVotingPower,
      proposalCount,
      votingDelay,
      votingPeriod,
      quorum,
    ] = await Promise.all([
      context.client.readContract({
        address,
        abi: merkleGovModuleAbi,
        functionName: 'merkleSnapshotContract',
      }),
      context.client.readContract({
        address,
        abi: merkleGovModuleAbi,
        functionName: 'currentMerkleRoot',
      }),
      context.client.readContract({
        address,
        abi: merkleGovModuleAbi,
        functionName: 'ipfsHash',
      }),
      context.client.readContract({
        address,
        abi: merkleGovModuleAbi,
        functionName: 'ipfsHashCid',
      }),
      context.client.readContract({
        address,
        abi: merkleGovModuleAbi,
        functionName: 'totalVotingPower',
      }),
      context.client.readContract({
        address,
        abi: merkleGovModuleAbi,
        functionName: 'proposalCount',
      }),
      context.client.readContract({
        address,
        abi: merkleGovModuleAbi,
        functionName: 'votingDelay',
      }),
      context.client.readContract({
        address,
        abi: merkleGovModuleAbi,
        functionName: 'votingPeriod',
      }),
      context.client.readContract({
        address,
        abi: merkleGovModuleAbi,
        functionName: 'quorum',
      }),
    ])

    await context.db.insert(merkleGovModule).values({
      address,
      merkleSnapshot: merkleSnapshotContract,
      currentMerkleRoot,
      ipfsHash,
      ipfsHashCid,
      totalVotingPower,
      proposalCount,
      votingDelay,
      votingPeriod,
      quorum,
    })

    // Index any existing proposals
    for (let i = 1n; i <= proposalCount; i++) {
      const [proposal, , actions] = await context.client.readContract({
        address,
        abi: merkleGovModuleAbi,
        functionName: 'getProposal',
        args: [i],
      })

      // Format actions for JSON storage
      const formattedActions: ProposalAction[] = actions.map((action) => ({
        target: action.target,
        value: action.value.toString(),
        data: action.data,
        operation: Number(action.operation),
      }))

      await context.db.insert(merkleGovModuleProposal).values({
        module: address,
        id: proposal.id,
        proposer: proposal.proposer,
        startBlock: proposal.startBlock,
        endBlock: proposal.endBlock,
        yesVotes: proposal.yesVotes,
        noVotes: proposal.noVotes,
        abstainVotes: proposal.abstainVotes,
        executed: proposal.executed,
        cancelled: proposal.cancelled,
        merkleRoot: proposal.merkleRoot,
        totalVotingPower: proposal.totalVotingPower,
        actions: formattedActions,
        // Use current block for setup (we don't have the original block)
        blockNumber: 0n,
        timestamp: 0n,
      })
    }
  } catch {
    // Contract may not be deployed yet
    return
  }
})

// ProposalCreated: Create a new proposal record
ponder.on('merkleGovModule:ProposalCreated', async ({ event, context }) => {
  const { proposalId, proposer, startBlock, endBlock, merkleRoot } = event.args
  const address = context.contracts.merkleGovModule.address!

  // Get full proposal data including actions from contract
  const [proposal, , actions] = await context.client.readContract({
    address,
    abi: merkleGovModuleAbi,
    functionName: 'getProposal',
    args: [proposalId],
  })

  // Format actions for JSON storage
  const formattedActions: ProposalAction[] = actions.map((action) => ({
    target: action.target,
    value: action.value.toString(),
    data: action.data,
    operation: Number(action.operation),
  }))

  // Insert the new proposal
  await context.db.insert(merkleGovModuleProposal).values({
    module: address,
    id: proposalId,
    proposer,
    startBlock,
    endBlock,
    yesVotes: 0n,
    noVotes: 0n,
    abstainVotes: 0n,
    executed: false,
    cancelled: false,
    merkleRoot,
    totalVotingPower: proposal.totalVotingPower,
    actions: formattedActions,
    blockNumber: event.block.number,
    timestamp: event.block.timestamp,
  })

  // Update proposal count on the module
  await context.db
    .update(merkleGovModule, { address })
    .set({ proposalCount: proposalId })
})

// VoteCast: Record the vote and update vote counts on the proposal
ponder.on('merkleGovModule:VoteCast', async ({ event, context }) => {
  const { voter, proposalId, voteType, votingPower } = event.args
  const address = context.contracts.merkleGovModule.address!

  // Insert the vote record
  await context.db.insert(merkleGovModuleVote).values({
    module: address,
    proposalId,
    voter,
    voteType: Number(voteType),
    votingPower,
    blockNumber: event.block.number,
    timestamp: event.block.timestamp,
  })

  // Get current proposal state
  const [proposal] = await context.client.readContract({
    address,
    abi: merkleGovModuleAbi,
    functionName: 'getProposal',
    args: [proposalId],
  })

  // Update with the latest vote counts from the contract
  await context.db
    .update(merkleGovModuleProposal, { module: address, id: proposalId })
    .set({
      yesVotes: proposal.yesVotes,
      noVotes: proposal.noVotes,
      abstainVotes: proposal.abstainVotes,
    })
})

// ProposalExecuted: Mark proposal as executed
ponder.on('merkleGovModule:ProposalExecuted', async ({ event, context }) => {
  const { proposalId } = event.args
  const address = context.contracts.merkleGovModule.address!

  await context.db
    .update(merkleGovModuleProposal, { module: address, id: proposalId })
    .set({ executed: true })
})

// ProposalCancelled: Mark proposal as cancelled
ponder.on('merkleGovModule:ProposalCancelled', async ({ event, context }) => {
  const { proposalId } = event.args
  const address = context.contracts.merkleGovModule.address!

  await context.db
    .update(merkleGovModuleProposal, { module: address, id: proposalId })
    .set({ cancelled: true })
})

// QuorumUpdated: Update quorum on the module
ponder.on('merkleGovModule:QuorumUpdated', async ({ event, context }) => {
  const { newQuorum } = event.args
  const address = context.contracts.merkleGovModule.address!

  await context.db
    .update(merkleGovModule, { address })
    .set({ quorum: newQuorum })
})

// VotingDelayUpdated: Update voting delay on the module
ponder.on('merkleGovModule:VotingDelayUpdated', async ({ event, context }) => {
  const { newDelay } = event.args
  const address = context.contracts.merkleGovModule.address!

  await context.db
    .update(merkleGovModule, { address })
    .set({ votingDelay: newDelay })
})

// VotingPeriodUpdated: Update voting period on the module
ponder.on('merkleGovModule:VotingPeriodUpdated', async ({ event, context }) => {
  const { newPeriod } = event.args
  const address = context.contracts.merkleGovModule.address!

  await context.db
    .update(merkleGovModule, { address })
    .set({ votingPeriod: newPeriod })
})

// MerkleSnapshotContractUpdated: Update merkle snapshot address on the module
ponder.on(
  'merkleGovModule:MerkleSnapshotContractUpdated',
  async ({ event, context }) => {
    const { newContract } = event.args
    const address = context.contracts.merkleGovModule.address!

    await context.db
      .update(merkleGovModule, { address })
      .set({ merkleSnapshot: newContract })
  }
)

// MerkleRootUpdated (from IMerkleSnapshot): Update merkle state on the module
ponder.on('merkleGovModule:MerkleRootUpdated', async ({ event, context }) => {
  const { root, ipfsHash, ipfsHashCid, totalValue } = event.args
  const address = context.contracts.merkleGovModule.address!

  await context.db.update(merkleGovModule, { address }).set({
    currentMerkleRoot: root,
    ipfsHash,
    ipfsHashCid,
    totalVotingPower: totalValue,
  })
})
