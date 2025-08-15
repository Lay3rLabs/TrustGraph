#!/bin/bash

# Setup PageRank Environment Variables
# Automatically extracts configuration from deployment_summary.json

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
OUTPUT_FILE="$PROJECT_ROOT/.env.pagerank"

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
    if ! command -v jq &> /dev/null; then
        print_error "jq not found. Please install jq for JSON parsing"
        exit 1
    fi

    if [[ ! -f "$DEPLOYMENT_FILE" ]]; then
        print_error "Deployment file not found: $DEPLOYMENT_FILE"
        print_error "Please ensure contracts are deployed first"
        exit 1
    fi

    if ! jq empty "$DEPLOYMENT_FILE" 2>/dev/null; then
        print_error "Invalid JSON in deployment file"
        exit 1
    fi
}

# Function to extract values from deployment summary
extract_deployment_config() {
    print_step "Extracting configuration from deployment summary"

    # Network configuration
    RPC_URL=$(jq -r '.rpc_url' "$DEPLOYMENT_FILE")
    WAVS_SERVICE_MANAGER=$(jq -r '.wavs_service_manager' "$DEPLOYMENT_FILE")

    # EAS contracts
    EAS_ADDRESS=$(jq -r '.eas_contracts.eas' "$DEPLOYMENT_FILE")
    SCHEMA_REGISTRY=$(jq -r '.eas_contracts.schema_registry' "$DEPLOYMENT_FILE")
    ATTESTER_ADDRESS=$(jq -r '.eas_contracts.attester' "$DEPLOYMENT_FILE")
    SCHEMA_REGISTRAR=$(jq -r '.eas_contracts.schema_registrar' "$DEPLOYMENT_FILE")
    INDEXER_ADDRESS=$(jq -r '.eas_contracts.indexer' "$DEPLOYMENT_FILE")
    INDEXER_RESOLVER=$(jq -r '.eas_contracts.indexer_resolver' "$DEPLOYMENT_FILE")

    # Schema IDs
    BASIC_SCHEMA_ID=$(jq -r '.eas_schemas.basic_schema' "$DEPLOYMENT_FILE")
    COMPUTE_SCHEMA_ID=$(jq -r '.eas_schemas.compute_schema' "$DEPLOYMENT_FILE")
    STATEMENT_SCHEMA_ID=$(jq -r '.eas_schemas.statement_schema' "$DEPLOYMENT_FILE")
    IS_TRUE_SCHEMA_ID=$(jq -r '.eas_schemas.is_true_schema' "$DEPLOYMENT_FILE")
    LIKE_SCHEMA_ID=$(jq -r '.eas_schemas.like_schema' "$DEPLOYMENT_FILE")
    VOUCHING_SCHEMA_ID=$(jq -r '.eas_schemas.vouching_schema' "$DEPLOYMENT_FILE")

    # Service contracts
    TRIGGER_ADDRESS=$(jq -r '.service_contracts.trigger' "$DEPLOYMENT_FILE")

    # Governance contracts
    VOTING_POWER_ADDRESS=$(jq -r '.governance_contracts.voting_power' "$DEPLOYMENT_FILE")
    TIMELOCK_ADDRESS=$(jq -r '.governance_contracts.timelock' "$DEPLOYMENT_FILE")
    GOVERNOR_ADDRESS=$(jq -r '.governance_contracts.governor' "$DEPLOYMENT_FILE")

    # Reward contracts
    REWARD_DISTRIBUTOR_ADDRESS=$(jq -r '.reward_contracts.reward_distributor' "$DEPLOYMENT_FILE")
    REWARD_TOKEN_ADDRESS=$(jq -r '.reward_contracts.reward_token' "$DEPLOYMENT_FILE")

    print_success "Configuration extracted successfully"
}

# Function to validate extracted config
validate_config() {
    print_step "Validating extracted configuration"

    local errors=0

    # Check required addresses are not null
    if [[ "$EAS_ADDRESS" == "null" || -z "$EAS_ADDRESS" ]]; then
        print_error "EAS address not found in deployment file"
        ((errors++))
    fi

    if [[ "$ATTESTER_ADDRESS" == "null" || -z "$ATTESTER_ADDRESS" ]]; then
        print_error "Attester address not found in deployment file"
        ((errors++))
    fi

    if [[ "$BASIC_SCHEMA_ID" == "null" || -z "$BASIC_SCHEMA_ID" ]]; then
        print_error "Basic schema ID not found in deployment file"
        ((errors++))
    fi

    if [[ "$RPC_URL" == "null" || -z "$RPC_URL" ]]; then
        print_warning "RPC URL not found, using default localhost:8545"
        RPC_URL="http://localhost:8545"
    fi

    if [[ $errors -gt 0 ]]; then
        print_error "Configuration validation failed with $errors errors"
        exit 1
    fi

    print_success "Configuration validation passed"
}

