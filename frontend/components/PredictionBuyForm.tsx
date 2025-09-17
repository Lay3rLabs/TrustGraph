'use client'

import React, { useEffect, useState } from 'react'
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

import { Card } from './Card'
import { HyperstitionMarket } from './PredictionMarketDetail'

interface PredictionBuyFormProps {
  market: HyperstitionMarket
  onSuccess?: () => void
}

const PredictionBuyForm: React.FC<PredictionBuyFormProps> = ({
  market,
  onSuccess,
}) => {
  const { address, isConnected } = useAccount()

  const [formData, setFormData] = useState({
    outcome: 'YES' as 'YES' | 'NO',
    collateralAmount: '',
  })

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [tokensEstimate, setTokensEstimate] = useState<string | null>(null)
  const [yesCostEstimate, setYesCostEstimate] = useState<string | null>(null)
  const [noCostEstimate, setNoCostEstimate] = useState<string | null>(null)
  const [yesTokenBalance, setYesTokenBalance] = useState<string | null>(null)
  const [noTokenBalance, setNoTokenBalance] = useState<string | null>(null)

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
  const [isCalculating, setIsCalculating] = useState<boolean>(false)

  // Binary search state for iterative approach
  const [binarySearchState, setBinarySearchState] = useState<{
    low: bigint
    high: bigint
    bestTokenAmount: bigint
    targetCollateral: bigint
    outcome: 'YES' | 'NO'
    iteration: number
    currentMid: bigint
    isActive: boolean
  } | null>(null)

  // Binary search cost calculation
  const { data: binarySearchCostData } = useReadContract({
    address: marketMakerAddress,
    abi: lmsrMarketMakerAbi,
    functionName: 'calcNetCost',
    args: binarySearchState
      ? [
          binarySearchState.outcome === 'YES'
            ? [BigInt(0), binarySearchState.currentMid]
            : [binarySearchState.currentMid, BigInt(0)],
        ]
      : undefined,
    query: {
      enabled: !!binarySearchState && binarySearchState.isActive,
    },
  })

  // Calculate cost estimate for the estimated tokens (for verification)
  const { data: netCostData } = useReadContract({
    address: marketMakerAddress,
    abi: lmsrMarketMakerAbi,
    functionName: 'calcNetCost',
    args:
      estimatedTokenAmount &&
      !isNaN(Number(estimatedTokenAmount)) &&
      Number(estimatedTokenAmount) > 0
        ? [
            formData.outcome === 'YES'
              ? [BigInt(0), parseUnits(estimatedTokenAmount, 18)]
              : [parseUnits(estimatedTokenAmount, 18), BigInt(0)],
          ]
        : undefined,
    query: {
      enabled:
        !!estimatedTokenAmount &&
        !isNaN(Number(estimatedTokenAmount)) &&
        Number(estimatedTokenAmount) > 0 &&
        !binarySearchState?.isActive,
    },
  })

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

  // Update token estimates when data changes
  useEffect(() => {
    if (netCostData) {
      setTokensEstimate(estimatedTokenAmount)
    } else {
      setTokensEstimate(null)
    }
  }, [netCostData, estimatedTokenAmount])

  useEffect(() => {
    if (yesCostData) {
      setYesCostEstimate(formatUnits(yesCostData, 18))
    }
  }, [yesCostData])

  useEffect(() => {
    if (noCostData) {
      setNoCostEstimate(formatUnits(noCostData, 18))
    }
  }, [noCostData])

  useEffect(() => {
    if (yesTokenBalanceData) {
      setYesTokenBalance(formatUnits(yesTokenBalanceData, 18))
    }
  }, [yesTokenBalanceData])

  useEffect(() => {
    if (noTokenBalanceData) {
      setNoTokenBalance(formatUnits(noTokenBalanceData, 18))
    }
  }, [noTokenBalanceData])

  // Start binary search when collateral amount or outcome changes
  useEffect(() => {
    if (
      !formData.collateralAmount ||
      isNaN(Number(formData.collateralAmount)) ||
      Number(formData.collateralAmount) <= 0
    ) {
      setEstimatedTokenAmount('0')
      setBinarySearchState(null)
      setIsCalculating(false)
      return
    }

    const targetCollateral = parseUnits(formData.collateralAmount, 18)
    setIsCalculating(true)
    setBinarySearchState({
      low: BigInt(0),
      high: targetCollateral * BigInt(10), // Start with 10x the collateral as upper bound
      bestTokenAmount: BigInt(0),
      targetCollateral,
      outcome: formData.outcome,
      iteration: 0,
      currentMid: targetCollateral * BigInt(5), // Start in the middle
      isActive: true,
    })
  }, [formData.collateralAmount, formData.outcome])

  // Handle binary search iteration when cost data comes back
  useEffect(() => {
    if (
      !binarySearchState ||
      !binarySearchState.isActive ||
      !binarySearchCostData
    )
      return

    const cost = binarySearchCostData
    const state = binarySearchState

    let newLow = state.low
    let newHigh = state.high
    let newBestTokenAmount = state.bestTokenAmount

    if (cost <= state.targetCollateral) {
      // Cost is within budget, try for more tokens
      newBestTokenAmount = state.currentMid
      newLow = state.currentMid + BigInt(1)
    } else {
      // Cost is too high, try fewer tokens
      newHigh = state.currentMid - BigInt(1)
    }

    // Check if we should continue or finish
    if (newHigh <= newLow || state.iteration >= 15) {
      // Binary search complete - apply 5% safety buffer to ensure transaction success
      const safeTokenAmount = (newBestTokenAmount * BigInt(95)) / BigInt(100)
      setEstimatedTokenAmount(formatUnits(safeTokenAmount, 18))
      setBinarySearchState(null)
      setIsCalculating(false)
    } else {
      // Continue with next iteration
      const newMid = (newLow + newHigh) / BigInt(2)
      setBinarySearchState({
        ...state,
        low: newLow,
        high: newHigh,
        bestTokenAmount: newBestTokenAmount,
        iteration: state.iteration + 1,
        currentMid: newMid,
      })
    }
  }, [binarySearchCostData, binarySearchState])

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

  const hasEnoughCollateral =
    collateralBalance && formData.collateralAmount
      ? collateralBalance.value >= parseUnits(formData.collateralAmount, 18)
      : true

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
                    ? Number(yesTokenBalance).toFixed(3)
                    : '0.000'}
                </div>
                <div className="terminal-dim text-xs">YES tokens</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-[#dd70d4] text-sm font-bold">
                  {noTokenBalance ? Number(noTokenBalance).toFixed(3) : '0.000'}
                </div>
                <div className="terminal-dim text-xs">NO tokens</div>
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
                  {Number(yesCostEstimate).toFixed(3)} USDC
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
                  {Number(noCostEstimate).toFixed(3)} USDC
                </div>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="terminal-dim text-xs">
            COLLATERAL AMOUNT TO SPEND (USDC)
          </label>
          <Input
            type="number"
            step="0.000001"
            min="0.000001"
            placeholder="Enter USDC amount..."
            value={formData.collateralAmount}
            onChange={(e) =>
              handleInputChange('collateralAmount', e.target.value)
            }
            className="bg-black/20 border-gray-700 terminal-text"
            required
          />
        </div>

        {collateralBalance && (
          <p className="-mt-2 terminal-bright text-xs">
            BALANCE: {formatUnits(collateralBalance.value, 18)}{' '}
            {collateralBalance.symbol}
          </p>
        )}

        {formData.collateralAmount && (tokensEstimate || isCalculating) && (
          <div className="bg-black/20 border border-gray-600 p-3 rounded-sm">
            <div
              className={`terminal-dim text-xs ${
                !hasEnoughCollateral ? 'text-red-400' : ''
              }`}
            >
              {isCalculating
                ? 'CALCULATING OPTIMAL TOKENS'
                : 'ESTIMATED TOKENS TO RECEIVE'}
            </div>
            <div
              className={`terminal-text text-sm ${
                !hasEnoughCollateral ? 'text-red-400' : ''
              }`}
            >
              {isCalculating ? (
                <div className="flex items-center space-x-2">
                  <span className="terminal-bright">◉ OPTIMIZING</span>
                  {binarySearchState && (
                    <span className="terminal-dim text-xs">
                      (iteration {binarySearchState.iteration + 1}/15)
                    </span>
                  )}
                </div>
              ) : (
                <>
                  {tokensEstimate} {formData.outcome} tokens
                  {!hasEnoughCollateral && (
                    <div className="text-red-400 text-xs mt-1">
                      Insufficient balance
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="terminal-dim text-xs mt-1">
              {isCalculating
                ? 'Finding maximum tokens for your budget...'
                : 'Optimized amount with 5% safety buffer for reliable execution'}
            </div>

            {!hasEnoughCollateral && (
              <div className="mt-2 p-2 bg-blue-900/30 border border-blue-500 rounded text-blue-400 text-xs">
                <span className="font-bold">Demo Mode:</span> Collateral tokens
                will be automatically minted for you when you make a purchase.
              </div>
            )}
          </div>
        )}

        <Button
          type="submit"
          disabled={!isConnected || isBuying || !formData.collateralAmount}
          className="w-full mobile-terminal-btn"
        >
          {isBuying ? (
            <span className="terminal-dim">Processing...</span>
          ) : (
            <span className="terminal-command">
              SPEND {formData.collateralAmount || '0'} USDC ON{' '}
              {formData.outcome}
            </span>
          )}
        </Button>

        <div className="terminal-dim text-xs">
          By buying prediction tokens, you're getting exposure to the outcome of
          this market. If your prediction is correct, you'll be able to redeem
          your tokens for collateral when the market resolves.
        </div>
      </form>
    </div>
  )
}

export default PredictionBuyForm
