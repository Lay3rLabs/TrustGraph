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
      address: '0x1d7608DBb562F9d4bac2591D57212AE8fdC50E6D',
    },
    {
      abi: ABI.EAS.abi,
      name: 'EAS',
      address: '0xd273195a8858e276C4d4869793D0152824C56F59',
    },
    {
      abi: ABI.SchemaRegistry.abi,
      name: 'SchemaRegistry',
      address: '0xF2AECf4029436E82A1D8D6175420Dda745f3405F',
    },
    {
      abi: ABI.SchemaRegistrar.abi,
      name: 'SchemaRegistrar',
      address: '0x0E2d6d98738c37faE4a4aB3CE080B47007301EaF',
    },
    {
      abi: ABI.Indexer.abi,
      name: 'Indexer',
      address: '0x835Ea27977A6df339543852E7d4bAfa378776874',
    },
    {
      abi: ABI.IndexerResolver.abi,
      name: 'IndexerResolver',
      address: '0x8a5B9E387e91Fe3aC14c8734C22092b1b116351D',
    },
    {
      abi: ABI.RewardDistributor.abi,
      name: 'RewardDistributor',
      address: '0x3859c1AE42AfCf6C854d436D790074467186C161',
    },
    {
      abi: ABI.EASAttestTrigger.abi,
      name: 'EASAttestTrigger',
      address: '0xd192dB635DaF6a250B4e97E528170AC32e226FEb',
    },
    {
      abi: ABI.ENOVA.abi,
      name: 'ENOVA',
      address: '0x874413C13a0183066b2856D92613142b281778Cd',
    },
    {
      abi: ABI.GnosisSafe.abi,
      name: 'GnosisSafe',
      address: '0xe69bf91521b0797a4c4bb4e7a6b691e057e26077',
    },
    {
      abi: ABI.GnosisSafeProxy.abi,
      name: 'GnosisSafeProxy',
      address: '0xc74b131bcd98856fe90582e86a984ee416cc34bf',
    },
    {
      abi: ABI.PredictionMarketOracleController.abi,
      name: 'PredictionMarketOracleController',
      address: '0xBF92F4Fb7Cb7AfBd8a0F3d5E67d05EBA61af75C6',
    },
    {
      abi: ABI.MarketMaker.abi,
      name: 'MarketMaker',
      // Address will be updated by deployment script
    },
    {
      abi: ABI.MerkleGovModule.abi,
      name: 'MerkleGovModule',
      address: '0xde6a24d869d133b342b31fa59f0c4ed08ca81273',
    },
    {
      abi: ABI.SignerManagerModule.abi,
      name: 'SignerManagerModule',
      address: '0x8618ff9481d3e7be5d5b9d4c66a674e1239f95e3',
    },
    {
      abi: ABI.ConditionalTokens.abi,
      name: 'ConditionalTokens',
      address: '0x8c2034AD0630CE1D30053B976c01c312B4e246ad',
    },
    {
      abi: ABI.LMSRMarketMaker.abi,
      name: 'LMSRMarketMaker',
      address: '0x83BDA76BA9e8863C5e8FA0392a6495d418B55885',
    },
    {
      abi: ABI.PredictionMarketFactory.abi,
      name: 'PredictionMarketFactory',
      address: '0x73316564278814E36e0e755257cA2EE033f640EB',
    },
    {
      abi: ABI.MockUSDC.abi,
      name: 'MockUSDC',
      address: '0x49bF430ce5cc828F6E6477e306d7233217b8780e',
    },
    {
      abi: ABI.POAServiceManager.abi,
      name: 'POAServiceManager',
      address: '0xC7F22B0b804E14eC70b8C1679a82FA5656Af6102',
    },
  ],
})
