import {
  BaseSyntheticEvent,
  MouseEvent,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { useAccount, useSwitchChain } from 'wagmi'

import {
  createNetworkAddParams,
  getTargetChainConfig,
  getTargetChainId,
} from '@/lib/wagmi'

const WalletConnectionContext = createContext<{
  _openId: number
  openConnectWallet: (event?: BaseSyntheticEvent) => void
}>({
  _openId: 0,
  openConnectWallet: () => {},
})

export const useWalletConnectionContext = () =>
  useContext(WalletConnectionContext)
export const useOpenWalletConnector = () =>
  useWalletConnectionContext().openConnectWallet

export const WalletConnectionProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [_openId, setOpenId] = useState(0)
  const openConnectWallet = useCallback((event?: BaseSyntheticEvent) => {
    event?.stopPropagation()
    setOpenId((openId) => openId + 1)
  }, [])

  const addTargetNetwork = async () => {
    try {
      const chainConfig = getTargetChainConfig()
      const networkParams = createNetworkAddParams(chainConfig)

      await window.ethereum?.request({
        method: 'wallet_addEthereumChain',
        params: [networkParams],
      })

      console.log(`Added network: ${chainConfig.name} (${chainConfig.id})`)
    } catch (err) {
      console.error('Failed to add target network:', err)
      throw err
    }
  }

  const { switchChain } = useSwitchChain()
  const { isConnected, chain } = useAccount()

  const handleSwitchToTarget = async () => {
    try {
      const targetChainId = getTargetChainId()
      switchChain({ chainId: targetChainId })
    } catch (err) {
      console.error('Failed to switch network:', err)
      try {
        await addTargetNetwork()
        const targetChainId = getTargetChainId()
        switchChain({ chainId: targetChainId })
      } catch (addErr) {
        console.error('Failed to add and switch network:', addErr)
      }
    }
  }

  // Auto-switch to target network when connected to wrong chain
  useEffect(() => {
    const targetChainId = getTargetChainId()
    const targetChainConfig = getTargetChainConfig()

    if (isConnected && (!chain || chain.id !== targetChainId)) {
      console.log(
        `Current chain: ${chain?.id || 'unknown'}, switching to target chain: ${
          targetChainConfig.name
        } (${targetChainId})`
      )
      handleSwitchToTarget()
    }
  }, [isConnected, chain])

  return (
    <WalletConnectionContext.Provider value={{ _openId, openConnectWallet }}>
      {children}
    </WalletConnectionContext.Provider>
  )
}
