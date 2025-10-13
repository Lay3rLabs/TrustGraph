import { index, onchainEnum, onchainTable } from 'ponder'

export const predictionMarket = onchainTable(
  'prediction_market',
  (t) => ({
    marketMaker: t.hex().primaryKey(),
    conditionalTokens: t.hex().notNull(),
    controller: t.hex().notNull(),
    collateralToken: t.hex().notNull(),
    questionId: t.hex().notNull(),
    conditionId: t.hex().notNull(),
    fee: t.bigint().notNull(),
    initialFunding: t.bigint().notNull(),
    yesCollectionId: t.hex().notNull(),
    noCollectionId: t.hex().notNull(),
    yesPositionId: t.bigint().notNull(),
    noPositionId: t.bigint().notNull(),
    payoutDenominator: t.bigint(),
    yesPayoutNumerator: t.bigint(),
    noPayoutNumerator: t.bigint(),
    isMarketResolved: t.boolean().notNull(),
    result: t.boolean(),
    redeemableCollateral: t.bigint(),
    unusedCollateral: t.bigint(),
    collectedFees: t.bigint(),
    createdAt: t.bigint().notNull(),
    resolvedAt: t.bigint(),
  }),
  (t) => ({
    createdAtIdx: index().on(t.createdAt),
    resolvedAtIdx: index().on(t.resolvedAt),
  })
)

export const predictionMarketPrice = onchainTable(
  'prediction_market_price',
  (t) => ({
    id: t.text().primaryKey(),
    marketAddress: t.hex().notNull(),
    price: t.real().notNull(),
    timestamp: t.bigint().notNull(),
  }),
  (t) => ({
    marketAddressIdx: index().on(t.marketAddress),
    timestampIdx: index().on(t.timestamp),
  })
)

export const predictionMarketTradeType = onchainEnum(
  'prediction_market_trade_type',
  ['buy', 'sell']
)

export const predictionMarketTrade = onchainTable(
  'prediction_market_trade',
  (t) => ({
    id: t.text().primaryKey(),
    address: t.hex().notNull(),
    marketAddress: t.hex().notNull(),
    type: predictionMarketTradeType('type').notNull(),
    outcome: t.text().notNull(),
    amount: t.bigint().notNull(),
    cost: t.bigint().notNull(),
    fees: t.bigint().notNull(),
    timestamp: t.bigint().notNull(),
  }),
  (t) => ({
    addressIdx: index().on(t.address),
    marketAddressIdx: index().on(t.marketAddress),
    typeIdx: index().on(t.type),
    outcomeIdx: index().on(t.outcome),
    timestampIdx: index().on(t.timestamp),
  })
)

export const predictionMarketRedemption = onchainTable(
  'prediction_market_redemption',
  (t) => ({
    id: t.text().primaryKey(),
    address: t.hex().notNull(),
    marketAddress: t.hex().notNull(),
    collateralToken: t.hex().notNull(),
    conditionId: t.hex().notNull(),
    indexSets: t.bigint().array().notNull(),
    payout: t.bigint().notNull(),
    timestamp: t.bigint().notNull(),
  }),
  (t) => ({
    addressIdx: index().on(t.address),
    marketAddressIdx: index().on(t.marketAddress),
    timestampIdx: index().on(t.timestamp),
  })
)

export const wavsIndexerEvent = onchainTable(
  'wavs_indexer_event',
  (t) => ({
    id: t.hex().primaryKey(),
    chainId: t.text().notNull(),
    relevantContract: t.hex().notNull(),
    blockNumber: t.bigint().notNull(),
    timestamp: t.bigint().notNull(),
    type: t.text().notNull(),
    data: t.hex().notNull(),
    tags: t.text().array().notNull(),
    relevantAddresses: t.hex().array().notNull(),
    metadata: t.hex().notNull(),
    deleted: t.boolean().notNull(),
  }),
  (t) => ({
    typeIdx: index().on(t.type),
    chainIdIdx: index().on(t.chainId),
    relevantContractIdx: index().on(t.relevantContract),
    blockNumberIdx: index().on(t.blockNumber),
    timestampIdx: index().on(t.timestamp),
  })
)

export const easAttestation = onchainTable(
  'eas_attestation',
  (t) => ({
    uid: t.hex().primaryKey(),
    schema: t.hex().notNull(),
    attester: t.hex().notNull(),
    recipient: t.hex().notNull(),
    ref: t.hex().notNull(),
    revocable: t.boolean().notNull(),
    expirationTime: t.bigint().notNull(),
    revocationTime: t.bigint().notNull(),
    data: t.hex().notNull(),
    blockNumber: t.bigint().notNull(),
    timestamp: t.bigint().notNull(),
  }),
  (t) => ({
    schemaIdx: index().on(t.schema),
    attesterIdx: index().on(t.attester),
    recipientIdx: index().on(t.recipient),
    refIdx: index().on(t.ref),
    blockNumberIdx: index().on(t.blockNumber),
    timestampIdx: index().on(t.timestamp),
  })
)

export const merkleSnapshot = onchainTable(
  'merkle_snapshot',
  (t) => ({
    id: t.text().primaryKey(),
    root: t.hex().notNull(),
    ipfsHash: t.hex().notNull(),
    ipfsHashCid: t.text().notNull(),
    totalValue: t.bigint().notNull(),
    blockNumber: t.bigint().notNull(),
    timestamp: t.bigint().notNull(),
  }),
  (t) => ({
    rootIdx: index().on(t.root),
    ipfsHashCidIdx: index().on(t.ipfsHashCid),
    blockNumberIdx: index().on(t.blockNumber),
    timestampIdx: index().on(t.timestamp),
  })
)
