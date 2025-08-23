#!/bin/bash

# Deploy EAS contracts and WAVS EAS integration
# This script replaces the old deploy-contracts.sh with EAS-based deployment

set -e

echo "🚀 Starting WAVS EAS contract deployment..."

# Check for required WAVS service manager address
if [ -z "$WAVS_SERVICE_MANAGER_ADDRESS" ]; then
    if [ -f .nodes/avs_deploy.json ]; then
        echo "📋 Using WAVS_SERVICE_MANAGER_ADDRESS from .nodes/avs_deploy.json"
        export WAVS_SERVICE_MANAGER_ADDRESS=$(jq -r '.addresses.WavsServiceManager' .nodes/avs_deploy.json)
    else
        echo "WAVS_SERVICE_MANAGER_ADDRESS is not set."
        return
    fi
fi

# Get RPC URL and deployer key
export RPC_URL=$(task get-rpc)
export DEPLOYER_PK=$(task config:funded-key)

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
    --private-key "${DEPLOYER_PK}" \
    --broadcast \
    --json > .docker/eas_deploy.json

echo "🏛️  Deploying Governance contracts..."

# Deploy Governance contracts using Foundry script
forge script script/DeployGovernance.s.sol:DeployGovernance \
    --sig 'run(string)' "${WAVS_SERVICE_MANAGER_ADDRESS}" \
    --rpc-url "${RPC_URL}" \
    --private-key "${DEPLOYER_PK}" \
    --broadcast \
    --json > .docker/governance_deploy.json

echo "💰 Deploying Rewards contracts..."

# Deploy Rewards contracts using Foundry script
forge script script/DeployRewards.s.sol:DeployScript \
    --sig 'run(string)' "${WAVS_SERVICE_MANAGER_ADDRESS}" \
    --rpc-url "${RPC_URL}" \
    --private-key "${DEPLOYER_PK}" \
    --broadcast

echo "🎲 Deploying Prediction Market contracts..."

# Deploy Prediction Market contracts using Foundry script
forge script script/DeployPredictionMarket.s.sol:DeployScript \
    --sig 'run(string)' "${WAVS_SERVICE_MANAGER_ADDRESS}" \
    --rpc-url "${RPC_URL}" \
    --private-key "${DEPLOYER_PK}" \
    --broadcast

echo "🔐 Deploying Zodiac-enabled Safes with modules..."

# Deploy Zodiac Safes using Foundry script
forge script script/DeployZodiacSafes.s.sol:DeployZodiacSafes \
    --sig 'run(string)' "${WAVS_SERVICE_MANAGER_ADDRESS}" \
    --rpc-url "${RPC_URL}" \
    --private-key "${DEPLOYER_PK}" \
    --broadcast

# Extract deployed addresses from EAS deployment
export EAS_REGISTRY_ADDR=$(jq -r '.logs[] | select(type == "string" and startswith("SchemaRegistry deployed at:")) | split(": ")[1]' .docker/eas_deploy.json 2>/dev/null || echo "")
export EAS_ADDR=$(jq -r '.logs[] | select(type == "string" and startswith("EAS deployed at:")) | split(": ")[1]' .docker/eas_deploy.json 2>/dev/null || echo "")
export EAS_ATTESTER_ADDR=$(jq -r '.logs[] | select(type == "string" and startswith("Attester deployed at:")) | split(": ")[1]' .docker/eas_deploy.json 2>/dev/null || echo "")
export EAS_SCHEMA_REGISTRAR_ADDR=$(jq -r '.logs[] | select(type == "string" and startswith("SchemaRegistrar deployed at:")) | split(": ")[1]' .docker/eas_deploy.json 2>/dev/null || echo "")
export EAS_INDEXER_ADDR=$(jq -r '.logs[] | select(type == "string" and startswith("Indexer deployed at:")) | split(": ")[1]' .docker/eas_deploy.json 2>/dev/null || echo "")
export EAS_INDEXER_RESOLVER_ADDR=$(jq -r '.logs[] | select(type == "string" and startswith("IndexerResolver deployed at:")) | split(": ")[1]' .docker/eas_deploy.json 2>/dev/null || echo "")
export EAS_ATTEST_TRIGGER_ADDR=$(jq -r '.logs[] | select(type == "string" and startswith("EASAttestTrigger deployed at:")) | split(": ")[1]' .docker/eas_deploy.json 2>/dev/null || echo "")

