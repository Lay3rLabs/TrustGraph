import * as offchainSchema from "../../offchain.schema";
import { Context, Hono } from "hono";
import { drizzle } from "drizzle-orm/node-postgres";
import { offchainDb } from "./db";

declare global {
  interface BigInt {
    toJSON: () => string;
  }
}

BigInt.prototype.toJSON = function () {
  return this.toString();
};

const merkleApp = new Hono();

/**
 * Get the merkle tree with its entries.
 * @param c The context.
 * @param root The root of the merkle tree.
 * @returns The merkle tree with its entries.
 */
export const getMerkleTreeWithEntries = async (c: Context, root: string) => {
  const tree = await offchainDb.query.merkleMetadata.findFirst({
    where: (t, { eq }) => eq(t.root, root),
  });
  if (!tree) {
    return c.json({ error: "Merkle tree not found" }, 404);
  }

  const entries = await offchainDb.query.merkleEntry.findMany({
    columns: {
      account: true,
      value: true,
      proof: true,
    },
    where: (t, { eq }) => eq(t.root, tree.root),
    orderBy: (t, { asc }) => asc(t.account),
  });

  return c.json({ tree, entries });
};

/**
 * Resolve the root of the merkle tree.
 * If the root is "current", return the root of the current merkle tree.
 * Otherwise, return the root of the merkle tree with that root. If no such tree exists, throw an error.
 * @param root The root of the merkle tree.
 * @returns The resolved root, if found.
 */
const resolveRoot = async (root: string): Promise<string> => {
  if (root === "current") {
    const tree = await offchainDb.query.merkleMetadata.findFirst({
      orderBy: (t, { desc }) => desc(t.timestamp),
    });
    if (!tree) {
      throw new Error("Current merkle tree not found");
    }
    return tree.root;
  }

  const tree = await offchainDb.query.merkleMetadata.findFirst({
    where: (t, { eq }) => eq(t.root, root),
  });
  if (!tree) {
    throw new Error("Merkle tree not found for root");
  }

  return root;
};

merkleApp.get("/all", async (c) => {
  const trees = await offchainDb.query.merkleMetadata.findMany({
    orderBy: (t, { desc }) => desc(t.timestamp),
  });
  return c.json({ trees });
});

merkleApp.get("/:root", async (c) => {
  let { root } = c.req.param();
  if (!root) {
    return c.json({ error: "Root is required" }, 400);
  }

  try {
    root = await resolveRoot(root);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }

  return getMerkleTreeWithEntries(c, root);
});

merkleApp.get("/:root/:account", async (c) => {
  let { root, account } = c.req.param();
  if (!root || !account) {
    return c.json({ error: "Root and account are required" }, 400);
  }

  try {
    root = await resolveRoot(root);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }

  const entry = await offchainDb.query.merkleEntry.findFirst({
    columns: {
      account: true,
      value: true,
      proof: true,
    },
    where: (t, { and, eq }) => and(eq(t.root, root), eq(t.account, account)),
  });
  if (!entry) {
    return c.json({ error: "Merkle entry not found" }, 404);
  }

  return c.json({ entry });
});

export default merkleApp;
