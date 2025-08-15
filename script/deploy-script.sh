#!/bin/bash
# set -e

if [ ! -d compiled/ ] || [ -z "$(find compiled/ -name '*.wasm')" ]; then
    echo "No WASM files found in compiled/. Building components."
    make wasi-build
fi

if git status --porcelain | grep -q "^.* components/"; then
    echo "Found pending changes in components/*, building"
    WASI_BUILD_DIR=components/eas-attest make wasi-build
fi

### === Deploy Eigenlayer ===
# if RPC_URL is not set, use default by calling command
if [ -z "$RPC_URL" ]; then
    export RPC_URL=$(bash ./script/get-rpc-url.sh)
fi
if [ -z "$AGGREGATOR_URL" ]; then
    export AGGREGATOR_URL=http://127.0.0.1:8001
fi

# local: create deployer & auto fund. testnet: create & iterate check balance
bash ./script/create-deployer.sh
export DEPLOYER_PK=$(cat .nodes/deployer)
sleep 1

## Deploy Eigenlayer from Deployer
COMMAND=deploy make wavs-middleware
sleep 1

### === Deploy Contracts === ###

# Deploy Contracts
source script/deploy-contracts.sh
sleep 1

### === Deploy Services ===

# Require component configuration file
COMPONENT_CONFIGS_FILE=".docker/components-config.json"

if [ ! -f "$COMPONENT_CONFIGS_FILE" ]; then
    echo "❌ Component configuration file not found: $COMPONENT_CONFIGS_FILE"
    echo "Please run 'script/configure-components.sh init' to create the configuration."
    exit 1
fi

echo "Using component configuration from: $COMPONENT_CONFIGS_FILE"

export PKG_VERSION="0.1.0"
if [ "$(sh ./script/get-deploy-status.sh)" = "TESTNET" ]; then
    read -p "Enter the package version (default: ${PKG_VERSION}): " input_pkg_version
    if [ -n "$input_pkg_version" ]; then
        export PKG_VERSION="$input_pkg_version"
    fi
fi

# Testnet: set values (default: local if not set)
if [ "$(sh ./script/get-deploy-status.sh)" = "TESTNET" ]; then
    export TRIGGER_CHAIN=holesky
    export SUBMIT_CHAIN=holesky
fi

# Configure EAS addresses from deployment summary
echo "Configuring EAS addresses from deployment summary..."
EAS_ADDRESS=$(jq -r '.eas_contracts.eas' .docker/deployment_summary.json)
INDEXER_ADDRESS=$(jq -r '.eas_contracts.indexer' .docker/deployment_summary.json)
COMPUTE_SCHEMA_ID=$(jq -r '.eas_schemas.compute_schema' .docker/deployment_summary.json)

# Determine chain name based on deployment environment
if [ "$(sh ./script/get-deploy-status.sh)" = "TESTNET" ]; then
    CHAIN_NAME="holesky"
else
    CHAIN_NAME="local"
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

if [ "$COMPUTE_SCHEMA_ID" = "null" ] || [ -z "$COMPUTE_SCHEMA_ID" ]; then
    echo "❌ Failed to extract compute schema ID from deployment summary"
    exit 1
fi

echo "✅ EAS Address: ${EAS_ADDRESS}"
echo "✅ Indexer Address: ${INDEXER_ADDRESS}"
echo "✅ Compute Schema ID: ${COMPUTE_SCHEMA_ID}"
echo "✅ Chain Name: ${CHAIN_NAME}"

REWARDS_TOKEN_ADDRESS=$(jq -r '.reward_contracts.reward_token' .docker/deployment_summary.json)

# Set CONFIG_VALUES with EAS configuration and rewards token address
export CONFIG_VALUES="eas_address=${EAS_ADDRESS},indexer_address=${INDEXER_ADDRESS},chain_name=${CHAIN_NAME},reward_token=${REWARDS_TOKEN_ADDRESS},reward_schema_uid=${COMPUTE_SCHEMA_ID}"
echo "📋 EAS Configuration: ${CONFIG_VALUES}"

