# The Plan

## Frontend
- formatVotingPower is baddly named
- create proposal doesn't submit amount as big int

## Indexer TODO

We need to extend the Ponder indexer to index Merkle Tree data when the MerkleSnapshot contract updates.

We need to be able to show a list of network membership with:
- account
- attestations made for a particular Schema UID
- attestations recieved for a given Schema UID
- score (value)

## Contracts
- [x] Wire up new component to utilize SignerManagerModule, respond to MerkleRootUpdated Event get IPFS CID, get top N users, sync
- [x] Wire up dao-agent component to utilizes WavsModule for zodiac, add test trigger
- [ ] Merkle gov module needs some notion of total voting power (quorum is not a percent)
- [ ] Implement and document the fallback mechanism for governance (this should be fairly straightforward with Zodiac hopefully)
- [ ] Gnosis Safe Module helper scripts (query signers, proposals, etc.)
- [ ] Merkle Gov should need reward token to cast vote (fails with invalid proof)
- [ ] A DAO needs to be able to update it's own service configuration (related to Gyser?)
- [ ] Make contract proxies
- [ ] AI audit

### Changes needed
- [ ] Merkle snapshot needs to have some notion of "total", the the total value (very much needed in the voting power case)
- [ ] How do we make a nice api that works for rewards (which has reward token for multitoken distribution), governance and potentially other usecases?
