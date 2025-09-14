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
WAVS_SERVICE_MANAGER_ADDRESS=${WAVS_SERVICE_MANAGER_ADDRESS:-`task config:service-manager-address`}

# Function to substitute variables in config values
substitute_config_vars() {
    local config_str="$1"

    # Replace all ${VAR_NAME} patterns with their environment variable values
    while [[ "$config_str" =~ \$\{([^}]+)\} ]]; do
        var_name="${BASH_REMATCH[1]}"
        var_value="${!var_name}"
        if [ -z "$var_value" ]; then
            echo "⚠️  Warning: Variable ${var_name} is not set, using empty string" >&2
            var_value=""
        fi
        config_str="${config_str//\$\{${var_name}\}/${var_value}}"
    done

    echo "$config_str"
}

# Function to build config string from JSON object
build_config_string() {
    local config_json="$1"
    local config_str=""

    if [ -n "$config_json" ] && [ "$config_json" != "null" ] && [ "$config_json" != "{}" ]; then
        # Process each key-value pair
        while IFS= read -r line; do
            if [ -n "$config_str" ]; then
                config_str="${config_str},"
            fi
            key=$(echo "$line" | jq -r '.key')
            value=$(echo "$line" | jq -r '.value')
            # Substitute variables in the value
            value=$(substitute_config_vars "$value")
            config_str="${config_str}${key}=${value}"
        done < <(echo "$config_json" | jq -c 'to_entries[]')
    fi

    echo "$config_str"
}

# Function to build environment variables string
build_env_string() {
    local env_json="$1"
    local env_str=""

    if [ -n "$env_json" ] && [ "$env_json" != "null" ] && [ "$env_json" != "[]" ]; then
        # Process each environment variable
        while IFS= read -r env_var; do
            env_var=$(echo "$env_var" | jq -r '.')
            if [ -n "$env_str" ]; then
                env_str="${env_str},"
            fi
            env_str="${env_str}${env_var}"
        done < <(echo "$env_json" | jq -c '.[]')
    fi

    echo "$env_str"
}

BASE_CMD="docker run --rm --network host -w /data -v $(pwd):/data ghcr.io/lay3rlabs/wavs:0.5.5 wavs-cli service --json true --home /data --file /data/${FILE_LOCATION}"

if [ -z "$WAVS_SERVICE_MANAGER_ADDRESS" ]; then
    export WAVS_SERVICE_MANAGER_ADDRESS=$(jq -r '.contract' .docker/poa_sm_deploy.json)
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
    DEPLOY_ENV=$(task get-deploy-status)
fi

# === Core ===

# Get PKG_NAMESPACE
if [ -z "$PKG_NAMESPACE" ]; then
    export PKG_NAMESPACE=`task get-wasi-namespace`
    if [ -z "$PKG_NAMESPACE" ]; then
        echo "PKG_NAMESPACE is not set. Please set the PKG_NAMESPACE environment variable."
        exit 1
    fi
fi

TRIGGER_EVENT_HASH=`cast keccak ${TRIGGER_EVENT}`

eval "${BASE_CMD} init --name demo"

# Process component configurations from JSON file
if [ -z "${COMPONENT_CONFIGS_FILE}" ] || [ ! -f "${COMPONENT_CONFIGS_FILE}" ]; then
    # Try default location
    COMPONENT_CONFIGS_FILE="config/components.json"
    if [ ! -f "${COMPONENT_CONFIGS_FILE}" ]; then
        # Try .docker location
        COMPONENT_CONFIGS_FILE=".docker/components-config.json"
        if [ ! -f "${COMPONENT_CONFIGS_FILE}" ]; then
            echo "❌ Component configuration file not found"
            echo "Please specify COMPONENT_CONFIGS_FILE or ensure config/components.json or .docker/components-config.json exists"
            exit 1
        fi
    fi
fi

echo "Reading component configurations from: ${COMPONENT_CONFIGS_FILE}"

