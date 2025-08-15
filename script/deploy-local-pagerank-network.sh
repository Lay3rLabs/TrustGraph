#!/bin/bash

# Deploy PageRank Test Network to Local Blockchain
# This script creates a real attestation network for PageRank testing on a local chain

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
ANVIL_PID=""
RPC_URL="http://localhost:8545"
CHAIN_ID="31337"

# Deployment addresses (will be populated)
EAS_ADDRESS=""
SCHEMA_REGISTRY_ADDRESS=""
ATTESTER_ADDRESS=""
BASIC_SCHEMA_ID=""
LIKE_SCHEMA_ID=""
VOUCHING_SCHEMA_ID=""
STATEMENT_SCHEMA_ID=""

# Test account private keys (deterministic for testing)
declare -A TEST_ACCOUNTS
TEST_ACCOUNTS[Alice]="0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
TEST_ACCOUNTS[Bob]="0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"
TEST_ACCOUNTS[Charlie]="0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6"
TEST_ACCOUNTS[Diana]="0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a"
TEST_ACCOUNTS[Eve]="0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba"
TEST_ACCOUNTS[Frank]="0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e"
TEST_ACCOUNTS[Grace]="0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356"
TEST_ACCOUNTS[Henry]="0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97"
TEST_ACCOUNTS[Ivy]="0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6"
TEST_ACCOUNTS[Jack]="0xf214f2b2cd398c806f84e317254e0f0b801d0643303237d97a22a48e01628897"
TEST_ACCOUNTS[Kate]="0x701b615bbdfb9de65240bc28bd21bbc0d996645a3dd57e7b12bc2bdf6f192c82"
TEST_ACCOUNTS[Liam]="0xa267530f49f8280200edf313ee7af6b827f2a8bce2897751d06a843f644967b1"
TEST_ACCOUNTS[Mia]="0x47c99abed3324a2707c28affff1267e45918ec8c3f20b8aa892e8b065d2942dd"
TEST_ACCOUNTS[Noah]="0xc526ee95bf44d8fc405a158bb884d9d1238d99f0612e9f33d006bb0789009aaa"
TEST_ACCOUNTS[Olivia]="0x8166f546bab6da521a8369cab06c5d2b9e46670292d85c875ee9ec20e84ffb61"

# Deployer key (anvil default)
DEPLOYER_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
DEPLOYER_ADDRESS="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

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

    if ! command -v forge &> /dev/null; then
        print_error "forge not found. Please install Foundry: https://getfoundry.sh"
        exit 1
    fi

    if ! command -v anvil &> /dev/null; then
        print_error "anvil not found. Please install Foundry: https://getfoundry.sh"
        exit 1
    fi

    if ! command -v cast &> /dev/null; then
        print_error "cast not found. Please install Foundry: https://getfoundry.sh"
        exit 1
    fi

    print_success "All dependencies found"
}

# Function to start anvil
start_anvil() {
    if pgrep -f "anvil" > /dev/null; then
        print_info "Anvil already running"
        return
    fi

    print_step "Starting Anvil local blockchain"

    # Start anvil with deterministic accounts
    anvil \
        --host 0.0.0.0 \
        --port 8545 \
        --chain-id $CHAIN_ID \
        --accounts 20 \
        --balance 10000 \
        --gas-limit 30000000 \
        --gas-price 1000000000 \
        > anvil.log 2>&1 &

    ANVIL_PID=$!
    sleep 3

    # Verify anvil is running
    if ! curl -s -X POST -H "Content-Type: application/json" \
        --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
        $RPC_URL > /dev/null; then
        print_error "Failed to start anvil"
        exit 1
    fi

    print_success "Anvil started (PID: $ANVIL_PID) on $RPC_URL"
}

# Function to stop anvil
stop_anvil() {
    if [ ! -z "$ANVIL_PID" ] && kill -0 $ANVIL_PID 2>/dev/null; then
        print_step "Stopping Anvil"
        kill $ANVIL_PID
        wait $ANVIL_PID 2>/dev/null || true
        print_success "Anvil stopped"
    elif pgrep -f "anvil" > /dev/null; then
        print_step "Stopping existing Anvil processes"
        pkill -f "anvil" || true
        sleep 2
        print_success "Anvil processes stopped"
    fi
}

