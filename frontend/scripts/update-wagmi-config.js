#!/usr/bin/env node
/**
 * Script to update wagmi.config.ts with latest contract addresses from forge deployment
 */

const fs = require('fs');
const path = require('path');

// Path to latest deployment file and wagmi config
const deploymentFile = path.join(__dirname, '../../broadcast/DeployEAS.s.sol/17000/run-latest.json');
const wagmiConfigFile = path.join(__dirname, '../wagmi.config.ts');

console.log('🔄 Updating wagmi.config.ts with latest contract addresses...');

try {
  // Read deployment file
  const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
  
  // Extract contract addresses from deployment
  const contracts = {};
  
  deployment.transactions.forEach(tx => {
    if (tx.contractName && tx.contractAddress) {
      contracts[tx.contractName] = tx.contractAddress;
    }
  });
  
  console.log('📋 Found contracts:', contracts);
  
  // Read current wagmi config
  const configContent = fs.readFileSync(wagmiConfigFile, 'utf8');
  
  // Update contract addresses in the config
  let updatedContent = configContent;
  
  // Map deployment contract names to wagmi config names
  const nameMapping = {
    'Attester': 'Attester',
    'EAS': 'EAS', 
    'SchemaRegistry': 'SchemaRegistry',
    'SchemaRegistrar': 'SchemaRegistrar',
    'Indexer': 'Indexer',
    'IndexerResolver': 'IndexerResolver',
    'EASAttestTrigger': 'EASAttestTrigger',
    'VotingPower': 'VotingPower',
    'AttestationGovernor': 'AttestationGovernor',
    'RewardDistributor': 'RewardDistributor'
  };
  
  // Update addresses for each contract
  Object.entries(contracts).forEach(([deploymentName, address]) => {
    const configName = nameMapping[deploymentName];
    if (configName) {
      // Find the contract block and update the address
      const contractPattern = new RegExp(
        `(\\{[^}]*name: '${configName}'[^}]*address: ')([^']*)?('.*?\\})`,
        's'
      );
      const replacement = `$1${address}$3`;
      
      if (contractPattern.test(updatedContent)) {
        updatedContent = updatedContent.replace(contractPattern, replacement);
        console.log(`✅ Updated ${configName}: ${address}`);
      } else {
        // If no address field exists, add it
        const noAddressPattern = new RegExp(
          `(\\{[^}]*name: '${configName}'[^}]*)(\\s*\\})`,
          's'
        );
        if (noAddressPattern.test(updatedContent)) {
          const addAddressReplacement = `$1,\n      address: '${address}',$2`;
          updatedContent = updatedContent.replace(noAddressPattern, addAddressReplacement);
          console.log(`✅ Added address for ${configName}: ${address}`);
        }
      }
    }
  });
  
  // Write updated config
  fs.writeFileSync(wagmiConfigFile, updatedContent);
  
  console.log('✅ wagmi.config.ts updated successfully!');
  console.log('🚀 Now run: npm run wagmi:generate');
  
} catch (error) {
  console.error('❌ Error updating wagmi config:', error.message);
  process.exit(1);
}