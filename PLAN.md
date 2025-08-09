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
- [ ] eas-compute -> eas-compute-voting-power
- [ ] Realistic vouching schema
- [ ] Rename to Voting Power to points?
- [ ] Add configuration to EAS compute component?
- [ ] Fix up deployment so two or more services are deployed (eas-attest and eas-compute)


## Future Service Improvements
- [] Break out Indexer contract, could be modified to be multichain? EAS indexer component (indexes certain attestations without a resolver?)
- [] Add eas-indexer sidecar to docker compose?
- [] Add WAVS workflows?
- [] Expand the registrar to be a WAVS service?
- [] EAS Verify component? An EAS flow that verifies attestations
- [] Add rewards and eas-compute-rewards component
- [] More resolvers
- [] UI for demo
- [] Docs and writeup
- [] Symbient exploration
