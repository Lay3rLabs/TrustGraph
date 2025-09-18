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
      address: '0xF8AA95f59bB5890B9B7491D383f2C545a9bfc536',
    },
    {
      abi: ABI.EAS.abi,
      name: 'EAS',
      address: '0x6E2BFc74533308393105E68E7f2e4b8d220212fC',
    },
    {
      abi: ABI.EASAttestTrigger.abi,
      name: 'EASAttestTrigger',
      address: '0x7DF9DE36f516f1e338468d0B21Ca8322d2D277C2',
    },
    {
      abi: ABI.EASIndexerResolver.abi,
      name: 'EASIndexerResolver',
      address: '0xf15dE94461cCbCe5a7a9d9beA482e95BB8881034',
    },
    {
      abi: ABI.ENOVA.abi,
      name: 'ENOVA',
      address: '0x4f64929f2D3e6BffBAe117B7101200C977D48b42',
    },
    {
      abi: ABI.GnosisSafe.abi,
      name: 'GnosisSafe',
      address: '0xA322C8408FD5461F3eC7A43e9Ecd6FCb6Ffd3dbA',
    },
    {
      abi: ABI.GnosisSafeProxy.abi,
      name: 'GnosisSafeProxy',
      address: '0x0c8dC33352c567962381Eb840ad6A7AE4A535c6D',
    },
    {
      abi: ABI.LMSRMarketMaker.abi,
      name: 'LMSRMarketMaker',
      address: '0x3F4CfA02ee393a12c071b264004f937B1E4eA158',
    },
    {
      abi: ABI.MerkleGovModule.abi,
      name: 'MerkleGovModule',
      address: '0x891375cB8343395D583f97c65A78C0A15B7b6ed1',
    },
    {
      abi: ABI.MerkleSnapshot.abi,
      name: 'MerkleSnapshot',
      address: '0x055B7b92C745845d4aAC901Ad493Cc21D27E547e',
    },
    {
      abi: ABI.MockUSDC.abi,
      name: 'MockUSDC',
      address: '0xe736DAb01f3Dc61b480B2203E0F579e96a1Df567',
    },
    {
      abi: ABI.PredictionMarketFactory.abi,
      name: 'PredictionMarketFactory',
      address: '0xaDfF6cDEFCC97fEA6040551C99b5873Ae63398F5',
    },
    {
      abi: ABI.PredictionMarketOracleController.abi,
      name: 'PredictionMarketOracleController',
      address: '0x9e816E5cBb2c0A01a7B654032dBaB618aD9027FE',
    },
    {
      abi: ABI.RewardDistributor.abi,
      name: 'RewardDistributor',
      address: '0x6284BaF2042e9D4DeD70f2070a4C40ed3c51dA49',
    },
    {
      abi: ABI.SchemaRegistrar.abi,
      name: 'SchemaRegistrar',
      address: '0xCAa42cdf28b60c9D8F088ed00f9E69537E1D1c38',
    },
    {
      abi: ABI.SchemaRegistry.abi,
      name: 'SchemaRegistry',
      address: '0xe4cF1b2346DFAc115ceb8Cf0Fec241614f46BB87',
    },
    {
      abi: ABI.SignerManagerModule.abi,
      name: 'SignerManagerModule',
      address: '0x2F6C1E1E72De2d4BFD8a8152B5c9e8d3631888f6',
    },
    {
      abi: ABI.WavsAttester.abi,
      name: 'WavsAttester',
      address: '0xFfD8e1B80b64b03d0C6da9EDc83C8Fc651e164dE',
    },
    {
      abi: ABI.WavsIndexer.abi,
      name: 'WavsIndexer',
      address: '0x7d1eb157a774Ae11b5540E80a241f6E60D18364c',
    },
  ],
})