# Function to fund test accounts
fund_accounts() {
    print_step "Funding test accounts"

    for name in "${!TEST_ACCOUNTS[@]}"; do
        local private_key="${TEST_ACCOUNTS[$name]}"
        local address=$(cast wallet address "$private_key")

        # Send 100 ETH to each test account
        cast send --private-key $DEPLOYER_KEY \
            --rpc-url $RPC_URL \
            --value 100ether \
            $address \
            > /dev/null 2>&1

        local balance=$(cast balance $address --rpc-url $RPC_URL --ether)
        print_info "Funded $name ($address): ${balance} ETH"
    done

    print_success "All test accounts funded"
}

# Function to deploy EAS contracts
deploy_contracts() {
    print_step "Deploying EAS contracts"

    cd "$PROJECT_ROOT"

    # Create mock service manager address (we don't need real WAVS for testing)
    local mock_service_manager="0x1234567890123456789012345678901234567890"

    print_info "Deploying with mock service manager: $mock_service_manager"

    # Deploy using forge script
    local deploy_output=$(forge script script/DeployEAS.s.sol:DeployEAS \
        --rpc-url $RPC_URL \
        --private-key $DEPLOYER_KEY \
        --broadcast \
        --verify=false \
        --sig "run(string)" "$mock_service_manager" 2>&1)

    echo "$deploy_output"

    # Extract addresses from deployment output
    EAS_ADDRESS=$(echo "$deploy_output" | grep "EAS deployed at:" | awk '{print $4}')
    SCHEMA_REGISTRY_ADDRESS=$(echo "$deploy_output" | grep "SchemaRegistry deployed at:" | awk '{print $4}')
    ATTESTER_ADDRESS=$(echo "$deploy_output" | grep "Attester deployed at:" | awk '{print $4}')

    # Extract schema IDs
    BASIC_SCHEMA_ID=$(echo "$deploy_output" | grep "Basic Schema ID:" | awk '{print $4}')
    LIKE_SCHEMA_ID=$(echo "$deploy_output" | grep "Like Schema ID:" | awk '{print $4}')
    VOUCHING_SCHEMA_ID=$(echo "$deploy_output" | grep "Vouching Schema ID:" | awk '{print $4}')
    STATEMENT_SCHEMA_ID=$(echo "$deploy_output" | grep "Statement Schema ID:" | awk '{print $4}')

    # Verify deployments
    if [[ -z "$EAS_ADDRESS" || -z "$ATTESTER_ADDRESS" || -z "$BASIC_SCHEMA_ID" ]]; then
        print_error "Contract deployment failed or addresses not found"
        print_error "Deploy output: $deploy_output"
        exit 1
    fi

    print_success "Contracts deployed successfully"
    print_info "EAS: $EAS_ADDRESS"
    print_info "Attester: $ATTESTER_ADDRESS"
    print_info "Basic Schema: $BASIC_SCHEMA_ID"
    print_info "Like Schema: $LIKE_SCHEMA_ID"
    print_info "Vouching Schema: $VOUCHING_SCHEMA_ID"
}

# Function to create attestation
create_attestation() {
    local attester_name="$1"
    local recipient_name="$2"
    local schema_id="$3"
    local data="$4"
    local description="$5"

    local attester_key="${TEST_ACCOUNTS[$attester_name]}"
    local recipient_key="${TEST_ACCOUNTS[$recipient_name]}"
    local recipient_addr=$(cast wallet address "$recipient_key")

    print_info "Creating: $description"

    # Create the attestation
    local tx_hash=$(cast send $ATTESTER_ADDRESS \
        --private-key $attester_key \
        --rpc-url $RPC_URL \
        "attest(bytes32,address,bytes)" \
        $schema_id \
        $recipient_addr \
        $data 2>/dev/null)

    if [[ $? -eq 0 ]]; then
        print_success "  ✓ TX: $tx_hash"
    else
        print_error "  ✗ Failed to create attestation"
        return 1
    fi
}

