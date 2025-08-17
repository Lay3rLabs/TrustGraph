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
      address: "0xdCF55560F86F8F07091E9FE1f0695C7782dd917C",
    },
    {
      abi: ABI.EAS.abi,
      name: "EAS",
      address: "0x01E4927F0CDC83d2DD5AD6fb14b7417497E41E35",
    },
    {
      abi: ABI.SchemaRegistry.abi,
      name: "SchemaRegistry",
      address: "0x3E6cd56CeAD5210920f487fF852301391C699356",
    },
    {
      abi: ABI.SchemaRegistrar.abi,
      name: "SchemaRegistrar",
      address: "0x820987bC7e3896Ae864a6DdD665Bc4a09e4F9414",
    },
    {
      abi: ABI.Indexer.abi,
      name: "Indexer",
      address: "0xC18470bF37A2e1Eb229059D1Fb7f3874919b970c",
    },
    {
      abi: ABI.IndexerResolver.abi,
      name: "IndexerResolver",
      address: "0x03e851d7f0D526a1B4afC5D4013630eee316ee9c",
    },
    {
      abi: ABI.VotingPower.abi,
      name: "VotingPower",
      address: "0x5F7301Ca65FfD777922145F1BEAb8bb2FA07c2C5",
    },
    {
      abi: ABI.AttestationGovernor.abi,
      name: "AttestationGovernor",
      address: "0x2366EccC50a2EDc2559bf3287d8699e46F5772d7",
    },
    {
      abi: ABI.RewardDistributor.abi,
      name: "RewardDistributor",
      address: "0x71D4c2df7620EAD4Ee3900B761f950f21D81ED8d",
    },
    {
      abi: ABI.EASAttestTrigger.abi,
      name: "EASAttestTrigger",
      address: "0x1e03095fe6B269d99b44DA3F5F7f50d0fbdF4C6E",
    },
  ],
});
