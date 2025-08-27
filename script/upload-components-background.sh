#!/bin/bash

# Background component upload script with status tracking
set -e

# Function to log messages to stdout (not stderr)
log() {
    echo "[Component Upload] $1"
}

log "Starting background component upload process..."

warg reset

STATUS_FILE=${STATUS_FILE:-".docker/component-upload-status"}
COMPONENT_CONFIGS_FILE="config/components.json"

# Create status file
mkdir -p .docker
echo "UPLOADING" > "$STATUS_FILE"

# Function to handle cleanup on error
cleanup_on_error() {
    log "❌ Error occurred during component upload"
    echo "ERROR" > "$STATUS_FILE"
    exit 1
}

# Set trap to handle errors
trap cleanup_on_error ERR

# Check if component config file exists
if [ ! -f "$COMPONENT_CONFIGS_FILE" ]; then
    log "❌ Component configuration file not found: $COMPONENT_CONFIGS_FILE"
    echo "ERROR" > "$STATUS_FILE"
    exit 1
fi

log "📦 Checking for WASM components to build..."

if [ ! -d compiled/ ] || [ -z "$(find compiled/ -name '*.wasm')" ]; then
    log "No WASM files found in compiled/. Building components."
    task build:wasi 2>&1 | while read line; do
        log "$line"
    done
fi

if git status --porcelain | grep -v "bindings.rs" | grep -q "^.* components/"; then
    log "Found pending changes in components/* (excluding bindings.rs), building"
    task build:wasi 2>&1 | while read line; do
        log "$line"
    done
fi

# Get PKG_VERSION
export PKG_VERSION="0.1.0"
if [ "$(task get-deploy-status)" = "TESTNET" ]; then
    # For testnet, we'll use the default since we can't prompt in background
    log "Using default PKG_VERSION: ${PKG_VERSION}"
fi

# Upload components to WASI registry
log "📤 Starting component uploads to WASI registry..."

# Get total component count for progress tracking
TOTAL_COMPONENTS=$(jq -r '.components | length' "$COMPONENT_CONFIGS_FILE")
CURRENT_COMPONENT=0

jq -r '.components[] | @json' "$COMPONENT_CONFIGS_FILE" | while read -r component; do
    export COMPONENT_FILENAME=$(echo "$component" | jq -r '.filename')
    export PKG_NAME=$(echo "$component" | jq -r '.package_name')
    export PKG_VERSION=$(echo "$component" | jq -r '.package_version')

    CURRENT_COMPONENT=$((CURRENT_COMPONENT + 1))
    log "[$CURRENT_COMPONENT/$TOTAL_COMPONENTS] Uploading ${COMPONENT_FILENAME} as ${PKG_NAME}:${PKG_VERSION}..."

    # Upload to registry, capturing output to check for specific errors
    if UPLOAD_OUTPUT=$(task wasi:upload-to-registry PKG_NAME="${PKG_NAME}" PKG_VERSION="${PKG_VERSION}" COMPONENT_FILENAME="${COMPONENT_FILENAME}" 2>&1); then
        # Upload succeeded
        # Show selected output lines that are informative
        echo "$UPLOAD_OUTPUT" | grep -E "(Publishing to registry|Published package)" | while read line; do
            log "  └─ $line"
        done || true
        log "  └─ ✓ Completed ${PKG_NAME}"
    else
        # Upload failed, check the reason
        if echo "$UPLOAD_OUTPUT" | grep -q "already released"; then
            log "  └─ ℹ️  Package ${PKG_NAME}:${PKG_VERSION} already exists in registry, skipping"
        else
            # For other errors, show the actual error
            echo "$UPLOAD_OUTPUT" | while read line; do
                log "  └─ $line"
            done
            log "  └─ ⚠️  Upload failed for ${COMPONENT_FILENAME}, continuing..."
        fi
    fi
    sleep 1
done

log "✅ All components uploaded successfully"
echo "COMPLETED" > "$STATUS_FILE"
