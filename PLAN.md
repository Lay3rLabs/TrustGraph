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
- [ ] Realistic vouching schema
- [ ] Better computation of attestations
- [ ] eas-compute -> eas-compute-voting-power
- [ ] Rename to Voting Power to Membrane? Should a membrane be a resolver?
- [ ] Set operation to Voting power
- [ ] Add operations to Attester.sol (revoke, multi-attest, etc.)

## Future Service Improvements
- [] Break out Indexer contract, could be modified to be multichain? EAS indexer component (indexes certain attestations without a resolver?)
- [] Add eas-indexer sidecar to docker compose?
- [] JS example using EAS SDK
- [] EAS Verify component? An EAS flow that verifies attestations
- [] Add rewards and eas-compute-rewards component
- [] Add llm component.
- [] More resolvers
- [] UI for demo
- [] Docs and writeup
- [] Symbient exploration
- [] review and fixup tests
- [] ERC20 contract


# Idea space
### Attestation Components
There could be a whole folder of them!

- [] Attest to social media post
- [] Verification of an Offchain Attestation
- [] Attest to how you feel

### Resolvers
- [] Only if member
- [] Payment / token gating
