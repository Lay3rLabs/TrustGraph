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
      address: '0x8793283902559DE966639B0124F2fEc04f042125',
    },
    {
      abi: ABI.EAS.abi,
      name: 'EAS',
      address: '0x2643f321663AC466EE27eEF6d6c443FF4af69a99',
    },
    {
      abi: ABI.EASAttestTrigger.abi,
      name: 'EASAttestTrigger',
      address: '0x804b51568BC250F2225a0cFD9ecD359dDfDAeeDD',
    },
    {
      abi: ABI.EASIndexerResolver.abi,
      name: 'EASIndexerResolver',
      address: '0x44d58953A83c719A2022c81DFD74d3F2c7DF5228',
    },
    {
      abi: ABI.ENOVA.abi,
      name: 'ENOVA',
      address: '0x06CF59F62a0E3Dad2B8260a35a4B05Eaf1c1Ba50',
    },
    {
      abi: ABI.GnosisSafe.abi,
      name: 'GnosisSafe',
      address: '0x44F6e7e0bf47c83526876d5AC3058AB275C9a4e8',
    },
    {
      abi: ABI.GnosisSafeProxy.abi,
      name: 'GnosisSafeProxy',
      address: '0x17C0124BED9C03ceFC06509074b24a0326576ceD',
    },
    {
      abi: ABI.LMSRMarketMaker.abi,
      name: 'LMSRMarketMaker',
      address: '0xcC8687A2d20125Ee46451DF45eb48530a105E5A4',
    },
    {
      abi: ABI.MerkleGovModule.abi,
      name: 'MerkleGovModule',
      address: '0x52839A905E878f78b9C801256eAA1cfdB6dDFe57',
    },
    {
      abi: ABI.MerkleSnapshot.abi,
      name: 'MerkleSnapshot',
      address: '0x9aB2396564DaDa242EEb68e778BB32B079e2e8f0',
    },
    {
      abi: ABI.MockUSDC.abi,
      name: 'MockUSDC',
      address: '0x96cc304F54dD90cc2B84Effd5698ae5932348D90',
    },
    {
      abi: ABI.PredictionMarketFactory.abi,
      name: 'PredictionMarketFactory',
      address: '0x0B4553614509E3f0A6882E141f1B72aEf1FBa385',
    },
    {
      abi: ABI.PredictionMarketOracleController.abi,
      name: 'PredictionMarketOracleController',
      address: '0xa00f826296c6054306474Cb9a9978B947030630f',
    },
    {
      abi: ABI.RewardDistributor.abi,
      name: 'RewardDistributor',
      address: '0xFcE0A7434Cb150fFdB53f0C81402F494c944E845',
    },
    {
      abi: ABI.SchemaRegistrar.abi,
      name: 'SchemaRegistrar',
      address: '0x1132048214366A2644B930f91dfDC45a01c17A9c',
    },
    {
      abi: ABI.SchemaRegistry.abi,
      name: 'SchemaRegistry',
      address: '0x304Cf11209D045209590a101b4D5CA5Da31CFFeE',
    },
    {
      abi: ABI.SignerManagerModule.abi,
      name: 'SignerManagerModule',
      address: '0xC561404955AdCAc31D50Ed65cea11C7D99db805A',
    },
    {
      abi: ABI.WavsAttester.abi,
      name: 'WavsAttester',
      address: '0x2A024b9760dc3c88A23c33ADeaC61dcDC530608e',
    },
    {
      abi: ABI.WavsIndexer.abi,
      name: 'WavsIndexer',
      address: '0xB2C54cA3854CDD31b7be19542aba5E81D7ddAF89',
    },
  ],
})
