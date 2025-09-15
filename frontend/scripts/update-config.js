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

  // Contract name mappings from wagmi config names to contract addresses
  const contractAddresses = {
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
    ENOVA: deployment.merkler.reward_token,

    // Prediction market
    MockUSDC: deployment.prediction_market.collateral_token,
    ConditionalTokens: deployment.prediction_market.conditional_tokens,
    PredictionMarketFactory: deployment.prediction_market.factory,
    PredictionMarketOracleController:
      deployment.prediction_market.oracle_controller,
    LMSRMarketMaker: deployment.prediction_market.market_maker,

    // Zodiac safes
    GnosisSafe: deployment.zodiac_safes.safe_singleton,
    GnosisSafeProxy: deployment.zodiac_safes.safe_factory,
    MerkleGovModule: deployment.zodiac_safes.safe1.merkle_gov_module,
    SignerManagerModule: deployment.zodiac_safes.safe1.signer_module,
  }

  // Read current wagmi config
  let configContent = fs.readFileSync(wagmiConfigFile, 'utf8')

  // Get unique contract names.
  const contractNames = Object.keys(contractAddresses).sort()

  // Make sure ABIs exist for all contracts.
  contractNames.forEach((name) => {
    const abiPath = path.join(__dirname, `../../out/${name}.sol/${name}.json`)
    const abiExists = fs.existsSync(abiPath)
    if (!abiExists) {
      throw new Error(
        `Could not find ABI for ${name} at ${abiPath}. Please ensure the contract name and file name match.`
      )
    }
  })

  const abiRegex = /const ABI = \{[^}]+\}/
  if (abiRegex.test(configContent)) {
    configContent = configContent.replace(
      abiRegex,
      `
const ABI = {
${contractNames
  .map((name) => `  ${name}: require('../out/${name}.sol/${name}.json'),`)
  .join('\n')}
}`.trim()
    )
  } else {
    throw new Error(`Could not find "ABI" variable in wagmi.config.ts`)
  }

  // Update configured contracts
  const contractsRegex = /(  contracts: )\[[^\]]+\]/
  if (contractsRegex.test(configContent)) {
    configContent = configContent.replace(
      contractsRegex,
      `$1[
${contractNames
  .map(
    (name) => `    {
      abi: ABI.${name}.abi,
      name: '${name}',
      address: '${contractAddresses[name]}',
    },`
  )
  .join('\n')}
  ]`
    )
  } else {
    throw new Error(`Could not find "contracts" config key in wagmi.config.ts`)
  }

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
      throw new Error(`Could not find schemas variable`)
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
