#!/bin/bash

# Create PageRank Vouching Attestations on Existing Local Network
# Direct EAS version - creates attestations directly on EAS contract
# This ensures user addresses are properly recorded as attesters for PageRank

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
VOUCHING_SCHEMA_ID=""

# Test address that will receive vouches from Alice and Bob
if [[ -z "${TEST_ADDRESS:-}" ]]; then
    echo -e "${RED}Error: TEST_ADDRESS is not set. Please set it to a valid address.${NC}"
    exit 1
fi

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
        VOUCHING_SCHEMA_ID="$WAVS_ENV_VOUCHING_SCHEMA_ID"

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
        VOUCHING_SCHEMA_ID=$(jq -r '.eas_schemas.vouching_schema' "$DEPLOYMENT_FILE")

        print_success "Configuration loaded from deployment file"
    fi

    print_info "EAS: $EAS_ADDRESS"
    print_info "Attester: $ATTESTER_ADDRESS"
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

# Function to create vouching attestation
create_vouching_attestation() {
    local attester_name="$1"
    local recipient="$2"  # Can be a name or an address
    local weight="$3"

    local attester_key=$(get_private_key "$attester_name")

    # Check if recipient is an address (starts with 0x) or a name
    local recipient_addr
    if [[ "$recipient" == 0x* ]]; then
        recipient_addr="$recipient"
    else
        recipient_addr=$(get_address "$recipient")
    fi

    local data=$(cast abi-encode "f(uint256)" $weight)

    print_info "Creating vouching: $attester_name → $recipient (weight: $weight)"

    # Create the attestation directly on EAS contract
    # AttestationRequest struct: (bytes32 schema, AttestationRequestData data)
    # AttestationRequestData: (recipient, expirationTime, revocable, refUID, data, value)
    local tx_hash
    if tx_hash=$(cast send $EAS_ADDRESS \
        --private-key "$attester_key" \
        --rpc-url $RPC_URL \
        --gas-limit 500000 \
        "attest((bytes32,(address,uint64,bool,bytes32,bytes,uint256)))" \
        "($VOUCHING_SCHEMA_ID,($recipient_addr,0,true,0x0000000000000000000000000000000000000000000000000000000000000000,$data,0))" 2>/dev/null); then
        print_success "  ✓ TX: $tx_hash"
        return 0
    else
        print_error "  ✗ Failed to create attestation"
        return 1
    fi
}

# Function to create all vouching attestations
create_attestations() {
    print_step "Creating PageRank vouching attestations"

    local total_attestations=0
    local failed_attestations=0

    print_info "🎯 Creating vouching network for PageRank testing..."

    # Authority figure - Alice vouches for Bob and Test Address
    print_info "👑 Creating authority vouchers..."

    # Alice is the authority and vouches for Bob with high weight
    if create_vouching_attestation "Alice" "Bob" "95"; then
        ((total_attestations++))
    else
        ((failed_attestations++))
    fi
    sleep 0.1

    # Alice vouches for test address
    if create_vouching_attestation "Alice" "$TEST_ADDRESS" "85"; then
        ((total_attestations++))
    else
        ((failed_attestations++))
    fi
    sleep 0.1

    # Bob also vouches for test address
    if create_vouching_attestation "Bob" "$TEST_ADDRESS" "75"; then
        ((total_attestations++))
    else
        ((failed_attestations++))
    fi
    sleep 0.1

    # Spammer self-vouching
    print_info "🚫 Creating spammer self-vouchers..."

    local spammer_vouches=(
        "Grace:Grace:100"
        "Henry:Henry:100"
        "Ivy:Ivy:100"
    )

    for vouch in "${spammer_vouches[@]}"; do
        IFS=':' read -r attester recipient weight <<< "$vouch"
        if create_vouching_attestation "$attester" "$recipient" "$weight"; then
            ((total_attestations++))
        else
            ((failed_attestations++))
        fi
        sleep 0.1
    done

    # Legitimate community vouchers (non-spammers only)
    print_info "🤝 Creating community vouchers..."

    local community_vouches=(
        "Bob:Charlie:70"
        "Charlie:Diana:65"
        "Diana:Eve:60"
        "Eve:Frank:55"
        "Frank:Bob:50"
        "Charlie:Frank:45"
        "Diana:Bob:40"
    )

    for vouch in "${community_vouches[@]}"; do
        IFS=':' read -r attester recipient weight <<< "$vouch"
        if create_vouching_attestation "$attester" "$recipient" "$weight"; then
            ((total_attestations++))
        else
            ((failed_attestations++))
        fi
        sleep 0.1
    done

    print_success "Vouching attestation creation complete!"
    print_info "✅ Created: $total_attestations vouching attestations"
    if [[ $failed_attestations -gt 0 ]]; then
        print_warning "❌ Failed: $failed_attestations attestations"
    fi
}

