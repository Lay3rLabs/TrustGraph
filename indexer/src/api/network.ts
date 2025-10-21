import { Hono } from "hono";
import { db } from "ponder:api";
import { easAttestation } from "ponder:schema";
import { offchainDb } from "./db";

const app = new Hono();

// Get the graph of attestations, where nodes are accounts and edges are attestations between them.
app.get("/graph", async (c) => {
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
      where: (t, { eq }) => eq(t.root, latestMerkleTree.root),
      orderBy: (t, { asc }) => asc(t.account),
    });

    const attestations = await db.select().from(easAttestation);

    const accountsMap: Map<string, { value: bigint; sent: number; received: number }> =
      new Map();
    for (const account of allAccounts) {
      accountsMap.set(account.account, { value: account.value, sent: 0, received: 0 });
    }

    for (const attestation of attestations) {
      if (!accountsMap.has(attestation.attester)) {
        accountsMap.set(attestation.attester, { value: 0n, sent: 0, received: 0 });
      }
      if (!accountsMap.has(attestation.recipient)) {
        accountsMap.set(attestation.recipient, { value: 0n, sent: 0, received: 0 });
      }
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
    console.error("Error fetching attestations graph:", error);
    return c.json({ error: "Failed to fetch attestations graph" }, 500);
  }
});

export default app;
