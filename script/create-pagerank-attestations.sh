#!/bin/bash

# Create PageRank Attestations on Existing Local Network
# Uses deployed contracts and default anvil accounts to create real attestation network

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOYMENT_FILE="$PROJECT_ROOT/.docker/deployment_summary.json"
RPC_URL="http://localhost:8545"
CHAIN_ID="31337"

# Contract addresses from deployment summary
EAS_ADDRESS=""
ATTESTER_ADDRESS=""
BASIC_SCHEMA_ID=""
LIKE_SCHEMA_ID=""
VOUCHING_SCHEMA_ID=""
STATEMENT_SCHEMA_ID=""

# Function to get private key by account name
get_private_key() {
    case "$1" in
        Alice) echo "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d" ;;
        Bob) echo "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a" ;;
        Charlie) echo "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6" ;;
        Diana) echo "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a" ;;
        Eve) echo "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba" ;;
        Frank) echo "0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e" ;;
        Grace) echo "0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356" ;;
        Henry) echo "0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97" ;;
        Ivy) echo "0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6" ;;
        *) echo "" ;;
    esac
}

# Function to get address by account name
get_address() {
    case "$1" in
        Alice) echo "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" ;;
        Bob) echo "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" ;;
        Charlie) echo "0x90F79bf6EB2c4f870365E785982E1f101E93b906" ;;
        Diana) echo "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65" ;;
        Eve) echo "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc" ;;
        Frank) echo "0x976EA74026E726554dB657fA54763abd0C3a0aa9" ;;
        Grace) echo "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955" ;;
        Henry) echo "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f" ;;
        Ivy) echo "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720" ;;
        *) echo "" ;;
    esac
}

# We'll use first 9 anvil accounts, then generate addresses for the remaining 6
# Function to print colored output
print_step() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ $1${NC}"
}

# Function to check dependencies
check_dependencies() {
    print_step "Checking dependencies"

    if ! command -v cast &> /dev/null; then
        print_error "cast not found. Please install Foundry: https://getfoundry.sh"
        exit 1
    fi

    # Only require jq and deployment file if environment variables aren't set
    if [[ -z "${WAVS_ENV_EAS_ADDRESS:-}" ]]; then
        if ! command -v jq &> /dev/null; then
            print_error "jq not found. Please install jq for JSON parsing"
            print_info "Alternatively, run: ./script/setup-pagerank-env.sh --source"
            exit 1
        fi

        if [[ ! -f "$DEPLOYMENT_FILE" ]]; then
            print_error "Deployment file not found: $DEPLOYMENT_FILE"
            print_error "Please ensure contracts are deployed first"
            print_info "Or run: ./script/setup-pagerank-env.sh --source"
            exit 1
        fi
    fi

    print_success "All dependencies found"
}

# Function to load deployment configuration
load_deployment_config() {
    print_step "Loading deployment configuration"

    # First, try to use environment variables if they exist
    if [[ -n "${WAVS_ENV_EAS_ADDRESS:-}" ]]; then
        print_info "Using environment variables (already loaded)"

        EAS_ADDRESS="$WAVS_ENV_EAS_ADDRESS"
        ATTESTER_ADDRESS="$WAVS_ENV_ATTESTER_ADDRESS"
        BASIC_SCHEMA_ID="$WAVS_ENV_BASIC_SCHEMA_ID"
        LIKE_SCHEMA_ID="$WAVS_ENV_LIKE_SCHEMA_ID"
        VOUCHING_SCHEMA_ID="$WAVS_ENV_VOUCHING_SCHEMA_ID"
        STATEMENT_SCHEMA_ID="$WAVS_ENV_STATEMENT_SCHEMA_ID"

        print_success "Configuration loaded from environment variables"
    else
        print_info "Loading from deployment_summary.json"

        if ! jq empty "$DEPLOYMENT_FILE" 2>/dev/null; then
            print_error "Invalid JSON in deployment file"
            print_info "Hint: Run './script/setup-pagerank-env.sh --source' to setup environment"
            exit 1
        fi

        EAS_ADDRESS=$(jq -r '.eas_contracts.eas' "$DEPLOYMENT_FILE")
        ATTESTER_ADDRESS=$(jq -r '.eas_contracts.attester' "$DEPLOYMENT_FILE")
        BASIC_SCHEMA_ID=$(jq -r '.eas_schemas.basic_schema' "$DEPLOYMENT_FILE")
        LIKE_SCHEMA_ID=$(jq -r '.eas_schemas.like_schema' "$DEPLOYMENT_FILE")
        VOUCHING_SCHEMA_ID=$(jq -r '.eas_schemas.vouching_schema' "$DEPLOYMENT_FILE")
        STATEMENT_SCHEMA_ID=$(jq -r '.eas_schemas.statement_schema' "$DEPLOYMENT_FILE")

        print_success "Configuration loaded from deployment file"
    fi

    print_info "EAS: $EAS_ADDRESS"
    print_info "Attester: $ATTESTER_ADDRESS"
    print_info "Basic Schema: $BASIC_SCHEMA_ID"
    print_info "Like Schema: $LIKE_SCHEMA_ID"
    print_info "Vouching Schema: $VOUCHING_SCHEMA_ID"
}

