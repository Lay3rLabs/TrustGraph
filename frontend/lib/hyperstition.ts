import { HyperstitionMarket } from '@/types'

import {
  conditionalTokensAddress,
  lmsrMarketMakerAddress,
  predictionMarketControllerAddress,
} from './contracts'

export const currentMarket: HyperstitionMarket = {
  slug: 'test',
  title: 'EN0VA Twitter Launch',
  description:
    '[@0xEN0VA](https://x.com/0xEN0VA) reaches 50 Twitter followers by ' +
    new Date(1759514400 * 1e3).toLocaleString(undefined, {
      dateStyle: 'short',
      timeStyle: 'long',
    }),
  targetValue: 50,
  incentivePool: 10_000,
  startDate: new Date(1758841200 * 1e3),
  endDate: new Date(1759514400 * 1e3),
  marketMakerAddress: lmsrMarketMakerAddress,
  conditionalTokensAddress,
  controllerAddress: predictionMarketControllerAddress,
}

const pastMarkets: HyperstitionMarket[] = ([] as HyperstitionMarket[])
  // Sort by end date descending (most recent first)
  .sort((a, b) => b.endDate.getTime() - a.endDate.getTime())

export const allMarkets: HyperstitionMarket[] = [currentMarket, ...pastMarkets]
