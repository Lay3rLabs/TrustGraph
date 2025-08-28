import { defineConfig } from '@wagmi/cli'

// ABIs for Safe + Custom Zodiac modules + Prediction market contracts.
const ABI = {
  Attester: require('../out/Attester.sol/Attester.json'),
  EAS: require('../out/EAS.sol/EAS.json'),
  SchemaRegistry: require('../out/SchemaRegistry.sol/SchemaRegistry.json'),
  SchemaRegistrar: require('../out/SchemaRegistrar.sol/SchemaRegistrar.json'),
  Indexer: require('../out/Indexer.sol/Indexer.json'),
  IndexerResolver: require('../out/IndexerResolver.sol/IndexerResolver.json'),
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
  POAServiceManager: require('../out/POAServiceManager.sol/POAServiceManager.json'),
}

export default defineConfig({
  out: 'lib/contracts.ts',
  contracts: [
    {
      abi: ABI.Attester.abi,
      name: 'Attester',
      address: '0xE4BEB949C46562F8b72B6e0799B9061aA427823D',
    },
    {
      abi: ABI.EAS.abi,
      name: 'EAS',
      address: '0x8b1D01f104d5990d6E8F8a5495Ae5952110286E7',
    },
    {
      abi: ABI.SchemaRegistry.abi,
      name: 'SchemaRegistry',
      address: '0xc64429216EcF8c8A7D81f99591C358cCCd0D60A2',
    },
    {
      abi: ABI.SchemaRegistrar.abi,
      name: 'SchemaRegistrar',
      address: '0x2e48BDDbc0f4E7c67179Ae89665DC16d90962d2f',
    },
    {
      abi: ABI.Indexer.abi,
      name: 'Indexer',
      address: '0xcbF7B987f609E4A1615898436bAD3EAEC9248896',
    },
    {
      abi: ABI.IndexerResolver.abi,
      name: 'IndexerResolver',
      address: '0xeC20aD59024FDADdFf86b9Ea014D7d18a1cB7d9f',
    },
    {
      abi: ABI.RewardDistributor.abi,
      name: 'RewardDistributor',
      address: '0xbE446b88B5d3a0A95ce7eFfA1Ed285c5bC0A7807',
    },
    {
      abi: ABI.EASAttestTrigger.abi,
      name: 'EASAttestTrigger',
      address: '0x1052A8b93A5A86bBC6629bf246967312392eDaaA',
    },
    {
      abi: ABI.ENOVA.abi,
      name: 'ENOVA',
      address: '0x206b81eac63bd15EBeBBbCE815eF2649657F1DEf',
    },
    {
      abi: ABI.GnosisSafe.abi,
      name: 'GnosisSafe',
      address: '0xfb7a679c3769b557feaef485813d9d7ba05774fc',
    },
    {
      abi: ABI.GnosisSafeProxy.abi,
      name: 'GnosisSafeProxy',
      address: '0x8ac08e6f7f2bca8ec871d5465b55f136285726b2',
    },
    {
      abi: ABI.PredictionMarketOracleController.abi,
      name: 'PredictionMarketOracleController',
      address: '0xbA7Ef3f0e6C29DDD89DE7aD66C1246E424196Ce9',
    },
    {
      abi: ABI.MarketMaker.abi,
      name: 'MarketMaker',
      // Address will be updated by deployment script
    },
    {
      abi: ABI.MerkleGovModule.abi,
      name: 'MerkleGovModule',
      address: '0xc4ec9a461d492f2395a14ab56c7a1ceac0deaeaa',
    },
    {
      abi: ABI.SignerManagerModule.abi,
      name: 'SignerManagerModule',
      address: '0xe1ec7a9b142cc022ddb2593e3c964bcf2a2324b4',
    },
    {
      abi: ABI.ConditionalTokens.abi,
      name: 'ConditionalTokens',
      address: '0x6FDC36a3af61D7B802539DCc8e01573AF9A9b3d5',
    },
    {
      abi: ABI.LMSRMarketMaker.abi,
      name: 'LMSRMarketMaker',
      address: '0xe5bbBe8c9E023a3F5239a85dd567EDbb36CbEa54',
    },
    {
      abi: ABI.PredictionMarketFactory.abi,
      name: 'PredictionMarketFactory',
      address: '0xFa05583d3EeCB0b73Fa32633B62adB84c894d98E',
    },
    {
      abi: ABI.MockUSDC.abi,
      name: 'MockUSDC',
      address: '0x18e52196CE0b2412AeE0D6cd65713D22f48C3D53',
    },
    {
      abi: ABI.POAServiceManager.abi,
      name: 'POAServiceManager',
      address: '0xbEF2A1d6b526718C2e90109B3FA314e1BADD9d58',
    },
  ],
})
