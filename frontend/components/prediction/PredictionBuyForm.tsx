'use client'

import { useQueryClient } from '@tanstack/react-query'
import { readContractQueryOptions } from '@wagmi/core/query'
import clsx from 'clsx'
import { LoaderCircle } from 'lucide-react'
import React, { useCallback, useEffect, useState } from 'react'
import { formatUnits, parseUnits } from 'viem'
import { useAccount, useBalance, useReadContract } from 'wagmi'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
// Removed Select imports - using custom buttons instead
import {
  conditionalTokensAbi,
  conditionalTokensAddress,
  lmsrMarketMakerAbi,
  lmsrMarketMakerAddress,
  mockUsdcAbi,
  mockUsdcAddress,
  predictionMarketFactoryAddress,
} from '@/lib/contracts'
import { txToast } from '@/lib/tx'
import { config } from '@/lib/wagmi'

import { Card } from '../Card'
import { HyperstitionMarket } from './PredictionMarketDetail'

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

  const [formData, setFormData] = useState({
    outcome: 'YES' as 'YES' | 'NO',
    collateralAmount: '',
  })

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [tokensEstimate, setTokensEstimate] = useState<string | null>(null)
  const [isCalculating, setIsCalculating] = useState<boolean>(false)

  // Use mock USDC for collateral balance
  const { data: collateralBalance, refetch: refetchCollateralBalance } =
    useBalance({
      address: address,
      token: mockUsdcAddress,
      query: {
        refetchInterval: 3_000,
      },
    })

  // Use the deployed market maker address
  const marketMakerAddress = market.marketMakerAddress || lmsrMarketMakerAddress

  // Binary search to find the exact token amount for the specified collateral
  const [estimatedTokenAmount, setEstimatedTokenAmount] = useState<string>('0')

  // Recursive binary search function using direct query client calls
  const performBinarySearch = useCallback(
    async (
      targetCollateral: bigint,
      outcome: 'YES' | 'NO',
      low: bigint = BigInt(0),
      high: bigint = targetCollateral * BigInt(10),
      bestTokenAmount: bigint = BigInt(0),
      iteration: number = 0
    ): Promise<bigint> => {
      // Base case: stop after 15 iterations or when range is too small
      if (high <= low || iteration >= 15) {
        // Apply 5% safety buffer to ensure transaction success
        return (bestTokenAmount * BigInt(95)) / BigInt(100)
      }

      const mid = (low + high) / BigInt(2)
      const outcomeTokenAmounts =
        outcome === 'YES' ? [BigInt(0), mid] : [mid, BigInt(0)]

      try {
        const cost = (await queryClient.fetchQuery(
          readContractQueryOptions(config, {
            address: marketMakerAddress,
            abi: lmsrMarketMakerAbi,
            functionName: 'calcNetCost',
            args: [outcomeTokenAmounts],
          })
        )) as bigint

        if (cost <= targetCollateral) {
          // Cost is within budget, try for more tokens
          return performBinarySearch(
            targetCollateral,
            outcome,
            mid + BigInt(1),
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
            mid - BigInt(1),
            bestTokenAmount,
            iteration + 1
          )
        }
      } catch (error) {
        console.error('Error in binary search iteration:', error)
        // Return best amount found so far
        return (bestTokenAmount * BigInt(95)) / BigInt(100)
      }
    },
    [marketMakerAddress, queryClient]
  )

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

    const targetCollateral = parseUnits(formData.collateralAmount, 18)
    setIsCalculating(true)

    // Run binary search
    performBinarySearch(targetCollateral, formData.outcome)
      .then((result) => {
        const formattedResult = formatUnits(result, 18)
        setEstimatedTokenAmount(formattedResult)
        setTokensEstimate(formattedResult)
        setIsCalculating(false)
      })
      .catch((error) => {
        console.error('Binary search failed:', error)
        setEstimatedTokenAmount('0')
        setTokensEstimate(null)
        setIsCalculating(false)
      })
  }, [formData.collateralAmount, formData.outcome, performBinarySearch])

  // Calculate YES token cost for 1 token
  const { data: yesCostData, refetch: refetchYesCost } = useReadContract({
    address: marketMakerAddress,
    abi: lmsrMarketMakerAbi,
    functionName: 'calcNetCost',
    args: [[BigInt(0), parseUnits('1', 18)]],
    query: { enabled: true, refetchInterval: 3_000 },
  })

  // Calculate NO token cost for 1 token
  const { data: noCostData, refetch: refetchNoCost } = useReadContract({
    address: marketMakerAddress,
    abi: lmsrMarketMakerAbi,
    functionName: 'calcNetCost',
    args: [[parseUnits('1', 18), BigInt(0)]],
    query: { enabled: true, refetchInterval: 3_000 },
  })

  // Get the condition ID from the conditional tokens contract (same approach as PredictionRedeemForm)
  const { data: conditionId } = useReadContract({
    address: conditionalTokensAddress,
    abi: conditionalTokensAbi,
    functionName: 'getConditionId',
    args: [
      predictionMarketFactoryAddress, // oracle
      '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`, // questionId
      BigInt(2), // outcomeSlotCount (YES/NO = 2 outcomes)
    ],
    query: { enabled: !!address },
  })

  // Get collection IDs for YES/NO positions
  const { data: yesCollectionId } = useReadContract({
    address: conditionalTokensAddress,
    abi: conditionalTokensAbi,
    functionName: 'getCollectionId',
    args: conditionId
      ? [
          '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`, // parentCollectionId
          conditionId,
          BigInt(2), // indexSet for YES (binary 10 = decimal 2)
        ]
      : undefined,
    query: { enabled: !!conditionId },
  })

  const { data: noCollectionId } = useReadContract({
    address: conditionalTokensAddress,
    abi: conditionalTokensAbi,
    functionName: 'getCollectionId',
    args: conditionId
      ? [
          '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`, // parentCollectionId
          conditionId,
          BigInt(1), // indexSet for NO (binary 01 = decimal 1)
        ]
      : undefined,
    query: { enabled: !!conditionId },
  })

  // Get position IDs for YES/NO tokens
  const { data: yesPositionId } = useReadContract({
    address: conditionalTokensAddress,
    abi: conditionalTokensAbi,
    functionName: 'getPositionId',
    args: yesCollectionId
      ? [
          mockUsdcAddress, // collateralToken
          yesCollectionId,
        ]
      : undefined,
    query: { enabled: !!yesCollectionId },
  })

  const { data: noPositionId } = useReadContract({
    address: conditionalTokensAddress,
    abi: conditionalTokensAbi,
    functionName: 'getPositionId',
    args: noCollectionId
      ? [
          mockUsdcAddress, // collateralToken
          noCollectionId,
        ]
      : undefined,
    query: { enabled: !!noCollectionId },
  })

  // Get user's token balances using the position IDs
  const { data: yesTokenBalanceData, refetch: refetchYesTokenBalance } =
    useReadContract({
      address: conditionalTokensAddress,
      abi: conditionalTokensAbi,
      functionName: 'balanceOf',
      args: address && yesPositionId ? [address, yesPositionId] : undefined,
      query: {
        enabled: !!address && !!yesPositionId,
        refetchInterval: 3_000,
      },
    })

  const { data: noTokenBalanceData, refetch: refetchNoTokenBalance } =
    useReadContract({
      address: conditionalTokensAddress,
      abi: conditionalTokensAbi,
      functionName: 'balanceOf',
      args: address && noPositionId ? [address, noPositionId] : undefined,
      query: {
        enabled: !!address && !!noPositionId,
        refetchInterval: 3_000,
      },
    })

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
      const collateralLimit = parseUnits(formData.collateralAmount, 18)
      // Use the estimated token amount for the trade
      const tokenAmount = parseUnits(estimatedTokenAmount, 18)
      const outcomeTokenAmounts =
        formData.outcome === 'YES'
          ? [BigInt(0), tokenAmount]
          : [tokenAmount, BigInt(0)]

      await txToast(
        // Approve market maker to spend collateral
        {
          tx: {
            address: mockUsdcAddress,
            abi: mockUsdcAbi,
            functionName: 'approve',
            args: [marketMakerAddress, collateralLimit],
          },
          successMessage: 'Spend approved!',
        },
        // Execute trade
        {
          tx: {
            address: marketMakerAddress,
            abi: lmsrMarketMakerAbi,
            functionName: 'trade',
            args: [outcomeTokenAmounts, collateralLimit],
          },
          successMessage: 'Trade executed!',
        }
      )

      setSuccess(
        `Successfully spent ${formData.collateralAmount} USDC on ${formData.outcome} tokens!`
      )
      setFormData({ outcome: 'YES', collateralAmount: '' })

      if (onSuccess) {
        onSuccess()
        refetchCollateralBalance()
        refetchYesCost()
        refetchNoCost()
        refetchYesTokenBalance()
        refetchNoTokenBalance()
      }
    } catch (err: any) {
      console.error('Error buying prediction tokens:', err)
      setError(err.message || 'Failed to buy prediction tokens')
    } finally {
      setIsBuying(false)
    }
  }

  const yesTokenBalance = yesTokenBalanceData
    ? formatUnits(yesTokenBalanceData, 18)
    : null

  const noTokenBalance = noTokenBalanceData
    ? formatUnits(noTokenBalanceData, 18)
    : null

  const yesCostEstimate = yesCostData ? formatUnits(yesCostData, 18) : null

  const noCostEstimate = noCostData ? formatUnits(noCostData, 18) : null

  const hasEnoughCollateral =
    collateralBalance && formData.collateralAmount
      ? collateralBalance.value >= parseUnits(formData.collateralAmount, 18)
      : true

  const collateralSymbol = collateralBalance?.symbol || 'USDC'

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="terminal-command text-lg">{market.title}</h3>
        <p className="terminal-text text-sm">{market.description}</p>
      </div>

      {isConnected &&
        address &&
        (yesTokenBalance !== null || noTokenBalance !== null) && (
          <Card size="sm" type="detail">
            <div className="terminal-dim text-xs text-center">
              YOUR POSITION
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="flex flex-col items-center">
                <div className="text-[#05df72] text-sm font-bold">
                  {yesTokenBalance
                    ? Number(yesTokenBalance).toLocaleString(undefined, {
                        maximumFractionDigits: 3,
                      })
                    : '0.000'}
                </div>
                <div className="terminal-dim text-xs">YES shares</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-[#dd70d4] text-sm font-bold">
                  {noTokenBalance
                    ? Number(noTokenBalance).toLocaleString(undefined, {
                        maximumFractionDigits: 3,
                      })
                    : '0.000'}
                </div>
                <div className="terminal-dim text-xs">NO shares</div>
              </div>
            </div>
          </Card>
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
              {yesCostEstimate && (
                <div className="text-xs terminal-dim">
                  {Number(yesCostEstimate).toFixed(3)} ${collateralSymbol}
                </div>
              )}
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
              {noCostEstimate && (
                <div className="text-xs terminal-dim">
                  {Number(noCostEstimate).toFixed(3)} ${collateralSymbol}
                </div>
              )}
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

            {collateralBalance && (
              <p
                className={clsx(
                  '-mt-2 terminal-bright text-xs',
                  !hasEnoughCollateral && '!text-red-400'
                )}
              >
                BALANCE: {formatUnits(collateralBalance.value, 18)}{' '}
                {collateralBalance.symbol}
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
                        {Number(tokensEstimate).toLocaleString(undefined, {
                          maximumFractionDigits: 3,
                        })}{' '}
                        ${collateralSymbol}
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
        </div>

        <Button
          type="submit"
          disabled={
            !isConnected ||
            isBuying ||
            !formData.collateralAmount ||
            !hasEnoughCollateral
          }
          className="w-full mobile-terminal-btn"
        >
          {isBuying ? (
            <span className="terminal-dim">Processing...</span>
          ) : (
            <span className="terminal-command">
              SPEND {formData.collateralAmount || '0'} ${collateralSymbol} ON{' '}
              {formData.outcome}
            </span>
          )}
        </Button>

        <div className="terminal-dim text-xs">
          By buying shares, you're getting exposure to the outcome of this
          market. If your prediction is correct, you'll be able to redeem your
          shares for ${collateralSymbol} when the market resolves.
        </div>
      </form>
    </div>
  )
}
