#!/bin/bash

# Component Configuration Helper Script (JSON Format)
# This script helps manage WASM component configurations for WAVS deployment

set -e

COMPONENTS_CONFIG_DIR=".docker"
COMPONENTS_CONFIG_FILE="$COMPONENTS_CONFIG_DIR/components-config.json"

# Default component configurations in JSON format
DEFAULT_COMPONENTS_JSON='{
  "components": [
    {
      "filename": "wavs_eas_attest.wasm",
      "package_name": "wasm-eas-attest",
      "package_version": "0.1.0",
      "trigger_event": "AttestationRequested(address,bytes32,address,bytes)",
      "trigger_json_path": "service_contracts.trigger",
      "submit_json_path": "eas_contracts.attester"
    },
    {
      "filename": "wavs_eas_compute.wasm",
      "package_name": "wasm-eas-compute",
      "package_version": "0.1.0",
      "trigger_event": "Attested(address,address,bytes32,bytes32)",
      "trigger_json_path": "eas_contracts.indexer_resolver",
      "submit_json_path": "governance_contracts.voting_power"
    },
    {
      "filename": "rewards.wasm",
      "package_name": "rewards",
      "package_version": "0.1.0",
      "trigger_event": "WavsRewardsTrigger(uint64)",
      "trigger_json_path": "reward_contracts.reward_distributor",
      "submit_json_path": "rewards_contracts.reward_distributor"
    }
  ]
}'

# Helper functions
usage() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  init                 Initialize components configuration file"
    echo "  list                 List all configured components"
    echo "  add                  Add a new component interactively"
    echo "  add-batch            Add a component with all parameters"
    echo "  remove FILENAME      Remove a component by filename"
    echo "  validate             Validate component configurations"
    echo "  export               Export configurations for deployment"
    echo ""
    echo "Batch add format:"
    echo "  $0 add-batch FILENAME PKG_NAME PKG_VERSION TRIGGER_EVENT TRIGGER_PATH SUBMIT_PATH"
    echo ""
    echo "Example:"
    echo "  $0 add-batch my_component.wasm wasm-my-comp 1.0.0 'MyEvent(uint256)' service_contracts.my_trigger eas_contracts.my_submitter"
    exit 1
}

check_jq() {
    if ! command -v jq &> /dev/null; then
        echo "❌ jq is required but not installed. Please install jq first."
        exit 1
    fi
}

init_config() {
    check_jq
    mkdir -p "$COMPONENTS_CONFIG_DIR"
    if [ -f "$COMPONENTS_CONFIG_FILE" ]; then
        echo "⚠️  Configuration file already exists: $COMPONENTS_CONFIG_FILE"
        read -p "Overwrite? (y/N): " confirm
        if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
            echo "Cancelled."
            exit 0
        fi
    fi

    echo "$DEFAULT_COMPONENTS_JSON" | jq '.' > "$COMPONENTS_CONFIG_FILE"
    echo "✅ Initialized component configuration at: $COMPONENTS_CONFIG_FILE"
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

        echo "${count}. ${filename}"
        echo "   Package: ${package_name}@${package_version}"
        echo "   Trigger Event: ${trigger_event}"
        echo "   Trigger Path: ${trigger_path}"
        echo "   Submit Path: ${submit_path}"
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
    echo "  NewTrigger(bytes)"
    read -p "Trigger event: " trigger_event

    echo ""
    echo "Common paths:"
    echo "  service_contracts.trigger"
    echo "  eas_contracts.indexer_resolver"
    echo "  governance_contracts.voting_power"
    read -p "Trigger address JSON path: " trigger_path

    echo ""
    echo "Common submit paths:"
    echo "  eas_contracts.attester"
    echo "  governance_contracts.voting_power"
    read -p "Submit address JSON path: " submit_path

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
    if [ $# -ne 6 ]; then
        echo "❌ Invalid number of arguments for batch add"
        echo "Expected: FILENAME PKG_NAME PKG_VERSION TRIGGER_EVENT TRIGGER_PATH SUBMIT_PATH"
        exit 1
    fi

    local filename="$1"
    local package_name="$2"
    local package_version="$3"
    local trigger_event="$4"
    local trigger_path="$5"
    local submit_path="$6"

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
