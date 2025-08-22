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
      address: "0x606e6FbF31AF9bA8Cf4CD203159f5EaA2eE33D1F",
    },
    {
      abi: ABI.EAS.abi,
      name: "EAS",
      address: "0x4F9eCd4471fA836Bd8a19B4B42450b70d12fbE83",
    },
    {
      abi: ABI.SchemaRegistry.abi,
      name: "SchemaRegistry",
      address: "0x5340e5798670991110dc6B7DcEAe0237ADDE1Bd2",
    },
    {
      abi: ABI.SchemaRegistrar.abi,
      name: "SchemaRegistrar",
      address: "0xa52dEF455ff2667c3a196aa690639479F61d0ac4",
    },
    {
      abi: ABI.Indexer.abi,
      name: "Indexer",
      address: "0xA925aF24159e4a9361B577a43aD76e4b478854BA",
    },
    {
      abi: ABI.IndexerResolver.abi,
      name: "IndexerResolver",
      address: "0x3DA1242362539185Bc14398995B097E9F729CD8a",
    },
    {
      abi: ABI.VotingPower.abi,
      name: "VotingPower",
      address: "0x86E5462a7e3B3B0082558D88052E80D6930be5B3",
    },
    {
      abi: ABI.AttestationGovernor.abi,
      name: "AttestationGovernor",
      address: "0xcb9D39cd0cD34D5848B0fDfED18F737133d21319",
    },
    {
      abi: ABI.RewardDistributor.abi,
      name: "RewardDistributor",
      address: "0x98Fe79B6D7BD2EFDeE41F0B61bfa26bF44753275",
    },
    {
      abi: ABI.EASAttestTrigger.abi,
      name: "EASAttestTrigger",
      address: "0xFA5b64f163c3D538a565d3e99604C5300b8CFB6D",
    },
    {
      abi: ABI.ENOVA.abi,
      name: "ENOVA",
      address: "0xe4448b59D3195E93954FF3c65652a6b19b57dc53",
    },
    {
      abi: ABI.MerkleGov.abi,
      name: "MerkleGov",
      address: "0x375CE9578D36855B0049664c8911990Cc9aF1fC4",
    },
    {
      abi: ABI.MerkleVote.abi,
      name: "MerkleVote",
      address: "0x718dd2c5f5D711A5B9e9d531EC782DA91355F0bf",
    },
  ],
});
