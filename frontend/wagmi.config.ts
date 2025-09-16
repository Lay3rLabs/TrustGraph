import { defineConfig } from '@wagmi/cli'

// ABIs for all contracts by name.
const ABI = {
  ConditionalTokens: require('../out/ConditionalTokens.sol/ConditionalTokens.json'),
  EAS: require('../out/EAS.sol/EAS.json'),
  EASAttestTrigger: require('../out/EASAttestTrigger.sol/EASAttestTrigger.json'),
  EASIndexerResolver: require('../out/EASIndexerResolver.sol/EASIndexerResolver.json'),
  ENOVA: require('../out/ENOVA.sol/ENOVA.json'),
  GnosisSafe: require('../out/GnosisSafe.sol/GnosisSafe.json'),
  GnosisSafeProxy: require('../out/GnosisSafeProxy.sol/GnosisSafeProxy.json'),
  LMSRMarketMaker: require('../out/LMSRMarketMaker.sol/LMSRMarketMaker.json'),
  MerkleGovModule: require('../out/MerkleGovModule.sol/MerkleGovModule.json'),
  MerkleSnapshot: require('../out/MerkleSnapshot.sol/MerkleSnapshot.json'),
  MockUSDC: require('../out/MockUSDC.sol/MockUSDC.json'),
  PredictionMarketFactory: require('../out/PredictionMarketFactory.sol/PredictionMarketFactory.json'),
  PredictionMarketOracleController: require('../out/PredictionMarketOracleController.sol/PredictionMarketOracleController.json'),
  RewardDistributor: require('../out/RewardDistributor.sol/RewardDistributor.json'),
  SchemaRegistrar: require('../out/SchemaRegistrar.sol/SchemaRegistrar.json'),
  SchemaRegistry: require('../out/SchemaRegistry.sol/SchemaRegistry.json'),
  SignerManagerModule: require('../out/SignerManagerModule.sol/SignerManagerModule.json'),
  WavsAttester: require('../out/WavsAttester.sol/WavsAttester.json'),
  WavsIndexer: require('../out/WavsIndexer.sol/WavsIndexer.json'),
}

export default defineConfig({
  out: 'lib/contracts.ts',
  contracts: [
    {
      abi: ABI.ConditionalTokens.abi,
      name: 'ConditionalTokens',
      address: '0x00AE47eCB1cfD649A56524803046d65E1a6aE144',
    },
    {
      abi: ABI.EAS.abi,
      name: 'EAS',
      address: '0xb843B54299cdE4F17163755F15e346D2Ac8B7755',
    },
    {
      abi: ABI.EASAttestTrigger.abi,
      name: 'EASAttestTrigger',
      address: '0xcB007F24B678f834d5522810B71a9462a530b069',
    },
    {
      abi: ABI.EASIndexerResolver.abi,
      name: 'EASIndexerResolver',
      address: '0x96C02fD4Aa61B3c0B7dfb3920c58F11ae7aaa70b',
    },
    {
      abi: ABI.ENOVA.abi,
      name: 'ENOVA',
      address: '0x85c5bBdc7851008A81Cf69F2746FB1a2B4D42Dc1',
    },
    {
      abi: ABI.GnosisSafe.abi,
      name: 'GnosisSafe',
      address: '0x6F116217D579d6C2083c8b4b3b3Fa3793C9bdA63',
    },
    {
      abi: ABI.GnosisSafeProxy.abi,
      name: 'GnosisSafeProxy',
      address: '0x6d4803702717d2c4A26d39e2E37899e5C0d835A1',
    },
    {
      abi: ABI.LMSRMarketMaker.abi,
      name: 'LMSRMarketMaker',
      address: '0x6d77fdef6A4CF609eE896576799DD5e21F47aDa0',
    },
    {
      abi: ABI.MerkleGovModule.abi,
      name: 'MerkleGovModule',
      address: '0x2aD5388ddab515135aD92D6bc541F89E8ca5d216',
    },
    {
      abi: ABI.MerkleSnapshot.abi,
      name: 'MerkleSnapshot',
      address: '0x8b81A65C9F3836e4B47cc1407F4A378Df081c9dD',
    },
    {
      abi: ABI.MockUSDC.abi,
      name: 'MockUSDC',
      address: '0xFFdf48b65f05912F49C25d5Ba3F8ff713a6cA38f',
    },
    {
      abi: ABI.PredictionMarketFactory.abi,
      name: 'PredictionMarketFactory',
      address: '0x10cE180b852f76402c2ee4659ba76BdCA76D396E',
    },
    {
      abi: ABI.PredictionMarketOracleController.abi,
      name: 'PredictionMarketOracleController',
      address: '0xc5e5Dc36CAC05A7a1714641510fF38A0D8e07d9F',
    },
    {
      abi: ABI.RewardDistributor.abi,
      name: 'RewardDistributor',
      address: '0xD339Bd2f36d11ab1AC1e8fEa75dC1a960cD76412',
    },
    {
      abi: ABI.SchemaRegistrar.abi,
      name: 'SchemaRegistrar',
      address: '0xc9ba4b93150d0B45C7076A38100355221Bdb74fF',
    },
    {
      abi: ABI.SchemaRegistry.abi,
      name: 'SchemaRegistry',
      address: '0xf195b0FC49CD817A046727c1435c4c87ba2cc4dD',
    },
    {
      abi: ABI.SignerManagerModule.abi,
      name: 'SignerManagerModule',
      address: '0x6678912260482E5bce9bdDD9659b7F06Fabed6b8',
    },
    {
      abi: ABI.WavsAttester.abi,
      name: 'WavsAttester',
      address: '0x409A6b3e3DfE4b761c6F11F7d83493C220f3AB7C',
    },
    {
      abi: ABI.WavsIndexer.abi,
      name: 'WavsIndexer',
      address: '0x56B669DB0E74dD1213930AA761C6233f95BFdF85',
    },
  ],
})