# Function to analyze network
analyze_network() {
    print_step "Analyzing created vouching network"

    echo -e "${CYAN}"
    echo "📊 Vouching Network Analysis"
    echo "==========================="
    echo ""
    echo "👥 Test Accounts (using anvil accounts):"

    for name in Alice Bob Charlie Diana Eve Frank Grace Henry Ivy; do
        local addr=$(get_address "$name")
        local balance=$(cast balance $addr --rpc-url $RPC_URL --ether 2>/dev/null || echo "N/A")
        echo "   • $name: $addr (${balance} ETH)"
    done

    echo "   • TestAccount: $TEST_ADDRESS (Custom Test Address)"

    echo ""
    echo "📈 Expected PageRank Leaders:"
    echo "   1. Alice - Authority figure with high outgoing weight"
    echo "   2. TestAccount ($TEST_ADDRESS) - Receives high-weight vouches from Alice (85) and Bob (75)"
    echo "   3. Bob - Receives high-weight vouch from Alice (95) and vouches for others"
    echo "   4. Charlie - Well-connected in community network"
    echo "   5. Diana - Active in community vouching"
    echo "   6. Eve/Frank - Moderate community participation"
    echo ""
    echo "🔍 Network Patterns Created:"
    echo "   • Authority: Alice vouches for Bob (95) and TestAccount (85)"
    echo "   • TestAccount: Receives vouches from Alice (85) and Bob (75)"
    echo "   • Spammers: Grace, Henry, Ivy only vouch for themselves (100 each)"
    echo "   • Community: Legitimate vouching web between non-spammers (40-70)"
    echo "   • Anti-spam: Spammers isolated from legitimate network"
    echo "   • Total: ~13 vouching attestations (3 authority + 3 spam + 7 community)"
    echo ""
    echo "⚙️ Contract Addresses:"
    echo "   • EAS: $EAS_ADDRESS (direct attestations)"
    echo "   • Vouching Schema: $VOUCHING_SCHEMA_ID"
    echo "   • RPC: $RPC_URL"
    echo ""
    echo "✨ Direct EAS Attestations:"
    echo "   • Attestations created directly on EAS contract"
    echo "   • Each user's address is recorded as the actual attester"
    echo "   • Creates proper graph connections for PageRank algorithm"
    echo "   • TestAccount ($TEST_ADDRESS) integrated into vouching network"
    echo -e "${NC}"
}

# Function to provide next steps
show_next_steps() {
    print_step "Next Steps for PageRank Testing"

    echo -e "${YELLOW}"
    echo "🎯 Your simple vouching network is ready!"
    echo ""
    echo "🔄 Next Steps:"
    echo "   1. Environment setup:"
    echo "      export WAVS_ENV_EAS_ADDRESS=\"$EAS_ADDRESS\""
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
    echo "📊 Expected Results:"
    echo "   • Alice should have highest PageRank (authority giving high-weight vouches)"
    echo "   • TestAccount ($TEST_ADDRESS) should rank very high (receives vouches from Alice and Bob)"
    echo "   • Bob should rank high (receives high-weight vouch from Alice)"
    echo "   • Grace/Henry/Ivy should rank low (spammers isolated from network)"
    echo "   • PageRank algorithm should resist self-vouching spam attacks"
    echo ""
    echo "🎯 Key Improvement:"
    echo "   • Attestations now created directly on EAS contract"
    echo "   • User addresses properly recorded as attesters"
    echo "   • Graph connections between users now visible to PageRank"
    echo "   • TestAccount integrated with high-weight vouches from key nodes"
    echo -e "${NC}"
}

# Main function
main() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║         Direct EAS PageRank Vouching Network Creator         ║"
    echo "║                                                              ║"
    echo "║    Creates attestations directly on EAS contract to ensure   ║"
    echo "║    proper attester addresses for PageRank algorithm         ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    check_dependencies
    load_deployment_config
    verify_network
    create_attestations
    analyze_network
    show_next_steps

    print_success "Direct EAS vouching network created successfully! 🎉"
}

# Handle command line arguments
case "${1:-}" in
    "help"|"-h"|"--help")
        echo "Direct EAS PageRank Vouching Network Creator"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  (no args)  Create direct EAS vouching attestation network"
        echo "  help       Show this help message"
        echo ""
        echo "Prerequisites:"
        echo "  • Contracts must be deployed (deployment_summary.json exists)"
        echo "  • Anvil must be running on localhost:8545"
        echo "  • Default anvil accounts will be used as test personas"
        echo ""
        echo "This script creates ~13 vouching attestations directly on EAS:"
        echo "  • Direct EAS calls (not through Attester.sol)"
        echo "  • Authority voucher (Alice vouches for Bob and TestAccount)"
        echo "  • Bob also vouches for TestAccount"
        echo "  • Spam vouchers (Grace/Henry/Ivy self-vouch with weight 100)"
        echo "  • Community vouchers (legitimate users, weights 40-70)"
        echo "  • Anti-spam testing (spammers isolated from legitimate network)"
        echo ""
        echo "TestAccount ($TEST_ADDRESS) receives:"
        echo "  • Weight 85 vouch from Alice (authority)"
        echo "  • Weight 75 vouch from Bob (trusted node)"
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
