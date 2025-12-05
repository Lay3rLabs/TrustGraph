import { ponder } from "ponder:registry";
import {
  merkleSnapshot,
  merkleFundDistributor,
  merkleFundDistribution,
  merkleFundDistributionClaim,
} from "ponder:schema";
import {
  merkleFundDistributorAbi,
  merkleSnapshotAbi,
} from "../../frontend/lib/contracts";
import ponderConfig from "../ponder.config";
import { drizzle } from "drizzle-orm/node-postgres";
import * as offchainSchema from "../offchain.schema";
import { eq, sql } from "drizzle-orm";

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
  // Use 127.0.0.1 instead of localhost to avoid subdomain redirects
  const ipfsUrl = (ipfsGateway + ipfsHashCid).replace("localhost", "127.0.0.1");
  const merkleRequest = await fetch(ipfsUrl);
  if (!merkleRequest.ok) {
    throw new Error(
      `Failed to fetch merkle tree from IPFS CID ${ipfsHashCid}: ${merkleRequest.status} ${merkleRequest.statusText}`
    );
  }
  const merkleTreeData = (await merkleRequest.json()) as MerkleTreeData;
  await insertMerkleData(merkleTreeData, event, root, ipfsHash, ipfsHashCid);
});

async function insertMerkleData(
  merkleTreeData: MerkleTreeData,
  event: any,
  root: string,
  ipfsHash: string,
  ipfsHashCid: string
) {
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
}

ponder.on("merkleFundDistributor:setup", async ({ context, event }) => {
  const contractAddress = context.contracts.merkleFundDistributor.address;
  if (!contractAddress) {
    throw new Error("Contract address is not set");
  }

  const [
    merkleSnapshotAddress,
    owner,
    pendingOwner,
    feeRecipient,
    feePercentage,
    feeRange,
    allowlistEnabled,
    paused,
    allowlist,
  ] = await Promise.all([
    context.client.readContract({
      address: contractAddress,
      abi: merkleFundDistributorAbi,
      functionName: "merkleSnapshot",
      retryEmptyResponse: false,
    }),
    context.client.readContract({
      address: contractAddress,
      abi: merkleFundDistributorAbi,
      functionName: "owner",
    }),
    context.client.readContract({
      address: contractAddress,
      abi: merkleFundDistributorAbi,
      functionName: "pendingOwner",
    }),
    context.client.readContract({
      address: contractAddress,
      abi: merkleFundDistributorAbi,
      functionName: "feeRecipient",
    }),
    context.client.readContract({
      address: contractAddress,
      abi: merkleFundDistributorAbi,
      functionName: "feePercentage",
    }),
    context.client.readContract({
      address: contractAddress,
      abi: merkleFundDistributorAbi,
      functionName: "FEE_RANGE",
    }),
    context.client.readContract({
      address: contractAddress,
      abi: merkleFundDistributorAbi,
      functionName: "allowlistEnabled",
    }),
    context.client.readContract({
      address: contractAddress,
      abi: merkleFundDistributorAbi,
      functionName: "paused",
    }),
    context.client.readContract({
      address: contractAddress,
      abi: merkleFundDistributorAbi,
      functionName: "getAllowlist",
    }),
  ]);

  await context.db.insert(merkleFundDistributor).values({
    address: contractAddress,
    chainId: context.chain.id.toString(),
    paused,
    merkleSnapshot: merkleSnapshotAddress,
    owner,
    pendingOwner,
    feeRecipient,
    feePercentage: (Number(feePercentage) / Number(feeRange)).toString(),
    allowlistEnabled,
    allowlist: [...allowlist],
  });
});

ponder.on(
  "merkleFundDistributor:OwnershipTransferStarted",
  async ({ event, context }) => {
    const { pendingOwner } = event.args;
    await context.db
      .update(merkleFundDistributor, { address: event.log.address })
      .set({
        pendingOwner,
      });
  }
);

ponder.on(
  "merkleFundDistributor:OwnershipTransferred",
  async ({ event, context }) => {
    const { newOwner } = event.args;
    await context.db
      .update(merkleFundDistributor, { address: event.log.address })
      .set({
        owner: newOwner,
        pendingOwner: "0x0000000000000000000000000000000000000000",
      });
  }
);

