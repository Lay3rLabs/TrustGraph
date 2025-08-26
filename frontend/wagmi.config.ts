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
      address: "0x004980F90020e71edaBaCD8624fde7DAf79eD6A0",
    },
    {
      abi: ABI.EAS.abi,
      name: "EAS",
      address: "0x959C6bdB0834983429D52C4Ef77edb07af5fF67f",
    },
    {
      abi: ABI.SchemaRegistry.abi,
      name: "SchemaRegistry",
      address: "0x73144bd314116C7234abDe19157E506691AcE4af",
    },
    {
      abi: ABI.SchemaRegistrar.abi,
      name: "SchemaRegistrar",
      address: "0xf6612655669d4d516F73a83c2B8cC9d32Bf09965",
    },
    {
      abi: ABI.Indexer.abi,
      name: "Indexer",
      address: "0xE3Ec94B4eF96466C461029a58d65f733C5Cb0e24",
    },
    {
      abi: ABI.IndexerResolver.abi,
      name: "IndexerResolver",
      address: "0xAFB17376011b6E7235416f47EBB46f18aB0dF77c",
    },
    {
      abi: ABI.RewardDistributor.abi,
      name: "RewardDistributor",
      address: "0x36B82212C5F882Bf99eE9DB2C390C536500461c2",
    },
    {
      abi: ABI.EASAttestTrigger.abi,
      name: "EASAttestTrigger",
      address: "0xb55C806e2fDC1616173481D7937AFeCeD6c37483",
    },
    {
      abi: ABI.ENOVA.abi,
      name: "ENOVA",
      address: "0x56416C3ff0e26A6cDDFB6A484d2597c62BBE1d91",
    },
    {
      abi: ABI.GnosisSafe.abi,
      name: "GnosisSafe",
      address: "0xc3c26279c7034b2a2c2dab6859b2efdb661dd7a8",
    },
    {
      abi: ABI.GnosisSafeProxy.abi,
      name: "GnosisSafeProxy",
      address: "0x395cc0d793c918068fa981df930c40192aa4a1aa",
    },
    {
      abi: ABI.PredictionMarketOracleController.abi,
      name: "PredictionMarketOracleController",
      address: "0x3C974CCc3C9655264B08C80Cf9e3d0916a48fd0A",
    },
    {
      abi: ABI.MarketMaker.abi,
      name: "MarketMaker",
      // Address will be updated by deployment script
    },
    {
      abi: ABI.MerkleGovModule.abi,
      name: "MerkleGovModule",
      address: "0x2506a893ba78bfbb398ddb4d7e48731fbec6175d",
    },
    {
      abi: ABI.SignerManagerModule.abi,
      name: "SignerManagerModule",
      address: "0x6769855f6c2a19b4a4b15d91f5ad1a1f64b24045",
    },
    {
      abi: ABI.ConditionalTokens.abi,
      name: "ConditionalTokens",
      address: "0x291104398E0AE1ba415BedEe61feeeA02A4dD3Cf",
    },
    {
      abi: ABI.LMSRMarketMaker.abi,
      name: "LMSRMarketMaker",
      address: "0xB1E0eF4254B65bC7F79Fc09aA8Fa883Ea6F7c55e",
    },
    {
      abi: ABI.PredictionMarketFactory.abi,
      name: "PredictionMarketFactory",
      address: "0xeF5fa4D7404eD3dC0baEB9d66f1E06c1bE758D23",
    },
    {
      abi: ABI.MockUSDC.abi,
      name: "MockUSDC",
      address: "0xF068eA0A9E14D9D206714bc8cD003Bcf6feA5D8C",
    },
  ],
});
