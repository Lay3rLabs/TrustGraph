import { Hono } from 'hono'

import { offchainDb } from './db'
import { getMerkleTreeWithEntries, lower } from './utils'

declare global {
  interface BigInt {
    toJSON: () => string
  }
}

BigInt.prototype.toJSON = function () {
  return this.toString()
}

const merkleApp = new Hono()

/**
 * Resolve the root of the merkle tree.
 * If the root is "current", return the root of the current merkle tree.
 * Otherwise, return the root of the merkle tree with that root. If no such tree exists, throw an error.
 * @param merkleSnapshotContract The contract address of the merkle snapshot.
 * @param root The root of the merkle tree.
 * @returns The resolved root, if found.
 */
const resolveRoot = async (
  merkleSnapshotContract: string,
  root: string
): Promise<string> => {
  if (root === 'current') {
    const tree = await offchainDb.query.merkleMetadata.findFirst({
      where: (t, { eq }) =>
        eq(
          lower(t.merkleSnapshotContract),
          merkleSnapshotContract.toLowerCase()
        ),
      orderBy: (t, { desc }) => desc(t.timestamp),
    })
    if (!tree) {
      throw new Error('Current merkle tree not found')
    }
    return tree.root
  }

  const tree = await offchainDb.query.merkleMetadata.findFirst({
    where: (t, { eq, and }) =>
      and(
        eq(
          lower(t.merkleSnapshotContract),
          merkleSnapshotContract.toLowerCase()
        ),
        eq(lower(t.root), root.toLowerCase())
      ),
  })
  if (!tree) {
    throw new Error('Merkle tree not found for root')
  }

  return root
}

merkleApp.get('/:snapshot/all', async (c) => {
  const merkleSnapshotContract = c.req.param('snapshot')
  if (!merkleSnapshotContract) {
    return c.json({ error: 'Merkle snapshot contract is required' }, 400)
  }

  const trees = await offchainDb.query.merkleMetadata.findMany({
    where: (t, { eq }) =>
      eq(lower(t.merkleSnapshotContract), merkleSnapshotContract.toLowerCase()),
    orderBy: (t, { desc }) => desc(t.timestamp),
  })
  return c.json({ trees })
})

merkleApp.get('/:snapshot/:root', async (c) => {
  const merkleSnapshotContract = c.req.param('snapshot')
  if (!merkleSnapshotContract) {
    return c.json({ error: 'Merkle snapshot contract is required' }, 400)
  }

  let { root } = c.req.param()
  if (!root) {
    return c.json({ error: 'Root is required' }, 400)
  }

  try {
    root = await resolveRoot(merkleSnapshotContract, root)
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }

  const treeWithEntries = await getMerkleTreeWithEntries(
    merkleSnapshotContract,
    root
  )
  if (!treeWithEntries) {
    return c.json({ error: 'Merkle tree not found' }, 404)
  }

  return c.json(treeWithEntries)
})

merkleApp.get('/:snapshot/:root/:account', async (c) => {
  const merkleSnapshotContract = c.req.param('snapshot')
  if (!merkleSnapshotContract) {
    return c.json({ error: 'Merkle snapshot contract is required' }, 400)
  }

  let { root, account } = c.req.param()
  if (!root || !account) {
    return c.json({ error: 'Root and account are required' }, 400)
  }

  try {
    root = await resolveRoot(merkleSnapshotContract, root)
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }

  const entry = await offchainDb.query.merkleEntry.findFirst({
    columns: {
      account: true,
      value: true,
      proof: true,
    },
    where: (t, { and, eq }) =>
      and(
        eq(
          lower(t.merkleSnapshotContract),
          merkleSnapshotContract.toLowerCase()
        ),
        eq(lower(t.root), root.toLowerCase()),
        eq(lower(t.account), account.toLowerCase())
      ),
  })
  if (!entry) {
    return c.json({ error: 'Merkle entry not found' }, 404)
  }

  return c.json({ entry })
})

export default merkleApp
