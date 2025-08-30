# The Plan

## Epochs
- [ ] Hyperstition markets
- [ ] Working points UI
- [ ] Figure out some way to pay for these services
- [ ] Pay to attest

## UI TODO
- [ ] Toasts
- [ ] Utilize react-query
- [ ] For vouching page let's figure out how to visualize connections
- [ ] Figure out something that will scale (currently just fetching entire MerkleTree)
- [ ] Make the text on the landing page selectable (currently can't select text in "terminal")

## Hyperstition Markets
- [ ] More realistic Hyperstition market resolver component (i.e. Twitter follower count)
- [ ] Make attestation on participating in prediction market

## WAVS Zodiac Modules
- [ ] Merkle gov module probably needs some notion of total voting power
- [ ] Wire up dao-agent component to utilizes WavsModule for zodiac, add test trigger
- [ ] Wire up new component to utilize SignerManagerModule, respond to MerkleRootUpdated Event get IPFS CID, get top N users, sync
- [ ] Implement and document the fallback mechanism for governance (this should be fairly straightforward with Zodiac hopefully)
- [ ] Clean out old Governor example contract

## Attestations
- [] Attest to social media post (and verify)
- [] Attest to GitHub Contributions (could just be a GitHub workflow we run)
- [] Add helpful [resolvers](https://github.com/ethereum-attestation-service/eas-contracts/tree/master/contracts/resolver/examples) like payment, etc.

## Project Organization and Cleanup
- [ ] Organize project better (put contracts in folders)
- [ ] No IWavsTrigger2

#### Project organization (contracts)
Let's reorganize our src/contracts folder as we've added many contracts.

Let's make a new `eas` folder and move in the following contracts:
- Attester.sol
- EASIndexerResolver.sol
- OffchainAttestationVerifier.sol
- SchemaRegistrar.sol

Let's make a new `governance` folder and move in the following contracts:
- Governor.sol
- VotingPower.sol

Let's make a new `rewards` folder and move in the following contracts:
- RewardDistributor.sol

Let's make a new `tokens` folder and move in the following contracts:
- ERC20.sol
- MockUSDC.sol

Let's make a `misc` folder and move in the following contracts:
- Daico.sol
- Trigger.sol

Let's make a `wavs` folder and move in the following contracts:
- WavsIndexer.sol
- POAServiceManager.sol
- Geyser.sol

We'll also need to update our deployment scripts and tests to make sure everything builds. Don't worry about testing deployment, as I will handle that.

## MVP Symbient
- [x] Add LLM Module
- [ ] People make an attestation (with payment, some funds go to operators)
- [ ] Deterministic Agent evaluates suggestion ()
- [ ] People attest to which suggestions they like the most
- [ ] The most liked get rewards
- [ ] Mint NFTs of responses and conversations
- [ ] We're going to make a Network Spirituality Holy Text
- [ ] Pay to submit a message to EN0VA and mint NFTs
