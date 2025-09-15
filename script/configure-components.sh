#!/bin/bash

# Component Configuration Helper Script (JSON Format)
# This script helps manage WASM component configurations for WAVS deployment

set -e

COMPONENTS_CONFIG_DIR=".docker"
COMPONENTS_CONFIG_FILE="$COMPONENTS_CONFIG_DIR/components-config.json"

# Helper functions
usage() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  list                 List all configured components"
    echo "  add                  Add a new component interactively"
    echo "  add-batch            Add a component with all parameters"
    echo "  remove FILENAME      Remove a component by filename"
    echo "  validate             Validate component configurations"
    echo "  export               Export configurations for deployment"
    echo ""
    echo "Batch add format:"
    echo "  $0 add-batch FILENAME PKG_NAME PKG_VERSION TRIGGER_EVENT TRIGGER_PATH SUBMIT_PATH [CONFIG_VALUES] [ENV_VARIABLES]"
    echo ""
    echo "Example command:"
    echo '  $0 add-batch my_component.wasm wasm-my-comp 1.0.0 "MyEvent(uint256)" eas.contracts.my_trigger eas.contracts.my_submitter "key1=value1,key2=value2" "WAVS_ENV_SECRET1,WAVS_ENV_SECRET2"'
    echo ""
    echo "Expected JSON configuration format in config/components.json:"
    echo '  {
    "components": [
      {
        "filename": "wavs_eas_attest.wasm",
        "package_name": "wasm-eas-attest",
        "package_version": "0.1.0",
        "trigger_event": "AttestationRequested(address,bytes32,address,bytes)",
        "trigger_json_path": "eas.contracts.attest_trigger",
        "submit_json_path": "eas.contracts.attester",
        "config_values": {
          "eas_address": "${EAS_ADDRESS}",
          "indexer_address": "${INDEXER_ADDRESS}",
          "chain_name": "${CHAIN_NAME}"
        },
        "env_variables": ["WAVS_ENV_SOME_SECRET"]
      }
    ]
  }'
    echo ""
    echo "Note: config_values can use ${VAR_NAME} syntax for runtime variable substitution"
    exit 1
}

check_jq() {
    if ! command -v jq &> /dev/null; then
        echo "❌ jq is required but not installed. Please install jq first."
        exit 1
    fi
}

list_components() {
    check_jq
    if [ ! -f "$COMPONENTS_CONFIG_FILE" ]; then
        echo "❌ No configuration file found. Run: $0 init"
        exit 1
    fi

    echo "📋 Configured Components:"
    echo "========================"

    local count=1
    jq -r '.components[] | @json' "$COMPONENTS_CONFIG_FILE" | while read -r component; do
        filename=$(echo "$component" | jq -r '.filename')
        package_name=$(echo "$component" | jq -r '.package_name')
        package_version=$(echo "$component" | jq -r '.package_version')
        trigger_event=$(echo "$component" | jq -r '.trigger_event')
        trigger_path=$(echo "$component" | jq -r '.trigger_json_path')
        submit_path=$(echo "$component" | jq -r '.submit_json_path')
        config_values=$(echo "$component" | jq -r '.config_values // empty')
        env_variables=$(echo "$component" | jq -r '.env_variables // empty')

        echo "${count}. ${filename}"
        echo "   Package: ${package_name}@${package_version}"
        echo "   Trigger Event: ${trigger_event}"
        echo "   Trigger Path: ${trigger_path}"
        echo "   Submit Path: ${submit_path}"

        if [ -n "$config_values" ] && [ "$config_values" != "null" ]; then
            echo "   Config Values:"
            echo "$component" | jq -r '.config_values | to_entries[] | "     - \(.key): \(.value)"'
        fi

        if [ -n "$env_variables" ] && [ "$env_variables" != "null" ] && [ "$env_variables" != "[]" ]; then
            echo "   Environment Variables:"
            echo "$component" | jq -r '.env_variables[]' | while read -r env_var; do
                echo "     - ${env_var}"
            done
        fi

        echo ""
        ((count++))
    done
}

