import { porto } from 'porto/wagmi'
import { createConfig, http } from 'wagmi'
import {
  coinbaseWallet,
  injected,
  metaMask,
  walletConnect,
} from 'wagmi/connectors'

// Local chain configuration matching the deployment
export const localChain = {
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
} as const

export const config = createConfig({
  chains: [localChain],
  connectors: [
    injected(),
    porto(),
    metaMask(),
    coinbaseWallet(),
    // walletConnect({
    //   projectId: '',
    // }),
  ],
  transports: {
    [localChain.id]: http(localChain.rpcUrls.default.http[0], {
      retryCount: 3,
      timeout: 60000,
    }),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
