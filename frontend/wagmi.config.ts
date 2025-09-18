import { defineConfig } from '@wagmi/cli'

// ABIs for all contracts by name.
const ABI = {
  ConditionalTokens: require('../out/ConditionalTokens.sol/ConditionalTokens.json'),
  EAS: require('../out/EAS.sol/EAS.json'),
  EASAttestTrigger: require('../out/EASAttestTrigger.sol/EASAttestTrigger.json'),
  EASIndexerResolver: require('../out/EASIndexerResolver.sol/EASIndexerResolver.json'),
  ENOVA: require('../out/ENOVA.sol/ENOVA.json'),
  GnosisSafe: require('../out/GnosisSafe.sol/GnosisSafe.json'),
  GnosisSafeProxy: require('../out/GnosisSafeProxy.sol/GnosisSafeProxy.json'),
  LMSRMarketMaker: require('../out/LMSRMarketMaker.sol/LMSRMarketMaker.json'),
  MerkleGovModule: require('../out/MerkleGovModule.sol/MerkleGovModule.json'),
  MerkleSnapshot: require('../out/MerkleSnapshot.sol/MerkleSnapshot.json'),
  MockUSDC: require('../out/MockUSDC.sol/MockUSDC.json'),
  PredictionMarketFactory: require('../out/PredictionMarketFactory.sol/PredictionMarketFactory.json'),
  PredictionMarketOracleController: require('../out/PredictionMarketOracleController.sol/PredictionMarketOracleController.json'),
  RewardDistributor: require('../out/RewardDistributor.sol/RewardDistributor.json'),
  SchemaRegistrar: require('../out/SchemaRegistrar.sol/SchemaRegistrar.json'),
  SchemaRegistry: require('../out/SchemaRegistry.sol/SchemaRegistry.json'),
  SignerManagerModule: require('../out/SignerManagerModule.sol/SignerManagerModule.json'),
  WavsAttester: require('../out/WavsAttester.sol/WavsAttester.json'),
  WavsIndexer: require('../out/WavsIndexer.sol/WavsIndexer.json'),
}

export default defineConfig({
  out: 'lib/contracts.ts',
  contracts: [
    {
      abi: ABI.ConditionalTokens.abi,
      name: 'ConditionalTokens',
      address: '0x39C73a67a4D6D825f4C38234A8dA3A8F09590696',
    },
    {
      abi: ABI.EAS.abi,
      name: 'EAS',
      address: '0xb673B08a473A8209E2c850eFa70b6968d84f5748',
    },
    {
      abi: ABI.EASAttestTrigger.abi,
      name: 'EASAttestTrigger',
      address: '0x132aF1a335aFBFff76B69bC30433048Dda62a91f',
    },
    {
      abi: ABI.EASIndexerResolver.abi,
      name: 'EASIndexerResolver',
      address: '0x3ac5C4BFEb86981156B7Ae28deAfa7f8aE267568',
    },
    {
      abi: ABI.ENOVA.abi,
      name: 'ENOVA',
      address: '0x2bd0AA9101F10472fE7B145fa74cB53d699943E7',
    },
    {
      abi: ABI.GnosisSafe.abi,
      name: 'GnosisSafe',
      address: '0x5A0a87dc384bff6ff2b55B8131F468504Eb44588',
    },
    {
      abi: ABI.GnosisSafeProxy.abi,
      name: 'GnosisSafeProxy',
      address: '0x64F1475B80f7FdC41A4E79f57f1c1c9498AB1508',
    },
    {
      abi: ABI.LMSRMarketMaker.abi,
      name: 'LMSRMarketMaker',
      address: '0xAe1eD19675C9e76638Eaacc5c6841f6688c52Ce3',
    },
    {
      abi: ABI.MerkleGovModule.abi,
      name: 'MerkleGovModule',
      address: '0x8C92E2494BbdF9D478b17211FC93eEbacE88DD75',
    },
    {
      abi: ABI.MerkleSnapshot.abi,
      name: 'MerkleSnapshot',
      address: '0x56696361011367F90089c5F7C11E614235914dA0',
    },
    {
      abi: ABI.MockUSDC.abi,
      name: 'MockUSDC',
      address: '0xd0724672B49f189D562aD3DAb6439E6911AE18DF',
    },
    {
      abi: ABI.PredictionMarketFactory.abi,
      name: 'PredictionMarketFactory',
      address: '0xE03b1B122168B7d36D2302FaCa7485D73db5a9A2',
    },
    {
      abi: ABI.PredictionMarketOracleController.abi,
      name: 'PredictionMarketOracleController',
      address: '0xC9707F6BA33F68e0F3B143dE0e8dd9bDfd7167fD',
    },
    {
      abi: ABI.RewardDistributor.abi,
      name: 'RewardDistributor',
      address: '0x1BF3B8604Df8bB811B806FEC9bb369Bb9De29BA3',
    },
    {
      abi: ABI.SchemaRegistrar.abi,
      name: 'SchemaRegistrar',
      address: '0x9B92336ceE802538b0FcDDd3b86Ce6a9E9ae9Ee7',
    },
    {
      abi: ABI.SchemaRegistry.abi,
      name: 'SchemaRegistry',
      address: '0x6B577BD2442a60557Eb18016D4B6A5E84B7c9E1a',
    },
    {
      abi: ABI.SignerManagerModule.abi,
      name: 'SignerManagerModule',
      address: '0xd283a2288B81ACE203F76B164aEe568faa3b689A',
    },
    {
      abi: ABI.WavsAttester.abi,
      name: 'WavsAttester',
      address: '0x1e22c9fDf3Ee7f59Dd838F70680b2Ba8eF788316',
    },
    {
      abi: ABI.WavsIndexer.abi,
      name: 'WavsIndexer',
      address: '0xfCa96e1FC57DeB0Cbe6eA6d4F10cA44CA419787c',
    },
  ],
})
