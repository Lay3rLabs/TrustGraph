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
POA_MIDDLEWARE="docker run --rm --network host -v ./.nodes:/root/.nodes --env-file .env ghcr.io/lay3rlabs/poa-middleware:0.2.1"
$POA_MIDDLEWARE deploy
$POA_MIDDLEWARE owner_operation updateStakeThreshold 100
$POA_MIDDLEWARE owner_operation updateQuorum 2 3
cast rpc anvil_mine --rpc-url $(task get-rpc) 2&> /dev/null # required for the checkpoint stuff, ref: aurtur / https://github.com/Lay3rLabs/EN0VA/pull/31/commits/d205e9c65f91fb5b0b5bca672d8d28d6c7f672f9#diff-e3d8246ec3421fa3a204fe7a8f0586acfad4888ae82f5b8c6d130cb907705c80R75-R78

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

export INDEXER_ADDRESS=$(jq -r '.wavs_indexer' .docker/deployment_summary.json)

# Configure EAS addresses from deployment summary
echo "Configuring EAS addresses from deployment summary..."
export EAS_ADDRESS=$(jq -r '.eas.contracts.eas' .docker/deployment_summary.json)
export RECOGNITION_SCHEMA_UID=$(jq -r '.eas.schemas.recognition.uid' .docker/deployment_summary.json)
export VOUCHING_SCHEMA_UID=$(jq -r '.eas.schemas.vouching.uid' .docker/deployment_summary.json)

# Determine chain name based on deployment environment
if [ "$(task get-deploy-status)" = "TESTNET" ]; then
    export CHAIN_NAME="evm:11155111"
else
    export CHAIN_NAME="evm:31337"
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

if [ "$RECOGNITION_SCHEMA_UID" = "null" ] || [ -z "$RECOGNITION_SCHEMA_UID" ]; then
    echo "❌ Failed to extract recognition schema UID from deployment summary"
    exit 1
fi

if [ "$VOUCHING_SCHEMA_UID" = "null" ] || [ -z "$VOUCHING_SCHEMA_UID" ]; then
    echo "❌ Failed to extract vouching schema UID from deployment summary"
    exit 1
fi

echo "✅ EAS Address: ${EAS_ADDRESS}"
echo "✅ Indexer Address: ${INDEXER_ADDRESS}"
echo "✅ Recognition Schema UID: ${RECOGNITION_SCHEMA_UID}"
echo "✅ Vouching Schema UID: ${VOUCHING_SCHEMA_UID}"
echo "✅ Chain Name: ${CHAIN_NAME}"

export REWARDS_TOKEN_ADDRESS=$(jq -r '.merkler.reward_token' .docker/deployment_summary.json)

# === Prediction Market Oracle ===
export ORACLE_CONTROLLER_ADDRESS=`jq -r '.prediction_market.oracle_controller' "./.docker/deployment_summary.json"`
export MARKET_MAKER_ADDRESS=`jq -r '.prediction_market.market_maker' "./.docker/deployment_summary.json"`
export CONDITIONAL_TOKENS_ADDRESS=`jq -r '.prediction_market.conditional_tokens' "./.docker/deployment_summary.json"`

echo "✅ Oracle Controller Address: ${ORACLE_CONTROLLER_ADDRESS}"
echo "✅ Market Maker Address: ${MARKET_MAKER_ADDRESS}"
echo "✅ Conditional Tokens Address: ${CONDITIONAL_TOKENS_ADDRESS}"
echo "✅ Rewards Token Address: ${REWARDS_TOKEN_ADDRESS}"

# Export additional configuration values that components might need
export PAGERANK_REWARD_POOL="1000000000000000000000"
export PAGERANK_TRUSTED_SEEDS="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
export PAGERANK_TRUST_MULTIPLIER="10.5"
export PAGERANK_TRUST_BOOST="0.99"

# Zodiac Module Configuration values
export SIGNER_MANAGER_ZODIAC_MODULE=`jq -r '.zodiac_safes.safe1.signer_module' "./.docker/deployment_summary.json"`

echo "📋 All configuration variables exported for component-specific substitution"

# wait for STATUS_FILE to contain the status COMPLETED in its content, check every 0.5 seconds for up to 60 seconds then error
echo "Waiting for component uploads to complete..."
timeout 300 bash -c "
    trap 'exit 130' INT TERM
    while ! grep -q 'COMPLETED' '$STATUS_FILE' 2>/dev/null; do
        sleep 0.5
    done
"
if [ $? -ne 0 ]; then
    echo "❌ Component uploads did not complete in time or failed."
    exit 1
fi
echo "✅ All components uploaded successfully"
# clear tmp file
rm -f $STATUS_FILE

echo "Waiting for 5 seconds for registry to update..."
sleep 7

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
curl -s -X POST -H "Content-Type: application/json" -d "{
  \"service_manager\": {
    \"evm\": {
      \"chain\": \"${CHAIN_NAME}\",
      \"address\": \"${WAVS_SERVICE_MANAGER_ADDRESS}\"
    }
  }
}" ${AGGREGATOR_URL}/services

### === Start WAVS ===
bash ./script/create-operator.sh 1
IPFS_GATEWAY=${IPFS_GATEWAY} bash ./infra/wavs-1/start.sh
sleep 3

# Deploy the service JSON to WAVS so it now watches and submits.
# 'opt in' for WAVS to watch (this is before we register to Eigenlayer)
WAVS_ENDPOINT=http://127.0.0.1:8000 SERVICE_URL=${IPFS_URI} IPFS_GATEWAY=${IPFS_GATEWAY} make deploy-service
sleep 3

export SERVICE_ID=${SERVICE_ID:-`task config:service-id`}
if [ -z "$SERVICE_ID" ]; then
    echo "❌ Failed to retrieve service ID"
    exit 1
fi
echo "✅ Service ID: ${SERVICE_ID}"

# Update the deployment summary with the service ID
jq ".service_id = \"${SERVICE_ID}\"" .docker/deployment_summary.json > .docker/deployment_summary.json.tmp
mv .docker/deployment_summary.json.tmp .docker/deployment_summary.json

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

# if post-deploy.sh exists, run it
if [ -f "script/post-deploy.sh" ]; then
    echo "Running post-deploy.sh..."
    bash script/post-deploy.sh

    echo "✅ post-deploy.sh completed!"
fi