# Function to verify network connectivity
verify_network() {
    print_step "Verifying network connectivity"

    # Check if RPC is accessible
    if ! curl -s -X POST -H "Content-Type: application/json" \
        --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
        $RPC_URL > /dev/null; then
        print_error "Cannot connect to RPC at $RPC_URL"
        print_error "Please ensure anvil is running"
        exit 1
    fi

    # Check if contracts exist
    local eas_code=$(cast code $EAS_ADDRESS --rpc-url $RPC_URL 2>/dev/null || echo "0x")
    if [[ "$eas_code" == "0x" ]]; then
        print_error "EAS contract not found at $EAS_ADDRESS"
        print_error "Please ensure contracts are deployed"
        exit 1
    fi

    print_success "Network connectivity verified"
}

# Function to get recipient address by name
get_recipient_address() {
    local name="$1"
    local addr=$(get_address "$name")
    if [[ -n "$addr" ]]; then
        echo "$addr"
    else
        # For accounts not in our list, generate from private key
        local key=$(get_private_key "$name")
        if [[ -n "$key" ]]; then
            cast wallet address "$key"
        else
            echo ""
        fi
    fi
}

# Function to create attestation
create_attestation() {
    local attester_name="$1"
    local recipient_name="$2"
    local schema_id="$3"
    local data="$4"
    local description="$5"

    local attester_key=$(get_private_key "$attester_name")
    local recipient_addr=$(get_recipient_address "$recipient_name")

    print_info "Creating: $description"

    # Create the attestation with error handling
    local tx_hash
    if tx_hash=$(cast send $ATTESTER_ADDRESS \
        --private-key "$attester_key" \
        --rpc-url $RPC_URL \
        --gas-limit 500000 \
        "attest(bytes32,address,bytes)" \
        "$schema_id" \
        "$recipient_addr" \
        "$data" 2>/dev/null); then
        print_success "  ✓ TX: $tx_hash"
        return 0
    else
        print_error "  ✗ Failed to create attestation"
        return 1
    fi
}

