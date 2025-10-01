'use client'

import { useQueryClient } from '@tanstack/react-query'
import { readContractQueryOptions } from '@wagmi/core/query'
import clsx from 'clsx'
import { LoaderCircle } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { formatUnits, parseUnits } from 'viem'
import { useAccount } from 'wagmi'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCollateralToken } from '@/hooks/useCollateralToken'
import { usePredictionMarket } from '@/hooks/usePredictionMarket'
import {
  conditionalTokensAbi,
  conditionalTokensAddress,
  lmsrMarketMakerAbi,
} from '@/lib/contracts'
import { txToast } from '@/lib/tx'
import { formatBigNumber } from '@/lib/utils'
import { config } from '@/lib/wagmi'
import { HyperstitionMarket } from '@/types'

import { Card } from '../Card'

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
  const [slippage, setSlippage] = useState<number>(2)

  const {
    symbol: collateralSymbol,
    decimals: collateralDecimals,
    refetchBalance: refetchCollateralBalance,
  } = useCollateralToken()

  // Binary search to find the exact collateral amount for the specified shares
  const [estimatedCollateralAmount, setEstimatedCollateralAmount] =
    useState<string>('0')

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

    const targetShares = parseUnits(formData.shareAmount, collateralDecimals)

    // Calculate collateral output directly using calcNetCost with negative amounts
    const outcomeTokenAmounts =
      formData.outcome === 'YES' ? [0n, -targetShares] : [-targetShares, 0n]

    setIsCalculating(true)
    queryClient
      .fetchQuery(
        readContractQueryOptions(config, {
          address: market.marketMakerAddress,
          abi: lmsrMarketMakerAbi,
          functionName: 'calcNetCost',
          args: [outcomeTokenAmounts],
        })
      )
      .then(async (netCost) => {
        // For selling, netCost should be negative (we receive collateral)
        const outcomeTokenNetCost = netCost as bigint
        if (outcomeTokenNetCost >= 0n) {
          // This shouldn't happen for selling, but handle gracefully
          setEstimatedCollateralAmount('0')
          setCollateralEstimate(null)
          setIsCalculating(false)
          return
        }

        // Calculate market fee (same logic as in the contract)
        const fee = (await queryClient.fetchQuery(
          readContractQueryOptions(config, {
            address: market.marketMakerAddress,
            abi: lmsrMarketMakerAbi,
            functionName: 'calcMarketFee',
            args: [-outcomeTokenNetCost], // Use positive value for fee calculation
          })
        )) as bigint

        // Total amount received after fee (netCost is negative, fee is positive)
        const totalReceived = -outcomeTokenNetCost - fee

        const formattedResult = formatUnits(totalReceived, collateralDecimals)
        setEstimatedCollateralAmount(formattedResult)
        setCollateralEstimate(formattedResult)
      })
      .catch((error) => {
        console.error('Sell calculation failed:', error)
        setEstimatedCollateralAmount('0')
        setCollateralEstimate(null)
      })
      .finally(() => {
        setIsCalculating(false)
      })
  }, [
    formData.shareAmount,
    formData.outcome,
    market.marketMakerAddress,
    queryClient,
  ])

  const {
    isMarketResolved,
    isLoadingResolution,
    yesShares,
    formattedYesShares,
    isLoadingYesShares,
    noShares,
    formattedNoShares,
    isLoadingNoShares,
    refetch: refetchPredictionMarket,
  } = usePredictionMarket(market)

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
      const shareAmount = parseUnits(formData.shareAmount, collateralDecimals)
      // For selling, we use negative amounts
      const outcomeTokenAmounts =
        formData.outcome === 'YES' ? [0n, -shareAmount] : [-shareAmount, 0n]

      // Calculate minimum collateral to receive (with 2% slippage tolerance)
      const estimatedCollateral = parseUnits(
        estimatedCollateralAmount,
        collateralDecimals
      )
      const minCollateral =
        (estimatedCollateral * (100n - BigInt(slippage))) / 100n

      await txToast(
        // Approve market maker to spend conditional tokens
        {
          tx: {
            address: conditionalTokensAddress,
            abi: conditionalTokensAbi,
            functionName: 'setApprovalForAll',
            args: [market.marketMakerAddress, true],
          },
          successMessage: 'Token approval granted!',
        },
        // Execute sell trade
        {
          tx: {
            address: market.marketMakerAddress,
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
        refetchPredictionMarket()
      }
    } catch (err: any) {
      console.error('Error selling prediction tokens:', err)
      setError(err.message || 'Failed to sell prediction tokens')
    } finally {
      setIsSelling(false)
    }
  }

  // Check if user has enough shares to sell
  const currentBalance = formData.outcome === 'YES' ? yesShares : noShares
  const hasEnoughShares =
    currentBalance !== undefined && formData.shareAmount
      ? currentBalance >= parseUnits(formData.shareAmount, collateralDecimals)
      : true

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="terminal-command text-lg">{market.title}</h3>
        <p className="terminal-text text-sm">{market.description}</p>
      </div>

      {isConnected && address && !isLoadingYesShares && !isLoadingNoShares && (
        <Card size="sm" type="detail">
          <div className="terminal-dim text-xs text-center">YOUR POSITION</div>
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
                {formatBigNumber(formattedYesShares)} shares
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
                {formatBigNumber(formattedNoShares)} shares
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

            {currentBalance !== undefined && (
              <p
                className={clsx(
                  '-mt-2 terminal-bright text-xs',
                  !hasEnoughShares && '!text-red-400'
                )}
                onClick={() =>
                  handleInputChange(
                    'shareAmount',
                    formatUnits(currentBalance, collateralDecimals)
                  )
                }
              >
                BALANCE:{' '}
                <span className="underline cursor-pointer transition-opacity hover:opacity-80 active:opacity-70">
                  {formatBigNumber(currentBalance, collateralDecimals, true)}
                </span>{' '}
                {formData.outcome} shares
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
                      {formatBigNumber(collateralEstimate)} ${collateralSymbol}
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
            isSelling ||
            !formData.shareAmount ||
            !hasEnoughShares ||
            isLoadingResolution ||
            isMarketResolved ||
            isCalculating
          }
          className="w-full mobile-terminal-btn"
        >
          {isSelling ? (
            <span className="terminal-dim">Processing...</span>
          ) : isCalculating ? (
            <span className="terminal-dim">Calculating output...</span>
          ) : (
            <span className="terminal-command">
              SELL {formatBigNumber(formData.shareAmount || 0)}{' '}
              {formData.outcome} SHARES
            </span>
          )}
        </Button>

        <div className="terminal-dim text-xs">
          By selling your shares, you'll receive ${collateralSymbol} based on
          current market prices. The final amount may vary slightly due to
          market conditions and slippage ({slippage}% tolerance).
        </div>
      </form>
    </div>
  )
}
