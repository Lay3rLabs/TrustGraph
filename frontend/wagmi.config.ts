import { defineConfig } from '@wagmi/cli'

// ABIs for Safe + Custom Zodiac modules + Prediction market contracts.
const ABI = {
  Attester: require('../out/Attester.sol/Attester.json'),
  EAS: require('../out/EAS.sol/EAS.json'),
  SchemaRegistry: require('../out/SchemaRegistry.sol/SchemaRegistry.json'),
  SchemaRegistrar: require('../out/SchemaRegistrar.sol/SchemaRegistrar.json'),
  EASIndexerResolver: require('../out/EASIndexerResolver.sol/EASIndexerResolver.json'),
  RewardDistributor: require('../out/RewardDistributor.sol/RewardDistributor.json'),
  EASAttestTrigger: require('../out/Trigger.sol/EASAttestTrigger.json'),
  ENOVA: require('../out/ERC20.sol/ENOVA.json'),
  GnosisSafe: require('../out/GnosisSafe.sol/GnosisSafe.json'),
  GnosisSafeProxy: require('../out/GnosisSafeProxy.sol/GnosisSafeProxy.json'),
  PredictionMarketOracleController: require('../out/PredictionMarketOracleController.sol/PredictionMarketOracleController.json'),
  MarketMaker: require('../out/MarketMaker.sol/MarketMaker.json'),
  MerkleGovModule: require('../out/MerkleGovModule.sol/MerkleGovModule.json'),
  SignerManagerModule: require('../out/SignerManagerModule.sol/SignerManagerModule.json'),
  ConditionalTokens: require('../out/ConditionalTokens.sol/ConditionalTokens.json'),
  LMSRMarketMaker: require('../out/LMSRMarketMaker.sol/LMSRMarketMaker.json'),
  PredictionMarketFactory: require('../out/PredictionMarketFactory.sol/PredictionMarketFactory.json'),
  MockUSDC: require('../out/MockUSDC.sol/MockUSDC.json'),
  WavsIndexer: require('../out/WavsIndexer.sol/WavsIndexer.json'),
}

export default defineConfig({
  out: 'lib/contracts.ts',
  contracts: [
    {
      abi: ABI.Attester.abi,
      name: 'Attester',
      address: '0xce7EfFf09c46db4e6a51619492edAce74D866ad7',
    },
    {
      abi: ABI.EAS.abi,
      name: 'EAS',
      address: '0x4f4E2B6b5579919Ef98c35b27d14E43fa1002bc2',
    },
    {
      abi: ABI.SchemaRegistry.abi,
      name: 'SchemaRegistry',
      address: '0xf48e5cbe0f6F414c282c4DB08218DCA1A8Cf6dA6',
    },
    {
      abi: ABI.SchemaRegistrar.abi,
      name: 'SchemaRegistrar',
      address: '0x71914A72d5DcAaaFD74CB02C22DaE9DD79A88D37',
    },
    {
      abi: ABI.EASIndexerResolver.abi,
      name: 'EASIndexerResolver',
      address: '0x469F0BE1649F99DEFDbd6E5D346Ec89de588f298',
    },
    {
      abi: ABI.RewardDistributor.abi,
      name: 'RewardDistributor',
      address: '0x96C08A459659A3Ab335e2Eb4F2dBbEBfE748a433',
    },
    {
      abi: ABI.EASAttestTrigger.abi,
      name: 'EASAttestTrigger',
      address: '0xc1f0AED7fFC79E94D5eEd3e1fDA799a9D58a1551',
    },
    {
      abi: ABI.ENOVA.abi,
      name: 'ENOVA',
      address: '0x876aD9F6CEFd00080D82d26200a225Fda7f1dc54',
    },
    {
      abi: ABI.GnosisSafe.abi,
      name: 'GnosisSafe',
      address: '0x9189c1da9aca140c961683423c458491eb79a182',
    },
    {
      abi: ABI.GnosisSafeProxy.abi,
      name: 'GnosisSafeProxy',
      address: '0x1cf1df3e9e4ffc60a42d0d79202a3c92faeb0163',
    },
    {
      abi: ABI.PredictionMarketOracleController.abi,
      name: 'PredictionMarketOracleController',
      address: '0xc1971Fc57986169f8CE00c5d0AcC6fAE85BA7c7e',
    },
    {
      abi: ABI.MarketMaker.abi,
      name: 'MarketMaker',
      // Address will be updated by deployment script
    },
    {
      abi: ABI.MerkleGovModule.abi,
      name: 'MerkleGovModule',
      address: '0x9c01c09fb0a647606f97fac9141290532e0fbc33',
    },
    {
      abi: ABI.SignerManagerModule.abi,
      name: 'SignerManagerModule',
      address: '0x7968370f2a5d8fa8f830eafde1320fe27608b6e7',
    },
    {
      abi: ABI.ConditionalTokens.abi,
      name: 'ConditionalTokens',
      address: '0x610CAC87aC087E0e1173D163D1982BCb15850Fa9',
    },
    {
      abi: ABI.LMSRMarketMaker.abi,
      name: 'LMSRMarketMaker',
      address: '0x7B8319EAcebcAe6b0b5d857e80136333212B9062',
    },
    {
      abi: ABI.PredictionMarketFactory.abi,
      name: 'PredictionMarketFactory',
      address: '0xDae6404a03Fa9E6c2dF9B38B6e619321631eF898',
    },
    {
      abi: ABI.MockUSDC.abi,
      name: 'MockUSDC',
      address: '0xAc29EeE8f2EEA6Ef38686D21275CB13B6B6Ad13D',
    },
    {
      abi: ABI.WavsIndexer.abi,
      name: 'WavsIndexer',
      address: '0xA22dF78A7B33f5942Dc2EF3B99970eFB5d1dC3D9',
    },
  ],
})