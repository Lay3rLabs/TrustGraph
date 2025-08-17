import { defineConfig } from '@wagmi/cli';

const ABI = {
  Attester: require('../out/Attester.sol/Attester.json'),
  EAS: require('../out/EAS.sol/EAS.json'),
  SchemaRegistry: require('../out/SchemaRegistry.sol/SchemaRegistry.json'),
  SchemaRegistrar: require('../out/SchemaRegistrar.sol/SchemaRegistrar.json'),
  Indexer: require('../out/Indexer.sol/Indexer.json'),
  IndexerResolver: require('../out/IndexerResolver.sol/IndexerResolver.json'),
  VotingPower: require('../out/VotingPower.sol/VotingPower.json'),
  AttestationGovernor: require('../out/Governor.sol/AttestationGovernor.json'),
  RewardDistributor: require('../out/RewardDistributor.sol/RewardDistributor.json'),
  EASAttestTrigger: require('../out/Trigger.sol/EASAttestTrigger.json'),
};

export default defineConfig({
  out: 'lib/contracts.ts',
  contracts: [
    {
      abi: ABI.Attester.abi,
      name: 'Attester',
      address: '0x6b5bbefe4d78ecda1c29d5978a1aef6ba4393879',
    },
    {
      abi: ABI.EAS.abi,
      name: 'EAS',
      address: '0x3cbe968adcd5033e5704cebb807f262492e264bb',
    },
    {
      abi: ABI.SchemaRegistry.abi,
      name: 'SchemaRegistry',
      address: '0xdcd1173e9d1e6fc6006fad7bed80c8c9607c9b9e',
    },
    {
      abi: ABI.SchemaRegistrar.abi,
      name: 'SchemaRegistrar',
      address: '0xe7f26edb3b9ab77ce52954b066086b1a7d385c3b',
    },
    {
      abi: ABI.Indexer.abi,
      name: 'Indexer',
      address: '0x80a8bf845022927b11137065034afaa96dc61937',
    },
    {
      abi: ABI.IndexerResolver.abi,
      name: 'IndexerResolver',
      address: '0x3d591d974df59eb4976624ca9efdf9834e4f044a',
    },
    {
      abi: ABI.VotingPower.abi,
      name: 'VotingPower',
      // Address will be added when contract is deployed
    },
    {
      abi: ABI.AttestationGovernor.abi,
      name: 'AttestationGovernor',
      // Address will be added when contract is deployed
    },
    {
      abi: ABI.RewardDistributor.abi,
      name: 'RewardDistributor',
      // Address will be added when contract is deployed
    },
    {
      abi: ABI.EASAttestTrigger.abi,
      name: 'EASAttestTrigger',
      address: '0x17fd747b6dfd3688d7b442c3bde045b85d56bb85',
    },
  ],
});