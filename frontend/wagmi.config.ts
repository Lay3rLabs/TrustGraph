import { defineConfig } from '@wagmi/cli'

// ABIs for Safe + Custom Zodiac modules + Prediction market contracts.
const ABI = {
  WavsAttester: require('../out/WavsAttester.sol/WavsAttester.json'),
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
      abi: ABI.WavsAttester.abi,
      name: 'WavsAttester',
      address: '0xaaBFb4E7BAcdD82Acb10fBBe400431c30c2B41d6',
    },
    {
      abi: ABI.EAS.abi,
      name: 'EAS',
      address: '0xA29138e31094d32b4E5A915819C6A2CE63A958C7',
    },
    {
      abi: ABI.SchemaRegistry.abi,
      name: 'SchemaRegistry',
      address: '0x5DF644Af410dC5af3aBcA34269e1fA147171A335',
    },
    {
      abi: ABI.SchemaRegistrar.abi,
      name: 'SchemaRegistrar',
      address: '0xB62E8D0235C29aA24723147E6fAAB721e51Ff350',
    },
    {
      abi: ABI.EASIndexerResolver.abi,
      name: 'EASIndexerResolver',
      address: '0x8DD41455E5130CbA52f7F2F41cC030fB84BcC160',
    },
    {
      abi: ABI.RewardDistributor.abi,
      name: 'RewardDistributor',
      address: '0x443e8D34f0A3Ca0bC01f5666ee590Ce04D6C1C4A',
    },
    {
      abi: ABI.EASAttestTrigger.abi,
      name: 'EASAttestTrigger',
      address: '0x30eBcaE5339051CAbf9e1a460E36e0901631988C',
    },
    {
      abi: ABI.ENOVA.abi,
      name: 'ENOVA',
      address: '0xC65875550Cd4e0A4AE654eF65888Fea6E14ab957',
    },
    {
      abi: ABI.GnosisSafe.abi,
      name: 'GnosisSafe',
      address: '0x8b3ed4d2fe5d2e71cdbc271b6cfc2a89060e34c9',
    },
    {
      abi: ABI.GnosisSafeProxy.abi,
      name: 'GnosisSafeProxy',
      address: '0xddd2073e7ed1975798807f67642da2928626a369',
    },
    {
      abi: ABI.PredictionMarketOracleController.abi,
      name: 'PredictionMarketOracleController',
      address: '0x4aE3df4393EA538E29BC1b211eEF5DA7e0f0ebC7',
    },
    {
      abi: ABI.MarketMaker.abi,
      name: 'MarketMaker',
      // Address will be updated by deployment script
    },
    {
      abi: ABI.MerkleGovModule.abi,
      name: 'MerkleGovModule',
      address: '0x8829ea7489d9f394b5a92418b9d8bdc8a38fb0de',
    },
    {
      abi: ABI.SignerManagerModule.abi,
      name: 'SignerManagerModule',
      address: '0x39ec3c454e1c41454941e74e43e8790f3a0f68df',
    },
    {
      abi: ABI.ConditionalTokens.abi,
      name: 'ConditionalTokens',
      address: '0x3674434f08c1D81639365eA8E4c703271De86382',
    },
    {
      abi: ABI.LMSRMarketMaker.abi,
      name: 'LMSRMarketMaker',
      address: '0x558F04FF496f9622B8f55154Fe09ba0cb63B6e49',
    },
    {
      abi: ABI.PredictionMarketFactory.abi,
      name: 'PredictionMarketFactory',
      address: '0xC960b1A96F64B500Ed96bA5903BCa817eD91A61E',
    },
    {
      abi: ABI.MockUSDC.abi,
      name: 'MockUSDC',
      address: '0xbFeE8C96dD47f87f8885c71fF33332747542B80D',
    },
    {
      abi: ABI.WavsIndexer.abi,
      name: 'WavsIndexer',
      address: '0xAFabD93fC6e666c0da32Da517CE3229E82B517fb',
    },
  ],
})
