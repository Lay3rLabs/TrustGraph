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
- [ ] New eas-compute-voting-power component: loads attestations for a recipient and does compute over them to calculate voting power (trigger on an epcoh basis? per vote?)
- [ ] Realistic vouching schema
- [ ] Script to query voting power
- [ ] Rename to Voting Power to points?
- [x] What triggers the EAS compute component: IndexerResolver events
- [ ] Make indexer resolver trigger compute
- [ ] Add configuration to EAS compute component?
- [ ] Fix up deployment so two or more services are deployed (eas-attest and eas-compute)

## Service Improvements
- [] Break out Indexer contract, could be modified to be multichain? EAS indexer component (indexes certain attestations without a resolver?)
- [] Add eas-indexer sidecar to docker compose?
- [] Add WAVS workflows?
- [] Expand the registrar to be a WAVS service?
- [] EAS Verify component? An EAS flow that verifies attestations
- [] Add rewards and eas-compute-rewards component
- [] More resolvers
- [] UI for demo
- [] Docs
- [] Symbient exploration
