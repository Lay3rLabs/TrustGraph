import { ponder } from "ponder:registry";
import { predictionMarketPrice, predictionMarketTrade } from "ponder:schema";
import { lmsrMarketMakerAbi } from "../../frontend/lib/contracts";
import { Hex, parseUnits } from "viem";

// Calculate initial price.
ponder.on("marketMaker:setup", async ({ context }) => {
  const marketAddress = context.contracts.marketMaker.address as Hex;

  // During setup, the market maker contract may not exist yet.
  let yesPrice: bigint;
  try {
    yesPrice = await context.client.readContract({
      address: marketAddress,
      abi: lmsrMarketMakerAbi,
      functionName: "calcNetCost",
      args: [[0n, parseUnits("1", 18)]],
      retryEmptyResponse: false,
    });
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
  const outcome = outcomeIndex === 0 ? "yes" : "no";
  const type = outcomeTokenAmounts[outcomeIndex]! > 0n ? "buy" : "sell";

  const amount =
    outcomeTokenAmounts[outcomeIndex]! > 0n
      ? outcomeTokenAmounts[outcomeIndex]!
      : -outcomeTokenAmounts[outcomeIndex]!;

  const cost =
    outcomeTokenNetCost > 0n ? outcomeTokenNetCost : -outcomeTokenNetCost;

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

  const yesPrice = await context.client.readContract({
    address: marketAddress,
    abi: lmsrMarketMakerAbi,
    functionName: "calcNetCost",
    args: [[0n, parseUnits("1", 18)]],
  });

  await context.db
    .insert(predictionMarketPrice)
    .values({
      id: event.id,
      price: yesPrice,
      marketAddress,
      timestamp: event.block.timestamp,
    })
    .onConflictDoUpdate((row) => ({
      price: row.price,
      marketAddress: row.marketAddress,
      timestamp: row.timestamp,
    }));
});
