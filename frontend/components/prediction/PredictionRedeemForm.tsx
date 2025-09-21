'use client'

import React, { useEffect, useState } from 'react'
import { useAccount, useReadContract, useWriteContract } from 'wagmi'

import { Button } from '@/components/ui/button'
import {
  conditionalTokensAbi,
  conditionalTokensAddress,
  mockUsdcAbi,
  mockUsdcAddress,
  predictionMarketFactoryAddress,
} from '@/lib/contracts'
import { formatBigNumber } from '@/lib/utils'

import { HyperstitionMarket } from './PredictionMarketDetail'

interface PredictionRedeemFormProps {
  market: HyperstitionMarket
  onSuccess?: () => void
}

export const PredictionRedeemForm: React.FC<PredictionRedeemFormProps> = ({
  market,
  onSuccess,
}) => {
  const { address, isConnected } = useAccount()
  const { writeContractAsync, isPending: isWriting } = useWriteContract()

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [expectedPayout, setExpectedPayout] = useState<bigint | null>(null)

  // Use the factory address as the oracle (as seen in the deployment scripts)
  // This matches how the contracts are actually set up
  const factoryAddress = predictionMarketFactoryAddress

  const { data: collateralSymbol = 'USDC' } = useReadContract({
    address: mockUsdcAddress,
    abi: mockUsdcAbi,
    functionName: 'symbol',
  })
  const { data: collateralDecimals = 0 } = useReadContract({
    address: mockUsdcAddress,
    abi: mockUsdcAbi,
    functionName: 'decimals',
  })

  // Get the condition ID - using the factory as oracle (as in the scripts)
  const { data: conditionId } = useReadContract({
    address: conditionalTokensAddress,
    abi: conditionalTokensAbi,
    functionName: 'getConditionId',
    args: [
      factoryAddress, // oracle (factory, not market maker)
      '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`, // questionId (bytes32(0))
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

  // Get user's token balances
  const { data: yesBalance, refetch: refetchYesBalance } = useReadContract({
    address: conditionalTokensAddress,
    abi: conditionalTokensAbi,
    functionName: 'balanceOf',
    args: [
      address ||
        ('0x0000000000000000000000000000000000000000' as `0x${string}`),
      yesPositionId || BigInt(0),
    ],
    query: { enabled: !!address && !!yesPositionId },
  })

  const { data: noBalance, refetch: refetchNoBalance } = useReadContract({
    address: conditionalTokensAddress,
    abi: conditionalTokensAbi,
    functionName: 'balanceOf',
    args: [
      address ||
        ('0x0000000000000000000000000000000000000000' as `0x${string}`),
      noPositionId || BigInt(0),
    ],
    query: { enabled: !!address && !!noPositionId },
  })

  // Get payout denominator
  const { data: payoutDenominator } = useReadContract({
    address: conditionalTokensAddress,
    abi: conditionalTokensAbi,
    functionName: 'payoutDenominator',
    args: conditionId ? [conditionId] : undefined,
    query: { enabled: !!conditionId },
  })

  // Get payout numerators for YES outcome (index 1)
  const { data: yesPayoutNumerator } = useReadContract({
    address: conditionalTokensAddress,
    abi: conditionalTokensAbi,
    functionName: 'payoutNumerators',
    args: conditionId ? [conditionId, BigInt(1)] : undefined,
    query: { enabled: !!conditionId },
  })

  // Get payout numerators for NO outcome (index 0)
  const { data: noPayoutNumerator } = useReadContract({
    address: conditionalTokensAddress,
    abi: conditionalTokensAbi,
    functionName: 'payoutNumerators',
    args: conditionId ? [conditionId, BigInt(0)] : undefined,
    query: { enabled: !!conditionId },
  })

  // Determine if the market is actually resolved by checking if payout numerators exist
  const isMarketResolved = React.useMemo(() => {
    return (
      payoutDenominator !== undefined &&
      yesPayoutNumerator !== undefined &&
      noPayoutNumerator !== undefined &&
      payoutDenominator > BigInt(0)
    )
  }, [payoutDenominator, yesPayoutNumerator, noPayoutNumerator])

  // Determine the actual market outcome from the contract
  const marketOutcome = React.useMemo(() => {
    if (!isMarketResolved) return null

    // YES outcome wins if yesPayoutNumerator > 0 and noPayoutNumerator = 0
    // NO outcome wins if noPayoutNumerator > 0 and yesPayoutNumerator = 0
    // Could also be a draw if both are equal and > 0
    if (yesPayoutNumerator! > BigInt(0) && noPayoutNumerator === BigInt(0)) {
      return 'YES'
    } else if (
      noPayoutNumerator! > BigInt(0) &&
      yesPayoutNumerator === BigInt(0)
    ) {
      return 'NO'
    } else {
      // This handles draws or other edge cases
      return null
    }
  }, [isMarketResolved, yesPayoutNumerator, noPayoutNumerator])

  // Determine which positions the user has (can have both YES and NO)
  const userPositions = React.useMemo(() => {
    const yesAmount = yesBalance || BigInt(0)
    const noAmount = noBalance || BigInt(0)

    const positions = []

    if (yesAmount > BigInt(0)) {
      positions.push({
        outcome: 'YES' as const,
        amount: yesAmount,
      })
    }

    if (noAmount > BigInt(0)) {
      positions.push({
        outcome: 'NO' as const,
        amount: noAmount,
      })
    }

    return positions
  }, [yesBalance, noBalance])

  // Calculate expected payout for all positions
  useEffect(() => {
    if (
      userPositions.length === 0 ||
      !isMarketResolved ||
      !payoutDenominator ||
      (yesPayoutNumerator === undefined && noPayoutNumerator === undefined)
    ) {
      setExpectedPayout(null)
      return
    }

    try {
      let totalPayout = BigInt(0)

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

      setExpectedPayout(totalPayout)
    } catch (err) {
      console.error('Error calculating expected payout:', err)
      setExpectedPayout(null)
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
        pos.outcome === 'YES' ? BigInt(2) : BigInt(1)
      )

      // Make sure we have a condition ID
      if (!conditionId) {
        throw new Error('Condition ID not found')
      }

      await writeContractAsync({
        address: conditionalTokensAddress,
        abi: conditionalTokensAbi,
        functionName: 'redeemPositions',
        args: [
          mockUsdcAddress, // collateralToken
          '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`, // parentCollectionId
          conditionId,
          indexSets,
        ],
      })

      // Create success message with all positions
      const positionDetails = userPositions
        .map(
          (pos) =>
            `${formatBigNumber(pos.amount, collateralDecimals)} ${pos.outcome}`
        )
        .join(' + ')

      setSuccess(`Successfully redeemed ${positionDetails} tokens!`)

      // Refresh balances
      refetchYesBalance()
      refetchNoBalance()

      if (onSuccess) onSuccess()
    } catch (err: any) {
      console.error('Error redeeming position:', err)
      setError(err.message || 'Failed to redeem position')
    }
  }

  // Legacy code - keeping for potential backwards compatibility
  // const isWinningPosition =
  //   userPosition && market.result === (userPosition.outcome === 'YES')

  // Show loading state while fetching position data
  if (!address || !isConnected) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="terminal-command text-lg">Redeem Your Position</h3>
          <p className="terminal-text text-sm">{market.title}</p>
        </div>
        <div className="text-center py-8">
          <div className="terminal-dim text-sm">
            Please connect your wallet to view positions
          </div>
        </div>
      </div>
    )
  }

  // Show no position message if user has no tokens
  if (
    userPositions.length === 0 &&
    yesBalance !== undefined &&
    noBalance !== undefined
  ) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="terminal-command text-lg">Redeem Your Position</h3>
          <p className="terminal-text text-sm">{market.title}</p>
        </div>

        <div className="text-center py-8">
          <div className="terminal-dim text-sm">
            You have no positions in this market
          </div>
          <div className="terminal-dim text-xs mt-2">
            Buy some tokens first to participate
          </div>
        </div>
      </div>
    )
  }

  // Show loading while position data is being fetched
  if (userPositions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="terminal-command text-lg">Redeem Your Position</h3>
          <p className="terminal-text text-sm">{market.title}</p>
        </div>
        <div className="text-center py-8">
          <div className="terminal-bright text-sm">◉ LOADING POSITION ◉</div>
          <div className="terminal-dim text-xs mt-2">
            Fetching your token balances...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="terminal-command text-lg">Redeem Your Position</h3>
        <p className="terminal-text text-sm">{market.title}</p>
      </div>

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
                    {formatBigNumber(position.amount, collateralDecimals)}{' '}
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
        </div>

        {expectedPayout !== null && (
          <div className="mt-4 pt-4 border-t border-gray-800">
            <div className="terminal-dim text-xs">
              TOTAL EXPECTED REDEMPTION
            </div>
            <div className="terminal-bright text-base text-green-400">
              {formatBigNumber(expectedPayout, collateralDecimals)} $
              {collateralSymbol}
            </div>
          </div>
        )}
      </div>

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

      <Button
        onClick={handleRedeem}
        disabled={!isConnected || !isMarketResolved || isWriting}
        className="w-full mobile-terminal-btn"
      >
        {isWriting ? (
          <span className="terminal-dim">Processing...</span>
        ) : expectedPayout ? (
          <span className="terminal-command">
            REDEEM FOR {formatBigNumber(expectedPayout, collateralDecimals)} $
            {collateralSymbol}
          </span>
        ) : (
          <span className="terminal-command">REDEEM POSITIONS</span>
        )}
      </Button>

      <div className="terminal-dim text-xs">
        When you redeem your positions, you&apos;ll receive collateral tokens
        based on the market outcome.{' '}
        {!isMarketResolved
          ? 'The market is not yet resolved, so no redemption is possible.'
          : userPositions.some((pos) => marketOutcome === pos.outcome)
          ? userPositions.some((pos) => marketOutcome !== pos.outcome)
            ? ' You have both winning and losing positions - only winning positions will yield collateral.'
            : ' Since you bet on the correct outcome, you can redeem your tokens for collateral.'
          : ' Since you bet on the incorrect outcome, your tokens are now worthless.'}
      </div>
    </div>
  )
}
