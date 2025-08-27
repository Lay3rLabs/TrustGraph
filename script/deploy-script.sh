#!/bin/bash
# set -e
# set -x

STATUS_FILE=".docker/component-upload-status"

# Store the PID of the background process
bash script/upload-components-background.sh &
UPLOAD_PID=$!

# Function to clean up on exit
cleanup() {
    echo "Cleaning up..."
    # Kill the background upload process if it's still running
    if [ -n "$UPLOAD_PID" ] && kill -0 $UPLOAD_PID 2>/dev/null; then
        echo "Terminating background upload process (PID: $UPLOAD_PID)..."
        kill -TERM $UPLOAD_PID 2>/dev/null
        # Give it a moment to terminate gracefully, then force kill if needed
        sleep 1
        kill -9 $UPLOAD_PID 2>/dev/null || true
    fi
    # Clean up the status file
    rm -f "$STATUS_FILE"
    echo "Cleanup complete"
    exit 1
}

# Set up trap to handle Ctrl+C (SIGINT) and other termination signals
trap cleanup INT TERM EXIT


# if RPC_URL is not set, use default by calling command
if [ -z "$RPC_URL" ]; then
    export RPC_URL=$(task get-rpc)
fi
if [ -z "$AGGREGATOR_URL" ]; then
    export AGGREGATOR_URL=http://127.0.0.1:8001
fi

# local: create deployer & auto fund. testnet: create & iterate check balance
bash ./script/create-deployer.sh
export FUNDED_KEY=$(task config:funded-key)

echo "🟢 Deploying POA Service Manager..."
forge script script/DeployPOAServiceManager.s.sol:DeployPOAServiceManager --rpc-url ${RPC_URL} --broadcast
WAVS_SERVICE_MANAGER_ADDRESS=`task config:service-manager-address`
echo "ℹ️ Using WAVS Service Manager address: ${WAVS_SERVICE_MANAGER_ADDRESS}"

### === Deploy Contracts === ###

# Deploy Contracts
source script/deploy-contracts.sh
sleep 1

### === Deploy Services ===

# Require component configuration file
COMPONENT_CONFIGS_FILE="config/components.json"

if [ ! -f "$COMPONENT_CONFIGS_FILE" ]; then
    echo "❌ Component configuration file not found: $COMPONENT_CONFIGS_FILE"
    echo "Please run 'script/configure-components.sh init' to create the configuration."
    exit 1
fi

echo "Using component configuration from: $COMPONENT_CONFIGS_FILE"

export PKG_VERSION="0.1.0"
if [ "$(task get-deploy-status)" = "TESTNET" ]; then
    read -p "Enter the package version (default: ${PKG_VERSION}): " input_pkg_version
    if [ -n "$input_pkg_version" ]; then
        export PKG_VERSION="$input_pkg_version"
    fi
fi

# Testnet: set values (default: local if not set)
if [ "$(task get-deploy-status)" = "TESTNET" ]; then
    export TRIGGER_CHAIN=sepolia
    export SUBMIT_CHAIN=sepolia
fi

# Configure EAS addresses from deployment summary
echo "Configuring EAS addresses from deployment summary..."
export EAS_ADDRESS=$(jq -r '.eas_contracts.eas' .docker/deployment_summary.json)
export INDEXER_ADDRESS=$(jq -r '.eas_contracts.indexer' .docker/deployment_summary.json)
export VOUCHING_SCHEMA_ID=$(jq -r '.eas_schemas.vouching_schema' .docker/deployment_summary.json)

# Determine chain name based on deployment environment
if [ "$(task get-deploy-status)" = "TESTNET" ]; then
    export CHAIN_NAME="sepolia"
else
    export CHAIN_NAME="local"
fi

# Validate EAS addresses were extracted successfully
if [ "$EAS_ADDRESS" = "null" ] || [ -z "$EAS_ADDRESS" ]; then
    echo "❌ Failed to extract EAS address from deployment summary"
    exit 1
fi

if [ "$INDEXER_ADDRESS" = "null" ] || [ -z "$INDEXER_ADDRESS" ]; then
    echo "❌ Failed to extract indexer address from deployment summary"
    exit 1
fi

if [ "$VOUCHING_SCHEMA_ID" = "null" ] || [ -z "$VOUCHING_SCHEMA_ID" ]; then
    echo "❌ Failed to extract vouching schema ID from deployment summary"
    exit 1
fi

echo "✅ EAS Address: ${EAS_ADDRESS}"
echo "✅ Indexer Address: ${INDEXER_ADDRESS}"
echo "✅ Vouching Schema ID: ${VOUCHING_SCHEMA_ID}"
echo "✅ Chain Name: ${CHAIN_NAME}"

export REWARDS_TOKEN_ADDRESS=$(jq -r '.reward_contracts.reward_token' .docker/deployment_summary.json)

# === Prediction Market Oracle ===
export ORACLE_CONTROLLER_ADDRESS=`jq -r '.prediction_market_contracts.oracle_controller' "./.docker/deployment_summary.json"`
export MARKET_MAKER_ADDRESS=`jq -r '.prediction_market_contracts.market_maker' "./.docker/deployment_summary.json"`
export CONDITIONAL_TOKENS_ADDRESS=`jq -r '.prediction_market_contracts.conditional_tokens' "./.docker/deployment_summary.json"`

