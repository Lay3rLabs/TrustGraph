import { useCallback } from 'react'
import { formatUnits, hexToNumber } from 'viem'
import { useAccount, useReadContract, useWatchContractEvent } from 'wagmi'

import {
  conditionalTokensConfig,
  erc20Address,
  lmsrMarketMakerAbi,
  predictionMarketControllerAddress,
  predictionMarketControllerConfig,
} from '@/lib/contracts'
import { HyperstitionMarket, HyperstitionMarketStatus } from '@/types'

import { useCollateralToken } from './useCollateralToken'

const PRICE_DIVISOR = hexToNumber('0x10000000000000000')

export const usePredictionMarket = ({
  marketMakerAddress,
}: HyperstitionMarket) => {
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

  const { data: conditionId, isLoading: isLoadingConditionId } =
    useReadContract({
      ...conditionalTokensConfig,
      functionName: 'getConditionId',
      args: [
        predictionMarketControllerAddress, // oracle
        '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`, // questionId
        2n, // outcomeSlotCount (YES/NO = 2 outcomes)
      ],
    })

  // Get collection IDs for YES/NO positions
  const { data: yesCollectionId, isLoading: isLoadingYesCollectionId } =
    useReadContract({
      ...conditionalTokensConfig,
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
      ...conditionalTokensConfig,
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
      ...conditionalTokensConfig,
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
      ...conditionalTokensConfig,
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
    ...conditionalTokensConfig,
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
    ...conditionalTokensConfig,
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

  const {
    data: payoutDenominator,
    isLoading: isLoadingPayoutDenominator,
    refetch: refetchPayoutDenominator,
  } = useReadContract({
    ...conditionalTokensConfig,
    functionName: 'payoutDenominator',
    args: conditionId ? [conditionId] : undefined,
    query: { enabled: !!conditionId },
  })

  const {
    data: yesPayoutNumerator,
    isLoading: isLoadingYesPayoutNumerator,
    refetch: refetchYesPayoutNumerator,
  } = useReadContract({
    ...conditionalTokensConfig,
    functionName: 'payoutNumerators',
    args: conditionId ? [conditionId, 1n] : undefined,
    query: { enabled: !!conditionId },
  })

  const {
    data: noPayoutNumerator,
    isLoading: isLoadingNoPayoutNumerator,
    refetch: refetchNoPayoutNumerator,
  } = useReadContract({
    ...conditionalTokensConfig,
    functionName: 'payoutNumerators',
    args: conditionId ? [conditionId, 0n] : undefined,
    query: { enabled: !!conditionId },
  })

  const isMarketResolved =
    !!payoutDenominator &&
    yesPayoutNumerator !== undefined &&
    noPayoutNumerator !== undefined

  const status: HyperstitionMarketStatus = isMarketResolved
    ? yesPayoutNumerator > 0n
      ? 'achieved'
      : 'failed'
    : isLoadingPayoutDenominator ||
      isLoadingYesPayoutNumerator ||
      isLoadingNoPayoutNumerator ||
      isLoadingConditionId
    ? 'loading'
    : 'active'

  const refetch = useCallback(() => {
    refetchYesCost()
    refetchNoCost()
    refetchYesShares()
    refetchNoShares()
    refetchPayoutDenominator()
    refetchYesPayoutNumerator()
    refetchNoPayoutNumerator()
  }, [
    refetchYesCost,
    refetchNoCost,
    refetchYesShares,
    refetchNoShares,
    refetchPayoutDenominator,
    refetchYesPayoutNumerator,
    refetchNoPayoutNumerator,
  ])

  // Refresh when the market resolves.
  useWatchContractEvent({
    ...predictionMarketControllerConfig,
    eventName: 'MarketResolved',
    onLogs: refetch,
  })

  return {
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

    refetch,

    conditionId,
    yesCollectionId,
    noCollectionId,
    yesPositionId,
    noPositionId,

    isMarketResolved,
    yesPayoutNumerator,
    noPayoutNumerator,
    payoutDenominator,
    isLoadingResolution:
      isLoadingConditionId ||
      isLoadingPayoutDenominator ||
      isLoadingYesPayoutNumerator ||
      isLoadingNoPayoutNumerator,
  }
}
