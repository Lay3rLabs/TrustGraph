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
      address: "0xeAb90E430eF83dA98459D35D3EFe81fA419Af0AA",
    },
    {
      abi: ABI.EAS.abi,
      name: "EAS",
      address: "0x57a65aF842C7F78E6598053C954DdBD281896cc5",
    },
    {
      abi: ABI.SchemaRegistry.abi,
      name: "SchemaRegistry",
      address: "0x53A4ac3Ba53cf5f73bA271d1686c4923820a73FC",
    },
    {
      abi: ABI.SchemaRegistrar.abi,
      name: "SchemaRegistrar",
      address: "0xf57353d6d049195Bae036C1211378c706AAfBeEd",
    },
    {
      abi: ABI.Indexer.abi,
      name: "Indexer",
      address: "0x6D9B74cC8841DCB0b576277bd808C7325B3d215C",
    },
    {
      abi: ABI.IndexerResolver.abi,
      name: "IndexerResolver",
      address: "0x5f165D19649A957F4B60A8323897B710a16017e6",
    },
    {
      abi: ABI.VotingPower.abi,
      name: "VotingPower",
      address: "0x5Da5D64EEE871269351BEab68a81f401BB2E0b39",
    },
    {
      abi: ABI.AttestationGovernor.abi,
      name: "AttestationGovernor",
      address: "0xcC1c22a0C4467A927f690696D03f60F563121e9D",
    },
    {
      abi: ABI.RewardDistributor.abi,
      name: "RewardDistributor",
      address: "0xe5d3A16E44aB6807FE7561E5daFb60EF156b81CF",
    },
    {
      abi: ABI.EASAttestTrigger.abi,
      name: "EASAttestTrigger",
      address: "0x5f77b7bb7f6dBe64Fc6b457Cc5e67D7fc2295a44",
    },
    {
      abi: ABI.ENOVA.abi,
      name: "ENOVA",
      address: "0xe4448b59D3195E93954FF3c65652a6b19b57dc53",
    },
    {
      abi: ABI.MerkleGov.abi,
      name: "MerkleGov",
      address: "0xb9635ae3AAFD965271320382226C03196c26f386",
    },
    {
      abi: ABI.MerkleVote.abi,
      name: "MerkleVote",
      address: "0x1cf5b1c032eEB3dcbA0c46809A4B29cA78A04ab8",
    },
  ],
});
