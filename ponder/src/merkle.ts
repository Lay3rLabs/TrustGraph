import { ponder } from "ponder:registry";
import { merkleSnapshot } from "ponder:schema";
import { merkleSnapshotAbi } from "../../frontend/lib/contracts";
import { drizzle } from "drizzle-orm/node-postgres";
import * as offchainSchema from "../offchain.schema";
import { sql } from "drizzle-orm";

type MerkleTreeData = {
  id: string;
  metadata: {
    num_accounts: number;
    sources: {
      name: string;
      metadata: any;
    }[];
    total_value: string;
  };
  root: string;
  tree: {
    account: string;
    value: string;
    proof: string[];
  }[];
};

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}
const offchainDb = drizzle(process.env.DATABASE_URL, {
  schema: offchainSchema,
});

ponder.on("merkleSnapshot:setup", async ({ context }) => {
  try {
    const stateCount = await context.client.readContract({
      address: context.contracts.merkleSnapshot.address,
      abi: merkleSnapshotAbi,
      functionName: "getStateCount",
      retryEmptyResponse: false,
    });

    for (let i = 0; i < Number(stateCount); i++) {
      const state = await context.client.readContract({
        address: context.contracts.merkleSnapshot.address,
        abi: merkleSnapshotAbi,
        functionName: "getStateAtIndex",
        args: [BigInt(i)],
      });

      await context.db.insert(merkleSnapshot).values({
        id: i.toString(),
        blockNumber: state.blockNumber,
        timestamp: state.timestamp,
        root: state.root,
        ipfsHash: state.ipfsHash,
        ipfsHashCid: state.ipfsHashCid,
        totalValue: state.totalValue,
      });
    }
  } catch {
    return;
  }
});

ponder.on("merkleSnapshot:MerkleRootUpdated", async ({ event, context }) => {
  const { root, ipfsHash, ipfsHashCid, totalValue } = event.args;

  await context.db.insert(merkleSnapshot).values({
    id: event.id,
    blockNumber: event.block.number,
    timestamp: event.block.timestamp,
    root,
    ipfsHash,
    ipfsHashCid,
    totalValue,
  });

  // Load IPFS data.
  const ipfsGateway = process.env.IPFS_GATEWAY;
  if (!ipfsGateway) {
    throw new Error("IPFS_GATEWAY is not set");
  }
  const merkleRequest = await fetch(ipfsGateway + ipfsHashCid);
  if (!merkleRequest.ok) {
    throw new Error(
      `Failed to fetch merkle tree from IPFS CID ${ipfsHashCid}: ${merkleRequest.status} ${merkleRequest.statusText}`
    );
  }
  const merkleTreeData = (await merkleRequest.json()) as MerkleTreeData;

  await offchainDb
    .insert(offchainSchema.merkleMetadata)
    .values({
      root,
      ipfsHash,
      ipfsHashCid,
      numAccounts: merkleTreeData.metadata.num_accounts,
      totalValue: BigInt(merkleTreeData.metadata.total_value),
      sources: merkleTreeData.metadata.sources,
      blockNumber: event.block.number,
      timestamp: event.block.timestamp,
    })
    .onConflictDoUpdate({
      target: offchainSchema.merkleMetadata.root,
      set: {
        ipfsHash: sql.raw(
          `excluded."${offchainSchema.merkleMetadata.ipfsHash.name}"`
        ),
        ipfsHashCid: sql.raw(
          `excluded."${offchainSchema.merkleMetadata.ipfsHashCid.name}"`
        ),
        numAccounts: sql.raw(
          `excluded."${offchainSchema.merkleMetadata.numAccounts.name}"`
        ),
        totalValue: sql.raw(
          `excluded."${offchainSchema.merkleMetadata.totalValue.name}"`
        ),
        sources: sql.raw(
          `excluded."${offchainSchema.merkleMetadata.sources.name}"`
        ),
        blockNumber: sql.raw(
          `excluded."${offchainSchema.merkleMetadata.blockNumber.name}"`
        ),
        timestamp: sql.raw(
          `excluded."${offchainSchema.merkleMetadata.timestamp.name}"`
        ),
      },
    });

  await offchainDb
    .insert(offchainSchema.merkleEntry)
    .values(
      merkleTreeData.tree.map((entry) => ({
        root,
        ipfsHashCid,
        account: entry.account,
        value: BigInt(entry.value),
        proof: entry.proof,
        blockNumber: event.block.number,
        timestamp: event.block.timestamp,
      }))
    )
    .onConflictDoUpdate({
      target: [
        offchainSchema.merkleEntry.root,
        offchainSchema.merkleEntry.account,
      ],
      set: {
        ipfsHashCid: sql.raw(
          `excluded."${offchainSchema.merkleEntry.ipfsHashCid.name}"`
        ),
        value: sql.raw(`excluded."${offchainSchema.merkleEntry.value.name}"`),
        proof: sql.raw(`excluded."${offchainSchema.merkleEntry.proof.name}"`),
        blockNumber: sql.raw(
          `excluded."${offchainSchema.merkleEntry.blockNumber.name}"`
        ),
        timestamp: sql.raw(
          `excluded."${offchainSchema.merkleEntry.timestamp.name}"`
        ),
      },
    });
});
