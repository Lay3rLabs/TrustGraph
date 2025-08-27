#!/bin/bash

log() {
    echo "🔧 [Upload] $1"
}

log "Starting component upload..."

REPO_ROOT=$(git rev-parse --show-toplevel) || exit 1
cd "$REPO_ROOT" || exit 1

STATUS_FILE=${STATUS_FILE:-".docker/component-upload-status"}
COMPONENT_CONFIGS_FILE="config/components.json"

mkdir -p .docker
echo "UPLOADING" > "$STATUS_FILE"

cleanup_on_error() {
    log "❌ Upload failed"
    echo "ERROR" > "$STATUS_FILE"
    # Clean up any remaining temp directories
    find /tmp -maxdepth 1 -name "warg_home_*" -type d -exec rm -rf {} + 2>/dev/null || true
    # Kill background jobs
    jobs -p | xargs -r kill 2>/dev/null || true
    exit 1
}

trap cleanup_on_error INT TERM

if [ ! -f "$COMPONENT_CONFIGS_FILE" ]; then
    log "❌ Config file not found: $COMPONENT_CONFIGS_FILE"
    echo "ERROR" > "$STATUS_FILE"
    exit 1
fi

log "📦 Building components if needed..."

if [ ! -d compiled/ ] || [ -z "$(find compiled/ -name '*.wasm')" ]; then
    log "Building components..."
    task build:wasi
fi

if git status --porcelain | grep -v "bindings.rs" | grep -q "^.* components/"; then
    log "Changes detected, rebuilding..."
    task build:wasi
fi

upload_package() {
    local component_json="$1"
    local num="$2"

    local COMPONENT_FILENAME=$(echo "$component_json" | jq -r '.filename')
    local PKG_NAME=$(echo "$component_json" | jq -r '.package_name')
    local PKG_VERSION=$(echo "$component_json" | jq -r '.package_version')
    local component_file="./compiled/${COMPONENT_FILENAME}"

    if [ ! -f "$component_file" ]; then
        log "[$num] ❌ File not found: $component_file"
        return 1
    fi

    local REGISTRY=$(task get-registry)
    local PKG_NAMESPACE=$(task get-wasi-namespace REGISTRY="$REGISTRY")

    if [ -z "$REGISTRY" ] || [ -z "$PKG_NAMESPACE" ]; then
        log "[$num] ❌ Registry config missing for ${PKG_NAME}"
        return 1
    fi

    local PROTOCOL="https"
    if [[ "$REGISTRY" == *"localhost"* ]] || [[ "$REGISTRY" == *"127.0.0.1"* ]]; then
        PROTOCOL="http"
    fi

    local REGISTRY_URL="${PROTOCOL}://${REGISTRY}"
    local FULL_PKG_NAME="${PKG_NAMESPACE}:${PKG_NAME}"

    # Create unique temp directory for warg storage (bypasses locking)
    local temp_home=$(mktemp -d -t warg_home_XXXXXX)

    log "[$num] 🚀 Uploading ${PKG_NAME}..."

    # Set environment to use isolated storage (avoids .lock files)
    export WARG_HOME="${temp_home}"
    local output=$(warg config --registry "${REGISTRY_URL}" 2>&1 && \
                   warg publish release --name "${FULL_PKG_NAME}" --version "${PKG_VERSION}" "${component_file}" --no-wait 2>&1)
    local exit_code=$?
    rm -rf "${temp_home}"

    if [ $exit_code -eq 0 ] || [[ "$output" =~ "already released" ]] || [[ "$output" =~ "failed to prove inclusion" ]]; then
        log "[$num] ✅ ${PKG_NAME} uploaded"
        return 0
    else
        log "[$num] ❌ ${PKG_NAME} failed: ${output}"
        return 1
    fi
}

log "📤 Starting component uploads..."

if ! command -v warg >/dev/null 2>&1; then
    log "❌ warg command not found"
    echo "ERROR" > "$STATUS_FILE"
    exit 1
fi

TOTAL_COMPONENTS=$(jq -r '.components | length' "$COMPONENT_CONFIGS_FILE")

if [ $TOTAL_COMPONENTS -eq 0 ]; then
    log "❌ No components found"
    echo "ERROR" > "$STATUS_FILE"
    exit 1
fi

log "📊 Found $TOTAL_COMPONENTS components"

# Upload components in parallel
pids=()
component_num=0
while IFS= read -r component; do
    component_num=$((component_num + 1))
    upload_package "$component" "$component_num" &
    pids+=($!)
done < <(jq -r '.components[] | @json' "$COMPONENT_CONFIGS_FILE")

# Wait for all uploads
successful=0
failed=0

for pid in "${pids[@]}"; do
    if wait $pid 2>/dev/null; then
        successful=$((successful + 1))
    else
        failed=$((failed + 1))
    fi
done

log ""
log "📊 Results: ✅ ${successful} success, ❌ ${failed} failed"

if [ $failed -eq 0 ]; then
    log "🎉 All uploads completed!"
    echo "COMPLETED" > "$STATUS_FILE"
    exit 0
else
    log "⚠️ Some uploads failed"
    echo "ERROR" > "$STATUS_FILE"
    exit 1
fi
