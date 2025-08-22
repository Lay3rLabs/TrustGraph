#!/bin/bash

# set -x

: '''
# Run:

sh ./build_service.sh

# Overrides:
- FILE_LOCATION: The save location of the configuration file
- TRIGGER_ADDRESS: The address to trigger the service
- SUBMIT_ADDRESS: The address to submit the service
- TRIGGER_EVENT: The event to trigger the service (e.g. "NewTrigger(bytes)")
- FUEL_LIMIT: The fuel limit (wasm compute metering) for the service
- MAX_GAS: The maximum chain gas for the submission Tx
'''

# == Defaults ==

FUEL_LIMIT=${FUEL_LIMIT:-1000000000000}
MAX_GAS=${MAX_GAS:-5000000}
FILE_LOCATION=${FILE_LOCATION:-".docker/service.json"}
TRIGGER_EVENT=${TRIGGER_EVENT:-"AttestationRequested(address,bytes32,address,bytes)"}
TRIGGER_CHAIN=${TRIGGER_CHAIN:-"local"}
SUBMIT_CHAIN=${SUBMIT_CHAIN:-"local"}
AGGREGATOR_URL=${AGGREGATOR_URL:-""}
DEPLOY_ENV=${DEPLOY_ENV:-""}
REGISTRY=${REGISTRY:-"wa.dev"}
CONFIG_VALUES=${CONFIG_VALUES:-"key=value,key2=value2"}

# Display configuration being applied
if [[ "$CONFIG_VALUES" == *"eas_address"* ]]; then
    echo "📋 Applying EAS configuration: ${CONFIG_VALUES}"
else
    echo "⚠️  Using default configuration values (EAS addresses not configured): ${CONFIG_VALUES}"
fi

BASE_CMD="docker run --rm --network host -w /data -v $(pwd):/data ghcr.io/lay3rlabs/wavs:35c96a4 wavs-cli service --json true --home /data --file /data/${FILE_LOCATION}"

if [ -z "$WAVS_SERVICE_MANAGER_ADDRESS" ]; then
    export WAVS_SERVICE_MANAGER_ADDRESS=$(jq -r .addresses.WavsServiceManager ./.nodes/avs_deploy.json)
    if [ -z "$WAVS_SERVICE_MANAGER_ADDRESS" ]; then
        echo "WAVS_SERVICE_MANAGER_ADDRESS is not set. Please set it to the address of the service manager."
        return
    fi
fi

if [ -z "$TRIGGER_ADDRESS" ]; then
    TRIGGER_ADDRESS=`jq -r '.service_contracts.trigger' .docker/deployment_summary.json`
fi
if [ -z "$SUBMIT_ADDRESS" ]; then
    SUBMIT_ADDRESS=`jq -r '.eas_contracts.attester' .docker/deployment_summary.json`
fi
if [ -z "$DEPLOY_ENV" ]; then
    DEPLOY_ENV=$(sh ./script/get-deploy-status.sh)
fi
# === Core ===

# Get PKG_NAMESPACE
if [ -z "$PKG_NAMESPACE" ]; then
    export PKG_NAMESPACE=`bash ./script/get-wasi-namespace.sh`
    if [ -z "$PKG_NAMESPACE" ]; then
        echo "PKG_NAMESPACE is not set. Please set the PKG_NAMESPACE environment variable."
        exit 1
    fi
fi

TRIGGER_EVENT_HASH=`cast keccak ${TRIGGER_EVENT}`

export SERVICE_ID=`eval "${BASE_CMD} init --name demo" | jq -r .service.id`
echo "Service ID: ${SERVICE_ID}"

# Process component configurations from JSON file
if [ -z "${COMPONENT_CONFIGS_FILE}" ] || [ ! -f "${COMPONENT_CONFIGS_FILE}" ]; then
    echo "❌ Component configuration file not found: ${COMPONENT_CONFIGS_FILE}"
    echo "Please run 'script/configure-components.sh init' to create the configuration."
    exit 1
fi

