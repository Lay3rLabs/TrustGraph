'use client'

import clsx from 'clsx'
import { useState } from 'react'

import { HyperstitionMarket } from '@/types'

import { Card } from '../Card'
import { PredictionBuyForm } from './PredictionBuyForm'
import { PredictionRedeemForm } from './PredictionRedeemForm'
import { PredictionSellForm } from './PredictionSellForm'

export type PredictionMarketFormsProps = {
  market: HyperstitionMarket
  isMarketResolved?: boolean
  className?: string
}

export const PredictionMarketForms = ({
  market,
  isMarketResolved,
  className,
}: PredictionMarketFormsProps) => {
  const [_activeTab, setActiveTab] = useState<'buy' | 'sell' | 'redeem'>('buy')

  const activeTab = isMarketResolved ? 'redeem' : _activeTab

  const redeemButton = (
    <button
      onClick={() => isMarketResolved && setActiveTab('redeem')}
      className={clsx(
        'text-xs font-mono transition-colors',
        activeTab === 'redeem'
          ? 'terminal-command'
          : 'terminal-dim hover:terminal-bright',
        !isMarketResolved &&
          '!opacity-50 cursor-not-allowed pointer-events-none'
      )}
    >
      REDEEM
    </button>
  )

  return (
    <Card size="lg" type="primary" className={className}>
      {/* Tab Navigation */}
      <div className="border-b border-gray-700 pb-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex space-x-6">
            {isMarketResolved && redeemButton}
            <button
              onClick={() => !isMarketResolved && setActiveTab('buy')}
              disabled={isMarketResolved}
              className={clsx(
                'text-xs font-mono transition-colors',
                activeTab === 'buy'
                  ? 'terminal-command'
                  : 'terminal-dim hover:terminal-bright',
                isMarketResolved &&
                  '!opacity-50 cursor-not-allowed pointer-events-none'
              )}
            >
              BUY
            </button>
            <button
              onClick={() => !isMarketResolved && setActiveTab('sell')}
              disabled={isMarketResolved}
              className={clsx(
                'text-xs font-mono transition-colors',
                activeTab === 'sell'
                  ? 'terminal-command'
                  : 'terminal-dim hover:terminal-bright',
                isMarketResolved &&
                  '!opacity-50 cursor-not-allowed pointer-events-none'
              )}
            >
              SELL
            </button>
            {!isMarketResolved && redeemButton}
          </div>
        </div>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'buy' && <PredictionBuyForm market={market} />}
        {activeTab === 'sell' && <PredictionSellForm market={market} />}
        {activeTab === 'redeem' && <PredictionRedeemForm market={market} />}
      </div>
    </Card>
  )
}
