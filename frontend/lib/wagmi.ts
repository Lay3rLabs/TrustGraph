import { porto } from 'porto/wagmi'
import { Chain } from 'viem'
import { base } from 'viem/chains'
import { createConfig, fallback, http, webSocket } from 'wagmi'
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
  if (CHAIN === 'base') {
    const webSocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL_8453
    return {
      ...base,
      rpcUrls: {
        default: {
          http: ['/api/rpc/8453'],
          ...(webSocketUrl && { webSocket: [webSocketUrl] }),
        },
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

const supportedChains = [currentNetworkConfig] as readonly [Chain, ...Chain[]]

export const config = createConfig({
  chains: supportedChains,
  connectors: [
    injected(),
    porto({
      chains: supportedChains,
    }),
    metaMask(),
    coinbaseWallet(),
    walletConnect({
      projectId: 'c6abc47a50f2aebfc9cbd1cac562759c',
    }),
  ],
  transports: supportedChains.reduce((acc, chain) => {
    const webSocketUrl = chain.rpcUrls.default.webSocket?.[0]
    const httpUrl = chain.rpcUrls.default.http[0]
    const httpTransport = http(httpUrl, {
      retryCount: 3,
      timeout: 30_000,
    })
    const transport = webSocketUrl
      ? fallback([webSocket(webSocketUrl), httpTransport])
      : httpTransport

    acc[chain.id] = transport
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
