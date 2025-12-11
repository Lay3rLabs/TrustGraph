import { index, onchainTable, primaryKey } from "ponder";

export const wavsIndexerEvent = onchainTable(
  "wavs_indexer_event",
  (t) => ({
    id: t.hex().primaryKey(),
    chainId: t.text().notNull(),
    relevantContract: t.hex().notNull(),
    blockNumber: t.bigint().notNull(),
    timestamp: t.bigint().notNull(),
    type: t.text().notNull(),
    data: t.hex().notNull(),
    tags: t.text().array().notNull(),
    relevantAddresses: t.hex().array().notNull(),
    metadata: t.hex().notNull(),
    deleted: t.boolean().notNull(),
  }),
  (t) => ({
    typeIdx: index().on(t.type),
    chainIdIdx: index().on(t.chainId),
    relevantContractIdx: index().on(t.relevantContract),
    blockNumberIdx: index().on(t.blockNumber),
    timestampIdx: index().on(t.timestamp),
  })
)

export const easAttestation = onchainTable(
  'eas_attestation',
  (t) => ({
    uid: t.hex().primaryKey(),
    schema: t.hex().notNull(),
    attester: t.hex().notNull(),
    recipient: t.hex().notNull(),
    ref: t.hex().notNull(),
    revocable: t.boolean().notNull(),
    expirationTime: t.bigint().notNull(),
    revocationTime: t.bigint().notNull(),
    data: t.hex().notNull(),
    blockNumber: t.bigint().notNull(),
    timestamp: t.bigint().notNull(),
  }),
  (t) => ({
    schemaIdx: index().on(t.schema),
    attesterIdx: index().on(t.attester),
    recipientIdx: index().on(t.recipient),
    refIdx: index().on(t.ref),
    blockNumberIdx: index().on(t.blockNumber),
    timestampIdx: index().on(t.timestamp),
  })
)

export const merkleSnapshot = onchainTable(
  'merkle_snapshot',
  (t) => ({
    id: t.text().primaryKey(),
    root: t.hex().notNull(),
    ipfsHash: t.hex().notNull(),
    ipfsHashCid: t.text().notNull(),
    totalValue: t.bigint().notNull(),
    blockNumber: t.bigint().notNull(),
    timestamp: t.bigint().notNull(),
  }),
  (t) => ({
    rootIdx: index().on(t.root),
    ipfsHashCidIdx: index().on(t.ipfsHashCid),
    blockNumberIdx: index().on(t.blockNumber),
    timestampIdx: index().on(t.timestamp),
  })
)

export const merkleGovModule = onchainTable(
  'merkle_gov_module',
  (t) => ({
    address: t.hex().primaryKey(),
    merkleSnapshot: t.hex().notNull(),
    currentMerkleRoot: t.hex().notNull(),
    ipfsHash: t.hex().notNull(),
    ipfsHashCid: t.text().notNull(),
    totalVotingPower: t.bigint().notNull(),
    proposalCount: t.bigint().notNull(),
    votingDelay: t.bigint().notNull(),
    votingPeriod: t.bigint().notNull(),
    quorum: t.bigint().notNull(),
  }),
  (t) => ({
    merkleSnapshotIdx: index().on(t.merkleSnapshot),
    currentMerkleRootIdx: index().on(t.currentMerkleRoot),
    ipfsHashCidIdx: index().on(t.ipfsHashCid),
  })
)

export const merkleGovModuleProposal = onchainTable(
  'merkle_gov_module_proposal',
  (t) => ({
    module: t.hex().notNull(),
    id: t.bigint().notNull(),
    proposer: t.hex().notNull(),
    startBlock: t.bigint().notNull(),
    endBlock: t.bigint().notNull(),
    yesVotes: t.bigint().notNull(),
    noVotes: t.bigint().notNull(),
    abstainVotes: t.bigint().notNull(),
    executed: t.boolean().notNull(),
    cancelled: t.boolean().notNull(),
    merkleRoot: t.hex().notNull(),
    totalVotingPower: t.bigint().notNull(),
    // Actions stored as JSON array: [{target, value, data, operation}]
    actions: t.json().notNull(),
    blockNumber: t.bigint().notNull(),
    timestamp: t.bigint().notNull(),
  }),
  (t) => ({
    pk: primaryKey({ columns: [t.module, t.id] }),
    moduleIdx: index().on(t.module),
    idIdx: index().on(t.id),
    proposerIdx: index().on(t.proposer),
    startBlockIdx: index().on(t.startBlock),
    endBlockIdx: index().on(t.endBlock),
    executedIdx: index().on(t.executed),
    merkleRootIdx: index().on(t.merkleRoot),
    blockNumberIdx: index().on(t.blockNumber),
    timestampIdx: index().on(t.timestamp),
  })
)

export const merkleGovModuleVote = onchainTable(
  'merkle_gov_module_vote',
  (t) => ({
    module: t.hex().notNull(),
    proposalId: t.bigint().notNull(),
    voter: t.hex().notNull(),
    voteType: t.integer().notNull(), // 0 = No, 1 = Yes, 2 = Abstain
    votingPower: t.bigint().notNull(),
    blockNumber: t.bigint().notNull(),
    timestamp: t.bigint().notNull(),
  }),
  (t) => ({
    pk: primaryKey({ columns: [t.module, t.proposalId, t.voter] }),
    moduleIdx: index().on(t.module),
    proposalIdIdx: index().on(t.proposalId),
    voterIdx: index().on(t.voter),
    voteTypeIdx: index().on(t.voteType),
    blockNumberIdx: index().on(t.blockNumber),
    timestampIdx: index().on(t.timestamp),
  })
)
