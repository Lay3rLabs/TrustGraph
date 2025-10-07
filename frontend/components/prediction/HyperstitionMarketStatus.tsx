import clsx from 'clsx'

import { useHyperstitionMarketStatus } from '@/hooks/useHyperstitionMarketStatus'
import { HyperstitionMarket } from '@/types'

export type HyperstitionMarketStatusProps = {
  market: HyperstitionMarket
}

export const HyperstitionMarketStatus = ({
  market,
}: HyperstitionMarketStatusProps) => {
  const { status } = useHyperstitionMarketStatus(market)

  return (
    <div
      className={clsx('px-2 py-1 border rounded-sm text-xs', {
        'border-green text-green': status === 'active' || status === 'achieved',
        'border-pink text-pink': status === 'failed',
        'border-accent text-accent': status === 'loading',
      })}
    >
      {status.toUpperCase()}
    </div>
  )
}
