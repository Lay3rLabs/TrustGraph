#!/usr/bin/env node
/**
 * Script to update wagmi.config.ts and schemas.ts with latest deployment data
 */

const fs = require('fs')
const path = require('path')

// Path to deployment summary and config files
const deploymentSummaryFile = path.join(
  __dirname,
  '../../.docker/deployment_summary.json'
)
const wagmiConfigFile = path.join(__dirname, '../wagmi.config.ts')
const schemasFile = path.join(__dirname, '../lib/schemas.ts')

console.log('🔄 Updating config files with latest deployment data...')

try {
  // Read deployment summary
  const deployment = JSON.parse(fs.readFileSync(deploymentSummaryFile, 'utf8'))

  console.log('📋 Found deployment data')

  // ========================================
  // UPDATE WAGMI CONFIG WITH CONTRACT ADDRESSES
  // ========================================

  // Create a flattened mapping of all contract addresses
  const contractAddresses = {}

  // Add all contract addresses from different sections
  if (deployment.universal_indexer) {
    Object.assign(contractAddresses, deployment.universal_indexer)
  }
  if (deployment.eas_contracts) {
    Object.assign(contractAddresses, deployment.eas_contracts)
  }
  if (deployment.service_contracts) {
    Object.assign(contractAddresses, deployment.service_contracts)
  }
  if (deployment.reward_contracts) {
    Object.assign(contractAddresses, deployment.reward_contracts)
  }
  if (deployment.prediction_market_contracts) {
    Object.assign(contractAddresses, deployment.prediction_market_contracts)
  }
  if (deployment.zodiac_safes) {
    contractAddresses.safe_singleton = deployment.zodiac_safes.safe_singleton
    contractAddresses.safe_factory = deployment.zodiac_safes.safe_factory
    if (deployment.zodiac_safes.safe1) {
      contractAddresses.merkle_gov_module =
        deployment.zodiac_safes.safe1.merkle_gov_module
      contractAddresses.signer_module =
        deployment.zodiac_safes.safe1.signer_module
    }
  }

  // Add WAVS service manager address
  if (deployment.wavs_service_manager) {
    contractAddresses.wavs_service_manager = deployment.wavs_service_manager
  }

  console.log('📋 Contract addresses:', contractAddresses)

  // Contract name mappings from deployment keys to wagmi config names
  const contractNameMapping = {
    universal_indexer: 'UniversalIndexer',

    // EAS contracts
    schema_registry: 'SchemaRegistry',
    eas: 'EAS',
    attester: 'Attester',
    schema_registrar: 'SchemaRegistrar',
    indexer_resolver: 'EASIndexerResolver',

    // Service contracts
    trigger: 'EASAttestTrigger',

    // Reward contracts
    reward_distributor: 'RewardDistributor',
    reward_token: 'ENOVA',

    // Prediction market contracts
    oracle_controller: 'PredictionMarketOracleController',
    factory: 'PredictionMarketFactory',
    collateral_token: 'MockUSDC',
    conditional_tokens: 'ConditionalTokens',
    market_maker: 'LMSRMarketMaker',

    // Zodiac Safe contracts
    safe_singleton: 'GnosisSafe',
    safe_factory: 'GnosisSafeProxy',
    merkle_gov_module: 'MerkleGovModule',
    signer_module: 'SignerManagerModule',

    // WAVS service manager
    wavs_service_manager: 'POAServiceManager',
  }

  // Read current wagmi config
  let configContent = fs.readFileSync(wagmiConfigFile, 'utf8')

  // Update each contract address
  Object.entries(contractAddresses).forEach(([deploymentName, address]) => {
    const configName = contractNameMapping[deploymentName]
    if (configName && address) {
      // Simple regex to find and replace the address field for each contract
      const addressRegex = new RegExp(
        `(name:\\s*["']${configName}["'][^}]*address:\\s*["'])([^"']*)(["'])`,
        'g'
      )

      if (addressRegex.test(configContent)) {
        configContent = configContent.replace(addressRegex, `$1${address}$3`)
        console.log(`✅ Updated ${configName}: ${address}`)
      } else {
        console.log(`⚠️  Could not find ${configName} in config`)
      }
    }
  })

  // Write updated wagmi config
  fs.writeFileSync(wagmiConfigFile, configContent)
  console.log('✅ wagmi.config.ts updated successfully!')

  // ========================================
  // UPDATE SCHEMAS WITH SCHEMA IDs
  // ========================================

  if (deployment.eas_schemas) {
    console.log('📋 Schema IDs:', deployment.eas_schemas)

    // Read current schemas file
    let schemasContent = fs.readFileSync(schemasFile, 'utf8')

    // Schema name mappings
    const schemaNameMapping = {
      basic_schema: 'basicSchema',
      compute_schema: 'computeSchema',
      statement_schema: 'statementSchema',
      is_true_schema: 'isTrueSchema',
      like_schema: 'likeSchema',
      vouching_schema: 'vouchingSchema',
    }

    // Update schema IDs
    Object.entries(deployment.eas_schemas).forEach(
      ([deploymentName, schemaId]) => {
        const codeName = schemaNameMapping[deploymentName]
        if (codeName && schemaId) {
          const schemaRegex = new RegExp(
            `(${codeName}:\\s*["'])([^"']*)(["'])`,
            'g'
          )

          if (schemaRegex.test(schemasContent)) {
            schemasContent = schemasContent.replace(
              schemaRegex,
              `$1${schemaId}$3`
            )
            console.log(`✅ Updated ${codeName}: ${schemaId}`)
          } else {
            console.log(`⚠️  Could not find ${codeName} in schemas`)
          }
        }
      }
    )

    // Write updated schemas file
    fs.writeFileSync(schemasFile, schemasContent)
    console.log('✅ schemas.ts updated successfully!')
  }

  console.log('🚀 All config files updated! Now run: npm run wagmi:generate')
} catch (error) {
  console.error('❌ Error updating config files:', error.message)
  if (error.code === 'ENOENT') {
    console.error(
      '💡 Make sure the deployment summary file exists at:',
      deploymentSummaryFile
    )
  }
  process.exit(1)
}
