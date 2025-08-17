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
};

export default defineConfig({
  out: "lib/contracts.ts",
  contracts: [
    {
      abi: ABI.Attester.abi,
      name: "Attester",
      address: "0x69eDEE6683583058252AeA92D3713a03CF45fBE1",
    },
    {
      abi: ABI.EAS.abi,
      name: "EAS",
      address: "0x2B385B9586C8C3197A7aeE6bFF5e54d50820D052",
    },
    {
      abi: ABI.SchemaRegistry.abi,
      name: "SchemaRegistry",
      address: "0x3e6d666732fB3b118491D9437A0dfE18c0bAAa58",
    },
    {
      abi: ABI.SchemaRegistrar.abi,
      name: "SchemaRegistrar",
      address: "0x12A1636F80fe7264C994049Ab837d0FF91992341",
    },
    {
      abi: ABI.Indexer.abi,
      name: "Indexer",
      address: "0xDf225e4896dDD6A4de7136dB624Bf4421f7Dc38E",
    },
    {
      abi: ABI.IndexerResolver.abi,
      name: "IndexerResolver",
      address: "0x45Dd4b55C72554bc45538607ee0643260F4D8AE6",
    },
    {
      abi: ABI.VotingPower.abi,
      name: "VotingPower",
      address: "0x0e22d2f5e13fCdD9A399dA75D3e4100faF474Efb",
    },
    {
      abi: ABI.AttestationGovernor.abi,
      name: "AttestationGovernor",
      address: "0x2950f3e3af4563FdEF495e40ef4A10A25Bd01BFb",
    },
    {
      abi: ABI.RewardDistributor.abi,
      name: "RewardDistributor",
      address: "0x4729B1774a001694bf4C8A0ce5a4B31A9491abC9",
    },
    {
      abi: ABI.EASAttestTrigger.abi,
      name: "EASAttestTrigger",
      address: "0x70555EF2dE3438bC0b1a61f4e4f2F7054d653b51",
    },
    {
      abi: ABI.ENOVA.abi,
      name: "ENOVA",
      address: "0xe4448b59D3195E93954FF3c65652a6b19b57dc53",
    },
  ],
});
