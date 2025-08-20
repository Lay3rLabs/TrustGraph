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
export RPC_URL=$(bash ./script/get-rpc.sh)
export DEPLOYER_PK=$(cat .nodes/deployer)

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

# Extract reward distributor address for MerkleGov deployment
export REWARD_DISTRIBUTOR_ADDR=$(jq -r '.reward_distributor' .docker/rewards_deploy.json 2>/dev/null || echo "")

echo "🗳️  Deploying Merkle Governance contracts..."

# Deploy MerkleGov contracts using Foundry script
forge script script/DeployMerkleGov.s.sol:DeployScript \
    --sig 'run(string,string)' "${WAVS_SERVICE_MANAGER_ADDRESS}" "${REWARD_DISTRIBUTOR_ADDR}" \
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

# Extract deployed addresses from MerkleGov deployment
export MERKLE_VOTE_ADDR=$(jq -r '.merkle_vote' .docker/merkle_gov_deploy.json 2>/dev/null || echo "")
export MERKLE_GOV_ADDR=$(jq -r '.merkle_gov' .docker/merkle_gov_deploy.json 2>/dev/null || echo "")

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
  "merkle_governance_contracts": {
    "merkle_vote": "${MERKLE_VOTE_ADDR}",
    "merkle_gov": "${MERKLE_GOV_ADDR}"
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
echo "🗳️  Merkle Governance Contracts:"
echo "   MERKLE_VOTE_ADDR: ${MERKLE_VOTE_ADDR}"
echo "   MERKLE_GOV_ADDR: ${MERKLE_GOV_ADDR}"
echo ""
echo "📄 Deployment details saved to .docker/deployment_summary.json"
echo "📄 EAS deployment logs saved to .docker/eas_deploy.json"
echo "📄 Governance deployment logs saved to .docker/governance_deploy.json"
echo "📄 Rewards deployment details saved to .docker/rewards_deploy.json"
echo "📄 Merkle Governance deployment details saved to .docker/merkle_gov_deploy.json"

# Update environment variables for other scripts
export SERVICE_SUBMISSION_ADDR="${EAS_ATTESTER_ADDR}"  # For backwards compatibility

echo ""
echo "🔄 Environment Variables Set:"
echo "   SERVICE_SUBMISSION_ADDR=${SERVICE_SUBMISSION_ADDR} (Attester contract)"
echo "   SERVICE_TRIGGER_ADDR=${SERVICE_TRIGGER_ADDR}"
