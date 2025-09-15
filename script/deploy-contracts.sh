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

echo "🏛️  Deploying Governance contracts..."

# Deploy Governance contracts using Foundry script
forge script script/DeployGovernance.s.sol:DeployGovernance \
    --sig 'run(string)' "${WAVS_SERVICE_MANAGER_ADDRESS}" \
    --rpc-url "${RPC_URL}" \
    --private-key "${FUNDED_KEY}" \
    --broadcast

echo "💰 Deploying Merkler contracts..."

# Deploy Merkler contracts using Foundry script
forge script script/DeployMerkler.s.sol:DeployScript \
    --sig 'run(string)' "${WAVS_SERVICE_MANAGER_ADDRESS}" \
    --rpc-url "${RPC_URL}" \
    --private-key "${FUNDED_KEY}" \
    --broadcast

echo "🎲 Deploying Prediction Market contracts..."

# Deploy Prediction Market contracts using Foundry script
forge script script/DeployPredictionMarket.s.sol:DeployScript \
    --sig 'run(string)' "${WAVS_SERVICE_MANAGER_ADDRESS}" \
    --rpc-url "${RPC_URL}" \
    --private-key "${FUNDED_KEY}" \
    --broadcast

echo "🔐 Deploying Zodiac-enabled Safes with modules..."

# Deploy Zodiac Safes using Foundry script. MUST RUN AFTER MERKLER DEPLOYMENT.
export MERKLE_SNAPSHOT_ADDR=`task config:merkle-snapshot-address`
forge script script/DeployZodiacSafes.s.sol:DeployZodiacSafes \
    --sig 'run(string,string)' "${WAVS_SERVICE_MANAGER_ADDRESS}" "${MERKLE_SNAPSHOT_ADDR}" \
    --rpc-url "${RPC_URL}" \
    --private-key "${FUNDED_KEY}" \
    --broadcast

echo "🌊 Deploying Geyser contracts..."
forge create Geyser --json --rpc-url ${RPC_URL} --broadcast --private-key $FUNDED_KEY --constructor-args "${WAVS_SERVICE_MANAGER_ADDRESS}" > .docker/geyser_deploy.json

echo "🌐 Deploying WavsIndexer contract..."

# Deploy WavsIndexer contract using Foundry script
forge script script/DeployWavsIndexer.s.sol:DeployWavsIndexer \
    --sig 'run(string)' "${WAVS_SERVICE_MANAGER_ADDRESS}" \
    --rpc-url "${RPC_URL}" \
    --private-key "${FUNDED_KEY}" \
    --broadcast

# Extract deployed addresses from Governance deployment
export VOTING_POWER_ADDR=$(jq -r '.voting_power' .docker/governance_deploy.json 2>/dev/null || echo "")
export TIMELOCK_ADDR=$(jq -r '.timelock' .docker/governance_deploy.json 2>/dev/null || echo "")
export GOVERNOR_ADDR=$(jq -r '.governor' .docker/governance_deploy.json 2>/dev/null || echo "")

# Extract deployed addresses from Geyser deployment
export GYSER_ADDR=$(jq -r '.deployedTo' .docker/geyser_deploy.json 2>/dev/null || echo "")

# Extract deployed addresses from Merkler deployment
export MERKLE_SNAPSHOT_ADDR=$(jq -r '.merkle_snapshot' .docker/merkler_deploy.json 2>/dev/null || echo "")
export REWARD_DISTRIBUTOR_ADDR=$(jq -r '.reward_distributor' .docker/merkler_deploy.json 2>/dev/null || echo "")
export REWARD_TOKEN_ADDR=$(jq -r '.reward_token' .docker/merkler_deploy.json 2>/dev/null || echo "")

