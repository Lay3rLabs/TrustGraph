import { defineConfig } from '@wagmi/cli'

// ABIs for Safe + Custom Zodiac modules + Prediction market contracts.
const ABI = {
  WavsAttester: require('../out/WavsAttester.sol/WavsAttester.json'),
  EAS: require('../out/EAS.sol/EAS.json'),
  SchemaRegistry: require('../out/SchemaRegistry.sol/SchemaRegistry.json'),
  SchemaRegistrar: require('../out/SchemaRegistrar.sol/SchemaRegistrar.json'),
  EASIndexerResolver: require('../out/EASIndexerResolver.sol/EASIndexerResolver.json'),
  MerkleSnapshot: require('../out/MerkleSnapshot.sol/MerkleSnapshot.json'),
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
      abi: ABI.WavsAttester.abi,
      name: 'WavsAttester',
      address: '0xD4fBaDC5e07B8E7418025c52C8E978F8f04FDc5C',
    },
    {
      abi: ABI.EAS.abi,
      name: 'EAS',
      address: '0xdb3B3641f2Be57D8B60EffE6f3D9f37E30FD73AA',
    },
    {
      abi: ABI.SchemaRegistry.abi,
      name: 'SchemaRegistry',
      address: '0x2327049AFd89160F4B2AA222C92BC40C61838A3C',
    },
    {
      abi: ABI.SchemaRegistrar.abi,
      name: 'SchemaRegistrar',
      address: '0xca3EDed5c796a23340d7cb25cB807a70C7cEF890',
    },
    {
      abi: ABI.EASIndexerResolver.abi,
      name: 'EASIndexerResolver',
      address: '0x2227765cE8817d827648506E77C98FBc0352F677',
    },
    {
      abi: ABI.MerkleSnapshot.abi,
      name: 'MerkleSnapshot',
      address: '0xb4f652B22316F150F92A1a61045EaccB530aA775',
    },
    {
      abi: ABI.RewardDistributor.abi,
      name: 'RewardDistributor',
      address: '0x78b3c44dcc4F5845aD26dF1f2184a64017a51C20',
    },
    {
      abi: ABI.EASAttestTrigger.abi,
      name: 'EASAttestTrigger',
      address: '0x3A4a751eAc74d4f41e15a5e36a2f340c9bB4C448',
    },
    {
      abi: ABI.ENOVA.abi,
      name: 'ENOVA',
      address: '0x44D5260c953f275b4C6E8A6E1b6c0fa231419eA0',
    },
    {
      abi: ABI.GnosisSafe.abi,
      name: 'GnosisSafe',
      address: '0x8118e300b459e2be875c128475c49a63a4f2e124',
    },
    {
      abi: ABI.GnosisSafeProxy.abi,
      name: 'GnosisSafeProxy',
      address: '0x4f367ac68ad5af8b276f3701593d13350dc166c3',
    },
    {
      abi: ABI.PredictionMarketOracleController.abi,
      name: 'PredictionMarketOracleController',
      address: '0xE6D982b9342a420667eaDa288A840Ec4B4332cFe',
    },
    {
      abi: ABI.MarketMaker.abi,
      name: 'MarketMaker',
      // Address will be updated by deployment script
    },
    {
      abi: ABI.MerkleGovModule.abi,
      name: 'MerkleGovModule',
      address: '0xe4f1d1c5af66b3460c0fd6d9753cbe6da645857a',
    },
    {
      abi: ABI.SignerManagerModule.abi,
      name: 'SignerManagerModule',
      address: '0xcebc698b6797f2cc2d31681103eff9e7835e7cde',
    },
    {
      abi: ABI.ConditionalTokens.abi,
      name: 'ConditionalTokens',
      address: '0x7d15e0925f5DC5B3b88A78CbA86F5BbF8be1f989',
    },
    {
      abi: ABI.LMSRMarketMaker.abi,
      name: 'LMSRMarketMaker',
      address: '0x5600A0F0154F1D9bdE7685f29075DA768C9FCB8d',
    },
    {
      abi: ABI.PredictionMarketFactory.abi,
      name: 'PredictionMarketFactory',
      address: '0x57b99DA267758b88775932dD7ffEfB9DDacef49c',
    },
    {
      abi: ABI.MockUSDC.abi,
      name: 'MockUSDC',
      address: '0x8f83Efb81ace7c791cFc2Ea54e36fFfb2692eC3F',
    },
    {
      abi: ABI.WavsIndexer.abi,
      name: 'WavsIndexer',
      address: '0x81a51d19F0829C4f861210956350Aa827BDED4Da',
    },
  ],
})
