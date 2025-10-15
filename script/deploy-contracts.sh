#!/bin/bash

# Deploy EAS contracts and WAVS EAS integration
# This script replaces the old deploy-contracts.sh with EAS-based deployment

set -e

echo "🚀 Starting WAVS EAS contract deployment..."

export WAVS_SERVICE_MANAGER_ADDRESS=${WAVS_SERVICE_MANAGER_ADDRESS:-`task config:service-manager-address`}

# Get RPC URL and deployer key
export RPC_URL=$(task get-rpc)
# Use FUNDED_KEY from environment if set (from create-deployer.sh), otherwise read from .env
if [ -z "$FUNDED_KEY" ]; then
    export FUNDED_KEY=$(task config:funded-key)
fi

export DEPLOY_ENV=`task get-deploy-status`

# CRITICAL: Export FUNDED_KEY for Forge scripts to use. Without this the first run will get 'server returned an error response: error code -32003: Insufficient funds for gas * price + value'
# export FUNDED_KEY="${FUNDED_KEY}"

echo "🔧 Configuration:"
echo "   RPC_URL: ${RPC_URL}"
echo "   WAVS_SERVICE_MANAGER_ADDRESS: ${WAVS_SERVICE_MANAGER_ADDRESS}"

# Create output directory
mkdir -p .docker

echo "📦 Deploying EAS contracts..."

# Deploy EAS contracts using Foundry script
forge script script/DeployEAS.s.sol:DeployEAS \
    --sig 'run(string)' "${WAVS_SERVICE_MANAGER_ADDRESS}" \
    --rpc-url "${RPC_URL}" \
    --private-key "${FUNDED_KEY}" \
    --broadcast

echo "💰 Deploying Merkler contracts..."
forge script script/DeployMerkler.s.sol:DeployScript \
    --sig 'run(string,bool)' "${WAVS_SERVICE_MANAGER_ADDRESS}" "${DEPLOY_REWARD_DISTRIBUTOR:-true}" \
    --rpc-url "${RPC_URL}" \
    --private-key "${FUNDED_KEY}" \
    --broadcast

if [ "$DEPLOY_ENV" == "LOCAL" ]; then
    echo "🔐 Deploying Zodiac-enabled Safes with modules..."

    # MUST RUN AFTER MERKLER DEPLOYMENT.
    export MERKLE_SNAPSHOT_ADDR=`task config:merkle-snapshot-address`
    forge script script/DeployZodiacSafes.s.sol:DeployZodiacSafes \
        --sig 'run(string,string)' "${WAVS_SERVICE_MANAGER_ADDRESS}" "${MERKLE_SNAPSHOT_ADDR}" \
        --rpc-url "${RPC_URL}" \
        --private-key "${FUNDED_KEY}" \
        --broadcast
fi

echo "🌐 Deploying WavsIndexer contract..."

# Deploy WavsIndexer contract using Foundry script
forge script script/DeployWavsIndexer.s.sol:DeployWavsIndexer \
    --sig 'run(string)' "${WAVS_SERVICE_MANAGER_ADDRESS}" \
    --rpc-url "${RPC_URL}" \
    --private-key "${FUNDED_KEY}" \
    --broadcast

# Combine all deployment JSON files into a single deployment summary.

jq -n \
  --arg service_id "" \
  --arg rpc_url "${RPC_URL}" \
  --arg wavs_service_manager "${WAVS_SERVICE_MANAGER_ADDRESS}" \
  --slurpfile wavs_indexer_deploy .docker/wavs_indexer_deploy.json \
  --slurpfile eas_deploy .docker/eas_deploy.json \
  --slurpfile merkler_deploy .docker/merkler_deploy.json \
  --slurpfile zodiac_safes_deploy .docker/zodiac_safes_deploy.json \
  '{
    service_id: $service_id,
    rpc_url: $rpc_url,
    wavs_service_manager: $wavs_service_manager,
    wavs_indexer: $wavs_indexer_deploy[0].wavs_indexer,
    eas: $eas_deploy[0],
    merkler: $merkler_deploy[0],
    zodiac_safes: $zodiac_safes_deploy[0],
  }' \
  > .docker/deployment_summary.json

echo "✅ Contract Deployment Complete!"
echo ""
echo "📋 Deployment Summary:"
echo "   RPC_URL: ${RPC_URL}"
echo "   WAVS_SERVICE_MANAGER_ADDRESS: ${WAVS_SERVICE_MANAGER_ADDRESS}"
echo ""
echo "📄 Deployment details saved to .docker/deployment_summary.json"
echo "📄 EAS deployment details saved to .docker/eas_deploy.json"
echo "📄 Governance deployment details saved to .docker/governance_deploy.json"
echo "📄 Merkler deployment details saved to .docker/merkler_deploy.json"
echo "📄 Zodiac Safes deployment details saved to .docker/zodiac_safes_deploy.json"
echo "📄 WavsIndexer deployment details saved to .docker/wavs_indexer_deploy.json"