# Function to create all attestations
create_attestations() {
    print_step "Creating PageRank test attestations"

    local total_attestations=0
    local failed_attestations=0

    print_info "🎯 Creating comprehensive attestation network..."
    print_info "   This will generate diverse patterns for PageRank testing"

    # Hub pattern - Alice as central hub
    print_info "📍 Creating hub pattern with Alice as center..."
    for name in Bob Charlie Diana Eve Frank Grace Henry Ivy; do
        if create_attestation "$name" "Alice" "$LIKE_SCHEMA_ID" "0x0000000000000000000000000000000000000000000000000000000000000001" "$name endorses hub Alice"; then
            ((total_attestations++))
        else
            ((failed_attestations++))
        fi
        sleep 0.1  # Brief pause between transactions
    done

    # Alice responds to first 4
    print_info "🔄 Alice acknowledging key supporters..."
    for name in Bob Charlie Diana Eve; do
        local timestamp=$(date +%s)
        local data=$(cast abi-encode "f(bytes32,string,uint256)" "0x6875625f726573706f6e7365000000000000000000000000000000000000000" "Hub acknowledgment" $timestamp)
        if create_attestation "Alice" "$name" "$BASIC_SCHEMA_ID" "$data" "Hub Alice acknowledges $name"; then
            ((total_attestations++))
        else
            ((failed_attestations++))
        fi
        sleep 0.1
    done

    # Authority pattern - Diana gives high-weight endorsements
    print_info "👑 Creating authority pattern with Diana..."
    local weights=(95 90 85 80 75 70)
    local recipients=(Alice Bob Charlie Frank Grace Henry)
    for i in {0..5}; do
        local weight=${weights[$i]}
        local recipient=${recipients[$i]}
        local data=$(cast abi-encode "f(uint256)" $weight)
        if create_attestation "Diana" "$recipient" "$VOUCHING_SCHEMA_ID" "$data" "Authority Diana vouches for $recipient (weight: $weight)"; then
            ((total_attestations++))
        else
            ((failed_attestations++))
        fi
        sleep 0.1
    done

    # Chain pattern - trust chain
    print_info "🔗 Creating chain of trust pattern..."
    local chain_names=(Bob Charlie Diana Eve Frank)
    local chain_weights=(80 75 70 65)
    for i in {0..3}; do
        local from=${chain_names[$i]}
        local to=${chain_names[$((i+1))]}
        local weight=${chain_weights[$i]}
        local data=$(cast abi-encode "f(uint256)" $weight)
        if create_attestation "$from" "$to" "$VOUCHING_SCHEMA_ID" "$data" "Chain: $from -> $to (weight: $weight)"; then
            ((total_attestations++))
        else
            ((failed_attestations++))
        fi
        sleep 0.1
    done

    # Mutual connections
    print_info "🤝 Creating mutual connections..."
    local data75=$(cast abi-encode "f(uint256)" 75)
    local data80=$(cast abi-encode "f(uint256)" 80)
    local like_true=$(cast abi-encode "f(bool)" true)

    local mutual_attestations=(
        "Grace:Henry:vouching:$data75:Grace vouches for Henry"
        "Henry:Grace:vouching:$data80:Henry vouches for Grace"
        "Ivy:Jack:like:$like_true:Ivy likes Jack"
        "Jack:Ivy:like:$like_true:Jack likes Ivy"
    )

    for attestation in "${mutual_attestations[@]}"; do
        IFS=':' read -r from to schema_type data_val desc <<< "$attestation"
        local schema_id=""
        if [[ "$schema_type" == "vouching" ]]; then
            schema_id="$VOUCHING_SCHEMA_ID"
        else
            schema_id="$LIKE_SCHEMA_ID"
        fi

        if create_attestation "$from" "$to" "$schema_id" "$data_val" "$desc"; then
            ((total_attestations++))
        else
            ((failed_attestations++))
        fi
        sleep 0.1
    done

    # Community clusters
    print_info "🏘️ Creating community clusters..."

    # Only use first 9 accounts for clusters to avoid missing addresses
    # Cluster 1: Kate, Liam, Mia (but only if we have them)
    local available_cluster=(Grace Henry Frank)  # Use available accounts
    for i in {0..2}; do
        for j in {0..2}; do
            if [[ $i -ne $j ]]; then
                if create_attestation "${available_cluster[$i]}" "${available_cluster[$j]}" "$LIKE_SCHEMA_ID" "$like_true" "Cluster: ${available_cluster[$i]} <-> ${available_cluster[$j]}"; then
                    ((total_attestations++))
                else
                    ((failed_attestations++))
                fi
                sleep 0.1
            fi
        done
    done

    # Partnership between two available accounts
    local data85=$(cast abi-encode "f(uint256)" 85)
    if create_attestation "Henry" "Ivy" "$VOUCHING_SCHEMA_ID" "$data85" "Henry partners with Ivy"; then
        ((total_attestations++))
    else
        ((failed_attestations++))
    fi
    if create_attestation "Ivy" "Henry" "$VOUCHING_SCHEMA_ID" "$data85" "Ivy partners with Henry"; then
        ((total_attestations++))
    else
        ((failed_attestations++))
    fi

    # Bridge connections - Charlie connecting groups
    print_info "🌉 Creating bridge connections through Charlie..."
    local timestamp=$(date +%s)
    local bridge_data=$(cast abi-encode "f(bytes32,string,uint256)" "0x627269646765000000000000000000000000000000000000000000000000000" "Inter-group connection" $timestamp)

    for name in Alice Frank Ivy Grace Henry Eve; do
        if create_attestation "Charlie" "$name" "$BASIC_SCHEMA_ID" "$bridge_data" "Bridge Charlie connects to $name"; then
            ((total_attestations++))
        else
            ((failed_attestations++))
        fi
        sleep 0.1
    done

    # Random connections for network diversity
    print_info "🎲 Adding random connections for network diversity..."
    local random_connections=(
        "Eve:Grace:like:$like_true:Eve likes Grace"
        "Frank:Henry:60:vouching:Frank vouches for Henry (60)"
        "Henry:Bob:65:vouching:Henry vouches for Bob (65)"
        "Ivy:Alice:70:vouching:Ivy vouches for Alice (70)"
        "Bob:Grace:like:$like_true:Bob likes Grace"
        "Grace:Charlie:55:vouching:Grace vouches for Charlie (55)"
        "Eve:Frank:like:$like_true:Eve likes Frank"
        "Alice:Ivy:like:$like_true:Alice likes Ivy"
    )

    for connection in "${random_connections[@]}"; do
        IFS=':' read -r from to type_or_weight schema_type desc <<< "$connection"
        local schema_id=""
        local data_val=""

        if [[ "$schema_type" == "vouching" ]]; then
            schema_id="$VOUCHING_SCHEMA_ID"
            data_val=$(cast abi-encode "f(uint256)" $type_or_weight)
        else
            schema_id="$LIKE_SCHEMA_ID"
            data_val="$type_or_weight"  # Already encoded like_true
        fi

        if create_attestation "$from" "$to" "$schema_id" "$data_val" "$desc"; then
            ((total_attestations++))
        else
            ((failed_attestations++))
        fi
        sleep 0.1
    done

    print_success "Attestation creation complete!"
    print_info "✅ Created: $total_attestations attestations"
    if [[ $failed_attestations -gt 0 ]]; then
        print_warning "❌ Failed: $failed_attestations attestations"
    fi
}