# Extract deployed addresses from Prediction Market deployment
export PREDICTION_ORACLE_CONTROLLER_ADDR=$(jq -r '.oracle_controller' .docker/prediction_market_deploy.json 2>/dev/null || echo "")
export PREDICTION_FACTORY_ADDR=$(jq -r '.factory' .docker/prediction_market_deploy.json 2>/dev/null || echo "")
export PREDICTION_COLLATERAL_TOKEN_ADDR=$(jq -r '.collateral_token' .docker/prediction_market_deploy.json 2>/dev/null || echo "")
export PREDICTION_CONDITIONAL_TOKENS_ADDR=$(jq -r '.conditional_tokens' .docker/prediction_market_deploy.json 2>/dev/null || echo "")
export PREDICTION_MARKET_MAKER_ADDR=$(jq -r '.market_maker' .docker/prediction_market_deploy.json 2>/dev/null || echo "")

# Extract deployed addresses from Zodiac Safes deployment
export SAFE1_ADDR=$(jq -r '.safe1_address' .docker/zodiac_safes_deploy.json 2>/dev/null || echo "")
export SAFE1_MERKLE_GOV_MODULE=$(jq -r '.safe1_merkle_gov_module' .docker/zodiac_safes_deploy.json 2>/dev/null || echo "")
export SAFE1_SIGNER_MODULE=$(jq -r '.safe1_signer_module' .docker/zodiac_safes_deploy.json 2>/dev/null || echo "")
export SAFE2_ADDR=$(jq -r '.safe2_address' .docker/zodiac_safes_deploy.json 2>/dev/null || echo "")
export SAFE2_WAVS_MODULE=$(jq -r '.safe2_wavs_module' .docker/zodiac_safes_deploy.json 2>/dev/null || echo "")
export SAFE_SINGLETON=$(jq -r '.safe_singleton' .docker/zodiac_safes_deploy.json 2>/dev/null || echo "")
export SAFE_FACTORY=$(jq -r '.safe_factory' .docker/zodiac_safes_deploy.json 2>/dev/null || echo "")

# Extract deployed addresses from WavsIndexer deployment
export wavs_indexer_ADDR=$(jq -r '.wavs_indexer' .docker/wavs_indexer_deploy.json 2>/dev/null || echo "")

jq -n \
  --arg service_id "" \
  --arg rpc_url "${RPC_URL}" \
  --arg wavs_service_manager "${WAVS_SERVICE_MANAGER_ADDRESS}" \
  --arg wavs_indexer_addr "${wavs_indexer_ADDR}" \
  --arg geyser_addr "${GYSER_ADDR}" \
  --arg voting_power "${VOTING_POWER_ADDR}" \
  --arg timelock "${TIMELOCK_ADDR}" \
  --arg governor "${GOVERNOR_ADDR}" \
  --arg merkle_snapshot "${MERKLE_SNAPSHOT_ADDR}" \
  --arg reward_distributor "${REWARD_DISTRIBUTOR_ADDR}" \
  --arg reward_token "${REWARD_TOKEN_ADDR}" \
  --arg oracle_controller "${PREDICTION_ORACLE_CONTROLLER_ADDR}" \
  --arg factory "${PREDICTION_FACTORY_ADDR}" \
  --arg collateral_token "${PREDICTION_COLLATERAL_TOKEN_ADDR}" \
  --arg conditional_tokens "${PREDICTION_CONDITIONAL_TOKENS_ADDR}" \
  --arg market_maker "${PREDICTION_MARKET_MAKER_ADDR}" \
  --arg safe_singleton "${SAFE_SINGLETON}" \
  --arg safe_factory "${SAFE_FACTORY}" \
  --arg safe1_addr "${SAFE1_ADDR}" \
  --arg safe1_merkle_gov "${SAFE1_MERKLE_GOV_MODULE}" \
  --arg safe1_signer "${SAFE1_SIGNER_MODULE}" \
  --arg safe2_addr "${SAFE2_ADDR}" \
  --arg safe2_wavs "${SAFE2_WAVS_MODULE}" \
  --slurpfile eas_deploy .docker/eas_deploy.json \
  '{
    service_id: $service_id,
    rpc_url: $rpc_url,
    wavs_service_manager: $wavs_service_manager,
    wavs_indexer: {
      wavs_indexer: $wavs_indexer_addr
    },
    geyser: {
      trigger: $geyser_addr
    },
    governance_contracts: {
      voting_power: $voting_power,
      timelock: $timelock,
      governor: $governor
    },
    eas: $eas_deploy[0],
    merkler: {
      merkle_snapshot: $merkle_snapshot
    },
    reward_contracts: {
      reward_distributor: $reward_distributor,
      reward_token: $reward_token
    },
    prediction_market_contracts: {
      oracle_controller: $oracle_controller,
      factory: $factory,
      collateral_token: $collateral_token,
      conditional_tokens: $conditional_tokens,
      market_maker: $market_maker
    },
    zodiac_safes: {
      safe_singleton: $safe_singleton,
      safe_factory: $safe_factory,
      safe1: {
        address: $safe1_addr,
        merkle_gov_module: $safe1_merkle_gov,
        signer_module: $safe1_signer
      },
      safe2: {
        address: $safe2_addr,
        wavs_module: $safe2_wavs
      }
    }
  }' \
  > .docker/deployment_summary.json

