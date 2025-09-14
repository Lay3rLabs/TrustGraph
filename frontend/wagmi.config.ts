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
      address: '0x10fa1Bd26682EBb102347fE74BEc50a2956fB47E',
    },
    {
      abi: ABI.EAS.abi,
      name: 'EAS',
      address: '0xBc529F023B23312c156d886b7Dd5e0668f2809a9',
    },
    {
      abi: ABI.SchemaRegistry.abi,
      name: 'SchemaRegistry',
      address: '0x08eD52Ada6cb08E9BB2f110E7C454CCBC7254463',
    },
    {
      abi: ABI.SchemaRegistrar.abi,
      name: 'SchemaRegistrar',
      address: '0x75dDe7fb0525373ed7c68aD036fd8fE85128cD62',
    },
    {
      abi: ABI.EASIndexerResolver.abi,
      name: 'EASIndexerResolver',
      address: '0x01Df147fb8C2981ffEaA272308d77972D0F0fD22',
    },
    {
      abi: ABI.MerkleSnapshot.abi,
      name: 'MerkleSnapshot',
      address: '0x04C0F57e805E8098F1b97177e90c0621393A5395',
    },
    {
      abi: ABI.RewardDistributor.abi,
      name: 'RewardDistributor',
      address: '0x745b5550f39c76d3983f5f98CDfF4022CFeBF689',
    },
    {
      abi: ABI.EASAttestTrigger.abi,
      name: 'EASAttestTrigger',
      address: '0x7CC9F77370B1abbF01398C9618249649c076F28b',
    },
    {
      abi: ABI.ENOVA.abi,
      name: 'ENOVA',
      address: '0x4D87e9B182E45dcEbB8e85c80e9DadE644151147',
    },
    {
      abi: ABI.GnosisSafe.abi,
      name: 'GnosisSafe',
      address: '0x7391755720a71d8ef3cf443238b3f92eb6965e01',
    },
    {
      abi: ABI.GnosisSafeProxy.abi,
      name: 'GnosisSafeProxy',
      address: '0x767f173ceb7277691a45285fc7e230f328c1baa9',
    },
    {
      abi: ABI.PredictionMarketOracleController.abi,
      name: 'PredictionMarketOracleController',
      address: '0x1675c6dede3D381E4cA63dCF7Da43205A07f23ff',
    },
    {
      abi: ABI.MarketMaker.abi,
      name: 'MarketMaker',
      // Address will be updated by deployment script
    },
    {
      abi: ABI.MerkleGovModule.abi,
      name: 'MerkleGovModule',
      address: '0x51092fb53317cfc2310deb51b0f2b347db6e0e19',
    },
    {
      abi: ABI.SignerManagerModule.abi,
      name: 'SignerManagerModule',
      address: '0x73db14e5b48e8ee2ce6c754432b164bde45cae28',
    },
    {
      abi: ABI.ConditionalTokens.abi,
      name: 'ConditionalTokens',
      address: '0xB84b0E1FdDC347E10123ea2158B127BFB58fa06F',
    },
    {
      abi: ABI.LMSRMarketMaker.abi,
      name: 'LMSRMarketMaker',
      address: '0xd486Cd623f9C4c1E6e88F5A1999B05EE3604DCcc',
    },
    {
      abi: ABI.PredictionMarketFactory.abi,
      name: 'PredictionMarketFactory',
      address: '0x785ef2aD4F047730A71b2c81c541eF8A14a96F51',
    },
    {
      abi: ABI.MockUSDC.abi,
      name: 'MockUSDC',
      address: '0xC8D27E636F7A94B7044C486Db0619f6f39887604',
    },
    {
      abi: ABI.WavsIndexer.abi,
      name: 'WavsIndexer',
      address: '0x4C4a5b5D6aCD14Acc0a9E6647D6Fc9E3053C6127',
    },
  ],
})
