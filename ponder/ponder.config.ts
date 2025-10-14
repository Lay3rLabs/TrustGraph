import { createConfig, factory } from "ponder";

import {
  easAbi,
  merkleSnapshotAbi,
  wavsIndexerAbi,
} from "../frontend/lib/contracts";
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
