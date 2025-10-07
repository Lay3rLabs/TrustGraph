import { ponder } from "ponder:registry";
import {
  predictionMarket,
  predictionMarketPrice,
  predictionMarketRedemption,
  predictionMarketTrade,
} from "ponder:schema";
import {
  conditionalTokensAbi,
  lmsrMarketMakerAbi,
} from "../../frontend/lib/contracts";
import { hexToNumber } from "viem";
import { eq } from "drizzle-orm";

const PRICE_DIVISOR = hexToNumber("0x10000000000000000");

// Initialize market.
ponder.on(
  "predictionMarketController:LMSRMarketMakerCreation",
  async ({ event, context }) => {
    const controller = event.log.address;
    const {
      lmsrMarketMaker: marketMaker,
      conditionalTokens,
      collateralToken,
      questionId,
      conditionIds,
      fee,
      funding: initialFunding,
    } = event.args;

    if (conditionIds.length !== 1) {
      throw new Error(
        "Expected exactly one condition ID, got " + conditionIds.length
      );
    }

    const conditionId = conditionIds[0]!;

    const [
      { yesCollectionId, yesPositionId },
      { noCollectionId, noPositionId },
    ] = await Promise.all([
      context.client
        .readContract({
          abi: conditionalTokensAbi,
          address: conditionalTokens,
          functionName: "getCollectionId",
          args: [
            // parentCollectionId
            "0x0000000000000000000000000000000000000000000000000000000000000000",
            conditionId,
            2n, // indexSet for YES (binary 10 = decimal 2)
          ],
        })
        .then(async (yesCollectionId) => ({
          yesCollectionId,
          yesPositionId: await context.client.readContract({
            abi: conditionalTokensAbi,
            address: conditionalTokens,
            functionName: "getPositionId",
            args: [collateralToken, yesCollectionId],
          }),
        })),
      context.client
        .readContract({
          abi: conditionalTokensAbi,
          address: conditionalTokens,
          functionName: "getCollectionId",
          args: [
            // parentCollectionId
            "0x0000000000000000000000000000000000000000000000000000000000000000",
            conditionId,
            1n, // indexSet for NO (binary 01 = decimal 1)
          ],
        })
        .then(async (noCollectionId) => ({
          noCollectionId,
          noPositionId: await context.client.readContract({
            abi: conditionalTokensAbi,
            address: conditionalTokens,
            functionName: "getPositionId",
            args: [collateralToken, noCollectionId],
          }),
        })),
    ]);

    await Promise.all([
      context.db.insert(predictionMarket).values({
        marketMaker,
        conditionalTokens,
        controller,
        collateralToken,
        questionId,
        conditionId,
        fee,
        initialFunding,
        yesCollectionId,
        noCollectionId,
        yesPositionId,
        noPositionId,
        payoutDenominator: null,
        yesPayoutNumerator: null,
        noPayoutNumerator: null,
        isMarketResolved: false,
        result: null,
        redeemableCollateral: null,
        unusedCollateral: null,
        collectedFees: null,
        createdAt: event.block.timestamp,
        resolvedAt: null,
      }),
      context.db.insert(predictionMarketPrice).values({
        id: "init",
        price: 0.5,
        marketAddress: marketMaker,
        timestamp: event.block.timestamp,
      }),
    ]);
  }
);

// Resolve market.
ponder.on(
  "predictionMarketController:MarketResolved",
  async ({ event, context }) => {
    const {
      lmsrMarketMaker: marketMaker,
      conditionalTokens,
      result,
      redeemableCollateral,
      unusedCollateral,
      collectedFees,
    } = event.args;

    const conditionId = (
      await context.db.sql
        .select({ conditionId: predictionMarket.conditionId })
        .from(predictionMarket)
        .where(eq(predictionMarket.marketMaker, marketMaker))
        .limit(1)
    )[0]?.conditionId;

    if (!conditionId) {
      throw new Error("Condition ID not found for market maker " + marketMaker);
    }

    const [payoutDenominator, yesPayoutNumerator, noPayoutNumerator] =
      await Promise.all([
        context.client.readContract({
          abi: conditionalTokensAbi,
          address: conditionalTokens,
          functionName: "payoutDenominator",
          args: [conditionId],
        }),
        context.client.readContract({
          abi: conditionalTokensAbi,
          address: conditionalTokens,
          functionName: "payoutNumerators",
          args: [conditionId, 1n], // outcome slot for YES
        }),
        context.client.readContract({
          abi: conditionalTokensAbi,
          address: conditionalTokens,
          functionName: "payoutNumerators",
          args: [conditionId, 0n], // outcome slot for NO
        }),
      ]);

    if (!payoutDenominator) {
      throw new Error(
        "Payout denominator not set even though market was resolved"
      );
    }

    if (yesPayoutNumerator + noPayoutNumerator !== payoutDenominator) {
      throw new Error(
        "Payout numerators do not sum to payout denominator even though market was resolved"
      );
    }

    await context.db.update(predictionMarket, { marketMaker }).set({
      payoutDenominator,
      yesPayoutNumerator,
      noPayoutNumerator,
      isMarketResolved: true,
      result,
      redeemableCollateral,
      unusedCollateral,
      collectedFees,
      resolvedAt: event.block.timestamp,
    });
  }
);

// Update price after each trade.
ponder.on("marketMaker:AMMOutcomeTokenTrade", async ({ event, context }) => {
  const marketAddress = event.log.address;
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
  const conditionalTokens = event.log.address;
  const marketMaker = (
    await context.db.sql
      .select({
        marketMaker: predictionMarket.marketMaker,
      })
      .from(predictionMarket)
      .where(eq(predictionMarket.conditionalTokens, conditionalTokens))
      .limit(1)
  )[0]?.marketMaker;

  if (!marketMaker) {
    throw new Error(
      "Market maker not found for conditional tokens " + conditionalTokens
    );
  }

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
    marketAddress: marketMaker,
    collateralToken,
    conditionId,
    indexSets: indexSets as bigint[],
    payout,
    timestamp: event.block.timestamp,
  });
});
