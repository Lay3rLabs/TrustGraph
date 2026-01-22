import { ponder } from 'ponder:registry'
import { wavsIndexerEvent } from 'ponder:schema'
import { Hex } from 'viem'

import { revalidateNetwork } from './utils'
import { wavsIndexerAbi } from '../../frontend/lib/contract-abis'

ponder.on('wavsIndexer:EventIndexed', async ({ event, context }) => {
  // Get the entire indexed event.
  const {
    eventId,
    chainId,
    relevantContract,
    blockNumber,
    timestamp,
    eventType,
    data,
    tags,
    relevantAddresses,
    metadata,
    deleted,
  } = await context.client.readContract({
    address: context.contracts.wavsIndexer.address,
    abi: wavsIndexerAbi,
    functionName: 'getEvent',
    args: [event.args.eventId],
  })

  const values = {
    chainId,
    relevantContract,
    blockNumber,
    timestamp,
    type: eventType,
    data,
    tags: tags as string[],
    relevantAddresses: relevantAddresses as Hex[],
    metadata,
    deleted,
  }

  // Add or update the indexed event.
  await context.db
    .insert(wavsIndexerEvent)
    .values({
      id: eventId,
      ...values,
    })
    .onConflictDoUpdate(values)

  await revalidateNetwork()
})

ponder.on('wavsIndexer:EventDeleted', async ({ event, context }) => {
  await context.db
    .update(wavsIndexerEvent, { id: event.args.eventId })
    .set({ deleted: true })

  await revalidateNetwork()
})
