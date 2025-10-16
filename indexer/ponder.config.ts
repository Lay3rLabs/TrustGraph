import { createConfig } from "ponder";

import {
  easIndexerResolverAbi,
  merkleSnapshotAbi,
  wavsIndexerAbi,
} from "../frontend/lib/contracts";
import deploymentSummary from "../.docker/deployment_summary.json";
import { Hex } from "viem";

// const CHAIN = "optimism" as const;
// const CHAIN_ID = 10;

const CHAIN = "local" as const;
const CHAIN_ID = 31337;

export default createConfig({
  ordering: "multichain",
  chains: {
    [CHAIN]: {
      id: CHAIN_ID,
      rpc:
        CHAIN === "local"
          ? "http://localhost:8545"
          : process.env[`PONDER_RPC_URL_${CHAIN_ID}`],
      ws:
        CHAIN === "local"
          ? "ws://localhost:8545"
          : process.env[`PONDER_WS_URL_${CHAIN_ID}`],
    },
  },
  contracts: {
    wavsIndexer: {
      abi: wavsIndexerAbi,
      startBlock: 1,
      // startBlock: 35855002,
      chain: {
        [CHAIN]: { address: deploymentSummary.wavs_indexer as Hex },
      },
    },
    easIndexerResolver: {
      abi: easIndexerResolverAbi,
      startBlock: 1,
      // startBlock: 35855002,
      chain: {
        [CHAIN]: { address: deploymentSummary.eas.contracts.indexer_resolver as Hex },
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
