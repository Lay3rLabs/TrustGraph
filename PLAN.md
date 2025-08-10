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
- [ ] Fix up schema id being 0x00000 in eas-compute
- [ ] eas-compute -> eas-compute-voting-power
- [ ] Realistic vouching schema
- [ ] Rename to Voting Power to points?
- [ ] Add configuration to EAS compute component?


We need to modify the deployment of our WAVS service to upload another component.

@script/deploy-script.sh is the main deployment script with all our logic. Most of it does not need to change except the `### === Deploy Services ===` section.

Our WASM components live in the @compiled folder. We want to deploy only the `wavs_eas_attest.wasm` component (already deployed) and `wavs_eas_compute.wasm` component (we will add this one).

First we need to upload both components using @script/upload-to-wasi-registry.sh.

Then we need to modify the @script/build-service.sh script to build a service involving both components.

Most of the component configuration will be the same, with the execption of:
- TRIGGER_EVENT
- SUBMIT_ADDRESS
- TRIGGER_ADDRESS

For `wavs_eas_attest.wasm`, the configuration will be:
- TRIGGER_EVENT: "AttestationRequested(address,bytes32,address,bytes)"
- SUBMIT_ADDRESS: `jq -r '.eas_contracts.attester' .docker/deployment_summary.json`
- TRIGGER_ADDRESS: `jq -r '.service_contracts.trigger' .docker/deployment_summary.json`

For `wavs_eas_compute.wasm`, the configuration will be:
- TRIGGER_EVENT: "Attested(address,address,bytes32,bytes32)"
- SUBMIT_ADDRESS: `jq -r '.governance_contracts.voting_power' .docker/deployment_summary.json`
- TRIGGER_ADDRESS: `jq -r '.eas_contracts.indexer_resolver' .docker/deployment_summary.json`

Each component will have a new WORKFLOW_ID. SERVICE_ID is the same for both components.

It would be nice to do this in a way that makes it easier to add other components in the future. Do not over optimize, when you're ready to test let me know and I'll help you.


## Future Service Improvements
- [] Break out Indexer contract, could be modified to be multichain? EAS indexer component (indexes certain attestations without a resolver?)
- [] Add eas-indexer sidecar to docker compose?
- [] Add WAVS workflows?
- [] Expand the registrar to be a WAVS service?
- [] EAS Verify component? An EAS flow that verifies attestations
- [] Add rewards and eas-compute-rewards component
- [] Add llm component.
- [] More resolvers
- [] UI for demo
- [] Docs and writeup
- [] Symbient exploration
- [] review and fixup tests
- [ ] ERC20 contract


# Idea space
### Attestation Components
There could be a whole folder of them!

- [] Attest to social media post
- [] Verification of an Offchain Attestation
- [] Attest to how you feel

### Resolvers
- [] Only if member
- [] Payment / token gating
