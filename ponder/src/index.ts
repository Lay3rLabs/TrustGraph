import { ponder } from "ponder:registry";
import {
  predictionMarketPrice,
  predictionMarketRedemption,
  predictionMarketTrade,
  wavsIndexerEvent,
} from "ponder:schema";
import {
  lmsrMarketMakerAbi,
  wavsIndexerAbi,
} from "../../frontend/lib/contracts";
import { Hex, hexToNumber } from "viem";

const PRICE_DIVISOR = hexToNumber("0x10000000000000000");

// Calculate initial price.
ponder.on("marketMaker:setup", async ({ context }) => {
  const marketAddress = context.contracts.marketMaker.address as Hex;

  // During setup, the market maker contract may not exist yet.
  let yesPrice: number;
  try {
    yesPrice =
      Number(
        await context.client.readContract({
          address: marketAddress,
          abi: lmsrMarketMakerAbi,
          functionName: "calcMarginalPrice",
          args: [1],
          retryEmptyResponse: false,
        })
      ) / PRICE_DIVISOR;
  } catch (error) {
    return;
  }

  await context.db.insert(predictionMarketPrice).values({
    id: "init",
    price: yesPrice,
    marketAddress,
    timestamp: BigInt(Math.floor(Date.now() / 1000)),
  });
});

// Update price after each trade.
ponder.on("marketMaker:AMMOutcomeTokenTrade", async ({ event, context }) => {
  const marketAddress = context.contracts.marketMaker.address as Hex;

  const { transactor, outcomeTokenAmounts, outcomeTokenNetCost, marketFees } =
    event.args;

  const outcomeIndex = outcomeTokenAmounts.findIndex((amount) => amount !== 0n);
  // Not sure why but sometimes this event is fired and all fields are zero (except the transactor).
  if (outcomeIndex === -1) {
    return;
  }

  const outcome = outcomeIndex === 1 ? "yes" : "no";
  const type = outcomeTokenAmounts[outcomeIndex]! > 0n ? "buy" : "sell";

  const amount =
    outcomeTokenAmounts[outcomeIndex]! >= 0n
      ? outcomeTokenAmounts[outcomeIndex]!
      : -outcomeTokenAmounts[outcomeIndex]!;

  const cost =
    outcomeTokenNetCost >= 0n ? outcomeTokenNetCost : -outcomeTokenNetCost;

  // Record trade.
  await context.db.insert(predictionMarketTrade).values({
    id: event.id,
    address: transactor,
    marketAddress,
    type,
    outcome,
    amount,
    cost,
    fees: marketFees,
    timestamp: event.block.timestamp,
  });

  // Update price after each trade.

  const yesPrice =
    Number(
      await context.client.readContract({
        address: marketAddress,
        abi: lmsrMarketMakerAbi,
        functionName: "calcMarginalPrice",
        args: [1],
      })
    ) / PRICE_DIVISOR;

  await context.db
    .insert(predictionMarketPrice)
    .values({
      id: event.id,
      price: yesPrice,
      marketAddress,
      timestamp: event.block.timestamp,
    })
    .onConflictDoUpdate({
      price: yesPrice,
      marketAddress,
      timestamp: event.block.timestamp,
    });
});

ponder.on("conditionalTokens:PayoutRedemption", async ({ event, context }) => {
  const marketAddress = context.contracts.marketMaker.address as Hex;

  const {
    redeemer,
    collateralToken,
    parentCollectionId,
    conditionId,
    indexSets,
    payout,
  } = event.args;

  // If not a root redemption (parentCollectionId is not all zeroes), return. We only care about redemptions that output collateral tokens.
  if (!/^0x0+$/.test(parentCollectionId)) {
    return;
  }

  // Record redemption.
  await context.db.insert(predictionMarketRedemption).values({
    id: event.id,
    address: redeemer,
    marketAddress,
    collateralToken,
    conditionId,
    indexSets: indexSets as bigint[],
    payout,
    timestamp: event.block.timestamp,
  });
});

ponder.on("wavsIndexer:EventIndexed", async ({ event, context }) => {
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
    address: context.contracts.wavsIndexer.address as Hex,
    abi: wavsIndexerAbi,
    functionName: "getEvent",
    args: [event.args.eventId],
  });

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
  };

  // Add or update the indexed event.
  await context.db
    .insert(wavsIndexerEvent)
    .values({
      id: eventId,
      ...values,
    })
    .onConflictDoUpdate(values);
});

ponder.on("wavsIndexer:EventDeleted", async ({ event, context }) => {
  await context.db
    .update(wavsIndexerEvent, { id: event.args.eventId })
    .set({ deleted: true });
});