# Export all required variables that might be used in config value substitutions
# These should be set by deploy-script.sh before calling this script
echo "📋 Available configuration variables:"
[ -n "${EAS_ADDRESS}" ] && echo "  EAS_ADDRESS: ${EAS_ADDRESS}"
[ -n "${INDEXER_ADDRESS}" ] && echo "  INDEXER_ADDRESS: ${INDEXER_ADDRESS}"
[ -n "${VOUCHING_SCHEMA_ID}" ] && echo "  VOUCHING_SCHEMA_ID: ${VOUCHING_SCHEMA_ID}"
[ -n "${CHAIN_NAME}" ] && echo "  CHAIN_NAME: ${CHAIN_NAME}"
[ -n "${REWARDS_TOKEN_ADDRESS}" ] && echo "  REWARDS_TOKEN_ADDRESS: ${REWARDS_TOKEN_ADDRESS}"
[ -n "${MARKET_MAKER_ADDRESS}" ] && echo "  MARKET_MAKER_ADDRESS: ${MARKET_MAKER_ADDRESS}"
[ -n "${CONDITIONAL_TOKENS_ADDRESS}" ] && echo "  CONDITIONAL_TOKENS_ADDRESS: ${CONDITIONAL_TOKENS_ADDRESS}"
echo ""

jq -c '.components[]' "${COMPONENT_CONFIGS_FILE}" | while IFS= read -r component; do
    COMP_FILENAME=$(echo "$component" | jq -r '.filename')
    COMP_PKG_NAME=$(echo "$component" | jq -r '.package_name')
    COMP_PKG_VERSION=$(echo "$component" | jq -r '.package_version')
    COMP_TRIGGER_EVENT=$(echo "$component" | jq -r '.trigger_event')
    COMP_TRIGGER_JSON_PATH=$(echo "$component" | jq -r '.trigger_json_path')
    COMP_SUBMIT_JSON_PATH=$(echo "$component" | jq -r '.submit_json_path')

    # Extract component-specific config values and env variables
    COMP_CONFIG_VALUES=$(echo "$component" | jq '.config_values // {}')
    COMP_ENV_VARIABLES=$(echo "$component" | jq '.env_variables // []')

    # Extract addresses from JSON paths
    COMP_TRIGGER_ADDRESS=`jq -r ".${COMP_TRIGGER_JSON_PATH}" .docker/deployment_summary.json`
    COMP_SUBMIT_ADDRESS=`jq -r ".${COMP_SUBMIT_JSON_PATH}" .docker/deployment_summary.json`

    # Validate addresses
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
    ENV_STRING=$(build_env_string "$COMP_ENV_VARIABLES")
    if [ -n "$ENV_STRING" ]; then
        echo "  📋 Setting environment variables: ${ENV_STRING}"
        eval "$BASE_CMD workflow component --id ${WORKFLOW_ID} env --values \"${ENV_STRING}\"" > /dev/null
    else
        # Default env variables if none specified
        echo "  📋 Setting default environment variables"
        eval "$BASE_CMD workflow component --id ${WORKFLOW_ID} env --values WAVS_ENV_SOME_SECRET" > /dev/null
    fi

    # Set component-specific config values
    CONFIG_STRING=$(build_config_string "$COMP_CONFIG_VALUES")
    if [ -n "$CONFIG_STRING" ]; then
        echo "  📋 Configuring component with: ${CONFIG_STRING}"
        eval "$BASE_CMD workflow component --id ${WORKFLOW_ID} config --values \"${CONFIG_STRING}\"" > /dev/null
    else
        echo "  ⚠️  No configuration values specified for ${COMP_FILENAME}"
    fi

    eval "$BASE_CMD workflow component --id ${WORKFLOW_ID} fuel-limit --fuel ${FUEL_LIMIT}" > /dev/null

    echo "  ✅ Workflow configured for ${COMP_FILENAME}"
    echo ""
done

eval "$BASE_CMD manager set-evm --chain-name ${SUBMIT_CHAIN} --address `cast --to-checksum ${WAVS_SERVICE_MANAGER_ADDRESS}`" > /dev/null
eval "$BASE_CMD validate" > /dev/null

echo "Configuration file created ${FILE_LOCATION}. Watching events from '${TRIGGER_CHAIN}' & submitting to '${SUBMIT_CHAIN}'."
