import { defineConfig } from '@wagmi/cli'

// ABIs for Safe + Custom Zodiac modules + Prediction market contracts.
const ABI = {
  Attester: require('../out/Attester.sol/Attester.json'),
  EAS: require('../out/EAS.sol/EAS.json'),
  SchemaRegistry: require('../out/SchemaRegistry.sol/SchemaRegistry.json'),
  SchemaRegistrar: require('../out/SchemaRegistrar.sol/SchemaRegistrar.json'),
  Indexer: require('../out/Indexer.sol/Indexer.json'),
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
  UniversalIndexer: require('../out/UniversalIndexer.sol/UniversalIndexer.json'),
}

export default defineConfig({
  out: 'lib/contracts.ts',
  contracts: [
    {
      abi: ABI.Attester.abi,
      name: 'Attester',
      address: '0x08DD289a764cd99a5e812B9A484363F0430D4130',
    },
    {
      abi: ABI.EAS.abi,
      name: 'EAS',
      address: '0x7A88C248E42Df150d4EEb4625f7DaCB8C601da13',
    },
    {
      abi: ABI.SchemaRegistry.abi,
      name: 'SchemaRegistry',
      address: '0x2fe93fea97C06a9B7498918389B710147Cf774C3',
    },
    {
      abi: ABI.SchemaRegistrar.abi,
      name: 'SchemaRegistrar',
      address: '0x6b5372567637057BbBf61883038f77593C1D4Aa1',
    },
    {
      abi: ABI.Indexer.abi,
      name: 'Indexer',
      address: '0x69F78115d210b871b87836023e71d67eFBcbCcF5',
    },
    {
      abi: ABI.EASIndexerResolver.abi,
      name: 'EASIndexerResolver',
      address: '0x47D764D81ecF7732F3a12255200C00f404663E6B',
    },
    {
      abi: ABI.RewardDistributor.abi,
      name: 'RewardDistributor',
      address: '0x981893D30E3DfE8Acd4D76B211A097d20c4AD58a',
    },
    {
      abi: ABI.EASAttestTrigger.abi,
      name: 'EASAttestTrigger',
      address: '0x5552a057A5C848212Ff8950557202B6665ec9a48',
    },
    {
      abi: ABI.ENOVA.abi,
      name: 'ENOVA',
      address: '0x8feBfCd5dA77584b92e7b6bd121C2C92e039eD2e',
    },
    {
      abi: ABI.GnosisSafe.abi,
      name: 'GnosisSafe',
      address: '0xcb0dc4fb68515dd5368e35bc96187b02f05c7a51',
    },
    {
      abi: ABI.GnosisSafeProxy.abi,
      name: 'GnosisSafeProxy',
      address: '0x27667e350b3ad80510cedc0667684501ceb0eba6',
    },
    {
      abi: ABI.PredictionMarketOracleController.abi,
      name: 'PredictionMarketOracleController',
      address: '0xbC539E727B2a0Ad3aa0AEC34834f853D60F3Bb76',
    },
    {
      abi: ABI.MarketMaker.abi,
      name: 'MarketMaker',
      // Address will be updated by deployment script
    },
    {
      abi: ABI.MerkleGovModule.abi,
      name: 'MerkleGovModule',
      address: '0x74478615df4f3569ffbc8f262e6a8d30f9637e71',
    },
    {
      abi: ABI.SignerManagerModule.abi,
      name: 'SignerManagerModule',
      address: '0x325cb85430ce8aaf2c2da5fdf6b2145d439ed112',
    },
    {
      abi: ABI.ConditionalTokens.abi,
      name: 'ConditionalTokens',
      address: '0xc9f272b19ecE7b232634e2fDcdc92f444631793e',
    },
    {
      abi: ABI.LMSRMarketMaker.abi,
      name: 'LMSRMarketMaker',
      address: '0xDF4982D968621BDed20497E5242De7CC5a74AE87',
    },
    {
      abi: ABI.PredictionMarketFactory.abi,
      name: 'PredictionMarketFactory',
      address: '0x2c97Dd3BCA2D4B783cdc478287190d3BD5530334',
    },
    {
      abi: ABI.MockUSDC.abi,
      name: 'MockUSDC',
      address: '0x5BCd2c1BC46d34bd2CCFBa339c5DA208A1Bc9981',
    },
    {
      abi: ABI.UniversalIndexer.abi,
      name: 'UniversalIndexer',
      address: '0x4630929F816457cCD292C2788AcABE549b04DBC5',
    },
  ],
})
