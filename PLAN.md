# The Plan

## Epochs
- [-] Hyperstition markets
- [-] Working points UI
- [-] Vesting
- [ ] Figure out some way to pay for these services
- [ ] Governance

## UI TODO
- [ ] For vouching page let's figure out how to visualize connections
- [ ] Figure out something that will scale (currently just fetching entire MerkleTree)
- [ ] Add AI that feeds memetics to front page. You have to convince it to let you join the Symbient.

## Hyperstition Markets
- [x] Make attestation on participating in prediction market
- [-] More realistic Hyperstition market resolver component (i.e. Twitter follower count)
- [ ] Task for USDC faucet

## WAVS Zodiac Modules
- [x] Wire up new component to utilize SignerManagerModule, respond to MerkleRootUpdated Event get IPFS CID, get top N users, sync
- [x] Wire up dao-agent component to utilizes WavsModule for zodiac, add test trigger
- [ ] Merkle gov module probably needs some notion of total voting power
- [ ] Implement and document the fallback mechanism for governance (this should be fairly straightforward with Zodiac hopefully)
- [ ] Clean out old Governor example contract
- [ ] Gnosis Safe Module helper scripts (query signers, proposals, etc.)
- [ ] A DAO needs to be able to update it's own service configuration (related to Gyser?)

## Attestations
- [x] Add helpful like payment, etc.
- [x] Rename Attester.sol to WavsAttester.sol
- [ ] Attest to social media post (and verify)
- [ ] Attest to GitHub Contributions (could just be a GitHub workflow we run)

## MVP Symbient
- [x] Add LLM Module
- [x] People make an attestation (with payment)
- [x] Deterministic Agent evaluates suggestion against a policy
- [ ] People attest to which suggestions they like the most
- [ ] The most liked get rewards
- [ ] Mint NFTs of responses and conversations
- [ ] We're going to make a Network Spirituality Holy Text
- [ ] Pay to submit a message to EN0VA and mint NFTs
- [ ] Pay operators

## DAICO
- [x] Finish write-up / spec
- [ ] Implement better DAICO Contract
- [ ] Prediction market resolver on whether it will complete

## Vesting
- [x] Add [MetaLex vesting contracts](https://github.com/MetaLex-Tech/MetaVesT)
- [ ] Make a WAVS condition contract and example component
- [ ] Let people with points claim their vesting token allocations (creates a new contract from factory, need to check what this costs lol)
- [ ] UI to view vesting token allocations
- [ ] Let vesting users vote somehow
- [ ] Script to setup our initial vesting contracts for investors + team

## Guages
- [ ] Gauge voting to direct emissions
- [ ] Bribes (bribe users to update their gauge vote)