# Function to analyze network
analyze_network() {
    print_step "Analyzing created network"

    echo -e "${CYAN}"
    echo "📊 Network Analysis Summary"
    echo "=========================="
    echo ""
    echo "👥 Test Accounts (using first 9 anvil accounts):"

    for name in Alice Bob Charlie Diana Eve Frank Grace Henry Ivy; do
        local addr=$(get_address "$name")
        local balance=$(cast balance $addr --rpc-url $RPC_URL --ether 2>/dev/null || echo "N/A")
        echo "   • $name: $addr (${balance} ETH)"
    done

    echo ""
    echo "📈 Expected PageRank Leaders:"
    echo "   1. Alice (Hub) - Central node with most incoming connections"
    echo "   2. Diana (Authority) - High-weight outgoing endorsements"
    echo "   3. Charlie (Bridge) - Connects different network groups"
    echo "   4. Bob (Influencer) - Chain member + bidirectional hub"
    echo "   5. Grace/Henry - Mutual high-weight vouching pair"
    echo ""
    echo "🔍 Network Patterns Created:"
    echo "   • Hub & Spoke: Alice as central hub (8 incoming + 4 bidirectional)"
    echo "   • Authority: Diana gives weighted endorsements (95-70 weights)"
    echo "   • Chain: Trust chain Bob→Charlie→Diana→Eve→Frank"
    echo "   • Mutual: Grace↔Henry, Ivy↔Jack bidirectional vouching"
    echo "   • Clusters: Grace-Henry-Frank triangle cluster"
    echo "   • Bridge: Charlie connects 6 different groups"
    echo "   • Random: 8 diverse connections for realism"
    echo ""
    echo "⚙️ Contract Addresses:"
    echo "   • EAS: $EAS_ADDRESS"
    echo "   • Attester: $ATTESTER_ADDRESS"
    echo "   • RPC: $RPC_URL"
    echo -e "${NC}"
}

# Function to provide next steps
show_next_steps() {
    print_step "Next Steps for PageRank Testing"

    echo -e "${YELLOW}"
    echo "🎯 Your PageRank test network is ready!"
    echo ""
    echo "🔄 Next Steps:"
    echo "   1. Environment variables (auto-setup available):"
    echo "      ./script/setup-pagerank-env.sh --source  # Auto-generates from deployment"
    echo "      # Or manually set:"
    echo "      export WAVS_ENV_EAS_ADDRESS=\"$EAS_ADDRESS\""
    echo "      export WAVS_ENV_ATTESTER_ADDRESS=\"$ATTESTER_ADDRESS\""
    echo "      export WAVS_ENV_BASIC_SCHEMA_ID=\"$BASIC_SCHEMA_ID\""
    echo "      export WAVS_ENV_LIKE_SCHEMA_ID=\"$LIKE_SCHEMA_ID\""
    echo "      export WAVS_ENV_VOUCHING_SCHEMA_ID=\"$VOUCHING_SCHEMA_ID\""
    echo "      export WAVS_ENV_RPC_URL=\"$RPC_URL\""
    echo "      export WAVS_ENV_CHAIN_ID=\"$CHAIN_ID\""
    echo ""
    echo "   2. Build and test PageRank component:"
    echo "      make wasi-build"
    echo "      make wasi-exec COMPONENT_FILENAME=rewards.wasm INPUT_DATA=\"test-pagerank\""
    echo ""
    echo "   3. Query specific attestations:"
    echo "      cast call $EAS_ADDRESS \"getAttestation(bytes32)\" <uid> --rpc-url $RPC_URL"
    echo ""
    echo "   4. Test with different PageRank parameters:"
    echo "      export WAVS_ENV_PAGERANK_DAMPING_FACTOR=\"0.85\""
    echo "      export WAVS_ENV_PAGERANK_MAX_ITERATIONS=\"100\""
    echo "      export WAVS_ENV_PAGERANK_MIN_THRESHOLD=\"0.0001\""
    echo ""
    echo "📊 Expected Results:"
    echo "   • Alice should have highest PageRank (central hub)"
    echo "   • Diana should rank high (authority figure)"
    echo "   • Charlie should rank high (bridge connector)"
    echo "   • Network should show realistic influence distribution"
    echo -e "${NC}"
}

