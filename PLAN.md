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
- [ ] Better computation of attestations (actually use attestation data?)
- [ ] Add operations to Attester.sol (revoke, multi-attest, etc.)
- [ ] attest method on Attester.sol doesn't really make sense as users should attest to EAS directly.
- [ ] Revoking an attestation should lower voting power
- [ ] New voting power contract to consume merkle tree
- [ ] Resolver that only let's people who have voting power attest.
- [ ] Add symbient
- [ ] Vibe code Service UI from service.json (get IPFS hash)
- [ ] Deploy voting power contract with initial set?

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
