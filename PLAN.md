# The Plan

# Epochs
- [x] WAVS zodiac modules to replace MerkleGov and MerkleVote
- [-] Prediction market -> working hyperstition market
- [-] Add LLM package / component (attester example?)
- [ ] WAVS-NFT contracts (just contracts)
- [ ] Wavs Service Manager if we want to go crazy

# Next steps
- [x] Deploy Prediction market
- [x] Fix up Zodiac modules
- [x] Fund safe when setting up zodiac modules
- [ ] Add IPFS CID to merkle gov module to fix ui
- [ ] Merkle gov module probably needs some notion of total voting power
- [ ] Redo governance UI to work with new zodiac modules + safe
- [ ] Get prediction market to actually work (currently partially working)
- [ ] Add ollama docker container?
- [ ] Clean up wavs-llm package
- [ ] Make LLM attester
- [ ] Automatically make attestations when participating in prediction market

We've recently refactored our governance contracts to use Gnosis Safe + some custom zodiac governance modules.

The new modules are:
- @src/contracts/zodiac/SignerManagerModule.sol
- @src/contracts/zodiac/MerkleGovModule.sol

We need to update the governance UI to work with the new zodiac modules and safe. Backwards compatibility is not needed. See @frontend/app/backroom/governance/page.tsx and @frontend/hooks/useGovernance.ts.

I've updated @frontend/wagmi.config.ts with the latest smart contract ABIs available in @frontend/lib/contracts.ts.

The main page will tied to the MerkleGovModule.sol module (as it is our main focus). It should have an Safe button which will link externally to the Gnosis Safe address.

As a user I should be able to:
- create a proposal (let's default the UX to making a basic spend proposal while still allowing for more complex proposals)
- see how much ETH the Safe has
- see how much voting power I have (which we still get from the Merkle Tree)
- see a list of proposals
- see the details of a proposal
- Vote on a proposal
- Execute a passed proposal

# Project Organization and Cleanup TODO
- [x] Sepolia
- [ ] Organize project better (put contracts in folders)
- [ ] No IWavsTrigger2
- [ ] Use better upstream WAVS patterns
- [ ] Add config values to components-config.json (currently all components share the same config lol)
- [ ] Investigate why dao-agent doesn't compile running make build
- [ ] Unnessary envrionement variables in Demo (many redundent ones)

### Project organization (contracts)

Let's reorganize our src/contracts folder as we've added new contracts.

Let's make a new `eas` folder and move in the following contracts:
- Attester.sol
- Indexer.sol
- IndexerResolver.sol
- OffchainAttestationVerifier.sol
- SchemaRegistrar.sol

Let's make a new `rewards` folder and move in the following contracts:
- RewardDistributor.sol

Let's make a new `governance` folder and move in the following contracts:
- Governor.sol
- MerkleGov.sol
- MerkleVote.sol
- VotingPower.sol

Let's make a new `tokens` folder and move in the following contracts:
- ERC20.sol
- MockUSDC.sol

Let's make a `misc` folder and move in the following contracts:
- Daico.sol
- Trigger.sol

# Misc improvements
- [ ] Better computation of attestations (actually use attestation data?)
- [ ] Revoking an attestation should lower voting power
- [ ] Resolver that only let's people who have voting power attest.
- [ ] Vibe code Service UI from service.json (get IPFS hash)
- [ ] Make a generic weights contract?
- [ ] Make a Zodiac module

### Zodiac Modules
Let's use a zodiac module + safe to create a system with a nice fallback while we're experimenting with novel governance mechanisms.

1. Basic Setup:
- [x] Create a basic Zodiac module
- [x] Create a basic Zodiac module that is able to update signers on a safe
- [x] Create a deploy script that deploys two Safes with each of the custom zodiac modules
- [x] Basic test scaffold

2. MVP
- [ ] Module for direct voting with Merkle Proofs (similar to MerkleGov + MerkleVote)
- [ ] Module that syncs top N accounts as signers (similar to VotingPower.sol)
- [ ] Add zodiac module for WAVS agent
- [ ] Documentation of how these work
- [ ] Wire up components and WAVS deployments

3. Refinement
- [ ] Implement and document the fallback mechanism for governance (this should be fairly straightforward with Zodiac hopefully)

### MVP Symbient
- [ ] Add LLM Module
- [ ] People make an attestation (with payment, some funds go to operators)
- [ ] Deterministic Agent evaluates suggestion ()
- [ ] People attest to which suggestions they like the most
- [ ] The most liked get rewards
- [ ] Mint NFTs of responses and conversations
- [ ] We're going to make a Network Spirituality Holy Text

## NEXT FEATURE: Rewards

Attestations are great for creating custom rewards payouts.

The pipeline is simple:
```
ATTESTATION -> REWARDS CALCULATION SERVICE -> RewardsDistributor.sol
```

Can we make these reputation based?

## Future Service Improvements
- [ ] Break out Indexer contract, could be modified to be multichain? EAS indexer component (indexes certain attestations without a resolver?)
- [ ] Add eas-indexer sidecar to docker compose?
- [ ] JS example using EAS SDK?
- [ ] Performance based Vesting
- [ ] More EAS resolvers
- [ ] UI for demo
- [ ] Docs and writeup
- [ ] review and fixup tests
- [ ] bridge integration

# Idea space
### Attestation Components
There could be a whole folder of them!

- [] Attest to social media post
- [] Verification of an Offchain Attestation
- [] Attest to how you feel

### Resolvers
- [] Only if member
- [] Payment / token gating
