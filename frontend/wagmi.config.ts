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
      address: "0xB0C055361e7D176F26DC819F66126fD3C7b50c1E",
    },
    {
      abi: ABI.EAS.abi,
      name: "EAS",
      address: "0x4f314Bf4aFedfcF214236917d47b20c554256ee5",
    },
    {
      abi: ABI.SchemaRegistry.abi,
      name: "SchemaRegistry",
      address: "0xBb75afEEB16D5e1A8a0FA1bc342557fd3B6bB957",
    },
    {
      abi: ABI.SchemaRegistrar.abi,
      name: "SchemaRegistrar",
      address: "0xC9Ca108e70DF3CaD3075B30ebb79D52f1b76Ba76",
    },
    {
      abi: ABI.Indexer.abi,
      name: "Indexer",
      address: "0xaBd6eE2295DB489F42006260A85D6ecD4F9a41f9",
    },
    {
      abi: ABI.IndexerResolver.abi,
      name: "IndexerResolver",
      address: "0x23211C2489CcD89f1Eb814B1db0Cf6e0492506fC",
    },
    {
      abi: ABI.RewardDistributor.abi,
      name: "RewardDistributor",
      address: "0x4CdFbcF7460Ed8a6E68Dc6be34B4c1C7F36dfa73",
    },
    {
      abi: ABI.EASAttestTrigger.abi,
      name: "EASAttestTrigger",
      address: "0x21AAc63f276eE66f02267A1B487a496EBCdF81bA",
    },
    {
      abi: ABI.ENOVA.abi,
      name: "ENOVA",
      address: "0x5f78a252153D3c6352aB81A98B848cCc64bEB9Ec",
    },
    {
      abi: ABI.GnosisSafe.abi,
      name: "GnosisSafe",
      address: "0x2e7d8a4b5f69509ee94af63a8b6388be6b60dd09",
    },
    {
      abi: ABI.GnosisSafeProxy.abi,
      name: "GnosisSafeProxy",
      address: "0x19d8346a07ddd6716611885cb60201b6d9ccc436",
    },
    {
      abi: ABI.PredictionMarketOracleController.abi,
      name: "PredictionMarketOracleController",
      address: "0x4B0Dd1A7e6F7a512678Ea4Fb59F641b14Dd5aE3B",
    },
    {
      abi: ABI.MarketMaker.abi,
      name: "MarketMaker",
      // Address will be updated by deployment script
    },
    {
      abi: ABI.MerkleGovModule.abi,
      name: "MerkleGovModule",
      address: "0x52e764cf1f1b3f37c855b6bde63af4dcf8fe09e4",
    },
    {
      abi: ABI.SignerManagerModule.abi,
      name: "SignerManagerModule",
      address: "0xb1e35911fe838e365208ec32de7512ef289f2c8a",
    },
    {
      abi: ABI.ConditionalTokens.abi,
      name: "ConditionalTokens",
      address: "0x1c01da686121562A78Cc82D35F7671D39A0dCa02",
    },
    {
      abi: ABI.LMSRMarketMaker.abi,
      name: "LMSRMarketMaker",
      address: "0x540dd9ed51eD46FDD060c7A0DC6F278574A7d139",
    },
    {
      abi: ABI.PredictionMarketFactory.abi,
      name: "PredictionMarketFactory",
      address: "0x5c1792797642bf8Fc2D9ee3E6E062C0C9fAd73C1",
    },
    {
      abi: ABI.MockUSDC.abi,
      name: "MockUSDC",
      address: "0x882c42A703153f9050E9211114c98cbA10a60515",
    },
  ],
});
