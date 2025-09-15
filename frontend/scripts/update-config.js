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
const configFile = path.join(__dirname, '../lib/config.ts')

console.log('🔄 Updating config files with latest deployment data...')

try {
  // Read deployment summary
  const deployment = JSON.parse(fs.readFileSync(deploymentSummaryFile, 'utf8'))

  console.log('📋 Found deployment data')

  // Update WAVS service ID
  if (deployment.service_id) {
    let configContent = fs.readFileSync(configFile, 'utf8')
    configContent = configContent.replace(
      new RegExp('wavsServiceId =(\\s+)[\'"][^\'"]*[\'"]', 'm'),
      `wavsServiceId =$1'${deployment.service_id}'`
    )
    fs.writeFileSync(configFile, configContent)
    console.log('✅ wavsServiceId updated successfully!')
  }

  // ========================================
  // UPDATE WAGMI CONFIG WITH CONTRACT ADDRESSES
  // ========================================

  // Create a flattened mapping of all contract addresses
  const contractAddresses = {
    wavs_service_manager: deployment.wavs_service_manager,
    wavs_indexer: deployment.wavs_indexer,
    ...deployment.eas.contracts,
    ...deployment.merkler,
    ...deployment.prediction_market,
    // Zodiac Safe stuff
    safe_singleton: deployment.zodiac_safes.safe_singleton,
    safe_factory: deployment.zodiac_safes.safe_factory,
    merkle_gov_module: deployment.zodiac_safes.safe1.merkle_gov_module,
    signer_module: deployment.zodiac_safes.safe1.signer_module,
  }

  console.log('📋 Contract addresses:', contractAddresses)

  // Contract name mappings from deployment keys to wagmi config names
  const contractNameMapping = {
    wavs_indexer: 'WavsIndexer',

    // EAS contracts
    schema_registry: 'SchemaRegistry',
    eas: 'EAS',
    attester: 'WavsAttester',
    schema_registrar: 'SchemaRegistrar',
    indexer_resolver: 'EASIndexerResolver',
    attest_trigger: 'EASAttestTrigger',

    // Merkle contracts
    merkle_snapshot: 'MerkleSnapshot',
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

  if (deployment.eas?.schemas) {
    console.log('📋 Schema IDs:', deployment.eas.schemas)

    // Read current schemas file
    let schemasContent = fs.readFileSync(schemasFile, 'utf8')

    // Update schema IDs
    const schemaData = Object.entries(deployment.eas.schemas).map(
      ([snakeCasedName, schemaId]) => [
        snakeCasedName.replaceAll(/_[a-z]/g, (match) =>
          match.slice(1).toUpperCase()
        ),
        schemaId,
      ]
    )

    const schemaRegex = /const schemas = \{[^}]+\}/g
    if (schemaRegex.test(schemasContent)) {
      schemasContent = schemasContent.replace(
        schemaRegex,
        `
const schemas = {
${schemaData
  .map(([name, id]) => `  ${name}:${name.length > 7 ? '\n    ' : ' '}'${id}',`)
  .join('\n')}
}`.trim()
      )

      // Write updated schemas file
      fs.writeFileSync(schemasFile, schemasContent)
      console.log(`✅ Updated ${schemaData.length} schemas`)
    } else {
      console.log(`⚠️ Could not find schemas variable`)
    }
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