echo "Reading component configurations from JSON file..."
jq -r '.components[] | @json' "${COMPONENT_CONFIGS_FILE}" | while read -r component; do
    COMP_FILENAME=$(echo "$component" | jq -r '.filename')
    COMP_PKG_NAME=$(echo "$component" | jq -r '.package_name')
    COMP_PKG_VERSION=$(echo "$component" | jq -r '.package_version')
    COMP_TRIGGER_EVENT=$(echo "$component" | jq -r '.trigger_event')
    COMP_TRIGGER_JSON_PATH=$(echo "$component" | jq -r '.trigger_json_path')
    COMP_SUBMIT_JSON_PATH=$(echo "$component" | jq -r '.submit_json_path')

    # Extract addresses from JSON paths
    COMP_TRIGGER_ADDRESS=`jq -r ".${COMP_TRIGGER_JSON_PATH}" .docker/deployment_summary.json`
    COMP_SUBMIT_ADDRESS=`jq -r ".${COMP_SUBMIT_JSON_PATH}" .docker/deployment_summary.json`

    # The key COMP_SUBMIT_JSON_PATH may not be found in the deployment_summary (i.e. a typo). Make sure it exists. If it doesn't then return an error.
    if [ -z "$COMP_TRIGGER_ADDRESS" ] || [ "$COMP_TRIGGER_ADDRESS" == "null" ]; then
        echo "❌ Trigger address not found for component: ${COMP_FILENAME} at path: ${COMP_TRIGGER_JSON_PATH}"
        exit 1
    fi
    if [ -z "$COMP_SUBMIT_ADDRESS" ] || [ "$COMP_SUBMIT_ADDRESS" == "null" ]; then
        echo "❌ Submit address not found for component: ${COMP_FILENAME} at path: ${COMP_SUBMIT_JSON_PATH}"
        exit 1
    fi

    COMP_TRIGGER_EVENT_HASH=`cast keccak ${COMP_TRIGGER_EVENT}`

    echo "Creating workflow for component: ${COMP_FILENAME}"
    echo "  Package: ${PKG_NAMESPACE}:${COMP_PKG_NAME}@${COMP_PKG_VERSION}"
    echo "  Trigger: ${COMP_TRIGGER_ADDRESS} (${COMP_TRIGGER_EVENT})"
    echo "  Submit: ${COMP_SUBMIT_ADDRESS}"

    WORKFLOW_ID=`eval "$BASE_CMD workflow add" | jq -r .workflow_id`
    echo "  Workflow ID: ${WORKFLOW_ID}"

    eval "$BASE_CMD workflow trigger --id ${WORKFLOW_ID} set-evm --address ${COMP_TRIGGER_ADDRESS} --chain-name ${TRIGGER_CHAIN} --event-hash ${COMP_TRIGGER_EVENT_HASH}" > /dev/null

    # If no aggregator is set, use the default
    SUB_CMD="set-evm"
    if [ -n "$AGGREGATOR_URL" ]; then
        SUB_CMD="set-aggregator --url ${AGGREGATOR_URL}"
    fi
    eval "$BASE_CMD workflow submit --id ${WORKFLOW_ID} ${SUB_CMD} --address ${COMP_SUBMIT_ADDRESS} --chain-name ${SUBMIT_CHAIN} --max-gas ${MAX_GAS}" > /dev/null
    eval "$BASE_CMD workflow component --id ${WORKFLOW_ID} set-source-registry --domain ${REGISTRY} --package ${PKG_NAMESPACE}:${COMP_PKG_NAME} --version ${COMP_PKG_VERSION}"

    eval "$BASE_CMD workflow component --id ${WORKFLOW_ID} permissions --http-hosts '*' --file-system true" > /dev/null
    eval "$BASE_CMD workflow component --id ${WORKFLOW_ID} time-limit --seconds 30" > /dev/null
    # Set component-specific environment variables
    if [ "$COMP_PKG_NAME" = "rewards" ]; then
        eval "$BASE_CMD workflow component --id ${WORKFLOW_ID} env --values WAVS_ENV_SOME_SECRET,WAVS_ENV_PINATA_API_URL,WAVS_ENV_PINATA_API_KEY" > /dev/null
    else
        eval "$BASE_CMD workflow component --id ${WORKFLOW_ID} env --values WAVS_ENV_SOME_SECRET" > /dev/null
    fi

    echo "  📋 Configuring component with: ${CONFIG_VALUES}"
    eval "$BASE_CMD workflow component --id ${WORKFLOW_ID} config --values \"${CONFIG_VALUES}\"" > /dev/null
    eval "$BASE_CMD workflow component --id ${WORKFLOW_ID} fuel-limit --fuel ${FUEL_LIMIT}" > /dev/null

    echo "  ✅ Workflow configured for ${COMP_FILENAME}"
done

eval "$BASE_CMD manager set-evm --chain-name ${SUBMIT_CHAIN} --address `cast --to-checksum ${WAVS_SERVICE_MANAGER_ADDRESS}`" > /dev/null
eval "$BASE_CMD validate" > /dev/null

echo "Configuration file created ${FILE_LOCATION}. Watching events from '${TRIGGER_CHAIN}' & submitting to '${SUBMIT_CHAIN}'."
