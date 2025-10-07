'use client'

import { usePonderQuery } from '@ponder/react'
import { usePlausible } from 'next-plausible'
import React, { useMemo, useState } from 'react'
import { useAccount, useWriteContract } from 'wagmi'

import { Button } from '@/components/ui/button'
import { useCollateralToken } from '@/hooks/useCollateralToken'
import { useHyperstitionMarket } from '@/hooks/useHyperstitionMarket'
import { conditionalTokensAbi, erc20Address } from '@/lib/contracts'
import { txToast } from '@/lib/tx'
import { formatBigNumber } from '@/lib/utils'
import { HyperstitionMarket } from '@/types'

interface PredictionRedeemFormProps {
  market: HyperstitionMarket
  onSuccess?: () => void
}

export const PredictionRedeemForm: React.FC<PredictionRedeemFormProps> = ({
  market,
  onSuccess,
}) => {
  const { address, isConnected } = useAccount()
  const { isPending: isWriting } = useWriteContract()
  const plausible = usePlausible()

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const { symbol: collateralSymbol, decimals: collateralDecimals } =
    useCollateralToken()
  const {
    isLoadingShares,
    yesShares,
    noShares,
    yesPayoutNumerator,
    noPayoutNumerator,
    payoutDenominator,
    isMarketResolved,
    conditionId,
    refetch: refetchPredictionMarket,
  } = useHyperstitionMarket(market)

  // Find the redemption for the connected user.
  const { data: redemption, isLoading: isLoadingRedemption } = usePonderQuery({
    queryFn: (db) =>
      db.query.predictionMarketRedemption.findFirst({
        where: (t, { and, eq }) =>
          and(
            eq(t.marketAddress, market.marketMakerAddress),
            ...(address ? [eq(t.address, address)] : [])
          ),
      }),
    enabled: isMarketResolved && !!address,
  })

  const marketOutcome = !isMarketResolved
    ? null
    : // YES outcome wins if yesPayoutNumerator > 0 and noPayoutNumerator = 0
    // NO outcome wins if noPayoutNumerator > 0 and yesPayoutNumerator = 0
    // Could also be a draw if both are equal and > 0
    yesPayoutNumerator! > 0n && noPayoutNumerator === 0n
    ? 'YES'
    : noPayoutNumerator! > 0n && yesPayoutNumerator === 0n
    ? 'NO'
    : null

  // Determine which positions the user has (can have both YES and NO)
  const userPositions = useMemo(() => {
    const yesAmount = yesShares || 0n
    const noAmount = noShares || 0n

    const positions = []

    if (yesAmount > 0n) {
      positions.push({
        outcome: 'YES' as const,
        amount: yesAmount,
      })
    }

    if (noAmount > 0n) {
      positions.push({
        outcome: 'NO' as const,
        amount: noAmount,
      })
    }

    return positions
  }, [yesShares, noShares])

  // Calculate expected payout for all positions
  const payout = useMemo(() => {
    if (
      userPositions.length === 0 ||
      !isMarketResolved ||
      !payoutDenominator ||
      (yesPayoutNumerator === undefined && noPayoutNumerator === undefined)
    ) {
      return null
    }

    try {
      let totalPayout = 0n

      for (const position of userPositions) {
        const payoutNumerator =
          position.outcome === 'YES' ? yesPayoutNumerator : noPayoutNumerator
        if (payoutNumerator !== undefined) {
          // Calculate payout: (position.amount * payoutNumerator) / payoutDenominator
          const positionPayout =
            (position.amount * payoutNumerator) / payoutDenominator
          totalPayout += positionPayout
        }
      }

      return totalPayout
    } catch (err) {
      console.error('Error calculating expected payout:', err)
      return null
    }
  }, [
    userPositions,
    isMarketResolved,
    payoutDenominator,
    yesPayoutNumerator,
    noPayoutNumerator,
  ])

  const handleRedeem = async () => {
    if (!isConnected || !address) {
      setError('Please connect your wallet')
      return
    }

    if (userPositions.length === 0) {
      setError('No positions found to redeem')
      return
    }

    if (!isMarketResolved) {
      setError('Market must be resolved before redeeming')
      return
    }

    setError(null)
    setSuccess(null)

    try {
      // Create index sets for redemption - include all positions the user has
      // Index set 1 = binary 01 = decimal 1 (represents NO)
      // Index set 2 = binary 10 = decimal 2 (represents YES)
      const indexSets = userPositions.map((pos) =>
        pos.outcome === 'YES' ? 2n : 1n
      )

      if (!conditionId) {
        throw new Error('Condition ID not found')
      }

      const [receipt] = await txToast({
        tx: {
          address: market.conditionalTokensAddress,
          abi: conditionalTokensAbi,
          functionName: 'redeemPositions',
          args: [
            erc20Address, // collateralToken
            '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`, // parentCollectionId
            conditionId,
            indexSets,
          ],
        },
        successMessage: `Successfully redeemed ${
          payout !== null
            ? formatBigNumber(payout, collateralDecimals) +
              ' $' +
              collateralSymbol
            : '$' + collateralSymbol
        }.`,
      })

      plausible('hyperstition_redeem', {
        props: {
          market: market.marketMakerAddress,
          conditionalTokens: market.conditionalTokensAddress,
          amount:
            payout !== null
              ? formatBigNumber(payout, collateralDecimals, true)
              : -1,
        },
      })

      console.log('Transaction confirmed:', receipt.transactionHash)

      // Refresh balances
      refetchPredictionMarket()

      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      console.error('Error redeeming position:', err)
      setError(err.message || 'Failed to redeem position')
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="terminal-command text-lg">
          {isMarketResolved && redemption
            ? 'Your Redemption'
            : 'Redeem Your Position'}
        </h3>
        <p className="terminal-text text-sm">{market.title}</p>
      </div>

      {isConnected ? (
        <>
          {isLoadingShares ? (
            <div className="bg-black/20 border border-gray-600 p-4 rounded-sm">
              <div className="text-center py-8">
                <div className="terminal-bright text-sm">
                  ◉ LOADING YOUR POSITIONS ◉
                </div>
              </div>
            </div>
          ) : !isMarketResolved || userPositions.length > 0 ? (
            <>
              <div className="bg-black/20 border border-gray-600 p-4 rounded-sm">
                <div className="space-y-3">
                  <div className="terminal-dim text-xs">YOUR POSITIONS</div>

                  {userPositions.map((position) => {
                    const isWinning =
                      isMarketResolved && marketOutcome === position.outcome
                    const isLosing =
                      isMarketResolved &&
                      marketOutcome !== null &&
                      marketOutcome !== position.outcome

                    return (
                      <div
                        key={position.outcome}
                        className="flex justify-between items-center gap-4"
                      >
                        <div className="flex-1">
                          <div className="terminal-bright text-base">
                            {formatBigNumber(
                              position.amount,
                              collateralDecimals
                            )}{' '}
                            {position.outcome} shares
                          </div>
                        </div>

                        {isMarketResolved ? (
                          <div
                            className={`text-xs font-bold px-2 py-1 rounded ${
                              isWinning
                                ? 'text-green-400 bg-green-900/30 border border-green-500'
                                : isLosing
                                ? 'text-red-400 bg-red-900/30 border border-red-500'
                                : 'text-gray-400 bg-gray-900/30 border border-gray-500'
                            }`}
                          >
                            {isWinning ? 'WON' : isLosing ? 'LOST' : 'DRAW'}
                          </div>
                        ) : (
                          <div className="text-xs font-bold px-2 py-1 rounded text-gray-400 bg-gray-900/30 border border-gray-500">
                            PENDING
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {userPositions.length === 0 && (
                    <div className="text-center py-8">
                      <div className="terminal-dim text-sm">
                        You have no positions in this market
                      </div>

                      {!isLoadingRedemption && !isMarketResolved && (
                        <div className="terminal-dim text-xs mt-2">
                          Buy some tokens first to participate
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <Button
                onClick={handleRedeem}
                disabled={!isConnected || !isMarketResolved || isWriting}
                className="w-full mobile-terminal-btn"
              >
                {isWriting ? (
                  <span className="terminal-dim">Processing...</span>
                ) : payout ? (
                  <span className="terminal-command">
                    REDEEM FOR {formatBigNumber(payout, collateralDecimals)} $
                    {collateralSymbol}
                  </span>
                ) : (
                  <span className="terminal-command">
                    REDEEM POSITIONS
                    {isMarketResolved ? '' : ' AFTER MARKET RESOLVES'}
                  </span>
                )}
              </Button>

              <div className="terminal-dim text-xs">
                When you redeem your positions, you&apos;ll receive collateral
                tokens based on the market outcome.{' '}
                {!isMarketResolved
                  ? 'The market is not yet resolved, so no redemption is possible.'
                  : userPositions.some((pos) => marketOutcome === pos.outcome)
                  ? userPositions.some((pos) => marketOutcome !== pos.outcome)
                    ? ' You have both winning and losing positions - only winning positions will yield collateral.'
                    : ' Since you bet on the correct outcome, you can redeem your tokens for collateral.'
                  : ' Since you bet on the incorrect outcome, your tokens are now worthless.'}
              </div>
            </>
          ) : isLoadingRedemption ? (
            <div className="bg-black/20 border border-gray-600 p-4 rounded-sm">
              <div className="text-center py-8">
                <div className="terminal-bright text-sm">
                  ◉ LOADING YOUR WINNINGS ◉
                </div>
              </div>
            </div>
          ) : redemption ? (
            <div className="bg-black/20 border border-gray-600 p-4 rounded-sm">
              <div className="space-y-3">
                <div className="terminal-dim text-xs">WINNINGS</div>
                <div className="terminal-bright text-base !text-green-400">
                  {formatBigNumber(redemption.payout, collateralDecimals)} $
                  {collateralSymbol}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-black/20 border border-gray-600 p-4 rounded-sm">
              <div className="text-center py-8">
                <div className="terminal-dim text-sm">
                  You have no winnings in this market
                </div>
              </div>
            </div>
          )}

          {payout !== null && (
            <div className="mt-4 pt-4 border-t border-gray-800">
              <div className="terminal-dim text-xs">
                TOTAL EXPECTED REDEMPTION
              </div>
              <div className="terminal-bright text-base text-green-400">
                {formatBigNumber(payout, collateralDecimals)} $
                {collateralSymbol}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-900/30 border border-red-500 p-3 rounded-sm">
              <div className="text-red-400 text-sm">{error}</div>
            </div>
          )}

          {success && (
            <div className="bg-green-900/30 border border-green-500 p-3 rounded-sm">
              <div className="text-green-400 text-sm">{success}</div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8">
          <div className="terminal-dim text-sm">
            Please connect your wallet to view positions
          </div>
        </div>
      )}
    </div>
  )
}
