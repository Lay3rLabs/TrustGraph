# The Plan

## Epochs
- [-] Hyperstition markets
- [ ] Working points UI
- [ ] Figure out some way to pay for these services
- [ ] Governance

## UI TODO
- [ ] Toasts
- [ ] Utilize react-query
- [ ] For vouching page let's figure out how to visualize connections
- [ ] Figure out something that will scale (currently just fetching entire MerkleTree)
- [ ] Make the text on the landing page selectable (currently can't select text in "terminal")
- [ ] Add AI that feeds memetics to front page. You have to convince it to let you join the Symbient.

## Hyperstition Markets
- [x] Make attestation on participating in prediction market
- [-] More realistic Hyperstition market resolver component (i.e. Twitter follower count)

## WAVS Zodiac Modules
- [ ] Merkle gov module probably needs some notion of total voting power
- [ ] Wire up dao-agent component to utilizes WavsModule for zodiac, add test trigger
- [ ] Wire up new component to utilize SignerManagerModule, respond to MerkleRootUpdated Event get IPFS CID, get top N users, sync
- [ ] Implement and document the fallback mechanism for governance (this should be fairly straightforward with Zodiac hopefully)
- [ ] Clean out old Governor example contract

I want to refactor the `eas-compute` component to update signers on the Signer Module manager.

Let's rename it to `signer-sync`. The trigger will be:
```solidity
event MerkleRootUpdated(bytes32 indexed root, bytes32 ipfsHash, string ipfsHashCid);
```

We will take the ipfsHashCid, download it, loop through the accounts, and sync the top N accounts with the SignerModuleManager.sol contract.

## Attestations
- [x] Add helpful like payment, etc.
- [x] Rename Attester.sol to WavsAttester.sol
- [ ] Attest to social media post (and verify)
- [ ] Attest to GitHub Contributions (could just be a GitHub workflow we run)

## MVP Symbient
- [x] Add LLM Module
- [ ] People make an attestation (with payment, some funds go to operators)
- [ ] Deterministic Agent evaluates suggestion against a policy
- [ ] People attest to which suggestions they like the most
- [ ] The most liked get rewards
- [ ] Mint NFTs of responses and conversations
- [ ] We're going to make a Network Spirituality Holy Text
- [ ] Pay to submit a message to EN0VA and mint NFTs
