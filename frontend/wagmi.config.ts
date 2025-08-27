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
}

export default defineConfig({
  out: 'lib/contracts.ts',
  contracts: [
    {
      abi: ABI.Attester.abi,
      name: 'Attester',
      address: '0x4A292d6ab4ded92fC55881bcce8a47aC5c2C1127',
    },
    {
      abi: ABI.EAS.abi,
      name: 'EAS',
      address: '0x4E496eeB65bE4F0049821Fa087D6427Af48C6355',
    },
    {
      abi: ABI.SchemaRegistry.abi,
      name: 'SchemaRegistry',
      address: '0x8aF960b119d062fdE7943Fb6bB6189FE75b57320',
    },
    {
      abi: ABI.SchemaRegistrar.abi,
      name: 'SchemaRegistrar',
      address: '0xbbF0c55519161080f6DeD277d73080dcd00C726B',
    },
    {
      abi: ABI.Indexer.abi,
      name: 'Indexer',
      address: '0x02cC033911bA1571E4cb2E7B281d82F3A2fE8121',
    },
    {
      abi: ABI.IndexerResolver.abi,
      name: 'IndexerResolver',
      address: '0x696df8445C35efeE6572E9a6210E5CaB445372F9',
    },
    {
      abi: ABI.RewardDistributor.abi,
      name: 'RewardDistributor',
      address: '0xf8D5DdF6c4f5Cb08C0eaccc2ae988C55A0dae64F',
    },
    {
      abi: ABI.EASAttestTrigger.abi,
      name: 'EASAttestTrigger',
      address: '0xA27eF05A7125Fd25B4C70662123B77D5884044D0',
    },
    {
      abi: ABI.ENOVA.abi,
      name: 'ENOVA',
      address: '0x13ccd4aedA37Ba0A54A6B01266691F8aB5B8d284',
    },
    {
      abi: ABI.GnosisSafe.abi,
      name: 'GnosisSafe',
      address: '0x3a595187dcfc3a975e8d3e55de7bcbb0d1026a2c',
    },
    {
      abi: ABI.GnosisSafeProxy.abi,
      name: 'GnosisSafeProxy',
      address: '0xa7c6d936bf522831b7773eb6c1395806c6101be6',
    },
    {
      abi: ABI.PredictionMarketOracleController.abi,
      name: 'PredictionMarketOracleController',
      address: '0x69C484504Cf9bD5F6e5200cF5e2E74Ac114Bd86C',
    },
    {
      abi: ABI.MarketMaker.abi,
      name: 'MarketMaker',
      // Address will be updated by deployment script
    },
    {
      abi: ABI.MerkleGovModule.abi,
      name: 'MerkleGovModule',
      address: '0xc85ddd0a250e8d13767facac836541a98e09b8ca',
    },
    {
      abi: ABI.SignerManagerModule.abi,
      name: 'SignerManagerModule',
      address: '0x070e93affc8a82a5a6d253aaf7180260c83302d7',
    },
    {
      abi: ABI.ConditionalTokens.abi,
      name: 'ConditionalTokens',
      address: '0x2b36ABD81ee9FeB996720875281f81a1Ce87F1D1',
    },
    {
      abi: ABI.LMSRMarketMaker.abi,
      name: 'LMSRMarketMaker',
      address: '0x05A88714da92d3657B0147F4957a7121Aea430Dd',
    },
    {
      abi: ABI.PredictionMarketFactory.abi,
      name: 'PredictionMarketFactory',
      address: '0xbC92a52de5E4b3aFC967fd0BFb6DdFDeCE7a4fc4',
    },
    {
      abi: ABI.MockUSDC.abi,
      name: 'MockUSDC',
      address: '0x75be824eFf81FeC601FF71894084F31bDD67D0D7',
    },
  ],
})
