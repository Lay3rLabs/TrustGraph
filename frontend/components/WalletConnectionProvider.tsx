import { useEffect } from 'react'
import { toHex } from 'viem'
import { useAccount, useSwitchChain } from 'wagmi'

import { localChain } from '@/lib/wagmi'

export const WalletConnectionProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const addLocalNetwork = async () => {
    try {
      await window.ethereum?.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: toHex(localChain.id),
            chainName: 'Local Anvil',
            nativeCurrency: {
              name: 'Ether',
              symbol: 'ETH',
              decimals: 18,
            },
            rpcUrls: ['http://localhost:8545'],
            blockExplorerUrls: ['http://localhost:8545'],
          },
        ],
      })
    } catch (err) {
      console.error('Failed to add local network:', err)
      throw err
    }
  }

  const { switchChain } = useSwitchChain()
  const { isConnected, chain } = useAccount()

  const handleSwitchToLocal = async () => {
    try {
      switchChain({ chainId: localChain.id })
    } catch (err) {
      console.error('Failed to switch network:', err)
      try {
        await addLocalNetwork()
        switchChain({ chainId: localChain.id })
      } catch (addErr) {
        console.error('Failed to add and switch network:', addErr)
      }
    }
  }

  // Auto-switch to local network when connected to wrong chain
  useEffect(() => {
    if (isConnected && (!chain || chain.id !== localChain.id)) {
      console.log(
        `Current chain: ${chain?.id || 'unknown'}, switching to local chain: ${
          localChain.id
        }`
      )
      handleSwitchToLocal()
    }
  }, [isConnected, chain])

  return <>{children}</>
}
