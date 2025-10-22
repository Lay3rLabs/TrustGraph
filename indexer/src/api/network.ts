import { Hono } from "hono";
import { db } from "ponder:api";
import { easAttestation } from "ponder:schema";
import { offchainDb } from "./db";
import { and, asc, desc, eq, inArray, or } from "drizzle-orm";

const app = new Hono();

// Get the accounts and attestations that are part of the network.
app.get("/", async (c) => {
  try {
    const latestMerkleTree = await offchainDb.query.merkleMetadata.findFirst({
      orderBy: (t, { desc }) => desc(t.timestamp),
    });
    if (!latestMerkleTree) {
      return c.json({ error: "Merkle tree not found" }, 404);
    }

    const allAccounts = await offchainDb.query.merkleEntry.findMany({
      columns: {
        account: true,
        value: true,
      },
      where: (t, { eq, gt, and }) =>
        and(eq(t.root, latestMerkleTree.root), gt(t.value, 0n)),
      orderBy: (t, { asc }) => asc(t.account),
    });

    // Map of in-network accounts to their metadata.
    const accountsMap: Map<
      string,
      {
        value: bigint;
        sent: number;
        received: number;
      }
    > = new Map();
    for (const account of allAccounts) {
      accountsMap.set(account.account, {
        value: account.value,
        sent: 0,
        received: 0,
      });
    }

    const relevantAccounts = Array.from(accountsMap.keys()) as `0x${string}`[];
    const attestations = await db
      .selectDistinctOn([easAttestation.attester, easAttestation.recipient])
      .from(easAttestation)
      .where(
        and(
          // Only include non-revoked attestations.
          eq(easAttestation.revocationTime, 0n),
          // Only include attestations between in-network accounts.
          inArray(easAttestation.attester, relevantAccounts),
          inArray(easAttestation.recipient, relevantAccounts)
        )
      )
      .orderBy(
        // Same order as distinct columns.
        asc(easAttestation.attester),
        asc(easAttestation.recipient),
        // Newest attestations override older ones, so pick newer first.
        desc(easAttestation.timestamp)
      );

    for (const attestation of attestations) {
      accountsMap.get(attestation.attester)!.sent++;
      accountsMap.get(attestation.recipient)!.received++;
    }

    const accounts = Array.from(accountsMap)
      .map(([account, { value, sent, received }]) => ({
        account,
        value: value.toString(),
        sent,
        received,
      }))
      .sort((a, b) => a.account.localeCompare(b.account));

    return c.json({
      accounts,
      attestations,
    });
  } catch (error) {
    console.error("Error fetching network:", error);
    return c.json({ error: "Failed to fetch network" }, 500);
  }
});

export default app;
