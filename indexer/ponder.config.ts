import { createConfig } from "ponder";
import { Hex } from "viem";

import deploymentSummary from "../.docker/deployment_summary.json";
import {
  easIndexerResolverAbi,
  merkleFundDistributorAbi,
  merkleGovModuleAbi,
  merkleSnapshotAbi,
  wavsIndexerAbi,
} from "../frontend/lib/contracts";

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
    merkleGovModule: {
      abi: merkleGovModuleAbi,
      // startBlock: 1,
      startBlock: 'latest',
      // startBlock: 35855002,
      chain: {
        [CHAIN]: { address: deploymentSummary.zodiac_safes.safe1.merkle_gov_module as Hex },
      },
    },
    merkleFundDistributor: {
      abi: merkleFundDistributorAbi,
      // startBlock: 1,
      startBlock: 'latest',
      // startBlock: 35855002,
      chain: {
        [CHAIN]: { address: deploymentSummary.merkler.fund_distributor as Hex },
      },
    },
  },
});
