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
import {
  conditionalTokensAbi,
  conditionalTokensAddress,
  lmsrMarketMakerAbi,
  lmsrMarketMakerAddress,
  mockUsdcAddress,
  predictionMarketFactoryAddress,
} from '@/lib/contracts'
import { txToast } from '@/lib/tx'
import { config } from '@/lib/wagmi'

import { Card } from '../Card'
import { HyperstitionMarket } from './PredictionMarketDetail'

interface PredictionSellFormProps {
  market: HyperstitionMarket
  onSuccess?: () => void
}

export const PredictionSellForm: React.FC<PredictionSellFormProps> = ({
  market,
  onSuccess,
}) => {
  const { address, isConnected } = useAccount()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState({
    outcome: 'YES' as 'YES' | 'NO',
    shareAmount: '',
  })

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [collateralEstimate, setCollateralEstimate] = useState<string | null>(
    null
  )
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

  // Binary search to find the exact collateral amount for the specified shares
  const [estimatedCollateralAmount, setEstimatedCollateralAmount] =
    useState<string>('0')

  // Recursive binary search function for selling (calcNetCost with negative amounts)
  const performSellBinarySearch = useCallback(
    async (
      targetShares: bigint,
      outcome: 'YES' | 'NO',
      low: bigint = BigInt(0),
      high: bigint = targetShares * BigInt(2),
      bestCollateralAmount: bigint = BigInt(0),
      iteration: number = 0
    ): Promise<bigint> => {
      // Base case: stop after 15 iterations or when range is too small
      if (high <= low || iteration >= 15) {
        // Apply 5% safety buffer to ensure transaction success
        return (bestCollateralAmount * BigInt(95)) / BigInt(100)
      }

      const mid = (low + high) / BigInt(2)
      // For selling, we use negative amounts
      const outcomeTokenAmounts =
        outcome === 'YES'
          ? [BigInt(0), -targetShares]
          : [-targetShares, BigInt(0)]

      try {
        const cost = (await queryClient.fetchQuery(
          readContractQueryOptions(config, {
            address: marketMakerAddress,
            abi: lmsrMarketMakerAbi,
            functionName: 'calcNetCost',
            args: [outcomeTokenAmounts],
          })
        )) as bigint

        // For selling, cost should be negative (we receive collateral)
        const collateralReceived = cost < 0 ? -cost : BigInt(0)

        if (collateralReceived >= mid) {
          // We can get at least this much collateral, try for more
          return performSellBinarySearch(
            targetShares,
            outcome,
            mid + BigInt(1),
            high,
            collateralReceived,
            iteration + 1
          )
        } else {
          // We get less collateral, try with lower expectation
          return performSellBinarySearch(
            targetShares,
            outcome,
            low,
            mid - BigInt(1),
            bestCollateralAmount,
            iteration + 1
          )
        }
      } catch (error) {
        console.error('Error in sell binary search iteration:', error)
        // Return best amount found so far
        return (bestCollateralAmount * BigInt(95)) / BigInt(100)
      }
    },
    [marketMakerAddress, queryClient]
  )

  // Effect to calculate collateral output when share amount or outcome changes
  useEffect(() => {
    if (
      !formData.shareAmount ||
      isNaN(Number(formData.shareAmount)) ||
      Number(formData.shareAmount) <= 0
    ) {
      setEstimatedCollateralAmount('0')
      setIsCalculating(false)
      setCollateralEstimate(null)
      return
    }

    const targetShares = parseUnits(formData.shareAmount, 18)
    setIsCalculating(true)

    // Calculate collateral output directly using calcNetCost with negative amounts
    const outcomeTokenAmounts =
      formData.outcome === 'YES'
        ? [BigInt(0), -targetShares]
        : [-targetShares, BigInt(0)]

    queryClient
      .fetchQuery(
        readContractQueryOptions(config, {
          address: marketMakerAddress,
          abi: lmsrMarketMakerAbi,
          functionName: 'calcNetCost',
          args: [outcomeTokenAmounts],
        })
      )
      .then((cost) => {
        // For selling, cost should be negative (we receive collateral)
        const collateralReceived =
          (cost as bigint) < 0 ? -(cost as bigint) : BigInt(0)
        const formattedResult = formatUnits(collateralReceived, 18)
        setEstimatedCollateralAmount(formattedResult)
        setCollateralEstimate(formattedResult)
        setIsCalculating(false)
      })
      .catch((error) => {
        console.error('Sell calculation failed:', error)
        setEstimatedCollateralAmount('0')
        setCollateralEstimate(null)
        setIsCalculating(false)
      })
  }, [formData.shareAmount, formData.outcome, marketMakerAddress, queryClient])

  // Get the condition ID from the conditional tokens contract
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

  const [isSelling, setIsSelling] = useState(false)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isConnected || !address) {
      setError('Please connect your wallet')
      return
    }

    if (
      !formData.shareAmount ||
      isNaN(Number(formData.shareAmount)) ||
      Number(formData.shareAmount) <= 0
    ) {
      setError('Please enter a valid share amount')
      return
    }

    setIsSelling(true)
    setError(null)
    setSuccess(null)

    try {
      const shareAmount = parseUnits(formData.shareAmount, 18)
      // For selling, we use negative amounts
      const outcomeTokenAmounts =
        formData.outcome === 'YES'
          ? [BigInt(0), -shareAmount]
          : [-shareAmount, BigInt(0)]

      // Calculate minimum collateral to receive (with 5% slippage tolerance)
      const estimatedCollateral = parseUnits(estimatedCollateralAmount, 18)
      const minCollateral = (estimatedCollateral * BigInt(95)) / BigInt(100)

      await txToast(
        // Approve market maker to spend conditional tokens
        {
          tx: {
            address: conditionalTokensAddress,
            abi: conditionalTokensAbi,
            functionName: 'setApprovalForAll',
            args: [marketMakerAddress, true],
          },
          successMessage: 'Token approval granted!',
        },
        // Execute sell trade
        {
          tx: {
            address: marketMakerAddress,
            abi: lmsrMarketMakerAbi,
            functionName: 'trade',
            args: [outcomeTokenAmounts, -minCollateral], // negative for minimum collateral to receive
          },
          successMessage: 'Trade executed!',
        }
      )

      setSuccess(
        `Successfully sold ${formData.shareAmount} ${formData.outcome} shares for ${estimatedCollateralAmount} USDC!`
      )
      setFormData({ outcome: 'YES', shareAmount: '' })

      if (onSuccess) {
        onSuccess()
        refetchCollateralBalance()
        refetchYesTokenBalance()
        refetchNoTokenBalance()
      }
    } catch (err: any) {
      console.error('Error selling prediction tokens:', err)
      setError(err.message || 'Failed to sell prediction tokens')
    } finally {
      setIsSelling(false)
    }
  }

  const yesTokenBalance =
    yesTokenBalanceData !== undefined
      ? formatUnits(yesTokenBalanceData, 18)
      : null

  const noTokenBalance =
    noTokenBalanceData !== undefined
      ? formatUnits(noTokenBalanceData, 18)
      : null

  // Check if user has enough shares to sell
  const currentBalance =
    formData.outcome === 'YES' ? yesTokenBalance : noTokenBalance
  const hasEnoughShares =
    currentBalance && formData.shareAmount
      ? parseUnits(currentBalance, 18) >= parseUnits(formData.shareAmount, 18)
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
              <div className="text-xs terminal-dim">
                {yesTokenBalance
                  ? `${Number(yesTokenBalance).toFixed(3)} shares`
                  : '0.000 shares'}
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
                {noTokenBalance
                  ? `${Number(noTokenBalance).toFixed(3)} shares`
                  : '0.000 shares'}
              </div>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start lg:flex-col lg:items-stretch">
          <div className="space-y-4 grow">
            <div className="space-y-2">
              <label className="terminal-dim text-xs">SHARES TO SELL</label>
              <Input
                type="number"
                step="0.000001"
                min="0.000001"
                placeholder="Enter shares to sell..."
                value={formData.shareAmount}
                onChange={(e) =>
                  handleInputChange('shareAmount', e.target.value)
                }
                className="bg-black/20 border-gray-700 terminal-text"
                required
              />
            </div>

            {currentBalance && (
              <p
                className={clsx(
                  '-mt-2 terminal-bright text-xs',
                  !hasEnoughShares && '!text-red-400'
                )}
              >
                BALANCE: {Number(currentBalance).toFixed(6)} {formData.outcome}{' '}
                shares
              </p>
            )}
          </div>

          {formData.shareAmount && Number(formData.shareAmount) > 0 && (
            <div className="grow space-y-2 animate-in fade-in-0">
              <div className="flex flex-row gap-1.5 items-center">
                <label
                  className={`terminal-dim text-xs ${
                    !hasEnoughShares ? 'text-red-400' : ''
                  }`}
                >
                  ESTIMATED PAYOUT
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
                    !!collateralEstimate && isCalculating
                      ? 'terminal-dim animate-pulse'
                      : 'terminal-text'
                  )}
                >
                  {collateralEstimate ? (
                    <>
                      {Number(collateralEstimate).toLocaleString(undefined, {
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
            isSelling ||
            !formData.shareAmount ||
            !hasEnoughShares
          }
          className="w-full mobile-terminal-btn"
        >
          {isSelling ? (
            <span className="terminal-dim">Processing...</span>
          ) : (
            <span className="terminal-command">
              SELL {formData.shareAmount || '0'} {formData.outcome} SHARES
            </span>
          )}
        </Button>

        <div className="terminal-dim text-xs">
          By selling your shares, you'll receive ${collateralSymbol} based on
          current market prices. The final amount may vary slightly due to
          market conditions and slippage.
        </div>
      </form>
    </div>
  )
}