# Extract schema IDs
export BASIC_SCHEMA_ID=$(jq -r '.logs[] | select(type == "string" and startswith("Basic Schema ID:")) | split(": ")[1]' .docker/eas_deploy.json 2>/dev/null || echo "")
export COMPUTE_SCHEMA_ID=$(jq -r '.logs[] | select(type == "string" and startswith("Compute Schema ID:")) | split(": ")[1]' .docker/eas_deploy.json 2>/dev/null || echo "")
export STATEMENT_SCHEMA_ID=$(jq -r '.logs[] | select(type == "string" and startswith("Statement Schema ID:")) | split(": ")[1]' .docker/eas_deploy.json 2>/dev/null || echo "")
export IS_TRUE_SCHEMA_ID=$(jq -r '.logs[] | select(type == "string" and startswith("IsTrue Schema ID:")) | split(": ")[1]' .docker/eas_deploy.json 2>/dev/null || echo "")
export LIKE_SCHEMA_ID=$(jq -r '.logs[] | select(type == "string" and startswith("Like Schema ID:")) | split(": ")[1]' .docker/eas_deploy.json 2>/dev/null || echo "")
export VOUCHING_SCHEMA_ID=$(jq -r '.logs[] | select(type == "string" and startswith("Vouching Schema ID:")) | split(": ")[1]' .docker/eas_deploy.json 2>/dev/null || echo "")

# Extract deployed addresses from Governance deployment
export VOTING_POWER_ADDR=$(jq -r '.logs[] | select(type == "string" and startswith("VotingPower deployed at:")) | split(": ")[1]' .docker/governance_deploy.json 2>/dev/null || echo "")
export TIMELOCK_ADDR=$(jq -r '.logs[] | select(type == "string" and startswith("TimelockController deployed at:")) | split(": ")[1]' .docker/governance_deploy.json 2>/dev/null || echo "")
export GOVERNOR_ADDR=$(jq -r '.logs[] | select(type == "string" and startswith("AttestationGovernor deployed at:")) | split(": ")[1]' .docker/governance_deploy.json 2>/dev/null || echo "")

# Extract deployed addresses from Rewards deployment
export REWARD_DISTRIBUTOR_ADDR=$(jq -r '.reward_distributor' .docker/rewards_deploy.json 2>/dev/null || echo "")
export REWARD_TOKEN_ADDR=$(jq -r '.reward_token' .docker/rewards_deploy.json 2>/dev/null || echo "")

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
export SAFE2_MERKLE_GOV_MODULE=$(jq -r '.safe2_merkle_gov_module' .docker/zodiac_safes_deploy.json 2>/dev/null || echo "")
export SAFE2_SIGNER_MODULE=$(jq -r '.safe2_signer_module' .docker/zodiac_safes_deploy.json 2>/dev/null || echo "")
export SAFE_SINGLETON=$(jq -r '.safe_singleton' .docker/zodiac_safes_deploy.json 2>/dev/null || echo "")
export SAFE_FACTORY=$(jq -r '.safe_factory' .docker/zodiac_safes_deploy.json 2>/dev/null || echo "")

# Use EAS Attest Trigger as the main service trigger
export SERVICE_TRIGGER_ADDR="${EAS_ATTEST_TRIGGER_ADDR}"

# Create consolidated deployment info
cat > .docker/deployment_summary.json << EOF
{
  "rpc_url": "${RPC_URL}",
  "wavs_service_manager": "${WAVS_SERVICE_MANAGER_ADDRESS}",
  "eas_contracts": {
    "schema_registry": "${EAS_REGISTRY_ADDR}",
    "eas": "${EAS_ADDR}",
    "attester": "${EAS_ATTESTER_ADDR}",
    "schema_registrar": "${EAS_SCHEMA_REGISTRAR_ADDR}",
    "indexer": "${EAS_INDEXER_ADDR}",
    "indexer_resolver": "${EAS_INDEXER_RESOLVER_ADDR}"
  },
  "eas_schemas": {
    "basic_schema": "${BASIC_SCHEMA_ID}",
    "compute_schema": "${COMPUTE_SCHEMA_ID}",
    "statement_schema": "${STATEMENT_SCHEMA_ID}",
    "is_true_schema": "${IS_TRUE_SCHEMA_ID}",
    "like_schema": "${LIKE_SCHEMA_ID}",
    "vouching_schema": "${VOUCHING_SCHEMA_ID}"
  },
  "service_contracts": {
    "trigger": "${SERVICE_TRIGGER_ADDR}"
  },
  "governance_contracts": {
    "voting_power": "${VOTING_POWER_ADDR}",
    "timelock": "${TIMELOCK_ADDR}",
    "governor": "${GOVERNOR_ADDR}"
  },
  "reward_contracts": {
    "reward_distributor": "${REWARD_DISTRIBUTOR_ADDR}",
    "reward_token": "${REWARD_TOKEN_ADDR}"
  },
  "prediction_market_contracts": {
    "oracle_controller": "${PREDICTION_ORACLE_CONTROLLER_ADDR}",
    "factory": "${PREDICTION_FACTORY_ADDR}",
    "collateral_token": "${PREDICTION_COLLATERAL_TOKEN_ADDR}",
    "conditional_tokens": "${PREDICTION_CONDITIONAL_TOKENS_ADDR}",
    "market_maker": "${PREDICTION_MARKET_MAKER_ADDR}"
  },
  "zodiac_safes": {
    "safe_singleton": "${SAFE_SINGLETON}",
    "safe_factory": "${SAFE_FACTORY}",
    "safe1": {
      "address": "${SAFE1_ADDR}",
      "merkle_gov_module": "${SAFE1_MERKLE_GOV_MODULE}",
      "signer_module": "${SAFE1_SIGNER_MODULE}"
    },
    "safe2": {
      "address": "${SAFE2_ADDR}",
      "merkle_gov_module": "${SAFE2_MERKLE_GOV_MODULE}",
      "signer_module": "${SAFE2_SIGNER_MODULE}"
    }
  }
}
EOF

