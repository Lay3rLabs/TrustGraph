import { ponder } from 'ponder:registry'
import { gnosisSafe } from 'ponder:schema'

import { gnosisSafeAbi } from '../../frontend/lib/contract-abis'

// Setup: Initialize the safe state from the contract
ponder.on('gnosisSafe:setup', async ({ context }) => {
  for (const safeAddress of context.contracts.gnosisSafe.address || []) {
    try {
      // Read owners and threshold from the contract
      const [owners, threshold] = await Promise.all([
        context.client.readContract({
          address: safeAddress,
          abi: gnosisSafeAbi,
          functionName: 'getOwners',
        }),
        context.client.readContract({
          address: safeAddress,
          abi: gnosisSafeAbi,
          functionName: 'getThreshold',
        }),
      ])

      await context.db.insert(gnosisSafe).values({
        address: safeAddress,
        chainId: `${context.chain.id}`,
        owners: [...owners],
        threshold,
        blockNumber: 0n,
        timestamp: 0n,
      })
    } catch {
      // Contract may not be deployed yet
    }
  }
})

// AddedOwner: Add a new owner to the safe
ponder.on('gnosisSafe:AddedOwner', async ({ event, context }) => {
  // Read current owners from the contract to ensure consistency
  const [owners, threshold] = await Promise.all([
    context.client.readContract({
      address: event.log.address,
      abi: gnosisSafeAbi,
      functionName: 'getOwners',
    }),
    context.client.readContract({
      address: event.log.address,
      abi: gnosisSafeAbi,
      functionName: 'getThreshold',
    }),
  ])

  await context.db
    .insert(gnosisSafe)
    .values({
      address: event.log.address,
      chainId: `${context.chain.id}`,
      owners: [...owners],
      threshold,
      blockNumber: event.block.number,
      timestamp: event.block.timestamp,
    })
    .onConflictDoUpdate({
      owners: [...owners],
      blockNumber: event.block.number,
      timestamp: event.block.timestamp,
    })
})

// RemovedOwner: Remove an owner from the safe
ponder.on('gnosisSafe:RemovedOwner', async ({ event, context }) => {
  // Read current owners from the contract to ensure consistency
  const [owners, threshold] = await Promise.all([
    context.client.readContract({
      address: event.log.address,
      abi: gnosisSafeAbi,
      functionName: 'getOwners',
    }),
    context.client.readContract({
      address: event.log.address,
      abi: gnosisSafeAbi,
      functionName: 'getThreshold',
    }),
  ])

  await context.db
    .insert(gnosisSafe)
    .values({
      address: event.log.address,
      chainId: `${context.chain.id}`,
      owners: [...owners],
      threshold,
      blockNumber: event.block.number,
      timestamp: event.block.timestamp,
    })
    .onConflictDoUpdate({
      owners: [...owners],
      blockNumber: event.block.number,
      timestamp: event.block.timestamp,
    })
})

// ChangedThreshold: Update the threshold
ponder.on('gnosisSafe:ChangedThreshold', async ({ event, context }) => {
  const { threshold } = event.args

  const owners = await context.client.readContract({
    address: event.log.address,
    abi: gnosisSafeAbi,
    functionName: 'getOwners',
  })

  await context.db
    .insert(gnosisSafe)
    .values({
      address: event.log.address,
      chainId: `${context.chain.id}`,
      owners: [...owners],
      threshold,
      blockNumber: event.block.number,
      timestamp: event.block.timestamp,
    })
    .onConflictDoUpdate({
      threshold,
      blockNumber: event.block.number,
      timestamp: event.block.timestamp,
    })
})
