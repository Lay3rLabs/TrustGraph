import { porto } from 'porto/wagmi'
import { Chain } from 'viem'
import { optimism } from 'viem/chains'
import { createConfig, fallback, http, webSocket } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import {
  coinbaseWallet,
  injected,
  metaMask,
  walletConnect,
} from 'wagmi/connectors'

import { CHAIN } from './config'

export const localChain: Chain = {
  id: 31337, // Anvil default chain ID
  name: 'Local Anvil',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://localhost:8545'],
      webSocket: ['ws://localhost:8545'],
    },
  },
  blockExplorers: {
    default: { name: 'Local', url: 'http://localhost:8545' },
  },
}

// Environment-based network configuration
export const getCurrentChainConfig = (): Chain => {
  if (CHAIN === 'optimism') {
    const webSocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL_10
    return {
      ...optimism,
      rpcUrls: {
        default: {
          http: ['/api/rpc/10?id=0', '/api/rpc/10?id=1'],
          ...(webSocketUrl && { webSocket: [webSocketUrl] }),
        },
        provided: optimism.rpcUrls.default,
      },
    }
  } else if (CHAIN === 'local') {
    return localChain
  } else {
    throw new Error(`Unsupported chain: ${CHAIN}`)
  }
}

// Get the current network configuration
export const currentNetworkConfig = getCurrentChainConfig()

const supportedChains = [
  currentNetworkConfig,
  // Add ETH mainnet for ENS resolution
  mainnet,
] as readonly [Chain, ...Chain[]]

export const config = createConfig({
  chains: supportedChains,
  connectors: [
    injected(),
    ...(CHAIN !== 'local' ? [porto()] : []),
    metaMask(),
    coinbaseWallet(),
    walletConnect({
      projectId: 'c6abc47a50f2aebfc9cbd1cac562759c',
    }),
  ],
  transports: supportedChains.reduce((acc, chain) => {
    const transports = [
      ...(chain.rpcUrls.default.webSocket?.map((url) => webSocket(url)) || []),
      ...(chain.rpcUrls.default.http.map((url) => http(url)) || []),
    ]

    acc[chain.id] = transports.length > 1 ? fallback(transports) : transports[0]
    return acc
  }, {} as Record<number, any>),
})

// Export utility functions for network management
export const getTargetChainId = (): number => {
  return currentNetworkConfig.id
}

export const getTargetChainConfig = (): Chain => {
  return currentNetworkConfig
}

export const createNetworkAddParams = (config: Chain) => {
  return {
    chainId: `0x${config.id.toString(16)}`,
    chainName: config.name,
    nativeCurrency: config.nativeCurrency,
    rpcUrls: config.rpcUrls.provided?.http || config.rpcUrls.default.http,
    blockExplorerUrls: config.blockExplorers?.default?.url
      ? [config.blockExplorers.default.url]
      : undefined,
  }
}

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
