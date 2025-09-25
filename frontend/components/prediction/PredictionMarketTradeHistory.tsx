'use client'

import { usePonderQuery } from '@ponder/react'
import type React from 'react'
import { useAccount } from 'wagmi'

import { useCollateralToken } from '@/hooks/useCollateralToken'
import { formatBigNumber } from '@/lib/utils'
import { HyperstitionMarket } from '@/types'

export type PredictionMarketTradeHistoryProps = {
  market: HyperstitionMarket
  windowStartTimestamp: bigint
  onlyMyTrades: boolean
}

export const PredictionMarketTradeHistory: React.FC<
  PredictionMarketTradeHistoryProps
> = ({ market, windowStartTimestamp, onlyMyTrades }) => {
  const { address } = useAccount()

  // Use mock USDC for collateral balance
  const { symbol: collateralSymbol, decimals: collateralDecimals } =
    useCollateralToken()

  const {
    data: tradeHistory,
    isLoading: isLoadingTradeHistory,
    isError: isErrorTradeHistory,
    error: errorTradeHistory,
  } = usePonderQuery({
    queryFn: (db) =>
      db.query.predictionMarketTrade.findMany({
        orderBy: (t, { desc }) => desc(t.timestamp),
        limit: 100,
        where: (t, { and, eq, gte }) =>
          and(
            eq(t.marketAddress, market.marketMakerAddress),
            ...(onlyMyTrades && address ? [eq(t.address, address)] : []),
            ...(windowStartTimestamp > 0n
              ? [gte(t.timestamp, windowStartTimestamp)]
              : [])
          ),
      }),
  })

  return isLoadingTradeHistory ? (
    <div className="flex items-center justify-center py-8">
      <div className="terminal-bright text-sm">◉ LOADING TRADE HISTORY ◉</div>
    </div>
  ) : isErrorTradeHistory ? (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="terminal-bright text-sm">
        ◉ ERROR LOADING TRADE HISTORY ◉
      </div>
      <div className="terminal-dim text-xs mt-1">
        {errorTradeHistory?.message}
      </div>
    </div>
  ) : !tradeHistory || tradeHistory.length === 0 ? (
    <div className="flex items-center justify-center py-8">
      <div className="terminal-dim text-sm">
        {onlyMyTrades && address
          ? 'No trades found for your wallet'
          : !address && onlyMyTrades
          ? 'Connect your wallet to view your trades'
          : 'No trade history available'}
      </div>
    </div>
  ) : (
    <div className="border border-gray-600 rounded overflow-hidden min-w-0">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-800/50 border-b border-gray-600">
              <th className="text-left p-3 terminal-dim font-mono">TIME</th>
              <th className="text-left p-3 terminal-dim font-mono">TRADE</th>
              <th className="text-left p-3 terminal-dim font-mono">OUTCOME</th>
              <th className="text-left p-3 terminal-dim font-mono">TRADER</th>
            </tr>
          </thead>
          <tbody>
            {tradeHistory.map((trade, index) => {
              const isUserTrade =
                address && trade.address.toLowerCase() === address.toLowerCase()
              return (
                <tr
                  key={trade.id}
                  className={`border-b border-gray-700/50 hover:bg-gray-800/30 transition-colors ${
                    index % 2 === 0 ? 'bg-gray-900/20' : ''
                  }`}
                >
                  <td className="p-3 terminal-text">
                    {new Date(Number(trade.timestamp) * 1000).toLocaleString(
                      [],
                      {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      }
                    )}
                  </td>
                  <td className="p-3 terminal-dim font-mono">
                    <span
                      className={
                        trade.type === 'buy' ? '!text-green' : '!text-pink'
                      }
                    >
                      {trade.type.toUpperCase()}
                    </span>{' '}
                    {formatBigNumber(trade.cost, collateralDecimals)} $
                    {collateralSymbol}
                  </td>
                  <td className="p-3 terminal-text">
                    <span
                      className={`px-2 py-1 rounded text-xs font-mono ${
                        trade.outcome === 'yes'
                          ? 'bg-green/20 text-green border border-green/30'
                          : 'bg-pink/20 text-pink border border-pink/30'
                      }`}
                    >
                      {trade.outcome.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3 terminal-dim font-mono">
                    {isUserTrade ? (
                      <span className="font-semibold">YOU</span>
                    ) : (
                      <>
                        {trade.address.slice(0, 6)}...
                        {trade.address.slice(-4)}
                      </>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
