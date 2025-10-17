import { index, pgSchema, primaryKey } from 'drizzle-orm/pg-core'

export const offchainSchema = pgSchema('offchain')

export const merkleMetadata = offchainSchema.table(
  'merkle_metadata',
  (t) => ({
    root: t.text().primaryKey(),
    ipfsHash: t.text().notNull(),
    ipfsHashCid: t.text().notNull(),
    numAccounts: t.integer().notNull(),
    totalValue: t.bigint({ mode: 'bigint' }).notNull(),
    sources: t.jsonb().notNull().$type<
      {
        name: string
        metadata: any
      }[]
    >(),
    blockNumber: t.bigint({ mode: 'bigint' }).notNull(),
    timestamp: t.bigint({ mode: 'bigint' }).notNull(),
  }),
  (t) => [
    index().on(t.root),
    index().on(t.ipfsHashCid),
    index().on(t.blockNumber),
    index().on(t.timestamp),
  ]
)

export const merkleEntry = offchainSchema.table(
  'merkle_entry',
  (t) => ({
    root: t.text().notNull(),
    account: t.text().notNull(),
    ipfsHashCid: t.text().notNull(),
    value: t.bigint({ mode: 'bigint' }).notNull(),
    proof: t.jsonb().notNull().$type<string[]>(),
    blockNumber: t.bigint({ mode: 'bigint' }).notNull(),
    timestamp: t.bigint({ mode: 'bigint' }).notNull(),
  }),
  (t) => [
    primaryKey({ columns: [t.root, t.account] }),
    index().on(t.root),
    index().on(t.account),
    index().on(t.ipfsHashCid),
    index().on(t.blockNumber),
    index().on(t.timestamp),
    index().on(t.account, t.timestamp),
  ]
)
