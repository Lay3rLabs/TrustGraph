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
  '../../config/trust_graph.template.json'
)
const networksDevelopmentConfigFile = path.join(
  __dirname,
  '../../config/networks.development.json'
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
  configOutput.chain = env === 'development' ? 'local' : 'optimism'
  configOutput.apis = {
    ponder:
      env === 'development'
        ? 'http://127.0.0.1:65421'
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
    // EASAttestTrigger: deployment.eas.attest_trigger,
    // WavsAttester: deployment.eas.attester,
    EAS: deployment.eas.eas,
    SchemaRegistrar: deployment.eas.schema_registrar,
    SchemaRegistry: deployment.eas.schema_registry,

    // Generate ABIs but set no address since each network has its own.
    EASIndexerResolver: '',
    MerkleSnapshot: '',
    MerkleGovModule: '',
    MerkleFundDistributor: '',
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

  fs.writeFileSync(configOutputFile, JSON.stringify(configOutput, null, 2))

  console.log(`🚀 ${configOutputFile} updated!`)

  // On development, update the contracts, schemas, and trusted seeds in the
  // networks development config.
  if (env === 'development') {
    const networksConfig = JSON.parse(
      fs.readFileSync(networksDevelopmentConfigFile, 'utf8')
    )

    const newNetworksConfig = deployment.networks.map((network: any) => {
      return {
        ...networksConfig[0],
        contracts: {
          merkleSnapshot: network.contracts.merkle_snapshot,
          merkleFundDistributor: network.contracts.fund_distributor,
          merkleGovModule: network.contracts.merkle_gov_module,
        },
        schemas: Object.values(
          network.schemas as Record<
            string,
            | {
                uid: string
                name: string
                description: string
                schema: string
                resolver: string
                revocable: boolean
              }
            | '_'
          >
        ).flatMap((data) => {
          if (data === '_') {
            return []
          }

          const fields = data.schema.split(',').map((field) => {
            const [type, name] = field.split(' ')
            return {
              name,
              type,
            }
          })

          return {
            ...data,
            fields,
          }
        }),
        trustedSeeds: trustGraphConfig.pagerank_trusted_seeds.split(','),
      }
    })

    fs.writeFileSync(
      networksDevelopmentConfigFile,
      JSON.stringify(newNetworksConfig, null, 2)
    )

    console.log(`🚀 ${networksDevelopmentConfigFile} updated!`)
  }
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
