export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export type HyperstitionMarket = {
  slug: string
  title: string
  description: string
  successCondition: string
  failureCondition: string
  targetValue: number
  incentivePool: number
  startDate: Date
  endDate: Date
  marketMakerAddress: `0x${string}`
  conditionalTokensAddress: `0x${string}`
  controllerAddress: `0x${string}`
}

export type HyperstitionMarketStatus =
  | 'active'
  | 'achieved'
  | 'failed'
  | 'loading'
