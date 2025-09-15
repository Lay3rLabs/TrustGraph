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
  EASAttestTrigger: require('../out/EASAttestTrigger.sol/EASAttestTrigger.json'),
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
      address: '0x510458A4E8D3060000Dbf1752213Db4559e05AaE',
    },
    {
      abi: ABI.EAS.abi,
      name: 'EAS',
      address: '0xfe5E8459BC5c957870a51Db25DF532532d5Dd417',
    },
    {
      abi: ABI.SchemaRegistry.abi,
      name: 'SchemaRegistry',
      address: '0xdEaAA2a134883c8f0834b43185A65e8367479BB0',
    },
    {
      abi: ABI.SchemaRegistrar.abi,
      name: 'SchemaRegistrar',
      address: '0xe03C4bB1363877ADa0649703f2DCcb598770eD0D',
    },
    {
      abi: ABI.EASIndexerResolver.abi,
      name: 'EASIndexerResolver',
      address: '0xe1F3c3e8Cd8aABCF7719E239E99E0a82Cc6C9a83',
    },
    {
      abi: ABI.MerkleSnapshot.abi,
      name: 'MerkleSnapshot',
      address: '0x41DedC58a078a88F110e8e5401f6C6CfD75F528C',
    },
    {
      abi: ABI.RewardDistributor.abi,
      name: 'RewardDistributor',
      address: '0xFC4ca5645baB29099032151d5d78B92cdae8414E',
    },
    {
      abi: ABI.EASAttestTrigger.abi,
      name: 'EASAttestTrigger',
      address: '0xDB3eB8a9258E215e84c6D079b0e4ce9B2b6116DA',
    },
    {
      abi: ABI.ENOVA.abi,
      name: 'ENOVA',
      address: '0x897aC4045B6C9De4399c61b0bDC021387163fa7A',
    },
    {
      abi: ABI.GnosisSafe.abi,
      name: 'GnosisSafe',
      address: '0x8e3b164c08a0e4eb9684f0ba0f897ed11a439a71',
    },
    {
      abi: ABI.GnosisSafeProxy.abi,
      name: 'GnosisSafeProxy',
      address: '0xa17b9c018fb6dc1d170f3d45d42f4b1e08e268b7',
    },
    {
      abi: ABI.PredictionMarketOracleController.abi,
      name: 'PredictionMarketOracleController',
      address: '0x01ffE9c909037163b48AdEea9E7dC7B13F931d0c',
    },
    {
      abi: ABI.MerkleGovModule.abi,
      name: 'MerkleGovModule',
      address: '0x4bb931339a3eaa6581ecf5f3412fbef34b118428',
    },
    {
      abi: ABI.SignerManagerModule.abi,
      name: 'SignerManagerModule',
      address: '0x098f5c5227d5757e7e9befe60e5a99d3d729ff84',
    },
    {
      abi: ABI.ConditionalTokens.abi,
      name: 'ConditionalTokens',
      address: '0xd85Ef0E863C9d66c9Da3DA1e833C2bF4c51Dcd08',
    },
    {
      abi: ABI.LMSRMarketMaker.abi,
      name: 'LMSRMarketMaker',
      address: '0x7aaF237bc7e9A7eED2e0C0158FD6aB1c39B5d7d4',
    },
    {
      abi: ABI.PredictionMarketFactory.abi,
      name: 'PredictionMarketFactory',
      address: '0xe00a6669C0B10cdD89084B51d68f436CBb23AB99',
    },
    {
      abi: ABI.MockUSDC.abi,
      name: 'MockUSDC',
      address: '0x8B8C4c4F6445791F11988c49C395f7f5cD221ECc',
    },
    {
      abi: ABI.WavsIndexer.abi,
      name: 'WavsIndexer',
      address: '0x4465dBA13bb1B1Cf86064fa6b74132aC02F55E4e',
    },
  ],
})
