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
      address: "0x4161883923F2457A36f4D815fcb5F617f867dA72",
    },
    {
      abi: ABI.EAS.abi,
      name: "EAS",
      address: "0x2F49adaB4d48D865eA0E78d5ca7cD9Adcc13c545",
    },
    {
      abi: ABI.SchemaRegistry.abi,
      name: "SchemaRegistry",
      address: "0xd0bBaD879C3E00C0d2eE4F5bC55451491491A2D7",
    },
    {
      abi: ABI.SchemaRegistrar.abi,
      name: "SchemaRegistrar",
      address: "0xC75e7c8858537c99E58EA18909184752d85a1635",
    },
    {
      abi: ABI.Indexer.abi,
      name: "Indexer",
      address: "0xbC9A451a3fd48ccB7aE8D67583Ef7DB77b9e74d0",
    },
    {
      abi: ABI.IndexerResolver.abi,
      name: "IndexerResolver",
      address: "0xB971f1aD5B50B259D13C0FE8c8e2fC04175B6434",
    },
    {
      abi: ABI.VotingPower.abi,
      name: "VotingPower",
      address: "0x4893592de610cD99701592E14AE88C25B50A9f94",
    },
    {
      abi: ABI.AttestationGovernor.abi,
      name: "AttestationGovernor",
      address: "0x88526a39A9B6b1ECecB3F421340D2Ad1410D0251",
    },
    {
      abi: ABI.RewardDistributor.abi,
      name: "RewardDistributor",
      address: "0x8956092EAd86E5aec31960a27e126BE029BA43e0",
    },
    {
      abi: ABI.EASAttestTrigger.abi,
      name: "EASAttestTrigger",
      address: "0x3b58A098215DfbB019920b8ea032f907a153f2aF",
    },
    {
      abi: ABI.ENOVA.abi,
      name: "ENOVA",
      address: "0xe4448b59D3195E93954FF3c65652a6b19b57dc53",
    },
    {
      abi: ABI.MerkleGov.abi,
      name: "MerkleGov",
      address: "0xBAE4DA60517e83ebC4F6682CDB7E745f7b9A5132",
    },
    {
      abi: ABI.MerkleVote.abi,
      name: "MerkleVote",
      address: "0xFaE67Ab740Ce02Ac9EEA4b255e04998CBf17B52C",
    },
  ],
});
