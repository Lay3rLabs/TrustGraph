'use client'

import { usePonderQuery } from '@ponder/react'
import { useQueryClient } from '@tanstack/react-query'
import { usePlausible } from 'next-plausible'
import { useCallback, useMemo, useState } from 'react'
import { formatUnits } from 'viem'
import { useAccount } from 'wagmi'

import { Button } from '@/components/ui/button'
import { useCollateralToken } from '@/hooks/useCollateralToken'
import { useHyperstitionMarket } from '@/hooks/useHyperstitionMarket'
import { conditionalTokensAbi, erc20Address } from '@/lib/contracts'
import { txToast } from '@/lib/tx'
import { formatBigNumber } from '@/lib/utils'
import { hyperstitionKeys } from '@/queries/hyperstition'
import { HyperstitionMarket } from '@/types'

import { XIcon } from '../icons/XIcon'
import { Markdown } from '../Markdown'
import { SymbientShareModal } from '../SymbientShareModal'

interface PredictionRedeemFormProps {
  market: HyperstitionMarket
  onSuccess?: () => void
}

export const PredictionRedeemForm = ({
  market,
  onSuccess,
}: PredictionRedeemFormProps) => {
  const { address, isConnected } = useAccount()
  const queryClient = useQueryClient()
  const plausible = usePlausible()

  const [isRedeeming, setIsRedeeming] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [redeemed, setRedeemed] = useState<{
    outcome: string
    amount: string
  } | null>(null)

  const { symbol: collateralSymbol, decimals: collateralDecimals } =
    useCollateralToken()
  const {
    isLoadingShares,
    yesShares = 0n,
    noShares = 0n,
    yesPayoutNumerator,
    noPayoutNumerator,
    payoutDenominator,
    isMarketResolved,
    conditionId,
    refetch: refetchPredictionMarket,
  } = useHyperstitionMarket(market)

  // Find the redemption for the connected user.
  const { data: redemption, isPending: isLoadingRedemption } = usePonderQuery({
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
    const positions = []

    if (yesShares > 0n) {
      positions.push({
        outcome: 'YES' as const,
        amount: yesShares,
        payout:
          typeof yesPayoutNumerator === 'bigint' && payoutDenominator
            ? (yesShares * yesPayoutNumerator) / payoutDenominator
            : null,
      })
    }

    if (noShares > 0n) {
      positions.push({
        outcome: 'NO' as const,
        amount: noShares,
        payout:
          typeof noPayoutNumerator === 'bigint' && payoutDenominator
            ? (noShares * noPayoutNumerator) / payoutDenominator
            : null,
      })
    }

    return positions.sort((a, b) => Number(b.amount - a.amount))
  }, [yesShares, noShares])

  // Calculate expected payout for all positions
  const payout = useMemo(() => {
    if (
      userPositions.length === 0 ||
      !isMarketResolved ||
      !payoutDenominator ||
      (typeof yesPayoutNumerator !== 'bigint' &&
        typeof noPayoutNumerator !== 'bigint')
    ) {
      return null
    }

    return userPositions.reduce(
      (acc, position) => acc + (position.payout ?? 0n),
      0n
    )
  }, [
    userPositions,
    isMarketResolved,
    payoutDenominator,
    yesPayoutNumerator,
    noPayoutNumerator,
  ])

  const scrollRedeemRef = useCallback(
    (node: HTMLElement | null) => {
      if (!node || !payout) {
        return
      }

      const rect = node.getBoundingClientRect()
      if (rect.bottom > window.innerHeight) {
        node.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else if (rect.top < 0) {
        node.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    },
    [payout]
  )

  const handleRedeem = async () => {
    if (!isConnected || !address) {
      setError('Please connect your wallet')
      return
    }

    if (!isMarketResolved || payout === null) {
      setError('Market must be resolved before redeeming')
      return
    }

    if (userPositions.length === 0 || !payout) {
      setError('No payout found to redeem')
      return
    }

    setIsRedeeming(true)
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
          formatBigNumber(payout, collateralDecimals) + ' $' + collateralSymbol
        }.`,
      })

      plausible('hyperstition_redeem', {
        props: {
          market: market.marketMakerAddress,
          conditionalTokens: market.conditionalTokensAddress,
          amount: formatBigNumber(payout, collateralDecimals, true),
        },
      })

      setSuccess(
        `Successfully redeemed ${
          formatBigNumber(payout, collateralDecimals) + ' $' + collateralSymbol
        }.`
      )
      setRedeemed({
        outcome: userPositions
          .filter((pos) => !!pos.payout)
          .map((pos) => pos.outcome)
          .join(' and '),
        amount: formatBigNumber(payout, collateralDecimals, true),
      })

      console.log('Transaction confirmed:', receipt.transactionHash)

      // Refresh balances
      refetchPredictionMarket()

      // Refresh pending redemptions
      queryClient.invalidateQueries({
        queryKey: hyperstitionKeys.pendingRedemptions(address),
      })

      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      console.error('Error redeeming position:', err)
      setError(err.message || 'Failed to redeem position')
    } finally {
      setIsRedeeming(false)
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
              <div
                className="bg-black/20 border border-gray-600 p-4 rounded-sm"
                ref={scrollRedeemRef}
              >
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
                disabled={!isConnected || !isMarketResolved || isRedeeming}
                className="w-full mobile-terminal-btn"
              >
                {isRedeeming ? (
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
            <>
              <div className="bg-black/20 border border-gray-600 p-4 rounded-sm">
                <div className="space-y-3">
                  <div className="terminal-dim text-xs">WINNINGS</div>
                  <div className="terminal-bright text-base !text-green-400">
                    {formatBigNumber(redemption.payout, collateralDecimals)} $
                    {collateralSymbol}
                  </div>
                </div>
              </div>

              {isConnected && redemption.payout > 0n && (
                <Button
                  variant="tertiary"
                  className="w-full"
                  onClick={() =>
                    setRedeemed(
                      redemption.indexSets[0] === 2n
                        ? {
                            outcome: 'YES',
                            amount: formatUnits(
                              redemption.payout,
                              collateralDecimals
                            ),
                          }
                        : {
                            outcome: 'NO',
                            amount: formatUnits(
                              redemption.payout,
                              collateralDecimals
                            ),
                          }
                    )
                  }
                >
                  <XIcon className="w-3 h-3" />
                  Share
                </Button>
              )}
            </>
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

      <SymbientShareModal
        isOpen={redeemed !== null}
        onClose={() => setRedeemed(null)}
        title="HYPERSTITION REDEMPTION DETECTED"
        description={
          <Markdown rawHtml>
            {`You earned <span className="text-green">${
              redeemed?.amount || '...'
            } ${collateralSymbol}</span> by redeeming ${
              redeemed?.outcome
            } in the Hyperstition.`}
          </Markdown>
        }
        action={`redeemed the ${redeemed?.outcome || '...'} outcome${
          redeemed?.outcome.includes(' and ') ? 's' : ''
        } in the Hyperstition: ${market.title}`}
      />
    </div>
  )
}
