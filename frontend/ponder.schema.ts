import { index, onchainEnum, onchainTable } from "ponder";

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
