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
      address: "0x7F10AE767C7998605C02E195696e4C0dA634eE9e",
    },
    {
      abi: ABI.EAS.abi,
      name: "EAS",
      address: "0x91F96f73e106bAE8Fc42775B21107b4523D387D2",
    },
    {
      abi: ABI.SchemaRegistry.abi,
      name: "SchemaRegistry",
      address: "0x405C3C4F213acdA114a89CE40679F73E4C980220",
    },
    {
      abi: ABI.SchemaRegistrar.abi,
      name: "SchemaRegistrar",
      address: "0xfE6aF2F3d032b92197bf77fd5F15190c34ECE740",
    },
    {
      abi: ABI.Indexer.abi,
      name: "Indexer",
      address: "0x149Aa61F44200a00352303aD1Dc5944D4BC8eAC5",
    },
    {
      abi: ABI.IndexerResolver.abi,
      name: "IndexerResolver",
      address: "0xD738A4CB01aE05388632b6988C24af5ff5bF4d90",
    },
    {
      abi: ABI.VotingPower.abi,
      name: "VotingPower",
      address: "0x617Ee526b833bCC2E131a8b0B6daC3fA84Db5aEa",
    },
    {
      abi: ABI.AttestationGovernor.abi,
      name: "AttestationGovernor",
      address: "0xF97fF013C86FeBEbd9802f8a990Bb08484112C2A",
    },
    {
      abi: ABI.RewardDistributor.abi,
      name: "RewardDistributor",
      address: "0x888A9da95dBa793eb35b930129339a51f8d79547",
    },
    {
      abi: ABI.EASAttestTrigger.abi,
      name: "EASAttestTrigger",
      address: "0xBBc8eb28E9D1649c3B6fBfc9fdEB75E8c6eD17Ca",
    },
    {
      abi: ABI.ENOVA.abi,
      name: "ENOVA",
      address: "0xe4448b59D3195E93954FF3c65652a6b19b57dc53",
    },
    {
      abi: ABI.MerkleGov.abi,
      name: "MerkleGov",
      address: "0x0B9a6B760fc61EB0d2038ABc491ECCF448dE7551",
    },
    {
      abi: ABI.MerkleVote.abi,
      name: "MerkleVote",
      address: "0xe464B2306f60b384810061fF8823De3e5F37780c",
    },
  ],
});
