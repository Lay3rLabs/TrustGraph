import { useCallback } from 'react'
import { formatUnits, hexToNumber } from 'viem'
import { useAccount, useReadContract, useWatchContractEvent } from 'wagmi'

import {
  conditionalTokensAbi,
  erc20Address,
  lmsrMarketMakerAbi,
  predictionMarketControllerAbi,
} from '@/lib/contracts'
import { HyperstitionMarket } from '@/types'

import { useCollateralToken } from './useCollateralToken'
import { useHyperstitionMarketStatus } from './useHyperstitionMarketStatusFromChain'

const PRICE_DIVISOR = hexToNumber('0x10000000000000000')

export const useHyperstitionMarket = (market: HyperstitionMarket) => {
  const {
    refetch: refetchStatus,
    status,
    conditionId,
    isLoadingConditionId,
    isMarketResolved,
    yesPayoutNumerator,
    noPayoutNumerator,
    payoutDenominator,
    isLoadingResolution,
  } = useHyperstitionMarketStatus(market)

  const { marketMakerAddress, conditionalTokensAddress, controllerAddress } =
    market

  const { address } = useAccount()

  const {
    data: yesCostData,
    isLoading: isLoadingYesCost,
    refetch: refetchYesCost,
  } = useReadContract({
    address: marketMakerAddress,
    abi: lmsrMarketMakerAbi,
    functionName: 'calcMarginalPrice',
    args: [1],
    query: { enabled: true, refetchInterval: 3_000 },
  })

  const yesCost = yesCostData ? Number(yesCostData) / PRICE_DIVISOR : 0

  const {
    data: noCostData,
    isLoading: isLoadingNoCost,
    refetch: refetchNoCost,
  } = useReadContract({
    address: marketMakerAddress,
    abi: lmsrMarketMakerAbi,
    functionName: 'calcMarginalPrice',
    args: [0],
    query: { refetchInterval: 5_000 },
  })

  const noCost = noCostData ? Number(noCostData) / PRICE_DIVISOR : 0

  const { decimals: collateralDecimals } = useCollateralToken()

  // Get collection IDs for YES/NO positions
  const { data: yesCollectionId, isLoading: isLoadingYesCollectionId } =
    useReadContract({
      abi: conditionalTokensAbi,
      address: conditionalTokensAddress,
      functionName: 'getCollectionId',
      args: conditionId
        ? [
            '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`, // parentCollectionId
            conditionId,
            2n, // indexSet for YES (binary 10 = decimal 2)
          ]
        : undefined,
      query: { enabled: !!conditionId },
    })

  const { data: noCollectionId, isLoading: isLoadingNoCollectionId } =
    useReadContract({
      abi: conditionalTokensAbi,
      address: conditionalTokensAddress,
      functionName: 'getCollectionId',
      args: conditionId
        ? [
            '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`, // parentCollectionId
            conditionId,
            1n, // indexSet for NO (binary 01 = decimal 1)
          ]
        : undefined,
      query: { enabled: !!conditionId },
    })

  // Get position IDs for YES/NO tokens
  const { data: yesPositionId, isLoading: isLoadingYesPositionId } =
    useReadContract({
      abi: conditionalTokensAbi,
      address: conditionalTokensAddress,
      functionName: 'getPositionId',
      args: yesCollectionId
        ? [
            erc20Address, // collateralToken
            yesCollectionId,
          ]
        : undefined,
      query: { enabled: !!yesCollectionId },
    })

  const { data: noPositionId, isLoading: isLoadingNoPositionId } =
    useReadContract({
      abi: conditionalTokensAbi,
      address: conditionalTokensAddress,
      functionName: 'getPositionId',
      args: noCollectionId ? [erc20Address, noCollectionId] : undefined,
      query: { enabled: !!noCollectionId },
    })

  // Get user's token balances using the position IDs
  const {
    data: yesShares,
    isLoading: _isLoadingYesShares,
    refetch: refetchYesShares,
  } = useReadContract({
    abi: conditionalTokensAbi,
    address: conditionalTokensAddress,
    functionName: 'balanceOf',
    args: address && yesPositionId ? [address, yesPositionId] : undefined,
    query: {
      enabled: !!address && !!yesPositionId,
      refetchInterval: 3_000,
    },
  })

  const isLoadingYesShares =
    isLoadingConditionId ||
    isLoadingYesCollectionId ||
    isLoadingYesPositionId ||
    _isLoadingYesShares

  const formattedYesShares = yesShares
    ? formatUnits(yesShares, collateralDecimals)
    : '0'

  const {
    data: noShares,
    isLoading: _isLoadingNoShares,
    refetch: refetchNoShares,
  } = useReadContract({
    abi: conditionalTokensAbi,
    address: conditionalTokensAddress,
    functionName: 'balanceOf',
    args: address && noPositionId ? [address, noPositionId] : undefined,
    query: {
      enabled: !!address && !!noPositionId,
      refetchInterval: 3_000,
    },
  })

  const isLoadingNoShares =
    isLoadingConditionId ||
    isLoadingNoCollectionId ||
    isLoadingNoPositionId ||
    _isLoadingNoShares

  const formattedNoShares = noShares
    ? formatUnits(noShares, collateralDecimals)
    : '0'

  const refetch = useCallback(() => {
    refetchYesCost()
    refetchNoCost()
    refetchYesShares()
    refetchNoShares()
    refetchStatus()
  }, [
    refetchYesCost,
    refetchNoCost,
    refetchYesShares,
    refetchNoShares,
    refetchStatus,
  ])

  // Refresh when the market resolves.
  useWatchContractEvent({
    address: controllerAddress,
    abi: predictionMarketControllerAbi,
    eventName: 'MarketResolved',
    onLogs: refetch,
  })

  return {
    refetch,

    status,

    yesCost,
    isLoadingYesCost,
    refetchYesCost,

    noCost,
    isLoadingNoCost,
    refetchNoCost,

    isLoadingCost: isLoadingYesCost || isLoadingNoCost,

    yesShares,
    formattedYesShares,
    isLoadingYesShares,
    refetchYesShares,

    noShares,
    formattedNoShares,
    isLoadingNoShares,
    refetchNoShares,

    isLoadingShares: isLoadingYesShares || isLoadingNoShares,

    conditionId,
    isLoadingConditionId,

    yesCollectionId,
    noCollectionId,
    yesPositionId,
    noPositionId,

    isMarketResolved,
    yesPayoutNumerator,
    noPayoutNumerator,
    payoutDenominator,
    isLoadingResolution,
  }
}
