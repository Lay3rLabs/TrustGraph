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
      address: '0xd9cce8a45c142f23a8266b3a52835288a9f67db2',
    },
    {
      abi: ABI.EAS.abi,
      name: 'EAS',
      address: '0x136f845f7a9cebe70ace9841f986ebd5b49e5de1',
    },
    {
      abi: ABI.SchemaRegistry.abi,
      name: 'SchemaRegistry',
      address: '0x5bce9f9675c18fd27cdf51ffe1bae0439d4c5601',
    },
    {
      abi: ABI.SchemaRegistrar.abi,
      name: 'SchemaRegistrar',
      address: '0x88a24ec6f8235ded92377fa787c95b636c97aa5a',
    },
    {
      abi: ABI.Indexer.abi,
      name: 'Indexer',
      address: '0x8af971c9a116e8d77e1aa5552cf0963cd92fb18f',
    },
    {
      abi: ABI.IndexerResolver.abi,
      name: 'IndexerResolver',
      address: '0x0d516b0624659a53c6734119fba34311c02d9335',
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
      address: '0x399b01ca86bbb49f597f6129a1fd4b48c6f03c90',
    },
  ],
});