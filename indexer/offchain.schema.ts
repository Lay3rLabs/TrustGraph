import { index, pgSchema, primaryKey } from "drizzle-orm/pg-core";

export const offchainSchema = pgSchema("offchain");

export const merkleMetadata = offchainSchema.table(
  "merkle_metadata",
  (t) => ({
    merkleSnapshotContract: t.text().notNull(),
    root: t.text().notNull(),
    ipfsHash: t.text().notNull(),
    ipfsHashCid: t.text().notNull(),
    numAccounts: t.integer().notNull(),
    totalValue: t.bigint({ mode: "bigint" }).notNull(),
    sources: t.jsonb().notNull().$type<
      {
        name: string;
        metadata: any;
      }[]
    >(),
    blockNumber: t.bigint({ mode: "bigint" }).notNull(),
    timestamp: t.bigint({ mode: "bigint" }).notNull(),
  }),
  (t) => [
    primaryKey({ columns: [t.merkleSnapshotContract, t.root] }),
    index().on(t.root),
    index().on(t.ipfsHashCid),
    index().on(t.blockNumber),
    index().on(t.timestamp),
  ]
);

export const merkleEntry = offchainSchema.table(
  "merkle_entry",
  (t) => ({
    merkleSnapshotContract: t.text().notNull(),
    root: t.text().notNull(),
    account: t.text().notNull(),
    ipfsHashCid: t.text().notNull(),
    value: t.bigint({ mode: "bigint" }).notNull(),
    proof: t.jsonb().notNull().$type<string[]>(),
    blockNumber: t.bigint({ mode: "bigint" }).notNull(),
    timestamp: t.bigint({ mode: "bigint" }).notNull(),
  }),
  (t) => [
    primaryKey({ columns: [t.merkleSnapshotContract, t.root, t.account] }),
    index().on(t.root),
    index().on(t.account),
    index().on(t.ipfsHashCid),
    index().on(t.blockNumber),
    index().on(t.timestamp),
    index().on(t.account, t.timestamp),
  ]
);

export const localismFundApplication = offchainSchema.table(
  "localism_fund_application",
  (t) => ({
    address: t.text().primaryKey(),
    url: t.text().notNull(),
    updatedAt: t.bigint({ mode: "bigint" }).notNull(),
  }),
  (t) => [
    index().on(t.url),
  ]
);