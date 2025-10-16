/**
 * Script to generate config.ENV.json from the deployment summary.
 */

import * as fs from 'fs'
import * as path from 'path'

const env = process.env.NODE_ENV || 'development'
const configOutputFile = path.join(__dirname, `../config.${env}.json`)
const configOutput: any = {}

// Path to deployment summary and config files
const deploymentSummaryFile = path.join(
  __dirname,
  '../../.docker/deployment_summary.json'
)
const trustGraphConfigFile = path.join(
  __dirname,
  '../../config/trust_graph.json'
)

console.log('🔄 Updating config with latest deployment data...')

try {
  // Read configs
  const deployment = JSON.parse(fs.readFileSync(deploymentSummaryFile, 'utf8'))
  const trustGraphConfig = JSON.parse(
    fs.readFileSync(trustGraphConfigFile, 'utf8')
  )

  console.log('📋 Found deployment data')

  // Set chain based on environment
  configOutput.chain = env === 'development' ? 'local' : 'base'
  configOutput.apis = {
    ponder:
      env === 'development'
        ? 'http://localhost:65421'
        : 'https://trust-graph.wavs.xyz/ponder',
    ipfsGateway:
      env === 'development'
        ? 'http://127.0.0.1:8080/ipfs/'
        : 'https://gateway.pinata.cloud/ipfs/',
  }

  // Update WAVS service ID
  configOutput.wavsServiceId = deployment.service_id

  // Contract name mappings to contract addresses
  configOutput.contracts = {
    // WAVS Service Manager
    IWavsServiceManager: deployment.wavs_service_manager,

    // Indexer
    WavsIndexer: deployment.wavs_indexer,

    // EAS
    EASAttestTrigger: deployment.eas.contracts.attest_trigger,
    WavsAttester: deployment.eas.contracts.attester,
    EAS: deployment.eas.contracts.eas,
    EASIndexerResolver: deployment.eas.contracts.indexer_resolver,
    SchemaRegistrar: deployment.eas.contracts.schema_registrar,
    SchemaRegistry: deployment.eas.contracts.schema_registry,

    // Merkler
    MerkleSnapshot: deployment.merkler.merkle_snapshot,
    RewardDistributor: deployment.merkler.reward_distributor,
    TEST: deployment.merkler.reward_token,

    // Zodiac safes
    GnosisSafe: deployment.zodiac_safes.safe_singleton,
    GnosisSafeProxy: deployment.zodiac_safes.safe_factory,
    MerkleGovModule: deployment.zodiac_safes.safe1.merkle_gov_module,
    SignerManagerModule: deployment.zodiac_safes.safe1.signer_module,
  }

  // Make sure ABIs exist for all contracts, and copy them to the frontend.
  Object.keys(configOutput.contracts)
    .sort()
    .forEach((name) => {
      const abiPath = path.join(__dirname, `../../out/${name}.sol/${name}.json`)
      const abiExists = fs.existsSync(abiPath)
      if (!abiExists) {
        throw new Error(
          `Could not find ABI for ${name} at ${abiPath}. Please ensure the contract name and file name match.`
        )
      }

      fs.copyFileSync(abiPath, path.join(__dirname, `../abis/${name}.json`))
    })

  configOutput.schemas = Object.entries(
    deployment.eas.schemas as Record<
      string,
      {
        uid: string
        schema: string
        resolver: string
        revocable: boolean
      }
    >
  )
    .filter(([key]) => key !== '_')
    .reduce((acc, [snakeCasedName, { uid, ...data }]) => {
      const camelCasedName = snakeCasedName.replaceAll(/_[a-z]/g, (match) =>
        match.slice(1).toUpperCase()
      )

      const titleCasedName =
        camelCasedName.charAt(0).toUpperCase() + camelCasedName.slice(1)

      const fields = data.schema.split(',').map((field) => {
        const [type, name] = field.split(' ')
        return {
          name,
          type,
        }
      })

      return {
        ...acc,
        [camelCasedName]: {
          uid,
          name: titleCasedName,
          ...data,
          fields,
        },
      }
    }, {})

  configOutput.trustedSeeds = trustGraphConfig.pagerank_trusted_seeds.split(',')

  fs.writeFileSync(configOutputFile, JSON.stringify(configOutput, null, 2))

  console.log(`🚀 ${configOutputFile} updated!`)
} catch (error: any) {
  console.error(`❌ Error updating ${configOutputFile}:`, error.message)
  if (error.code === 'ENOENT') {
    console.error(
      '💡 Make sure the deployment summary file exists at:',
      deploymentSummaryFile
    )
  }
  process.exit(1)
}