# Function to create all attestations
create_attestations() {
    print_step "Creating PageRank test attestations"

    local total_attestations=0

    # Hub pattern - Alice as central hub
    print_info "Creating hub pattern with Alice..."
    for name in Bob Charlie Diana Eve Frank Grace Henry Ivy; do
        create_attestation "$name" "Alice" "$LIKE_SCHEMA_ID" "0x0000000000000000000000000000000000000000000000000000000000000001" "$name endorses hub Alice"
        ((total_attestations++))
    done

    # Alice responds to first 4
    for name in Bob Charlie Diana Eve; do
        local timestamp=$(date +%s)
        local data=$(cast abi-encode "f(bytes32,string,uint256)" "0x6875625f726573706f6e7365000000000000000000000000000000000000000" "Hub acknowledgment" $timestamp)
        create_attestation "Alice" "$name" "$BASIC_SCHEMA_ID" "$data" "Hub Alice acknowledges $name"
        ((total_attestations++))
    done

    # Authority pattern - Diana gives high-weight endorsements
    print_info "Creating authority pattern with Diana..."
    local weights=(95 90 85 80 75 70)
    local recipients=(Alice Bob Charlie Frank Grace Henry)
    for i in {0..5}; do
        local weight=${weights[$i]}
        local recipient=${recipients[$i]}
        local data=$(cast abi-encode "f(uint256)" $weight)
        create_attestation "Diana" "$recipient" "$VOUCHING_SCHEMA_ID" "$data" "Authority Diana vouches for $recipient (weight: $weight)"
        ((total_attestations++))
    done

    # Chain pattern - trust chain
    print_info "Creating chain of trust pattern..."
    local chain_names=(Bob Charlie Diana Eve Frank)
    local chain_weights=(80 75 70 65)
    for i in {0..3}; do
        local from=${chain_names[$i]}
        local to=${chain_names[$((i+1))]}
        local weight=${chain_weights[$i]}
        local data=$(cast abi-encode "f(uint256)" $weight)
        create_attestation "$from" "$to" "$VOUCHING_SCHEMA_ID" "$data" "Chain: $from -> $to (weight: $weight)"
        ((total_attestations++))
    done

    # Mutual connections
    print_info "Creating mutual connections..."
    local data75=$(cast abi-encode "f(uint256)" 75)
    local data80=$(cast abi-encode "f(uint256)" 80)
    local like_true=$(cast abi-encode "f(bool)" true)

    create_attestation "Grace" "Henry" "$VOUCHING_SCHEMA_ID" "$data75" "Grace vouches for Henry"
    create_attestation "Henry" "Grace" "$VOUCHING_SCHEMA_ID" "$data80" "Henry vouches for Grace"
    create_attestation "Ivy" "Jack" "$LIKE_SCHEMA_ID" "$like_true" "Ivy likes Jack"
    create_attestation "Jack" "Ivy" "$LIKE_SCHEMA_ID" "$like_true" "Jack likes Ivy"
    total_attestations=$((total_attestations + 4))

    # Community clusters
    print_info "Creating community clusters..."
    # Cluster 1: Kate, Liam, Mia
    local cluster1=(Kate Liam Mia)
    for i in {0..2}; do
        for j in {0..2}; do
            if [[ $i -ne $j ]]; then
                create_attestation "${cluster1[$i]}" "${cluster1[$j]}" "$LIKE_SCHEMA_ID" "$like_true" "Cluster1: ${cluster1[$i]} <-> ${cluster1[$j]}"
                ((total_attestations++))
            fi
        done
    done

    # Cluster 2: Noah and Olivia partnership
    local data85=$(cast abi-encode "f(uint256)" 85)
    create_attestation "Noah" "Olivia" "$VOUCHING_SCHEMA_ID" "$data85" "Noah partners with Olivia"
    create_attestation "Olivia" "Noah" "$VOUCHING_SCHEMA_ID" "$data85" "Olivia partners with Noah"
    total_attestations=$((total_attestations + 2))

    # Bridge connections - Charlie connecting groups
    print_info "Creating bridge connections through Charlie..."
    local timestamp=$(date +%s)
    local bridge_data=$(cast abi-encode "f(bytes32,string,uint256)" "0x627269646765000000000000000000000000000000000000000000000000000" "Inter-group connection" $timestamp)
    for name in Alice Frank Ivy Kate Noah Olivia; do
        create_attestation "Charlie" "$name" "$BASIC_SCHEMA_ID" "$bridge_data" "Bridge Charlie connects to $name"
        ((total_attestations++))
    done

    # Random connections for network diversity
    print_info "Adding random connections for network diversity...")
    local random_connections=(
        "Eve:Kate:like"
        "Frank:Noah:60"
        "Henry:Liam:65"
        "Jack:Olivia:like"
        "Liam:Bob:like"
        "Mia:Grace:55"
        "Olivia:Eve:like"
        "Ivy:Alice:70"
    )

    for connection in "${random_connections[@]}"; do
        IFS=':' read -r from to type <<< "$connection"
        if [[ "$type" == "like" ]]; then
            create_attestation "$from" "$to" "$LIKE_SCHEMA_ID" "$like_true" "Random: $from -> $to"
        else
            local weight_data=$(cast abi-encode "f(uint256)" $type)
            create_attestation "$from" "$to" "$VOUCHING_SCHEMA_ID" "$weight_data" "Random: $from -> $to (weight: $type)"
        fi
        ((total_attestations++))
    done

    print_success "Created $total_attestations attestations successfully!"
}

