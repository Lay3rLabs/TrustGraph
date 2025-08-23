import { defineConfig } from "@wagmi/cli";

// ABIs for Safe + Custom Zodiac modules + Prediction market contracts.
const ABI = {
  Attester: require("../out/Attester.sol/Attester.json"),
  EAS: require("../out/EAS.sol/EAS.json"),
  SchemaRegistry: require("../out/SchemaRegistry.sol/SchemaRegistry.json"),
  SchemaRegistrar: require("../out/SchemaRegistrar.sol/SchemaRegistrar.json"),
  Indexer: require("../out/contracts/Indexer.sol/Indexer.json"),
  IndexerResolver: require("../out/IndexerResolver.sol/IndexerResolver.json"),
  RewardDistributor: require("../out/RewardDistributor.sol/RewardDistributor.json"),
  EASAttestTrigger: require("../out/Trigger.sol/EASAttestTrigger.json"),
  ENOVA: require("../out/ERC20.sol/ENOVA.json"),
  GnosisSafe: require("../out/GnosisSafe.sol/GnosisSafe.json"),
  GnosisSafeProxy: require("../out/GnosisSafeProxy.sol/GnosisSafeProxy.json"),
  PredictionMarketOracleController: require("../out/PredictionMarketOracleController.sol/PredictionMarketOracleController.json"),
  MarketMaker: require("../out/MarketMaker.sol/MarketMaker.json"),
  MerkleGovModule: require("../out/MerkleGovModule.sol/MerkleGovModule.json"),
  SignerManagerModule: require("../out/SignerManagerModule.sol/SignerManagerModule.json"),
  ConditionalTokens: require("../out/ConditionalTokens.sol/ConditionalTokens.json"),
  LMSRMarketMaker: require("../out/LMSRMarketMaker.sol/LMSRMarketMaker.json"),
  PredictionMarketFactory: require("../out/PredictionMarketFactory.sol/PredictionMarketFactory.json"),
  MockUSDC: require("../out/MockUSDC.sol/MockUSDC.json"),
};

export default defineConfig({
  out: "lib/contracts.ts",
  contracts: [
    {
      abi: ABI.Attester.abi,
      name: "Attester",
      address: "0x96fc0C70B6E3F1b40Aa0329c31c9f1Fc45764d91",
    },
    {
      abi: ABI.EAS.abi,
      name: "EAS",
      address: "0xF7b25da5642AD4087d9A848c9B4C2Fa9156456ab",
    },
    {
      abi: ABI.SchemaRegistry.abi,
      name: "SchemaRegistry",
      address: "0x4Ac9116Fd342fff399deE4a233d9B0DDC914c9fC",
    },
    {
      abi: ABI.SchemaRegistrar.abi,
      name: "SchemaRegistrar",
      address: "0x41225CA78e9d7114dec37bb7581F0E72F49883eC",
    },
    {
      abi: ABI.Indexer.abi,
      name: "Indexer",
      address: "0xD7E2fe08Ea9303b9BD46C5545b0eE08e42304dF3",
    },
    {
      abi: ABI.IndexerResolver.abi,
      name: "IndexerResolver",
      address: "0xB21aD0C4557393521Ec46Ee77F8163318144Fdbb",
    },
    {
      abi: ABI.RewardDistributor.abi,
      name: "RewardDistributor",
      address: "0x46880C4FbB8163ea736783cE59fdaE4563a3370E",
    },
    {
      abi: ABI.EASAttestTrigger.abi,
      name: "EASAttestTrigger",
      address: "0x13dD13DAfADb99efC95b3eE84B04b740A60F212E",
    },
    {
      abi: ABI.ENOVA.abi,
      name: "ENOVA",
      address: "0xED3405181e7e867639d9a295DFd0f168045EAF05",
    },
    {
      abi: ABI.GnosisSafe.abi,
      name: "GnosisSafe",
      address: "0x5d3b79773521bd23d6bbd380d80285461a65f798",
    },
    {
      abi: ABI.GnosisSafeProxy.abi,
      name: "GnosisSafeProxy",
      address: "0xea616154efd067a9742126e05f2515a41e002588",
    },
    {
      abi: ABI.PredictionMarketOracleController.abi,
      name: "PredictionMarketOracleController",
      address: "0x0E23390aEfBE3B7d27bF120B0D64feB311417DB1",
    },
    {
      abi: ABI.MarketMaker.abi,
      name: "MarketMaker",
      // Address will be updated by deployment script
    },
    {
      abi: ABI.MerkleGovModule.abi,
      name: "MerkleGovModule",
      address: "0xb3cb091ff316cca8bbf467df044f33cce5e0e2d5",
    },
    {
      abi: ABI.SignerManagerModule.abi,
      name: "SignerManagerModule",
      address: "0x91e0ca95bf92937c1d760034490129da52a75436",
    },
    {
      abi: ABI.ConditionalTokens.abi,
      name: "ConditionalTokens",
      address: "0x37399bD122FA332B3330De0cD5067ac8AD332a8e",
    },
    {
      abi: ABI.LMSRMarketMaker.abi,
      name: "LMSRMarketMaker",
      address: "0x8D87CC7CbC58816B420b0Cd2F4f5CFdf7A7883d4",
    },
    {
      abi: ABI.PredictionMarketFactory.abi,
      name: "PredictionMarketFactory",
      address: "0x0697c05E4B27F5FAc25e1eaD34a81A91958D9CA5",
    },
    {
      abi: ABI.MockUSDC.abi,
      name: "MockUSDC",
      address: "0x716831df22af84fc43A4E6Fa3f10A4007BfDC4F3",
    },
  ],
});