ponder.on(
  "merkleFundDistributor:FeeRecipientSet",
  async ({ event, context }) => {
    const { newFeeRecipient } = event.args;
    await context.db
      .update(merkleFundDistributor, { address: event.log.address })
      .set({
        feeRecipient: newFeeRecipient,
      });
  }
);

ponder.on(
  "merkleFundDistributor:FeePercentageSet",
  async ({ event, context }) => {
    const { newFeePercentage } = event.args;
    // Read FEE_RANGE to calculate the percentage
    const feeRange = await context.client.readContract({
      address: event.log.address,
      abi: merkleFundDistributorAbi,
      functionName: "FEE_RANGE",
    });
    await context.db
      .update(merkleFundDistributor, { address: event.log.address })
      .set({
        feePercentage: (Number(newFeePercentage) / Number(feeRange)).toString(),
      });
  }
);

ponder.on(
  "merkleFundDistributor:MerkleSnapshotUpdated",
  async ({ event, context }) => {
    const { newContract } = event.args;
    await context.db
      .update(merkleFundDistributor, { address: event.log.address })
      .set({
        merkleSnapshot: newContract,
      });
  }
);

ponder.on(
  "merkleFundDistributor:DistributorAllowanceUpdated",
  async ({ event, context }) => {
    const { distributor, canDistribute } = event.args;
    // Read the current allowlist and update it
    const current = await context.db.find(merkleFundDistributor, {
      address: event.log.address,
    });
    if (!current) return;

    let newAllowlist: `0x${string}`[];
    if (canDistribute) {
      // Add to allowlist if not already present
      if (!current.allowlist.includes(distributor)) {
        newAllowlist = [...current.allowlist, distributor];
      } else {
        newAllowlist = current.allowlist;
      }
    } else {
      // Remove from allowlist
      newAllowlist = current.allowlist.filter((addr) => addr !== distributor);
    }

    await context.db
      .update(merkleFundDistributor, { address: event.log.address })
      .set({
        allowlist: newAllowlist,
      });
  }
);

ponder.on(
  "merkleFundDistributor:DistributorAllowlistUpdated",
  async ({ event, context }) => {
    const { enabled } = event.args;
    await context.db
      .update(merkleFundDistributor, { address: event.log.address })
      .set({
        allowlistEnabled: enabled,
      });
  }
);

ponder.on(
  "merkleFundDistributor:Paused",
  async ({ event, context }) => {
    await context.db
      .update(merkleFundDistributor, { address: event.log.address })
      .set({
        paused: true,
      });
  }
);

ponder.on(
  "merkleFundDistributor:Unpaused",
  async ({ event, context }) => {
    await context.db
      .update(merkleFundDistributor, { address: event.log.address })
      .set({
        paused: false,
      });
  }
);

ponder.on(
  "merkleFundDistributor:Distributed",
  async ({ event, context }) => {
    const { distributionIndex, distributor, token, amountFunded, feeAmount } =
      event.args;

    // Read the full distribution state from the contract
    const distribution = await context.client.readContract({
      address: event.log.address,
      abi: merkleFundDistributorAbi,
      functionName: "getDistribution",
      args: [distributionIndex],
    });

    await context.db.insert(merkleFundDistribution).values({
      id: distributionIndex,
      merkleFundDistributor: event.log.address,
      blockNumber: event.block.number,
      timestamp: event.block.timestamp,
      root: distribution.root,
      ipfsHash: distribution.ipfsHash,
      ipfsHashCid: distribution.ipfsHashCid,
      totalMerkleValue: distribution.totalMerkleValue,
      distributor,
      token,
      amountFunded,
      amountDistributed: 0n,
      feeRecipient: distribution.feeRecipient,
      feeAmount,
    });
  }
);

ponder.on("merkleFundDistributor:Claimed", async ({ event, context }) => {
  const { distributionIndex, account, token, amount, value, newAmountDistributed } = event.args;

  // Update the distribution's amountDistributed
  await context.db
    .update(merkleFundDistribution, { id: distributionIndex })
    .set({
      amountDistributed: newAmountDistributed,
    });

  // Insert the claim record
  await context.db.insert(merkleFundDistributionClaim).values({
    id: `${event.log.address}-${distributionIndex}-${account}`,
    merkleFundDistributor: event.log.address,
    distributionIndex,
    account,
    token,
    amount,
    merkleValue: value,
    blockNumber: event.block.number,
    timestamp: event.block.timestamp,
  });
});