validate_component() {
    local component="$1"
    local errors=0

    filename=$(echo "$component" | jq -r '.filename // empty')
    package_name=$(echo "$component" | jq -r '.package_name // empty')
    package_version=$(echo "$component" | jq -r '.package_version // empty')
    trigger_event=$(echo "$component" | jq -r '.trigger_event // empty')
    trigger_path=$(echo "$component" | jq -r '.trigger_json_path // empty')
    submit_path=$(echo "$component" | jq -r '.submit_json_path // empty')

    if [ -z "$filename" ]; then
        echo "❌ Missing filename"
        ((errors++))
    elif [ ! -f "compiled/$filename" ]; then
        echo "⚠️  WASM file not found: compiled/$filename"
    fi

    if [ -z "$package_name" ]; then
        echo "❌ Missing package_name"
        ((errors++))
    fi

    if [ -z "$package_version" ]; then
        echo "❌ Missing package_version"
        ((errors++))
    fi

    if [ -z "$trigger_event" ]; then
        echo "❌ Missing trigger_event"
        ((errors++))
    fi

    if [ -z "$trigger_path" ]; then
        echo "❌ Missing trigger_json_path"
        ((errors++))
    fi

    if [ -z "$submit_path" ]; then
        echo "❌ Missing submit_json_path"
        ((errors++))
    fi

    # Validate config_values if present
    config_values=$(echo "$component" | jq -r '.config_values // empty')
    if [ -n "$config_values" ] && [ "$config_values" != "null" ]; then
        if ! echo "$component" | jq -e '.config_values | type == "object"' > /dev/null; then
            echo "❌ config_values must be an object"
            ((errors++))
        fi
    fi

    # Validate env_variables if present
    env_variables=$(echo "$component" | jq -r '.env_variables // empty')
    if [ -n "$env_variables" ] && [ "$env_variables" != "null" ]; then
        if ! echo "$component" | jq -e '.env_variables | type == "array"' > /dev/null; then
            echo "❌ env_variables must be an array"
            ((errors++))
        else
            # Check that all env variables start with WAVS_ENV_
            echo "$component" | jq -r '.env_variables[]' | while read -r env_var; do
                if [[ ! "$env_var" =~ ^WAVS_ENV_ ]]; then
                    echo "⚠️  Environment variable should start with WAVS_ENV_: $env_var"
                fi
            done
        fi
    fi

    return $errors
}

validate_config() {
    check_jq
    if [ ! -f "$COMPONENTS_CONFIG_FILE" ]; then
        echo "❌ No configuration file found. Run: $0 init"
        exit 1
    fi

    echo "🔍 Validating component configurations..."
    local total_errors=0
    local component_count=1

    # Validate JSON structure
    if ! jq '.' "$COMPONENTS_CONFIG_FILE" > /dev/null 2>&1; then
        echo "❌ Invalid JSON format in configuration file"
        exit 1
    fi

    # Check if components array exists
    if ! jq -e '.components' "$COMPONENTS_CONFIG_FILE" > /dev/null; then
        echo "❌ Missing 'components' array in configuration"
        exit 1
    fi

    jq -r '.components[] | @json' "$COMPONENTS_CONFIG_FILE" | while read -r component; do
        filename=$(echo "$component" | jq -r '.filename // "unknown"')
        echo "Validating component $component_count: $filename"
        if ! validate_component "$component"; then
            ((total_errors++))
        fi
        echo ""
        ((component_count++))
    done

    if [ $total_errors -eq 0 ]; then
        echo "✅ All component configurations are valid!"
    else
        echo "❌ Found $total_errors error(s) in configuration"
        exit 1
    fi
}

parse_config_values() {
    # Parse config values from comma-separated key=value pairs
    local config_str="$1"
    local json_obj="{}"

    if [ -n "$config_str" ] && [ "$config_str" != "null" ]; then
        IFS=',' read -ra configs <<< "$config_str"
        for config in "${configs[@]}"; do
            if [[ "$config" =~ ^([^=]+)=(.*)$ ]]; then
                key="${BASH_REMATCH[1]}"
                value="${BASH_REMATCH[2]}"
                json_obj=$(echo "$json_obj" | jq --arg key "$key" --arg value "$value" '. + {($key): $value}')
            fi
        done
    fi

    echo "$json_obj"
}

parse_env_variables() {
    # Parse environment variables from comma-separated list
    local env_str="$1"
    local json_arr="[]"

    if [ -n "$env_str" ] && [ "$env_str" != "null" ]; then
        IFS=',' read -ra envs <<< "$env_str"
        for env in "${envs[@]}"; do
            env=$(echo "$env" | xargs)  # Trim whitespace
            if [ -n "$env" ]; then
                json_arr=$(echo "$json_arr" | jq --arg env "$env" '. + [$env]')
            fi
        done
    fi

    echo "$json_arr"
}