# Upload components to WASI registry
echo "Uploading components to WASI registry..."
jq -r '.components[] | @json' "$COMPONENT_CONFIGS_FILE" | while read -r component; do
    export COMPONENT_FILENAME=$(echo "$component" | jq -r '.filename')
    export PKG_NAME=$(echo "$component" | jq -r '.package_name')
    export PKG_VERSION=$(echo "$component" | jq -r '.package_version')

    if [ "$(sh ./script/get-deploy-status.sh)" = "TESTNET" ]; then
        read -p "Upload component ${COMPONENT_FILENAME} with package name (default: ${PKG_NAME}): " input_pkg_name
        if [ -n "$input_pkg_name" ]; then
            export PKG_NAME="$input_pkg_name"
        fi
    fi

    echo "Uploading ${COMPONENT_FILENAME} as ${PKG_NAME}..."
    # ** Testnet Setup: https://wa.dev/account/credentials/new -> warg login
    source script/upload-to-wasi-registry.sh || true
    sleep 1
done

# Create service with multiple workflows
echo "Creating service with multiple component workflows..."
export COMPONENT_CONFIGS_FILE="$COMPONENT_CONFIGS_FILE"
REGISTRY=`bash ./script/get-registry.sh` source ./script/build-service.sh
sleep 1



# === Upload service.json to IPFS ===
# local: 127.0.0.1:5001 | testnet: https://app.pinata.cloud/. set PINATA_API_KEY to JWT token in .env
echo "Uploading to IPFS..."
export ipfs_cid=`SERVICE_FILE=.docker/service.json make upload-to-ipfs`
# LOCAL: http://127.0.0.1:8080 | TESTNET: https://gateway.pinata.cloud/
export IPFS_GATEWAY="$(bash script/get-ipfs-gateway.sh)"
export IPFS_URI="ipfs://${ipfs_cid}"
IPFS_URL="${IPFS_GATEWAY}${ipfs_cid}"
echo "IPFS_URL=${IPFS_URL}"

echo "Querying to verify IPFS upload... (120 second timeout)"
curl ${IPFS_URL} --connect-timeout 120 --max-time 120 --show-error --fail

if [ "$DEPLOYER_PK" ]; then
    echo ""
    echo "Setting service URI on WAVS Service Manager..."
    cast send ${WAVS_SERVICE_MANAGER_ADDRESS} 'setServiceURI(string)' "${IPFS_URI}" -r ${RPC_URL} --private-key ${DEPLOYER_PK}
fi

echo "IPFS_GATEWAY=${IPFS_GATEWAY}"
echo "IPFS_URI=${IPFS_URI}"

sleep 1

### === Create Aggregator ===

bash ./script/create-aggregator.sh 1
IPFS_GATEWAY=${IPFS_GATEWAY} bash ./infra/aggregator-1/start.sh
sleep 5
wget -q --header="Content-Type: application/json" --post-data="{\"uri\": \"${IPFS_URI}\"}" ${AGGREGATOR_URL}/register-service -O -

### === Start WAVS ===
bash ./script/create-operator.sh 1
IPFS_GATEWAY=${IPFS_GATEWAY} bash ./infra/wavs-1/start.sh
sleep 10

# Deploy the service JSON to WAVS so it now watches and submits.
# 'opt in' for WAVS to watch (this is before we register to Eigenlayer)
WAVS_ENDPOINT=http://127.0.0.1:8000 SERVICE_URL=${IPFS_URI} IPFS_GATEWAY=${IPFS_GATEWAY} make deploy-service

### === Register service specific operator ===

# OPERATOR_PRIVATE_KEY, AVS_SIGNING_ADDRESS
SERVICE_INDEX=0 source ./script/avs-signing-key.sh

# TODO: move this check into the middleware (?)
if [ "$(sh ./script/get-deploy-status.sh)" = "TESTNET" ]; then
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

export WAVS_SERVICE_MANAGER_ADDRESS=$(jq -r .addresses.WavsServiceManager ./.nodes/avs_deploy.json)
COMMAND="register ${OPERATOR_PRIVATE_KEY} ${AVS_SIGNING_ADDRESS} 0.001ether" make wavs-middleware

# Verify registration
COMMAND="list_operators" PAST_BLOCKS=500 make wavs-middleware

# Reset registry after deployment is complete
echo "Cleaning up registry data..."
REGISTRY=`bash ./script/get-registry.sh`
if [ -n "$REGISTRY" ]; then
    PROTOCOL="https"
    if [[ "$REGISTRY" == *"localhost"* ]] || [[ "$REGISTRY" == *"127.0.0.1"* ]]; then
        PROTOCOL="http"
    fi
    warg reset --registry ${PROTOCOL}://${REGISTRY} || echo "Registry reset failed (non-critical)"
fi

echo "✅ Deployment complete!"
