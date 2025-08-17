import { defineConfig } from "@wagmi/cli";

const ABI = {
  Attester: require("../out/Attester.sol/Attester.json"),
  EAS: require("../out/EAS.sol/EAS.json"),
  SchemaRegistry: require("../out/SchemaRegistry.sol/SchemaRegistry.json"),
  SchemaRegistrar: require("../out/SchemaRegistrar.sol/SchemaRegistrar.json"),
  Indexer: require("../out/Indexer.sol/Indexer.json"),
  IndexerResolver: require("../out/IndexerResolver.sol/IndexerResolver.json"),
  VotingPower: require("../out/VotingPower.sol/VotingPower.json"),
  AttestationGovernor: require("../out/Governor.sol/AttestationGovernor.json"),
  RewardDistributor: require("../out/RewardDistributor.sol/RewardDistributor.json"),
  EASAttestTrigger: require("../out/Trigger.sol/EASAttestTrigger.json"),
};

export default defineConfig({
  out: "lib/contracts.ts",
  contracts: [
    {
      abi: ABI.Attester.abi,
      name: "Attester",
      address: "0xde154D4b3d20D3aD4542c9Db0fD5a08ccD42c922",
    },
    {
      abi: ABI.EAS.abi,
      name: "EAS",
      address: "0x5D65F742c6291A97445Cf9D7fCE6b97476a74e67",
    },
    {
      abi: ABI.SchemaRegistry.abi,
      name: "SchemaRegistry",
      address: "0x3569D28CA21Bf410850d96C0B9E1f239BdD34567",
    },
    {
      abi: ABI.SchemaRegistrar.abi,
      name: "SchemaRegistrar",
      address: "0xd22647de20323282c35e9B6Ab75ef85a73bb874A",
    },
    {
      abi: ABI.Indexer.abi,
      name: "Indexer",
      address: "0x7eb54ee2c335bc3Cfe755Ba2E6868FD1c9C5B284",
    },
    {
      abi: ABI.IndexerResolver.abi,
      name: "IndexerResolver",
      address: "0xA1904245bA63fD8B297d68c7575ba41efeAD3F60",
    },
    {
      abi: ABI.VotingPower.abi,
      name: "VotingPower",
      address: "0xCb970716D72Af50654b016d3672eDa496b675942",
    },
    {
      abi: ABI.AttestationGovernor.abi,
      name: "AttestationGovernor",
      address: "0xAf6bAd0982548EE8b56667067283F1f7b83a8Fa0",
    },
    {
      abi: ABI.RewardDistributor.abi,
      name: "RewardDistributor",
      address: "0xE7423679D5Fdf596a46928DCaae69022a54F912D",
    },
    {
      abi: ABI.EASAttestTrigger.abi,
      name: "EASAttestTrigger",
      address: "0x6aa097292aF22dfDA1897D16c69BBeFA63760C84",
    },
  ],
});
