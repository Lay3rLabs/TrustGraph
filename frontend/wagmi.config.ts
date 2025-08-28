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
      address: '0xB41cd41D389E00544b414b9252C01964D3aA6c83',
    },
    {
      abi: ABI.EAS.abi,
      name: 'EAS',
      address: '0xefaa0372DA9363460c07D58DDbf35a547aDF8245',
    },
    {
      abi: ABI.SchemaRegistry.abi,
      name: 'SchemaRegistry',
      address: '0x09f220Af691A157afCB4b8a00682381537dA0275',
    },
    {
      abi: ABI.SchemaRegistrar.abi,
      name: 'SchemaRegistrar',
      address: '0x0DE88b0749AB7304289BA11AA547A0a52b752959',
    },
    {
      abi: ABI.Indexer.abi,
      name: 'Indexer',
      address: '0x69F78115d210b871b87836023e71d67eFBcbCcF5',
    },
    {
      abi: ABI.EASIndexerResolver.abi,
      name: 'EASIndexerResolver',
      address: '0xf69Af318B8f4fEF3E3bB21d1645aC44A2AE2eD67',
    },
    {
      abi: ABI.RewardDistributor.abi,
      name: 'RewardDistributor',
      address: '0x648dBd59a81379d4DA2E845f4061a74Fb17f77Db',
    },
    {
      abi: ABI.EASAttestTrigger.abi,
      name: 'EASAttestTrigger',
      address: '0xA8E651Af44A43cF59d5E4747983CC56A4F80A39A',
    },
    {
      abi: ABI.ENOVA.abi,
      name: 'ENOVA',
      address: '0x4B9f1099e7Aaf0e91Dbc98b1Da497C60320054E6',
    },
    {
      abi: ABI.GnosisSafe.abi,
      name: 'GnosisSafe',
      address: '0xcc6bb95cbc87df1d768fcd2e3e212e5aef435b91',
    },
    {
      abi: ABI.GnosisSafeProxy.abi,
      name: 'GnosisSafeProxy',
      address: '0x9cbcf8a1ebc7ebeaaecf407ce0123b75126ff2b2',
    },
    {
      abi: ABI.PredictionMarketOracleController.abi,
      name: 'PredictionMarketOracleController',
      address: '0xa1F6B9a72C4003BdED5Cd3C76D05eEa02d54FE20',
    },
    {
      abi: ABI.MarketMaker.abi,
      name: 'MarketMaker',
      // Address will be updated by deployment script
    },
    {
      abi: ABI.MerkleGovModule.abi,
      name: 'MerkleGovModule',
      address: '0xc3e0e358cdbe2113e49d5ff82ac0ed6e472693b8',
    },
    {
      abi: ABI.SignerManagerModule.abi,
      name: 'SignerManagerModule',
      address: '0x26cbd0d562fedcc9bb2a71d083114bec5fdf0c06',
    },
    {
      abi: ABI.ConditionalTokens.abi,
      name: 'ConditionalTokens',
      address: '0x068Ce29D261Ea04DF6DF29E37dE200e1a9407dBF',
    },
    {
      abi: ABI.LMSRMarketMaker.abi,
      name: 'LMSRMarketMaker',
      address: '0xd8019e9Aa9e7D76f2c8F75eE033fD57bDED7E26B',
    },
    {
      abi: ABI.PredictionMarketFactory.abi,
      name: 'PredictionMarketFactory',
      address: '0x6183fd8Aac3fce781c96e08962B6e86B3Bf93AF7',
    },
    {
      abi: ABI.MockUSDC.abi,
      name: 'MockUSDC',
      address: '0x957E09724dcd9515530eB76368B28cfAF094350C',
    },
    {
      abi: ABI.UniversalIndexer.abi,
      name: 'UniversalIndexer',
      address: '0x09B9A097911a3500469e9D7c23B8F72608FFE756',
    },
  ],
})