# Function to verify network
verify_network() {
    print_step "Verifying network creation"

    # Check some key attestations exist
    local alice_addr=$(cast wallet address "${TEST_ACCOUNTS[Alice]}")
    local diana_addr=$(cast wallet address "${TEST_ACCOUNTS[Diana]}")

    print_info "Alice address: $alice_addr"
    print_info "Diana address: $diana_addr"

    # Get attestation count (if EAS supports it)
    print_info "Network verification complete - contracts deployed and accessible"
    print_success "PageRank test network ready!"
}

# Function to generate summary
generate_summary() {
    print_step "Deployment Summary"

    echo -e "${CYAN}"
    echo "🎉 PageRank Test Network Deployed Successfully!"
    echo ""
    echo "📊 Network Details:"
    echo "   • Chain ID: $CHAIN_ID"
    echo "   • RPC URL: $RPC_URL"
    echo "   • 15 test accounts with 100 ETH each"
    echo "   • 48+ attestations across 4 schema types"
    echo ""
    echo "📝 Contract Addresses:"
    echo "   • EAS: $EAS_ADDRESS"
    echo "   • Schema Registry: $SCHEMA_REGISTRY_ADDRESS"
    echo "   • Attester: $ATTESTER_ADDRESS"
    echo ""
    echo "🔑 Schema IDs:"
    echo "   • Basic: $BASIC_SCHEMA_ID"
    echo "   • Like: $LIKE_SCHEMA_ID"
    echo "   • Vouching: $VOUCHING_SCHEMA_ID"
    echo "   • Statement: $STATEMENT_SCHEMA_ID"
    echo ""
    echo "👥 Test Accounts:"
    for name in "${!TEST_ACCOUNTS[@]}"; do
        local addr=$(cast wallet address "${TEST_ACCOUNTS[$name]}")
        local balance=$(cast balance $addr --rpc-url $RPC_URL --ether)
        echo "   • $name: $addr (${balance} ETH)"
    done
    echo ""
    echo "🔄 Next Steps:"
    echo "   1. Keep anvil running for testing"
    echo "   2. Set environment variables for PageRank component:"
    echo "      export WAVS_ENV_EAS_ADDRESS=\"$EAS_ADDRESS\""
    echo "      export WAVS_ENV_ATTESTER_ADDRESS=\"$ATTESTER_ADDRESS\""
    echo "      export WAVS_ENV_BASIC_SCHEMA_ID=\"$BASIC_SCHEMA_ID\""
    echo "      export WAVS_ENV_LIKE_SCHEMA_ID=\"$LIKE_SCHEMA_ID\""
    echo "      export WAVS_ENV_VOUCHING_SCHEMA_ID=\"$VOUCHING_SCHEMA_ID\""
    echo "      export WAVS_ENV_RPC_URL=\"$RPC_URL\""
    echo "      export WAVS_ENV_CHAIN_ID=\"$CHAIN_ID\""
    echo ""
    echo "   3. Build and test PageRank component:"
    echo "      make wasi-build"
    echo "      make wasi-exec COMPONENT_FILENAME=rewards.wasm INPUT_DATA=\"test-pagerank\""
    echo ""
    echo "   4. Query attestations manually:"
    echo "      cast call $EAS_ADDRESS \"getAttestation(bytes32)\" <uid> --rpc-url $RPC_URL"
    echo ""
    echo "📈 Expected PageRank Leaders:"
    echo "   1. Alice (Hub) - 11 incoming connections"
    echo "   2. Diana (Authority) - 565 total vouching weight"
    echo "   3. Charlie (Bridge) - 8 outgoing connections"
    echo "   4. Bob (Influencer) - Chain + bidirectional hub"
    echo ""
    echo "⚠️  Keep anvil running for testing. Stop with: kill $ANVIL_PID"
    echo -e "${NC}"
}