# Function to generate environment file
generate_env_file() {
    print_step "Generating environment file"

    cat > "$OUTPUT_FILE" << EOF
# PageRank Environment Variables
# Auto-generated from deployment_summary.json on $(date)
# Source this file with: source .env.pagerank

# =============================================================================
# NETWORK CONFIGURATION
# =============================================================================
export WAVS_ENV_RPC_URL="$RPC_URL"
export WAVS_ENV_CHAIN_ID="31337"
export WAVS_ENV_WAVS_SERVICE_MANAGER="$WAVS_SERVICE_MANAGER"

# =============================================================================
# EAS CONTRACT ADDRESSES
# =============================================================================
export WAVS_ENV_EAS_ADDRESS="$EAS_ADDRESS"
export WAVS_ENV_SCHEMA_REGISTRY_ADDRESS="$SCHEMA_REGISTRY"
export WAVS_ENV_ATTESTER_ADDRESS="$ATTESTER_ADDRESS"
export WAVS_ENV_SCHEMA_REGISTRAR_ADDRESS="$SCHEMA_REGISTRAR"
export WAVS_ENV_INDEXER_ADDRESS="$INDEXER_ADDRESS"
export WAVS_ENV_INDEXER_RESOLVER_ADDRESS="$INDEXER_RESOLVER"

# =============================================================================
# SCHEMA IDs
# =============================================================================
export WAVS_ENV_BASIC_SCHEMA_ID="$BASIC_SCHEMA_ID"
export WAVS_ENV_COMPUTE_SCHEMA_ID="$COMPUTE_SCHEMA_ID"
export WAVS_ENV_STATEMENT_SCHEMA_ID="$STATEMENT_SCHEMA_ID"
export WAVS_ENV_IS_TRUE_SCHEMA_ID="$IS_TRUE_SCHEMA_ID"
export WAVS_ENV_LIKE_SCHEMA_ID="$LIKE_SCHEMA_ID"
export WAVS_ENV_VOUCHING_SCHEMA_ID="$VOUCHING_SCHEMA_ID"

# =============================================================================
# SERVICE CONTRACT ADDRESSES
# =============================================================================
export WAVS_ENV_TRIGGER_ADDRESS="$TRIGGER_ADDRESS"

# =============================================================================
# GOVERNANCE CONTRACT ADDRESSES
# =============================================================================
export WAVS_ENV_VOTING_POWER_ADDRESS="$VOTING_POWER_ADDRESS"
export WAVS_ENV_TIMELOCK_ADDRESS="$TIMELOCK_ADDRESS"
export WAVS_ENV_GOVERNOR_ADDRESS="$GOVERNOR_ADDRESS"

# =============================================================================
# REWARD CONTRACT ADDRESSES
# =============================================================================
export WAVS_ENV_REWARD_DISTRIBUTOR_ADDRESS="$REWARD_DISTRIBUTOR_ADDRESS"
export WAVS_ENV_REWARD_TOKEN_ADDRESS="$REWARD_TOKEN_ADDRESS"

# =============================================================================
# PAGERANK ALGORITHM PARAMETERS
# =============================================================================
export WAVS_ENV_PAGERANK_REWARD_POOL="1000000000000000000000"  # 1000 ETH
export WAVS_ENV_PAGERANK_DAMPING_FACTOR="0.85"
export WAVS_ENV_PAGERANK_MAX_ITERATIONS="100"
export WAVS_ENV_PAGERANK_MIN_THRESHOLD="0.0001"
export WAVS_ENV_PAGERANK_CONVERGENCE_THRESHOLD="0.0001"

# =============================================================================
# TEST ACCOUNT ADDRESSES (Default Anvil Accounts)
# =============================================================================
export TEST_ALICE_ADDRESS="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"    # Account 1
export TEST_BOB_ADDRESS="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"      # Account 2
export TEST_CHARLIE_ADDRESS="0x90F79bf6EB2c4f870365E785982E1f101E93b906"  # Account 3
export TEST_DIANA_ADDRESS="0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"    # Account 4
export TEST_EVE_ADDRESS="0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc"      # Account 5
export TEST_FRANK_ADDRESS="0x976EA74026E726554dB657fA54763abd0C3a0aa9"    # Account 6
export TEST_GRACE_ADDRESS="0x14dC79964da2C08b23698B3D3cc7Ca32193d9955"    # Account 7
export TEST_HENRY_ADDRESS="0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f"    # Account 8
export TEST_IVY_ADDRESS="0xa0Ee7A142d267C1f36714E4a8F75612F20a79720"      # Account 9

# =============================================================================
# COMPONENT BUILD CONFIGURATION
# =============================================================================
export WAVS_BUILD_TARGET="wasm32-wasi"
export WAVS_BUILD_RELEASE="true"

# =============================================================================
# LOGGING AND DEBUG
# =============================================================================
export WAVS_ENV_LOG_LEVEL="info"
export WAVS_ENV_DEBUG_PAGERANK="false"

EOF

    print_success "Environment file generated: $OUTPUT_FILE"
}