add_component_interactive() {
    check_jq
    echo "🔧 Adding new component..."
    echo ""

    # List available WASM files
    echo "Available WASM files in compiled/:"
    if [ -d "compiled" ]; then
        ls -1 compiled/*.wasm 2>/dev/null | sed 's|compiled/||' || echo "No WASM files found"
    else
        echo "No compiled/ directory found"
    fi
    echo ""

    read -p "Component filename (with .wasm extension): " filename
    read -p "Package name: " package_name
    read -p "Package version (default: 0.1.0): " package_version
    package_version=${package_version:-0.1.0}

    echo ""
    echo "Common trigger events:"
    echo "  AttestationRequested(address,bytes32,address,bytes)"
    echo "  Attested(address,address,bytes32,bytes32)"
    echo "  WavsRewardsTrigger(uint64)"
    echo "  NewTrigger(bytes)"
    read -p "Trigger event: " trigger_event

    echo ""
    echo "Common paths:"
    echo "  eas.contracts.attest_trigger"
    echo "  eas.contracts.indexer_resolver"
    echo "  governance.voting_power"
    echo "  merkler.merkle_snapshot"
    echo "  merkler.reward_distributor"
    echo "  prediction_market.oracle_controller"
    read -p "Trigger address JSON path: " trigger_path

    echo ""
    echo "Common submit paths:"
    echo "  eas.contracts.attester"
    echo "  governance.voting_power"
    echo "  merkler.merkle_snapshot"
    echo "  merkler.reward_distributor"
    echo "  prediction_market.oracle_controller"
    read -p "Submit address JSON path: " submit_path

    echo ""
    echo "Configuration values (optional):"
    echo "These values can use \${VAR_NAME} syntax for runtime substitution"
    echo "Common config keys: eas_address, indexer_address, chain_name, reward_token, market_maker"
    echo "Format: key1=value1,key2=value2 (or press Enter to skip)"
    read -p "Config values: " config_values_str

    echo ""
    echo "Environment variables (optional):"
    echo "Variables should start with WAVS_ENV_"
    echo "Common env vars: WAVS_ENV_SOME_SECRET, WAVS_ENV_PINATA_API_KEY, WAVS_ENV_PINATA_API_URL"
    echo "Format: VAR1,VAR2,VAR3 (or press Enter to skip)"
    read -p "Environment variables: " env_variables_str

    # Parse config values and env variables
    config_values_json=$(parse_config_values "$config_values_str")
    env_variables_json=$(parse_env_variables "$env_variables_str")

    # Build the component JSON
    local new_component=$(jq -n \
        --arg filename "$filename" \
        --arg package_name "$package_name" \
        --arg package_version "$package_version" \
        --arg trigger_event "$trigger_event" \
        --arg trigger_path "$trigger_path" \
        --arg submit_path "$submit_path" \
        --argjson config_values "$config_values_json" \
        --argjson env_variables "$env_variables_json" \
        '{
            filename: $filename,
            package_name: $package_name,
            package_version: $package_version,
            trigger_event: $trigger_event,
            trigger_json_path: $trigger_path,
            submit_json_path: $submit_path
        }')

    # Add config_values if not empty
    if [ "$config_values_json" != "{}" ]; then
        new_component=$(echo "$new_component" | jq --argjson cv "$config_values_json" '. + {config_values: $cv}')
    fi

    # Add env_variables if not empty
    if [ "$env_variables_json" != "[]" ]; then
        new_component=$(echo "$new_component" | jq --argjson ev "$env_variables_json" '. + {env_variables: $ev}')
    fi

    echo ""
    echo "New component configuration:"
    echo "$new_component" | jq '.'
    echo ""

    read -p "Add this component? (Y/n): " confirm
    if [ "$confirm" = "n" ] || [ "$confirm" = "N" ]; then
        echo "Cancelled."
        exit 0
    fi

    mkdir -p "$COMPONENTS_CONFIG_DIR"

    # Initialize config if it doesn't exist
    if [ ! -f "$COMPONENTS_CONFIG_FILE" ]; then
        echo '{"components": []}' > "$COMPONENTS_CONFIG_FILE"
    fi

    # Add the component
    jq --argjson new_component "$new_component" '.components += [$new_component]' "$COMPONENTS_CONFIG_FILE" > "${COMPONENTS_CONFIG_FILE}.tmp"
    mv "${COMPONENTS_CONFIG_FILE}.tmp" "$COMPONENTS_CONFIG_FILE"

    echo "✅ Component added successfully!"
}

add_component_batch() {
    check_jq
    if [ $# -lt 6 ]; then
        echo "❌ Invalid number of arguments for batch add"
        echo "Expected at least: FILENAME PKG_NAME PKG_VERSION TRIGGER_EVENT TRIGGER_PATH SUBMIT_PATH"
        echo "Optional: CONFIG_VALUES ENV_VARIABLES"
        exit 1
    fi

    local filename="$1"
    local package_name="$2"
    local package_version="$3"
    local trigger_event="$4"
    local trigger_path="$5"
    local submit_path="$6"
    local config_values_str="${7:-}"
    local env_variables_str="${8:-}"

    # Parse config values and env variables
    config_values_json=$(parse_config_values "$config_values_str")
    env_variables_json=$(parse_env_variables "$env_variables_str")

    # Build the component JSON
    local new_component=$(jq -n \
        --arg filename "$filename" \
        --arg package_name "$package_name" \
        --arg package_version "$package_version" \
        --arg trigger_event "$trigger_event" \
        --arg trigger_path "$trigger_path" \
        --arg submit_path "$submit_path" \
        '{
            filename: $filename,
            package_name: $package_name,
            package_version: $package_version,
            trigger_event: $trigger_event,
            trigger_json_path: $trigger_path,
            submit_json_path: $submit_path
        }')

    # Add config_values if not empty
    if [ "$config_values_json" != "{}" ]; then
        new_component=$(echo "$new_component" | jq --argjson cv "$config_values_json" '. + {config_values: $cv}')
    fi

    # Add env_variables if not empty
    if [ "$env_variables_json" != "[]" ]; then
        new_component=$(echo "$new_component" | jq --argjson ev "$env_variables_json" '. + {env_variables: $ev}')
    fi

    if ! validate_component "$new_component"; then
        echo "❌ Invalid component configuration"
        exit 1
    fi

    mkdir -p "$COMPONENTS_CONFIG_DIR"

    # Initialize config if it doesn't exist
    if [ ! -f "$COMPONENTS_CONFIG_FILE" ]; then
        echo '{"components": []}' > "$COMPONENTS_CONFIG_FILE"
    fi

    # Add the component
    jq --argjson new_component "$new_component" '.components += [$new_component]' "$COMPONENTS_CONFIG_FILE" > "${COMPONENTS_CONFIG_FILE}.tmp"
    mv "${COMPONENTS_CONFIG_FILE}.tmp" "$COMPONENTS_CONFIG_FILE"

    echo "✅ Component added: $filename"
}

remove_component() {
    check_jq
    if [ -z "$1" ]; then
        echo "❌ Please specify component filename to remove"
        exit 1
    fi

    local filename="$1"

    if [ ! -f "$COMPONENTS_CONFIG_FILE" ]; then
        echo "❌ No configuration file found"
        exit 1
    fi

    # Check if component exists
    if ! jq -e --arg filename "$filename" '.components[] | select(.filename == $filename)' "$COMPONENTS_CONFIG_FILE" > /dev/null; then
        echo "❌ Component not found: $filename"
        exit 1
    fi

    # Create backup
    cp "$COMPONENTS_CONFIG_FILE" "${COMPONENTS_CONFIG_FILE}.backup"

    # Remove the component
    jq --arg filename "$filename" '.components |= map(select(.filename != $filename))' "$COMPONENTS_CONFIG_FILE" > "${COMPONENTS_CONFIG_FILE}.tmp"
    mv "${COMPONENTS_CONFIG_FILE}.tmp" "$COMPONENTS_CONFIG_FILE"

    echo "✅ Component removed: $filename"
    echo "💾 Backup saved as: ${COMPONENTS_CONFIG_FILE}.backup"
}

export_config() {
    check_jq
    if [ ! -f "$COMPONENTS_CONFIG_FILE" ]; then
        echo "❌ No configuration file found. Run: $0 init"
        exit 1
    fi

    echo "# Component configurations"
    cat "$COMPONENTS_CONFIG_FILE" | jq '.'
}

init_config() {
    mkdir -p "$COMPONENTS_CONFIG_DIR"

    if [ -f "$COMPONENTS_CONFIG_FILE" ]; then
        echo "Configuration file already exists at: $COMPONENTS_CONFIG_FILE"
        read -p "Overwrite with default configuration? (y/N): " confirm
        if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
            echo "Initialization cancelled."
            exit 0
        fi
    fi

    echo '{"components": []}' > "$COMPONENTS_CONFIG_FILE"
    echo "✅ Initialized empty configuration file at: $COMPONENTS_CONFIG_FILE"
    echo ""
    echo "You can now add components using:"
    echo "  $0 add        - Add components interactively"
    echo "  $0 add-batch  - Add components via command line"
}

# Main script logic
case "${1:-}" in
    "init")
        init_config
        ;;
    "list")
        list_components
        ;;
    "add")
        add_component_interactive
        ;;
    "add-batch")
        shift
        add_component_batch "$@"
        ;;
    "remove")
        remove_component "$2"
        ;;
    "validate")
        validate_config
        ;;
    "export")
        export_config
        ;;
    "help"|"-h"|"--help")
        usage
        ;;
    *)
        if [ -z "${1:-}" ]; then
            usage
        else
            echo "❌ Unknown command: $1"
            echo ""
            usage
        fi
        ;;
esac