# Function to save environment
save_environment() {
    local env_file="$PROJECT_ROOT/.env.pagerank-local"

    cat > "$env_file" << EOF
# PageRank Local Network Environment
# Generated on $(date)
# Using existing deployed contracts and real attestations

# Network Configuration
WAVS_ENV_RPC_URL=$RPC_URL
WAVS_ENV_CHAIN_ID=$CHAIN_ID

# Contract Addresses
WAVS_ENV_EAS_ADDRESS=$EAS_ADDRESS
WAVS_ENV_ATTESTER_ADDRESS=$ATTESTER_ADDRESS

# Schema IDs
WAVS_ENV_BASIC_SCHEMA_ID=$BASIC_SCHEMA_ID
WAVS_ENV_LIKE_SCHEMA_ID=$LIKE_SCHEMA_ID
WAVS_ENV_VOUCHING_SCHEMA_ID=$VOUCHING_SCHEMA_ID
WAVS_ENV_STATEMENT_SCHEMA_ID=$STATEMENT_SCHEMA_ID

# PageRank Parameters
WAVS_ENV_PAGERANK_REWARD_POOL=1000000000000000000000
WAVS_ENV_PAGERANK_DAMPING_FACTOR=0.85
WAVS_ENV_PAGERANK_MAX_ITERATIONS=100
WAVS_ENV_PAGERANK_MIN_THRESHOLD=0.0001

# Test Account Info (first 9 anvil accounts)
TEST_ALICE_ADDRESS=\$(get_address Alice)
TEST_BOB_ADDRESS=\$(get_address Bob)
TEST_CHARLIE_ADDRESS=\$(get_address Charlie)
TEST_DIANA_ADDRESS=\$(get_address Diana)
TEST_EVE_ADDRESS=\$(get_address Eve)
TEST_FRANK_ADDRESS=\$(get_address Frank)
TEST_GRACE_ADDRESS=\$(get_address Grace)
TEST_HENRY_ADDRESS=\$(get_address Henry)
TEST_IVY_ADDRESS=\$(get_address Ivy)

# Note: For full environment setup, use:
# ./script/setup-pagerank-env.sh --source
EOF

    print_success "Environment saved to .env.pagerank-local"
    print_info "Source with: source .env.pagerank-local"
}

# Main function
main() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║           PageRank Attestations on Local Network             ║"
    echo "║                                                              ║"
    echo "║  Creates real attestations using existing deployed contracts ║"
    echo "║  Perfect for testing PageRank algorithms with real data     ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    check_dependencies
    load_deployment_config
    verify_network
    create_attestations
    analyze_network
    save_environment
    show_next_steps

    print_success "PageRank attestation network created successfully! 🎉"
}

# Handle command line arguments
case "${1:-}" in
    "help"|"-h"|"--help")
        echo "PageRank Attestations Creator"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  (no args)  Create complete PageRank attestation network"
        echo "  help       Show this help message"
        echo ""
        echo "Prerequisites:"
        echo "  • Contracts must be deployed (deployment_summary.json exists)"
        echo "  • Anvil must be running on localhost:8545"
        echo "  • Default anvil accounts will be used as test personas"
        echo ""
        echo "This script will create ~40+ real attestations with patterns:"
        echo "  • Hub and spoke (Alice central)"
        echo "  • Authority endorsements (Diana high weights)"
        echo "  • Chain of trust patterns"
        echo "  • Community clusters"
        echo "  • Bridge connections"
        echo "  • Random network diversity"
        echo ""
        echo "Environment Setup:"
        echo "  • Auto-setup: ./script/setup-pagerank-env.sh --source"
        echo "  • Manual setup: Set WAVS_ENV_* variables"
        echo ""
        exit 0
        ;;
    "")
        main
        ;;
    *)
        print_error "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac
