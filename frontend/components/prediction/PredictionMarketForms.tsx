'use client'

import { useState } from 'react'

import { Card } from '../Card'
import { PredictionBuyForm } from './PredictionBuyForm'
import { HyperstitionMarket } from './PredictionMarketDetail'
import { PredictionRedeemForm } from './PredictionRedeemForm'
import { PredictionSellForm } from './PredictionSellForm'

export type PredictionMarketFormsProps = {
  market: HyperstitionMarket
  className?: string
}

export const PredictionMarketForms = ({
  market,
  className,
}: PredictionMarketFormsProps) => {
  const [activeTab, setActiveTab] = useState<'buy' | 'sell' | 'redeem'>('buy')

  return (
    <Card size="lg" type="primary" className={className}>
      {/* Tab Navigation */}
      <div className="border-b border-gray-700 pb-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex space-x-6">
            <button
              onClick={() => setActiveTab('buy')}
              className={`text-xs font-mono transition-colors ${
                activeTab === 'buy'
                  ? 'terminal-command'
                  : 'terminal-dim hover:terminal-bright'
              }`}
            >
              BUY
            </button>
            <button
              onClick={() => setActiveTab('sell')}
              className={`text-xs font-mono transition-colors ${
                activeTab === 'sell'
                  ? 'terminal-command'
                  : 'terminal-dim hover:terminal-bright'
              }`}
            >
              SELL
            </button>
            <button
              onClick={() => setActiveTab('redeem')}
              className={`text-xs font-mono transition-colors ${
                activeTab === 'redeem'
                  ? 'terminal-command'
                  : 'terminal-dim hover:terminal-bright'
              }`}
            >
              REDEEM
            </button>
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
