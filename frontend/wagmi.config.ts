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
  ENOVA: require("../out/ERC20.sol/ENOVA.json"),
  MerkleGov: require("../out/MerkleGov.sol/MerkleGov.json"),
  MerkleVote: require("../out/MerkleVote.sol/MerkleVote.json"),
};

export default defineConfig({
  out: "lib/contracts.ts",
  contracts: [
    {
      abi: ABI.Attester.abi,
      name: "Attester",
      address: "0xa23b41AdA4F70d03C7754aF168A81888b3Dfe6Ec",
    },
    {
      abi: ABI.EAS.abi,
      name: "EAS",
      address: "0x6F63fDFee68255c0835b03256589974dd9DaF6f8",
    },
    {
      abi: ABI.SchemaRegistry.abi,
      name: "SchemaRegistry",
      address: "0x5F93151B58a927c2278E21A2838567971ADa9087",
    },
    {
      abi: ABI.SchemaRegistrar.abi,
      name: "SchemaRegistrar",
      address: "0x8D0146d8961D2dddAEBE2f677266E622165a3Cee",
    },
    {
      abi: ABI.Indexer.abi,
      name: "Indexer",
      address: "0xe9ECcc0B2EeF5CF2383c914Ca4BF8f4bf45f04Db",
    },
    {
      abi: ABI.IndexerResolver.abi,
      name: "IndexerResolver",
      address: "0xf58C4879D92b32d49C205D222Fc664CcFd7Fff30",
    },
    {
      abi: ABI.VotingPower.abi,
      name: "VotingPower",
      address: "0x10f9867F5ccDA2f7eb57cC62989329536e4444F9",
    },
    {
      abi: ABI.AttestationGovernor.abi,
      name: "AttestationGovernor",
      address: "0x5aBb37548a1Be40665188AEa6d38aC91C036C4B0",
    },
    {
      abi: ABI.RewardDistributor.abi,
      name: "RewardDistributor",
      address: "0xbDfD43CCBDB12D60ec8e1683ce28075A8104e691",
    },
    {
      abi: ABI.EASAttestTrigger.abi,
      name: "EASAttestTrigger",
      address: "0xB6c66aa0517DF4650715C253f5b4b65b9b194cb4",
    },
    {
      abi: ABI.ENOVA.abi,
      name: "ENOVA",
      address: "0xe4448b59D3195E93954FF3c65652a6b19b57dc53",
    },
    {
      abi: ABI.MerkleGov.abi,
      name: "MerkleGov",
      address: "0x68b174a3B6ce95a88486eC5FACbce4cDF317De15",
    },
    {
      abi: ABI.MerkleVote.abi,
      name: "MerkleVote",
      address: "0xaB6F17D348741EB5D558cF3c210cDAe6a63cAC75",
    },
  ],
});
