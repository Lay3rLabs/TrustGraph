import { useCallback } from 'react'
import { useReadContract, useWatchContractEvent } from 'wagmi'

import {
  conditionalTokensAbi,
  predictionMarketControllerAbi,
} from '@/lib/contracts'
import { HyperstitionMarket, HyperstitionMarketStatus } from '@/types'

export const useHyperstitionMarketStatus = ({
  controllerAddress,
  conditionalTokensAddress,
}: HyperstitionMarket) => {
  const { data: conditionId, isLoading: isLoadingConditionId } =
    useReadContract({
      abi: conditionalTokensAbi,
      address: conditionalTokensAddress,
      functionName: 'getConditionId',
      args: [
        controllerAddress,
        '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`, // questionId
        2n, // outcomeSlotCount (YES/NO = 2 outcomes)
      ],
    })

  const {
    data: payoutDenominator,
    isLoading: isLoadingPayoutDenominator,
    refetch: refetchPayoutDenominator,
  } = useReadContract({
    address: conditionalTokensAddress,
    abi: conditionalTokensAbi,
    functionName: 'payoutDenominator',
    args: conditionId ? [conditionId] : undefined,
    query: { enabled: !!conditionId },
  })

  const {
    data: yesPayoutNumerator,
    isLoading: isLoadingYesPayoutNumerator,
    refetch: refetchYesPayoutNumerator,
  } = useReadContract({
    address: conditionalTokensAddress,
    abi: conditionalTokensAbi,
    functionName: 'payoutNumerators',
    args: conditionId ? [conditionId, 1n] : undefined,
    query: { enabled: !!conditionId },
  })

  const {
    data: noPayoutNumerator,
    isLoading: isLoadingNoPayoutNumerator,
    refetch: refetchNoPayoutNumerator,
  } = useReadContract({
    address: conditionalTokensAddress,
    abi: conditionalTokensAbi,
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
    refetchPayoutDenominator()
    refetchYesPayoutNumerator()
    refetchNoPayoutNumerator()
  }, [
    refetchPayoutDenominator,
    refetchYesPayoutNumerator,
    refetchNoPayoutNumerator,
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

    conditionId,
    isLoadingConditionId,

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
