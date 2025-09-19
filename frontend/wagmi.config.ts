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
      address: '0x268f6c292Dd98E6B691F4CF1364493f2824522d5',
    },
    {
      abi: ABI.EAS.abi,
      name: 'EAS',
      address: '0x1767D77327F25C01Dfe413f725ce87744080998D',
    },
    {
      abi: ABI.EASAttestTrigger.abi,
      name: 'EASAttestTrigger',
      address: '0x9B7D877911C099A6DFb2a8c112fAFf1895108134',
    },
    {
      abi: ABI.EASIndexerResolver.abi,
      name: 'EASIndexerResolver',
      address: '0x2B363210474e85b1EeA6Dd15A67fEDe971668142',
    },
    {
      abi: ABI.ENOVA.abi,
      name: 'ENOVA',
      address: '0xF82746E0A5fbfF48e6C0862074A6623416cd9243',
    },
    {
      abi: ABI.GnosisSafe.abi,
      name: 'GnosisSafe',
      address: '0x2636784328282A531483771046788E0101ee50D0',
    },
    {
      abi: ABI.GnosisSafeProxy.abi,
      name: 'GnosisSafeProxy',
      address: '0x14aE33c2C1252C6DBcc92050e9312c0cd79F13d1',
    },
    {
      abi: ABI.LMSRMarketMaker.abi,
      name: 'LMSRMarketMaker',
      address: '0xbdFA2a3688F2c0b28f6cB665E346b4574c2B934A',
    },
    {
      abi: ABI.MerkleGovModule.abi,
      name: 'MerkleGovModule',
      address: '0x68DaAeF5Db6253Ea1dc4aD824f8F07a97296e24e',
    },
    {
      abi: ABI.MerkleSnapshot.abi,
      name: 'MerkleSnapshot',
      address: '0xf3B37342F5d654824AE198c1684B319d1A04735D',
    },
    {
      abi: ABI.MockUSDC.abi,
      name: 'MockUSDC',
      address: '0x1e4035E6773A1CD009656ef44198e6b78669645B',
    },
    {
      abi: ABI.PredictionMarketFactory.abi,
      name: 'PredictionMarketFactory',
      address: '0x1EA1ABEb104dEc25846c136DD09936B9e80f1DB4',
    },
    {
      abi: ABI.PredictionMarketOracleController.abi,
      name: 'PredictionMarketOracleController',
      address: '0x84CFe0B5B2fBb8756189F83778f76910D467EC35',
    },
    {
      abi: ABI.RewardDistributor.abi,
      name: 'RewardDistributor',
      address: '0xff7C1131A6E67f0C0275C1e5e0135c8BE39231AE',
    },
    {
      abi: ABI.SchemaRegistrar.abi,
      name: 'SchemaRegistrar',
      address: '0xf3B91674E0854f9a4D5B4A2bB5FbdFAD2aA43C30',
    },
    {
      abi: ABI.SchemaRegistry.abi,
      name: 'SchemaRegistry',
      address: '0x8df6490B84937fB5f7E2D797224Dcf34Fc97103C',
    },
    {
      abi: ABI.SignerManagerModule.abi,
      name: 'SignerManagerModule',
      address: '0xeDe912fe3466c790EAc8adc62cBa48E539BC1b6B',
    },
    {
      abi: ABI.WavsAttester.abi,
      name: 'WavsAttester',
      address: '0x80c2aCeF5D9C1b21896647F48E0A53b32bb96437',
    },
    {
      abi: ABI.WavsIndexer.abi,
      name: 'WavsIndexer',
      address: '0xE7a991e6BeaA6F4dDD8891A9cE8449287F033970',
    },
  ],
})
