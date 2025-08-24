import { defineConfig } from "@wagmi/cli";

// ABIs for Safe + Custom Zodiac modules + Prediction market contracts.
const ABI = {
  Attester: require("../out/Attester.sol/Attester.json"),
  EAS: require("../out/EAS.sol/EAS.json"),
  SchemaRegistry: require("../out/SchemaRegistry.sol/SchemaRegistry.json"),
  SchemaRegistrar: require("../out/SchemaRegistrar.sol/SchemaRegistrar.json"),
  Indexer: require("../out/Indexer.sol/Indexer.json"),
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
      address: "0xAA2eF02C30DCb4A229ca458fD6B18c8Ea8E32A68",
    },
    {
      abi: ABI.EAS.abi,
      name: "EAS",
      address: "0xaeff21B1fc09126daad5507E17A94e70BF33D261",
    },
    {
      abi: ABI.SchemaRegistry.abi,
      name: "SchemaRegistry",
      address: "0x30e7e30C026323F212C676Aa0cD85428543196A2",
    },
    {
      abi: ABI.SchemaRegistrar.abi,
      name: "SchemaRegistrar",
      address: "0x8E21f4e1BB62F50aC7A0597FA7357508Cd47611f",
    },
    {
      abi: ABI.Indexer.abi,
      name: "Indexer",
      address: "0x34c57169AF887186B98317A541D42241B4481d89",
    },
    {
      abi: ABI.IndexerResolver.abi,
      name: "IndexerResolver",
      address: "0xe2936B809922A7dc87826787fe4cA0F1445E5E47",
    },
    {
      abi: ABI.RewardDistributor.abi,
      name: "RewardDistributor",
      address: "0x006Cef2AdD987C0333253156C0B1A16Ea63e38Ed",
    },
    {
      abi: ABI.EASAttestTrigger.abi,
      name: "EASAttestTrigger",
      address: "0x9d822B81B6f28D1C48be9c383776699d88d85C46",
    },
    {
      abi: ABI.ENOVA.abi,
      name: "ENOVA",
      address: "0xe6022FeeFF123209F504456f8fFbBe8a48b5DDe1",
    },
    {
      abi: ABI.GnosisSafe.abi,
      name: "GnosisSafe",
      address: "0xf5516def101091ce9a24f2327dee721424c91d91",
    },
    {
      abi: ABI.GnosisSafeProxy.abi,
      name: "GnosisSafeProxy",
      address: "0x9eb9988a316dbabe74925398aaf4b119f2c5e5c9",
    },
    {
      abi: ABI.PredictionMarketOracleController.abi,
      name: "PredictionMarketOracleController",
      address: "0x231617188B22fd3A6024561A3449b523374d8B39",
    },
    {
      abi: ABI.MarketMaker.abi,
      name: "MarketMaker",
      // Address will be updated by deployment script
    },
    {
      abi: ABI.MerkleGovModule.abi,
      name: "MerkleGovModule",
      address: "0x431c27b7cc62e8e7b1757f2f9fca6b68ca862ad9",
    },
    {
      abi: ABI.SignerManagerModule.abi,
      name: "SignerManagerModule",
      address: "0x445c65af87ef72b7108f48ed03256350610a6b21",
    },
    {
      abi: ABI.ConditionalTokens.abi,
      name: "ConditionalTokens",
      address: "0x8AFbBaFC564390e5ae3f448Df65980c1ec96A280",
    },
    {
      abi: ABI.LMSRMarketMaker.abi,
      name: "LMSRMarketMaker",
      address: "0xFA701a805308eC6ee57ad70F1be7f804357fD1c3",
    },
    {
      abi: ABI.PredictionMarketFactory.abi,
      name: "PredictionMarketFactory",
      address: "0xE0829fBe9494C2Eec18b992e77A5a2248C6f96c1",
    },
    {
      abi: ABI.MockUSDC.abi,
      name: "MockUSDC",
      address: "0x3a6cA4fb09Ad5f66e6efa11Ce686eC3aBfAAC587",
    },
  ],
});