echo "✅ EAS, Governance, and Merkler Deployment Complete!"
echo ""
echo "📋 Deployment Summary:"
echo "   RPC_URL: ${RPC_URL}"
echo "   WAVS_SERVICE_MANAGER_ADDRESS: ${WAVS_SERVICE_MANAGER_ADDRESS}"
echo "   wavs_indexer_ADDR: ${wavs_indexer_ADDR}"
echo ""
echo "🏛️  Governance Contracts:"
echo "   VOTING_POWER_ADDR: ${VOTING_POWER_ADDR}"
echo "   TIMELOCK_ADDR: ${TIMELOCK_ADDR}"
echo "   GOVERNOR_ADDR: ${GOVERNOR_ADDR}"
echo ""
echo "💰 Merkler Contracts:"
echo "   MERKLE_SNAPSHOT_ADDR: ${MERKLE_SNAPSHOT_ADDR}"
echo ""
echo "💰 Reward Contracts:"
echo "   REWARD_DISTRIBUTOR_ADDR: ${REWARD_DISTRIBUTOR_ADDR}"
echo "   REWARD_TOKEN_ADDR: ${REWARD_TOKEN_ADDR}"
echo ""
echo "🎲 Prediction Market Contracts:"
echo "   ORACLE_CONTROLLER_ADDR: ${PREDICTION_ORACLE_CONTROLLER_ADDR}"
echo "   FACTORY_ADDR: ${PREDICTION_FACTORY_ADDR}"
echo "   COLLATERAL_TOKEN_ADDR: ${PREDICTION_COLLATERAL_TOKEN_ADDR}"
echo "   CONDITIONAL_TOKENS_ADDR: ${PREDICTION_CONDITIONAL_TOKENS_ADDR}"
echo "   MARKET_MAKER_ADDR: ${PREDICTION_MARKET_MAKER_ADDR}"
echo ""
echo "🔐 Zodiac Safes:"
echo "   SAFE_SINGLETON: ${SAFE_SINGLETON}"
echo "   SAFE_FACTORY: ${SAFE_FACTORY}"
echo "   Safe 1 (SignerManager + MerkleGov):"
echo "     Address: ${SAFE1_ADDR}"
echo "     Merkle Gov Module: ${SAFE1_MERKLE_GOV_MODULE}"
echo "     Signer Module: ${SAFE1_SIGNER_MODULE}"
echo "   Safe 2 (WAVS Module):"
echo "     Address: ${SAFE2_ADDR}"
echo "     WAVS Module: ${SAFE2_WAVS_MODULE}"
echo ""
echo "📄 Deployment details saved to .docker/deployment_summary.json"
echo "📄 EAS deployment details saved to .docker/eas_deploy.json"
echo "📄 Governance deployment details saved to .docker/governance_deploy.json"
echo "📄 Merkler deployment details saved to .docker/merkler_deploy.json"
echo "📄 Prediction Market deployment details saved to .docker/prediction_market_deploy.json"
echo "📄 Zodiac Safes deployment details saved to .docker/zodiac_safes_deploy.json"
echo "📄 WavsIndexer deployment details saved to .docker/wavs_indexer_deploy.json"
