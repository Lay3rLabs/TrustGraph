import { http, createConfig } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { injected, metaMask } from "wagmi/connectors";

// Local chain configuration matching the deployment
const localChain = {
  id: 11155111, // Anvil default chain ID
  name: "Local Anvil",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["http://localhost:8545"],
    },
  },
  blockExplorers: {
    default: { name: "Local", url: "http://localhost:8545" },
  },
} as const;

export const config = createConfig({
  chains: [localChain, mainnet],
  connectors: [injected(), metaMask()],
  transports: {
    [localChain.id]: http("http://localhost:8545", {
      retryCount: 3,
      timeout: 60000,
    }),
    [mainnet.id]: http(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
