import { porto } from 'porto/wagmi'
import { base } from 'viem/chains'
import { createConfig, http } from 'wagmi'
import {
  coinbaseWallet,
  injected,
  metaMask,
  walletConnect,
} from 'wagmi/connectors'

import { CHAIN } from './config'

export type NetworkConfig = {
  id: number
  name: string
  nativeCurrency: {
    decimals: number
    name: string
    symbol: string
  }
  rpcUrls: {
    default: { http: string[] | readonly string[] }
  }
  blockExplorers?: {
    default: { name: string; url: string }
  }
}

export const localChain: NetworkConfig = {
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
    },
  },
  blockExplorers: {
    default: { name: 'Local', url: 'http://localhost:8545' },
  },
}

// Environment-based network configuration
export const getNetworkConfig = (): NetworkConfig => {
  if (CHAIN === 'base') {
    return base
  } else if (CHAIN === 'local') {
    return localChain
  } else {
    throw new Error(`Unsupported chain: ${CHAIN}`)
  }
}

// Get the current network configuration
export const currentNetworkConfig = getNetworkConfig()

const supportedChains = [currentNetworkConfig]

export const config = createConfig({
  chains: supportedChains as any,
  connectors: [
    injected(),
    porto(),
    metaMask(),
    coinbaseWallet(),
    walletConnect({
      projectId: 'c6abc47a50f2aebfc9cbd1cac562759c',
    }),
  ],
  transports: supportedChains.reduce((acc, chain) => {
    acc[chain.id] = http(chain.rpcUrls.default.http[0], {
      retryCount: 3,
      timeout: 60000,
    })
    return acc
  }, {} as Record<number, any>),
})

// Export utility functions for network management
export const getTargetChainId = (): number => {
  return currentNetworkConfig.id
}

export const getTargetChainConfig = (): NetworkConfig => {
  return currentNetworkConfig
}

export const createNetworkAddParams = (config: NetworkConfig) => {
  return {
    chainId: `0x${config.id.toString(16)}`,
    chainName: config.name,
    nativeCurrency: config.nativeCurrency,
    rpcUrls: config.rpcUrls.default.http,
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