echo "✅ Oracle Controller Address: ${ORACLE_CONTROLLER_ADDRESS}"
echo "✅ Market Maker Address: ${MARKET_MAKER_ADDRESS}"
echo "✅ Conditional Tokens Address: ${CONDITIONAL_TOKENS_ADDRESS}"
echo "✅ Rewards Token Address: ${REWARDS_TOKEN_ADDRESS}"

# Export additional configuration values that components might need
export PAGERANK_REWARD_POOL="1000000000000000000000"
export PAGERANK_TRUSTED_SEEDS="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
export PAGERANK_TRUST_MULTIPLIER="10.5"
export PAGERANK_TRUST_BOOST="0.99"

echo "📋 All configuration variables exported for component-specific substitution"

# wait for STATUS_FILE to contain the status COMPLETED in its content, check every 0.5 seconds for up to 60 seconds then error
echo "Waiting for component uploads to complete..."
timeout 120 bash -c "while ! grep -q 'COMPLETED' $STATUS_FILE; do sleep 0.5; done"
if [ $? -ne 0 ]; then
    echo "❌ Component uploads did not complete in time or failed."
    exit 1
fi
echo "✅ All components uploaded successfully"
# clear tmp file
rm -f $STATUS_FILE

# Create service with multiple workflows
echo "Creating service with multiple component workflows..."
export COMPONENT_CONFIGS_FILE="$COMPONENT_CONFIGS_FILE"
# All required variables are now exported for component-specific substitution
REGISTRY=`task get-registry` source ./script/build-service.sh
sleep 1



# === Upload service.json to IPFS ===
# local: 127.0.0.1:5001 | testnet: https://app.pinata.cloud/. set PINATA_API_KEY to JWT token in .env
echo "Uploading to IPFS..."
export ipfs_cid=`SERVICE_FILE=.docker/service.json make upload-to-ipfs`
# LOCAL: http://127.0.0.1:8080 | TESTNET: https://gateway.pinata.cloud/
export IPFS_GATEWAY="$(task get-ipfs-gateway)"
export IPFS_URI="ipfs://${ipfs_cid}"
IPFS_URL="${IPFS_GATEWAY}${ipfs_cid}"
echo "IPFS_URL=${IPFS_URL}"

echo "Querying to verify IPFS upload... (120 second timeout)"
curl ${IPFS_URL} --connect-timeout 120 --max-time 120 --show-error --fail

if [ "$FUNDED_KEY" ]; then
    echo ""
    echo "Setting service URI on WAVS Service Manager..."
    cast send ${WAVS_SERVICE_MANAGER_ADDRESS} 'setServiceURI(string)' "${IPFS_URI}" -r ${RPC_URL} --private-key ${FUNDED_KEY}
fi

echo "IPFS_GATEWAY=${IPFS_GATEWAY}"
echo "IPFS_URI=${IPFS_URI}"

sleep 1

### === Create Aggregator ===

bash ./script/create-aggregator.sh 1
IPFS_GATEWAY=${IPFS_GATEWAY} bash ./infra/aggregator-1/start.sh
sleep 3
curl -s -H "Content-Type: application/json" -d "{
  \"service_manager\": {
    \"evm\": {
      \"chain_name\": \"${CHAIN_NAME}\",
      \"address\": \"${WAVS_SERVICE_MANAGER_ADDRESS}\"
    }
  }
}" ${AGGREGATOR_URL}/register-service

### === Start WAVS ===
bash ./script/create-operator.sh 1
IPFS_GATEWAY=${IPFS_GATEWAY} bash ./infra/wavs-1/start.sh
sleep 3

# Deploy the service JSON to WAVS so it now watches and submits.
# 'opt in' for WAVS to watch (this is before we register to Eigenlayer)
WAVS_ENDPOINT=http://127.0.0.1:8000 SERVICE_URL=${IPFS_URI} IPFS_GATEWAY=${IPFS_GATEWAY} make deploy-service

### === Register service specific operator ===

# OPERATOR_PRIVATE_KEY, AVS_SIGNING_ADDRESS
eval "$(task setup-avs-signing HD_INDEX=1 | tail -4)"

# TODO: move this check into the middleware (?)
if [ "$(task get-deploy-status)" = "TESTNET" ]; then
    export OPERATOR_ADDRESS=$(cast wallet address --private-key ${OPERATOR_PRIVATE_KEY})
    while true; do
        BALANCE=$(cast balance ${OPERATOR_ADDRESS} --rpc-url ${RPC_URL} --ether)
        if [ "$BALANCE" != "0" ]; then
            echo "OPERATOR_ADDRESS has balance: $BALANCE"
            break
        else
            echo "Waiting for ${OPERATOR_ADDRESS} (operator) to have a balance..."
            sleep 5
        fi
    done
fi

# Reset registry after deployment is complete
echo "Cleaning up registry data..."
REGISTRY=`task get-registry`
if [ -n "$REGISTRY" ]; then
    PROTOCOL="https"
    if [[ "$REGISTRY" == *"localhost"* ]] || [[ "$REGISTRY" == *"127.0.0.1"* ]]; then
        PROTOCOL="http"
    fi
    warg reset --registry ${PROTOCOL}://${REGISTRY} || echo "Registry reset failed (non-critical)"
fi

# Remove trap for normal exit
trap - INT TERM EXIT

echo "✅ Deployment complete!"
