import { createConfig } from "ponder";

import { conditionalTokensAbi, lmsrMarketMakerAbi, wavsIndexerAbi } from "../frontend/lib/contracts";
import deploymentSummary from "../.docker/deployment_summary.json";
import { Hex } from "viem";

export default createConfig({
  ordering: "multichain",
  chains: {
    // mainnet: {
    //   id: 1,
    //   rpc: process.env.PONDER_RPC_URL_1,
    //   ws: process.env.PONDER_WS_URL_1,
    // },
    // base: {
    //   id: 8453,
    //   rpc: process.env.PONDER_RPC_URL_8453,
    //   ws: process.env.PONDER_WS_URL_8453,
    // },
    local: {
      id: 31337,
      rpc: "http://localhost:8545",
      ws: "ws://localhost:8546",
    },
  },
  contracts: {
    marketMaker: {
      abi: lmsrMarketMakerAbi,
      startBlock: 1,
      chain: {
        local: {
          address: deploymentSummary.prediction_market.market_maker as Hex,
        },
      },
    },
    conditionalTokens: {
      abi: conditionalTokensAbi,
      startBlock: 1,
      chain: {
        local: { address: deploymentSummary.prediction_market.conditional_tokens as Hex },
      },
    },
    wavsIndexer: {
      abi: wavsIndexerAbi,
      startBlock: 1,
      chain: {
        local: { address: deploymentSummary.wavs_indexer as Hex },
      },
    }
  },
});
