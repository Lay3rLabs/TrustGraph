# The Plan

## FSV (get a basic thing working)
Fix eas-attest component and Attester.sol contract:
- [x] Response should be an AttestationRequest
- [x] Trigger should be AttestationRequested
- [x] Script to create a new schema
- [x] Clean up trigger script
- [x] Figure out how to query attestations (with indexer)
- [x] Remove log resolver
- [x] Make sure attestations are being indexed
- [x] Add Governor contract example with custom votes extension?
- [x] Update VotingPower.sol to be updatable via the AVS.
- [x] Script to query voting power
- [x] What triggers the EAS compute component: IndexerResolver events
- [x] Make indexer resolver trigger compute
- [x] Fix up deployment so two or more services are deployed (eas-attest and eas-compute)
- [x] Fix up schema id being 0x00000 in eas-compute
- [x] Finish rewards deployment (deploy script for contracts)
- [x] Deploy rewards service
- [x] Fix ERROR Engine(ExecResult("Failed to get reward token address"))
- [x] Add EN0VA frontend
- [x] Set operation to Voting power
- [x] Realistic vouching schema
- [x] Vibe code working attestation UI
- [x] Implement page rank for rewards
- [x] Make a points page.
- [x] Add operations to Attester.sol (revoke, multi-attest, etc.)
- [x] attest method on Attester.sol doesn't really make sense as users should attest to EAS directly.
- [ ] Better computation of attestations (actually use attestation data?)
- [ ] Revoking an attestation should lower voting power
- [ ] Resolver that only let's people who have voting power attest.
- [ ] Vibe code Service UI from service.json (get IPFS hash)
- [ ] Deploy voting power contract with initial set?
- [ ] Make a generic weights contract
- [ ] Vouching app needs to be easy to use

# MVP Merkle Gov:
- [x] New voting power contract to consume merkle tree
- [x] Extend create attestations script to also have alice vouch for my wallets
- [x] Tests for new voting power contract to consume merkle tree (make sure it actually works in theory)
- [x] Deploy scripts for MerkleVote and Merkle Gov contracts
- [x] Wire up rewards component to MerkleVote contract
- [x] Fix frontend rewards claiming
- [ ] Vibe code governance UI

Let's work on @frontend/app/backroom/governance. We're going to be building a Merkle Governance UI for the following two contracts: MerkleVote @src/contracts/MerkleVote.sol and MerkleGov @src/contracts/MerkleGov.sol.

As a user, I want to be able to:
- Create a proposal
- Vote on a proposal
- See a list of proposals
- View proposal details
- Know my voting power

The Merkle Governance system is very similar to how we've implemented rewards. See @frontend/app/backroom/rewards/page.tsx. All the information needed for display is available in the merkle tree on IPFS, and you can query the IPFS CID from the MerkleVote contract. When submitting votes or creating proposals, you'll need to submit proofs as well, similar to how we've done with claiming rewards (the merkle tree is the same in both instances). It may also be helpful to you to look at @frontend/hooks/useRewards.ts and @frontend/components/RewardsCard.tsx.

Try to reuse or create UI components when possible, see the @frontend/components folder. Also see @frontend/wagmi.config.ts and auto-generated @frontend/lib/contracts.ts for contract ABI information.

MVP Symbient
- [ ] Add LLM Module
- [ ] People make an attestation (with payment, some funds go to operators)
- [ ] Deterministic Agent evaluates suggestion ()
- [ ] People attest to which suggestions they like the most
- [ ] The most liked get rewards
- [ ] Mint NFTs of responses and conversations
- [ ] We're going to make a Network Spirituality Holy Text


Project organization (low priority):
- [ ] eas-compute -> eas-compute-voting-power
- [ ] Rename to Voting Power to Membrane? Should a membrane be a resolver?
- [ ] Organize project better (put contracts in folders)

## NEXT FEATURE: Rewards

Attestations are great for creating custom rewards payouts.

The pipeline is simple:
```
ATTESTATION -> REWARDS CALCULATION SERVICE -> RewardsDistributor.sol
```

Can we make these reputation based?

## Future Service Improvements
- [] Add llm component.
- [] Break out Indexer contract, could be modified to be multichain? EAS indexer component (indexes certain attestations without a resolver?)
- [] Add eas-indexer sidecar to docker compose?
- [] JS example using EAS SDK
- [] EAS Verify component? An EAS flow that verifies attestations
- [] Add rewards and eas-compute-rewards component
- [ ] Add safe module
- [] Vesting
- [] More resolvers
- [] UI for demo
- [] Docs and writeup
- [] Symbient exploration
- [] Futarchy
- [] review and fixup tests
- [] ERC20 bridging

# Idea space
### Attestation Components
There could be a whole folder of them!

- [] Attest to social media post
- [] Verification of an Offchain Attestation
- [] Attest to how you feel

### Resolvers
- [] Only if member
- [] Payment / token gating
