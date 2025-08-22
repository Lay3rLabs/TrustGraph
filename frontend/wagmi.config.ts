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
      address: "0x5B9b14c0D1743a63E9D5bb4267B6C1B585420136",
    },
    {
      abi: ABI.EAS.abi,
      name: "EAS",
      address: "0x1718df6b9C8BfC821aFdA1249C44eA5a2D8e527b",
    },
    {
      abi: ABI.SchemaRegistry.abi,
      name: "SchemaRegistry",
      address: "0xc7b84E03054aCC854e866bD86eCb8D4C1B544f4e",
    },
    {
      abi: ABI.SchemaRegistrar.abi,
      name: "SchemaRegistrar",
      address: "0xe96e696A770F9c87503D379B8953d1dFda0402Fc",
    },
    {
      abi: ABI.Indexer.abi,
      name: "Indexer",
      address: "0x89Db2f3428a07d9354fA1915414F2F581Da80188",
    },
    {
      abi: ABI.IndexerResolver.abi,
      name: "IndexerResolver",
      address: "0x72AF2f41FD7B5C32CCC1Cf4b55098377bf467645",
    },
    {
      abi: ABI.RewardDistributor.abi,
      name: "RewardDistributor",
      address: "0xD26778894d529F7B588984C78549424BE7DDb9C4",
    },
    {
      abi: ABI.EASAttestTrigger.abi,
      name: "EASAttestTrigger",
      address: "0x6cA6283a4bcbDBfDEc152F0E12F35788830a54F6",
    },
    {
      abi: ABI.ENOVA.abi,
      name: "ENOVA",
      address: "0x5c9d6d366a6D1941860486cba3a215EB95E2b388",
    },
    {
      abi: ABI.GnosisSafe.abi,
      name: "GnosisSafe",
      address: "0x359482d7dea5b94caf8a666592bdf6f9e6c3dc66",
    },
    {
      abi: ABI.GnosisSafeProxy.abi,
      name: "GnosisSafeProxy",
      address: "0x152fc95cdc8fbe85998a3b5985f097a3093100de",
    },
    {
      abi: ABI.PredictionMarketOracleController.abi,
      name: "PredictionMarketOracleController",
      address: "0xd1F62A8BB7b605940f1FEAC87aD2717003617716",
    },
    {
      abi: ABI.MarketMaker.abi,
      name: "MarketMaker",
      // Address will be updated by deployment script
    },
    {
      abi: ABI.MerkleGovModule.abi,
      name: "MerkleGovModule",
      address: "0x3ec7d050c71baa842335c95dcd540f12543ca867",
    },
    {
      abi: ABI.SignerManagerModule.abi,
      name: "SignerManagerModule",
      address: "0xbed06ae40a0d48cd05e8163200ad0991e6798221",
    },
    {
      abi: ABI.ConditionalTokens.abi,
      name: "ConditionalTokens",
      address: "0x4dA36865307A27FA5fB858D01cCB50C2f09aDDe7",
    },
    {
      abi: ABI.LMSRMarketMaker.abi,
      name: "LMSRMarketMaker",
      address: "0x388bec8b2928a992a696a9D932204A6CB807FE6b",
    },
    {
      abi: ABI.PredictionMarketFactory.abi,
      name: "PredictionMarketFactory",
      address: "0x8751316b70433e24D2926B89400727E453b364D7",
    },
    {
      abi: ABI.MockUSDC.abi,
      name: "MockUSDC",
      address: "0xD4341dE33d6B626A5156da2748F3fbe5Ca38E2d0",
    },
  ],
});
