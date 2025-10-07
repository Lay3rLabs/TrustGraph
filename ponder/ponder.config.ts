import { createConfig, factory } from "ponder";

import { conditionalTokensAbi, easAbi, lmsrMarketMakerAbi, merkleSnapshotAbi, predictionMarketControllerAbi, wavsIndexerAbi } from "../frontend/lib/contracts";
import deploymentSummary from "../.docker/deployment_summary.json";
import { Hex } from "viem";

// const CHAIN = "base" as const;
// const CHAIN_ID = 8453;

const CHAIN = "local" as const;
const CHAIN_ID = 31337;

export default createConfig({
  ordering: "multichain",
  chains: {
    [CHAIN]: {
      id: CHAIN_ID,
      rpc: CHAIN === "local" ? "http://localhost:8545" : process.env[`PONDER_RPC_URL_${CHAIN_ID}`],
      ws: CHAIN === "local" ? "ws://localhost:8545" : process.env[`PONDER_WS_URL_${CHAIN_ID}`],
    },
  },
  contracts: {
    predictionMarketController: {
      abi: predictionMarketControllerAbi,
      startBlock: 1,
      // startBlock: 35855002,
      chain: {
        [CHAIN]: { address: deploymentSummary.prediction_market.controller as Hex },
      },
    },
    marketMaker: {
      abi: lmsrMarketMakerAbi,
      chain: CHAIN,
      startBlock: 1,
      // startBlock: 35855002,
      address: factory({
        address: deploymentSummary.prediction_market.controller as Hex,
        event: predictionMarketControllerAbi.find(abi => abi.type === 'event' && abi.name === 'LMSRMarketMakerCreation')!,
        parameter: 'lmsrMarketMaker',
      }),
    },
    conditionalTokens: {
      abi: conditionalTokensAbi,
      chain: CHAIN,
      startBlock: 1,
      // startBlock: 35855002,
      address: factory({
        address: deploymentSummary.prediction_market.controller as Hex,
        event: predictionMarketControllerAbi.find(abi => abi.type === 'event' && abi.name === 'LMSRMarketMakerCreation')!,
        parameter: 'conditionalTokens',
      }),
    },
    wavsIndexer: {
      abi: wavsIndexerAbi,
      startBlock: 1,
      // startBlock: 35855002,
      chain: {
        [CHAIN]: { address: deploymentSummary.wavs_indexer as Hex },
      },
    },
    eas: {
      abi: easAbi,
      startBlock: 1,
      // startBlock: 35855002,
      chain: {
        [CHAIN]: { address: deploymentSummary.eas.contracts.eas as Hex },
      },
    },
    merkleSnapshot: {
      abi: merkleSnapshotAbi,
      startBlock: 1,
      // startBlock: 35855002,
      chain: {
        [CHAIN]: { address: deploymentSummary.merkler.merkle_snapshot as Hex },
      },
    },
  },
});
