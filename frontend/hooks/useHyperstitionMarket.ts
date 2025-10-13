import { usePonderQuery } from '@ponder/react'
import { useCallback } from 'react'
import { formatUnits } from 'viem'
import { useAccount, useReadContract, useWatchContractEvent } from 'wagmi'

import {
  conditionalTokensAbi,
  predictionMarketControllerAbi,
} from '@/lib/contracts'
import { HyperstitionMarket, HyperstitionMarketStatus } from '@/types'

import { useCollateralToken } from './useCollateralToken'

export const useHyperstitionMarket = (market: HyperstitionMarket) => {
  const { address } = useAccount()

  const {
    data: state,
    isPending: isLoadingMarketState,
    refetch: refetchMarketState,
  } = usePonderQuery({
    queryFn: (db) =>
      db.query.predictionMarket.findFirst({
        where: (t, { eq }) => eq(t.marketMaker, market.marketMakerAddress),
      }),
  })

  const status: HyperstitionMarketStatus = state
    ? state.isMarketResolved
      ? state.yesPayoutNumerator
        ? 'achieved'
        : 'failed'
      : 'active'
    : 'loading'

  // Refresh when the market resolves.
  useWatchContractEvent({
    address: market.controllerAddress,
    abi: predictionMarketControllerAbi,
    eventName: 'MarketResolved',
    onLogs: () => refetchMarketState(),
  })

  const {
    data: { price: yesPrice } = { price: 0 },
    isPending: isLoadingPrice,
    isError: isErrorPrice,
    refetch: refetchPrice,
  } = usePonderQuery({
    queryFn: (db) =>
      db.query.predictionMarketPrice.findFirst({
        where: (t, { eq }) => eq(t.marketAddress, market.marketMakerAddress),
        orderBy: (t, { desc }) => desc(t.timestamp),
      }),
  })

  const noPrice = isLoadingPrice || isErrorPrice ? 0 : 1 - yesPrice

  const { decimals: collateralDecimals } = useCollateralToken()

  // Get user's token balances using the position IDs
  const {
    data: yesShares,
    isPending: _isLoadingYesShares,
    refetch: refetchYesShares,
  } = useReadContract({
    abi: conditionalTokensAbi,
    address: market.conditionalTokensAddress,
    functionName: 'balanceOf',
    args:
      address && state?.yesPositionId
        ? [address, state.yesPositionId]
        : undefined,
    query: {
      enabled: !!address && !!state?.yesPositionId,
      refetchInterval: 3_000,
    },
  })

  const isLoadingYesShares = isLoadingMarketState || _isLoadingYesShares
  const formattedYesShares = yesShares
    ? formatUnits(yesShares, collateralDecimals)
    : '0'

  const {
    data: noShares,
    isPending: _isLoadingNoShares,
    refetch: refetchNoShares,
  } = useReadContract({
    abi: conditionalTokensAbi,
    address: market.conditionalTokensAddress,
    functionName: 'balanceOf',
    args:
      address && state?.noPositionId
        ? [address, state.noPositionId]
        : undefined,
    query: {
      enabled: !!address && !!state?.noPositionId,
      refetchInterval: 3_000,
    },
  })

  const isLoadingNoShares = isLoadingMarketState || _isLoadingNoShares
  const formattedNoShares = noShares
    ? formatUnits(noShares, collateralDecimals)
    : '0'

  const refetch = useCallback(() => {
    refetchMarketState()
    refetchPrice()
    refetchYesShares()
    refetchNoShares()
  }, [refetchMarketState, refetchPrice, refetchYesShares, refetchNoShares])

  // Refresh when the market resolves.
  useWatchContractEvent({
    address: market.controllerAddress,
    abi: predictionMarketControllerAbi,
    eventName: 'MarketResolved',
    onLogs: refetch,
  })

  return {
    refetch,

    isLoadingMarket: isLoadingMarketState,
    status,
    isMarketResolved: state?.isMarketResolved,
    yesPayoutNumerator: state?.yesPayoutNumerator,
    noPayoutNumerator: state?.noPayoutNumerator,
    payoutDenominator: state?.payoutDenominator,
    conditionId: state?.conditionId,

    yesPrice,
    noPrice,
    isLoadingPrice,
    refetchPrice,

    yesShares,
    formattedYesShares,
    isLoadingYesShares,
    refetchYesShares,

    noShares,
    formattedNoShares,
    isLoadingNoShares,
    refetchNoShares,

    isLoadingShares: isLoadingYesShares || isLoadingNoShares,
  }
}