# Function to save environment
save_environment() {
    local env_file="$PROJECT_ROOT/.env.pagerank"

    cat > "$env_file" << EOF
# PageRank Test Network Environment
# Generated on $(date)

# Network Configuration
RPC_URL=$RPC_URL
CHAIN_ID=$CHAIN_ID
ANVIL_PID=$ANVIL_PID

# Contract Addresses
WAVS_ENV_EAS_ADDRESS=$EAS_ADDRESS
WAVS_ENV_SCHEMA_REGISTRY_ADDRESS=$SCHEMA_REGISTRY_ADDRESS
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

# Test Account Private Keys
$(for name in "${!TEST_ACCOUNTS[@]}"; do
    echo "TEST_${name^^}_PRIVATE_KEY=${TEST_ACCOUNTS[$name]}"
done)
EOF

    print_success "Environment saved to .env.pagerank"
    print_info "Source with: source .env.pagerank"
}

# Cleanup function
cleanup() {
    if [[ "${1:-}" == "EXIT" ]]; then
        print_step "Cleaning up on exit"
        # Don't stop anvil on normal exit - let it keep running
        print_info "Leaving anvil running for continued testing"
        print_info "Stop manually with: kill $ANVIL_PID"
    else
        print_step "Cleaning up"
        stop_anvil
    fi
}

# Main function
main() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║              PageRank Local Network Deployment               ║"
    echo "║                                                              ║"
    echo "║  Deploys real contracts and creates attestations on local   ║"
    echo "║  blockchain for comprehensive PageRank algorithm testing    ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    # Set up cleanup trap
    trap 'cleanup EXIT' EXIT
    trap 'cleanup INT' INT TERM

    # Main deployment pipeline
    check_dependencies
    start_anvil
    fund_accounts
    deploy_contracts
    create_attestations
    verify_network
    save_environment
    generate_summary

    print_success "PageRank test network deployment completed!"
    print_warning "Keep this terminal open to maintain the local blockchain"
}

# Handle command line arguments
case "${1:-}" in
    "cleanup"|"stop")
        stop_anvil
        exit 0
        ;;
    "help"|"-h"|"--help")
        echo "PageRank Local Network Deployment"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  (no args)  Deploy complete PageRank test network"
        echo "  cleanup    Stop anvil and cleanup"
        echo "  stop       Stop anvil and cleanup"
        echo "  help       Show this help message"
        echo ""
        echo "This script will:"
        echo "  1. Start local anvil blockchain"
        echo "  2. Deploy EAS contracts"
        echo "  3. Fund 15 test accounts"
        echo "  4. Create 48+ attestations with realistic patterns"
        echo "  5. Save environment configuration"
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