# Function to display summary
display_summary() {
    print_step "Environment Setup Summary"

    echo -e "${CYAN}"
    echo "🎉 PageRank Environment Setup Complete!"
    echo ""
    echo "📋 Generated Configuration:"
    echo "  • Network: $RPC_URL (Chain ID: 31337)"
    echo "  • EAS: $EAS_ADDRESS"
    echo "  • Attester: $ATTESTER_ADDRESS"
    echo "  • Schemas: Basic, Like, Vouching, Statement, IsTrue, Compute"
    echo "  • Service Manager: $WAVS_SERVICE_MANAGER"
    echo ""
    echo "📄 Environment file: $OUTPUT_FILE"
    echo ""
    echo "🚀 Next Steps:"
    echo "  1. Load the environment:"
    echo "     source .env.pagerank"
    echo "     # OR: eval \$(./script/setup-pagerank-env.sh --eval)"
    echo ""
    echo "  2. Verify environment is loaded:"
    echo "     echo \$WAVS_ENV_EAS_ADDRESS"
    echo ""
    echo "  3. Create PageRank test network:"
    echo "     ./script/create-pagerank-attestations.sh"
    echo ""
    echo "  4. Build and test PageRank component:"
    echo "     make wasi-build"
    echo "     make wasi-exec COMPONENT_FILENAME=rewards.wasm INPUT_DATA=\"test-pagerank\""
    echo ""
    echo "  5. Verify network with:"
    echo "     ./script/verify-pagerank-network.sh"
    echo ""
    echo "⚙️ PageRank Parameters:"
    echo "  • Damping Factor: 0.85"
    echo "  • Max Iterations: 100"
    echo "  • Convergence Threshold: 0.0001"
    echo "  • Reward Pool: 1000 ETH"
    echo -e "${NC}"
}

# Function to show environment loading instructions
show_env_instructions() {
    print_info "To load environment variables, run:"
    print_info "  source .env.pagerank"
    print_info "Or generate and load in one step:"
    print_info "  eval \$(./script/setup-pagerank-env.sh --eval)"
}

# Main function
main() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║              PageRank Environment Setup                     ║"
    echo "║                                                              ║"
    echo "║  Automatically generates environment variables from          ║"
    echo "║  deployment_summary.json for PageRank testing              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    check_dependencies
    extract_deployment_config
    validate_config
    generate_env_file
    display_summary
    show_env_instructions

    print_success "PageRank environment setup completed! 🎉"
}



# Handle command line arguments
case "${1:-}" in
    "--eval"|"-e")
        check_dependencies
        extract_deployment_config
        validate_config
        generate_env_file
        echo "source '$OUTPUT_FILE'"
        ;;
    "--output"|"-o")
        OUTPUT_FILE="${2:-$OUTPUT_FILE}"
        main
        ;;
    "help"|"-h"|"--help")
        echo "PageRank Environment Setup"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --eval, -e       Generate and output source command for evaluation"
        echo "  --output, -o     Specify output file (default: .env.pagerank)"
        echo "  help            Show this help message"
        echo ""
        echo "This script automatically extracts contract addresses and configuration"
        echo "from deployment_summary.json and generates environment variables"
        echo "ready for PageRank component testing."
        echo ""
        echo "Usage to load environment variables:"
        echo "  # Generate file then load manually:"
        echo "  ./script/setup-pagerank-env.sh"
        echo "  source .env.pagerank"
        echo ""
        echo "  # Or generate and load in one step:"
        echo "  eval \$(./script/setup-pagerank-env.sh --eval)"
        echo ""
        echo "Generated variables include:"
        echo "  • Network configuration (RPC, Chain ID)"
        echo "  • Contract addresses (EAS, Attester, Schemas)"
        echo "  • PageRank algorithm parameters"
        echo "  • Test account addresses"
        echo ""
        exit 0
        ;;
    "")
        main
        ;;
    *)
        print_error "Unknown option: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac
