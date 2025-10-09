'use client'

import { useQueryClient } from '@tanstack/react-query'
import { readContractQueryOptions } from '@wagmi/core/query'
import clsx from 'clsx'
import { LoaderCircle } from 'lucide-react'
import { usePlausible } from 'next-plausible'
import React, { useCallback, useEffect, useState } from 'react'
import { formatUnits, parseUnits } from 'viem'
import { useAccount } from 'wagmi'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCollateralToken } from '@/hooks/useCollateralToken'
import { useHyperstitionMarket } from '@/hooks/useHyperstitionMarket'
import { useUpdatingRef } from '@/hooks/useUpdatingRef'
import { erc20Abi, erc20Address, lmsrMarketMakerAbi } from '@/lib/contracts'
import { txToast } from '@/lib/tx'
import { formatBigNumber } from '@/lib/utils'
import { config } from '@/lib/wagmi'
import { HyperstitionMarket } from '@/types'

import { Card } from '../Card'
import { HyperstitionDescriptionDisplay } from './HyperstitionDescriptionDisplay'
import { HyperstitionShareModal } from './HyperstitionShareModal'
import { XIcon } from '../icons/XIcon'
import { Markdown } from '../Markdown'

interface PredictionBuyFormProps {
  market: HyperstitionMarket
  onSuccess?: () => void
}

export const PredictionBuyForm: React.FC<PredictionBuyFormProps> = ({
  market,
  onSuccess,
}) => {
  const { address, isConnected } = useAccount()
  const queryClient = useQueryClient()
  const plausible = usePlausible()

  const [formData, setFormData] = useState({
    outcome: 'YES' as 'YES' | 'NO',
    collateralAmount: '',
  })

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [tokensEstimate, setTokensEstimate] = useState<string | null>(null)
  const [isCalculating, setIsCalculating] = useState<boolean>(false)
  const [slippage, setSlippage] = useState<number>(2)

  const [bought, setBought] = useState<
    {
      outcome: string
      amount: string
    }[]
  >([])

  // Binary search to find the exact token amount for the specified collateral
  const [estimatedTokenAmount, setEstimatedTokenAmount] = useState<string>('0')

  // Recursive binary search function using direct query client calls
  const performBinarySearch = useCallback(
    async (
      targetCollateral: bigint,
      outcome: 'YES' | 'NO',
      low: bigint = 0n,
      high: bigint = targetCollateral * 10n,
      bestTokenAmount: bigint = 0n,
      iteration: number = 0
    ): Promise<bigint> => {
      // Base case: stop after 15 iterations or when range is too small
      if (high <= low || iteration >= 15) {
        return bestTokenAmount
      }

      const mid = (low + high) / 2n
      const outcomeTokenAmounts = outcome === 'YES' ? [0n, mid] : [mid, 0n]

      try {
        const netCost = (await queryClient.fetchQuery(
          readContractQueryOptions(config, {
            address: market.marketMakerAddress,
            abi: lmsrMarketMakerAbi,
            functionName: 'calcNetCost',
            args: [outcomeTokenAmounts],
          })
        )) as bigint

        // Calculate market fee (same logic as in the contract)
        const fee = (await queryClient.fetchQuery(
          readContractQueryOptions(config, {
            address: market.marketMakerAddress,
            abi: lmsrMarketMakerAbi,
            functionName: 'calcMarketFee',
            args: [netCost > 0n ? netCost : -netCost],
          })
        )) as bigint

        // Total cost including fee
        const totalCost = netCost + fee

        if (totalCost <= targetCollateral) {
          // Cost is within budget, try for more tokens
          return performBinarySearch(
            targetCollateral,
            outcome,
            mid + 1n,
            high,
            mid, // This is our new best amount
            iteration + 1
          )
        } else {
          // Cost is too high, try fewer tokens
          return performBinarySearch(
            targetCollateral,
            outcome,
            low,
            mid - 1n,
            bestTokenAmount,
            iteration + 1
          )
        }
      } catch (error) {
        console.error('Error in binary search iteration:', error)
        // Return best amount found so far
        return bestTokenAmount
      }
    },
    [market.marketMakerAddress, queryClient]
  )

  // Store reference to the latest collateral amount so we can interrupt async binary search if the collateral amount changes.
  const currentCollateralAmount = useUpdatingRef(formData.collateralAmount)

  // Effect to run binary search when collateral amount or outcome changes
  useEffect(() => {
    if (
      !formData.collateralAmount ||
      isNaN(Number(formData.collateralAmount)) ||
      Number(formData.collateralAmount) <= 0
    ) {
      setEstimatedTokenAmount('0')
      setIsCalculating(false)
      setTokensEstimate(null)
      return
    }

    const targetCollateral = parseUnits(
      formData.collateralAmount,
      collateralDecimals
    )
    setIsCalculating(true)

    // Run binary search
    performBinarySearch(targetCollateral, formData.outcome)
      .then((result) => {
        // If the collateral amount has changed since we started this search, do not update the estimates.
        if (currentCollateralAmount.current !== formData.collateralAmount) {
          return
        }

        const formattedResult = formatUnits(result, collateralDecimals)
        setEstimatedTokenAmount(formattedResult)
        setTokensEstimate(formattedResult)
        setIsCalculating(false)
      })
      .catch((error) => {
        // If the collateral amount has changed since we started this search, do not update the estimates.
        if (currentCollateralAmount.current !== formData.collateralAmount) {
          return
        }

        console.error('Binary search failed:', error)
        setEstimatedTokenAmount('0')
        setTokensEstimate(null)
        setIsCalculating(false)
      })
  }, [formData.collateralAmount, formData.outcome, performBinarySearch])

  const {
    isLoadingMarket,
    isMarketResolved,
    yesPrice,
    yesShares,
    formattedYesShares,
    isLoadingYesShares,
    noPrice,
    noShares,
    formattedNoShares,
    isLoadingNoShares,
    refetch: refetchPredictionMarket,
  } = useHyperstitionMarket(market)
  const {
    symbol: collateralSymbol,
    decimals: collateralDecimals,
    balance: collateralBalance,
    refetchBalance: refetchCollateralBalance,
  } = useCollateralToken()

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null)
    setSuccess(null)
  }

  const [isBuying, setIsBuying] = useState(false)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isConnected || !address) {
      setError('Please connect your wallet')
      return
    }

    if (
      !formData.collateralAmount ||
      isNaN(Number(formData.collateralAmount)) ||
      Number(formData.collateralAmount) <= 0
    ) {
      setError('Please enter a valid collateral amount')
      return
    }

    setIsBuying(true)
    setError(null)
    setSuccess(null)

    try {
      // Apply slippage tolerance to a slightly higher collateral amount
      const collateralLimit =
        (parseUnits(formData.collateralAmount, collateralDecimals) *
          (100n + BigInt(slippage))) /
        100n

      // Use the estimated token amount for the trade
      const tokenAmount = parseUnits(estimatedTokenAmount, collateralDecimals)
      const outcomeTokenAmounts =
        formData.outcome === 'YES' ? [0n, tokenAmount] : [tokenAmount, 0n]

      await txToast(
        // Approve market maker to spend collateral
        {
          tx: {
            address: erc20Address,
            abi: erc20Abi,
            functionName: 'approve',
            args: [market.marketMakerAddress, collateralLimit],
          },
          successMessage: 'Spend approved!',
        },
        // Execute trade
        {
          tx: {
            address: market.marketMakerAddress,
            abi: lmsrMarketMakerAbi,
            functionName: 'trade',
            args: [outcomeTokenAmounts, collateralLimit],
          },
          successMessage: 'Trade executed!',
        }
      )

      plausible('hyperstition_buy', {
        props: {
          market: market.marketMakerAddress,
          conditionalTokens: market.conditionalTokensAddress,
          outcome: formData.outcome,
          amount: formData.collateralAmount,
          estimated_amount: estimatedTokenAmount,
          slippage,
        },
      })

      setSuccess(
        `Successfully spent ${formData.collateralAmount} USDC on ${formData.outcome} tokens!`
      )
      setFormData({ outcome: 'YES', collateralAmount: '' })
      setBought([
        {
          outcome: formData.outcome,
          amount: formatBigNumber(estimatedTokenAmount, undefined, true),
        },
      ])

      if (onSuccess) {
        onSuccess()
        refetchCollateralBalance()
        refetchPredictionMarket()
      }
    } catch (err: any) {
      console.error('Error buying prediction tokens:', err)
      setError(err.message || 'Failed to buy prediction tokens')
    } finally {
      setIsBuying(false)
    }
  }

  const hasEnoughCollateral =
    collateralBalance !== undefined && formData.collateralAmount
      ? collateralBalance >=
        parseUnits(formData.collateralAmount, collateralDecimals)
      : true

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="terminal-command text-lg">{market.title}</h3>
        <HyperstitionDescriptionDisplay description={market.description} />
      </div>

      {isConnected &&
        !!address &&
        !isLoadingYesShares &&
        !isLoadingNoShares && (
          <Card size="sm" type="detail">
            <div className="terminal-dim text-xs text-center">
              YOUR POSITION
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="flex flex-col items-center">
                <div className="text-[#05df72] text-sm font-bold">
                  {formatBigNumber(formattedYesShares)}
                </div>
                <div className="terminal-dim text-xs">YES shares</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-[#dd70d4] text-sm font-bold">
                  {formatBigNumber(formattedNoShares)}
                </div>
                <div className="terminal-dim text-xs">NO shares</div>
              </div>
            </div>
          </Card>
        )}

      {isConnected && (!!yesShares || !!noShares) && (
        <Button
          variant="tertiary"
          className="w-full"
          onClick={() =>
            setBought([
              ...(yesShares
                ? [{ outcome: 'YES', amount: formattedYesShares }]
                : []),
              ...(noShares
                ? [{ outcome: 'NO', amount: formattedNoShares }]
                : []),
            ])
          }
        >
          <XIcon className="w-3 h-3" />
          Share
        </Button>
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="terminal-dim text-xs">PREDICTION OUTCOME</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleInputChange('outcome', 'YES')}
              className={`p-4 border rounded-sm transition-all duration-200 flex flex-col items-center space-y-2 ${
                formData.outcome === 'YES'
                  ? 'border-[#05df72] bg-[#05df72]/20 shadow-lg shadow-[#05df72]/20'
                  : 'border-gray-600 bg-black/20 hover:border-[#05df72]/50 hover:bg-[#05df72]/10'
              }`}
            >
              <div
                className={`text-lg font-bold ${
                  formData.outcome === 'YES' ? 'text-[#05df72]' : 'text-white'
                }`}
              >
                YES
              </div>
              <div className="text-xs terminal-dim">
                {yesPrice.toFixed(3)} ${collateralSymbol}
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleInputChange('outcome', 'NO')}
              className={`p-4 border rounded-sm transition-all duration-200 flex flex-col items-center space-y-2 ${
                formData.outcome === 'NO'
                  ? 'border-[#dd70d4] bg-[#dd70d4]/20 shadow-lg shadow-[#dd70d4]/20'
                  : 'border-gray-600 bg-black/20 hover:border-[#dd70d4]/50 hover:bg-[#dd70d4]/10'
              }`}
            >
              <div
                className={`text-lg font-bold ${
                  formData.outcome === 'NO' ? 'text-[#dd70d4]' : 'text-white'
                }`}
              >
                NO
              </div>
              <div className="text-xs terminal-dim">
                {noPrice.toFixed(3)} ${collateralSymbol}
              </div>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start lg:flex-col lg:items-stretch">
          <div className="space-y-4 grow">
            <div className="space-y-2">
              <label className="terminal-dim text-xs">
                AMOUNT TO SPEND (${collateralSymbol})
              </label>
              <Input
                type="number"
                step="0.000001"
                min="0.000001"
                placeholder={`Enter ${collateralSymbol} amount...`}
                value={formData.collateralAmount}
                onChange={(e) =>
                  handleInputChange('collateralAmount', e.target.value)
                }
                className="bg-black/20 border-gray-700 terminal-text"
                required
              />
            </div>

            {collateralBalance !== undefined && (
              <p
                className={clsx(
                  '-mt-2 terminal-bright text-xs',
                  !hasEnoughCollateral && '!text-red-400'
                )}
              >
                BALANCE:{' '}
                {formatBigNumber(collateralBalance, collateralDecimals, true)}{' '}
                {collateralSymbol}
              </p>
            )}
          </div>

          {formData.collateralAmount &&
            Number(formData.collateralAmount) > 0 && (
              <div className="grow space-y-2 animate-in fade-in-0">
                <div className="flex flex-row gap-1.5 items-center">
                  <label
                    className={`terminal-dim text-xs ${
                      !hasEnoughCollateral ? 'text-red-400' : ''
                    }`}
                  >
                    POTENTIAL WINNINGS
                  </label>
                  {isCalculating && (
                    <LoaderCircle
                      size={16}
                      className="terminal-dim animate-spin"
                    />
                  )}
                </div>

                <div className="bg-black/20 border border-gray-600 p-2 rounded-sm">
                  <div
                    className={clsx(
                      'text-sm',
                      !!tokensEstimate && isCalculating
                        ? 'terminal-dim animate-pulse'
                        : 'terminal-text'
                    )}
                  >
                    {tokensEstimate ? (
                      <>
                        {formatBigNumber(tokensEstimate)} ${collateralSymbol}
                      </>
                    ) : isCalculating ? (
                      <div className="flex items-center space-x-2">
                        <span className="terminal-bright">◉ CALCULATING</span>
                      </div>
                    ) : (
                      <span className="terminal-dim">
                        Enter amount to see estimate
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

          <div className="space-y-2">
            <label className="terminal-dim text-xs">SLIPPAGE TOLERANCE</label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 5].map((percentage) => (
                <button
                  key={percentage}
                  type="button"
                  onClick={() => setSlippage(percentage)}
                  className={`p-2 border rounded-sm text-xs transition-all duration-200 ${
                    slippage === percentage
                      ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                      : 'border-gray-600 bg-black/20 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {percentage}%
                </button>
              ))}
            </div>
          </div>
        </div>

        <Button
          type="submit"
          disabled={
            !isConnected ||
            isBuying ||
            !formData.collateralAmount ||
            !hasEnoughCollateral ||
            isLoadingMarket ||
            isMarketResolved ||
            isCalculating
          }
          className="w-full mobile-terminal-btn"
        >
          {isBuying ? (
            <span className="terminal-dim">Processing...</span>
          ) : isCalculating ? (
            <span className="terminal-dim">Calculating output...</span>
          ) : (
            <span className="terminal-command">
              SPEND {formatBigNumber(formData.collateralAmount || 0)} $
              {collateralSymbol} ON {formData.outcome}
            </span>
          )}
        </Button>

        <div className="terminal-dim text-xs">
          By buying shares, you're getting exposure to the outcome of this
          market. If your prediction is correct, you'll be able to redeem your
          shares for ${collateralSymbol} when the market resolves ({slippage}%
          slippage tolerance).
        </div>
      </form>

      <HyperstitionShareModal
        isOpen={bought.length > 0}
        onClose={() => setBought([])}
        title="HYPERSTITION ACTIVATION DETECTED"
        description={
          <Markdown rawHtml>
            {bought.length === 2
              ? `If ${
                  market.successCondition
                }, you'll earn <span className="text-green">${
                  bought.find((b) => b.outcome === 'YES')?.amount || '0'
                } ${collateralSymbol}</span>. Otherwise, you'll earn <span className="text-green">${
                  bought.find((b) => b.outcome === 'NO')?.amount || '0'
                } ${collateralSymbol}</span>.`
              : `If ${
                  bought[0]?.outcome === 'NO'
                    ? market.failureCondition
                    : market.successCondition
                }, you'll earn <span className="text-green">${
                  bought[0]?.amount || '...'
                } ${collateralSymbol}</span>.`}
          </Markdown>
        }
        action={`hyperstitioned the ${bought
          .map((b) => b.outcome)
          .join(' and ')} outcome${
          bought.length === 2 ? 's' : ''
        } in the Hyperstition: ${market.title}`}
      />
    </div>
  )
}
