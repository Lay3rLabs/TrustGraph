import { formatUnits } from 'viem'
import { useAccount, useBalance, useReadContract } from 'wagmi'

import { erc20Address, erc20Config } from '@/lib/contracts'

export const useCollateralToken = () => {
  const { address } = useAccount()

  const { data: decimals = 6, isPending: isLoadingDecimals } = useReadContract({
    ...erc20Config,
    functionName: 'decimals',
  })

  const { data: symbol = 'USDC', isPending: isLoadingSymbol } = useReadContract(
    {
      ...erc20Config,
      functionName: 'symbol',
    }
  )

  const {
    data: _balance,
    isPending: isLoadingBalance,
    refetch: refetchBalance,
  } = useBalance({
    address: address,
    token: erc20Address,
    query: {
      refetchInterval: 3_000,
    },
  })

  const balance = _balance?.value
  const formattedBalance = balance ? formatUnits(balance, decimals) : null

  return {
    decimals,
    isLoadingDecimals,

    symbol,
    isLoadingSymbol,

    balance,
    formattedBalance,
    isLoadingBalance,
    refetchBalance,
  }
}
