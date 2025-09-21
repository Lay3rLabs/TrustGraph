import { index, onchainEnum, onchainTable } from 'ponder'

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