echo "✅ EAS, Governance, and Rewards Deployment Complete!"
echo ""
echo "📋 Deployment Summary:"
echo "   RPC_URL: ${RPC_URL}"
echo "   WAVS_SERVICE_MANAGER_ADDRESS: ${WAVS_SERVICE_MANAGER_ADDRESS}"
echo ""
echo "🏗️  EAS Contracts:"
echo "   EAS_REGISTRY_ADDR: ${EAS_REGISTRY_ADDR}"
echo "   EAS_ADDR: ${EAS_ADDR}"
echo "   EAS_ATTESTER_ADDR: ${EAS_ATTESTER_ADDR}"
echo "   EAS_SCHEMA_REGISTRAR_ADDR: ${EAS_SCHEMA_REGISTRAR_ADDR}"
echo "   EAS_INDEXER_ADDR: ${EAS_INDEXER_ADDR}"
echo "   EAS_INDEXER_RESOLVER_ADDR: ${EAS_INDEXER_RESOLVER_ADDR}"
echo "   EAS_ATTEST_TRIGGER_ADDR: ${EAS_ATTEST_TRIGGER_ADDR}"
echo ""
echo "📋 EAS Schemas:"
echo "   BASIC_SCHEMA_ID: ${BASIC_SCHEMA_ID}"
echo "   COMPUTE_SCHEMA_ID: ${COMPUTE_SCHEMA_ID}"
echo "   STATEMENT_SCHEMA_ID: ${STATEMENT_SCHEMA_ID}"
echo "   IS_TRUE_SCHEMA_ID: ${IS_TRUE_SCHEMA_ID}"
echo "   LIKE_SCHEMA_ID: ${LIKE_SCHEMA_ID}"
echo "   VOUCHING_SCHEMA_ID: ${VOUCHING_SCHEMA_ID}"
echo ""
echo "🏛️  Governance Contracts:"
echo "   VOTING_POWER_ADDR: ${VOTING_POWER_ADDR}"
echo "   TIMELOCK_ADDR: ${TIMELOCK_ADDR}"
echo "   GOVERNOR_ADDR: ${GOVERNOR_ADDR}"
echo ""
echo "🎯 Service Contracts:"
echo "   SERVICE_TRIGGER_ADDR: ${SERVICE_TRIGGER_ADDR}"
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
echo "   Safe 1:"
echo "     Address: ${SAFE1_ADDR}"
echo "     Merkle Gov Module: ${SAFE1_MERKLE_GOV_MODULE}"
echo "     Signer Module: ${SAFE1_SIGNER_MODULE}"
echo "   Safe 2:"
echo "     Address: ${SAFE2_ADDR}"
echo "     Merkle Gov Module: ${SAFE2_MERKLE_GOV_MODULE}"
echo "     Signer Module: ${SAFE2_SIGNER_MODULE}"
echo ""
echo "📄 Deployment details saved to .docker/deployment_summary.json"
echo "📄 EAS deployment logs saved to .docker/eas_deploy.json"
echo "📄 Governance deployment logs saved to .docker/governance_deploy.json"
echo "📄 Rewards deployment details saved to .docker/rewards_deploy.json"
echo "📄 Prediction Market deployment details saved to .docker/prediction_market_deploy.json"
echo "📄 Zodiac Safes deployment details saved to .docker/zodiac_safes_deploy.json"

# Update environment variables for other scripts
export SERVICE_SUBMISSION_ADDR="${EAS_ATTESTER_ADDR}"  # For backwards compatibility

echo ""
echo "🔄 Environment Variables Set:"
echo "   SERVICE_SUBMISSION_ADDR=${SERVICE_SUBMISSION_ADDR} (Attester contract)"
echo "   SERVICE_TRIGGER_ADDR=${SERVICE_TRIGGER_ADDR}"
