#!/bin/bash

# PageRank Test Runner Script
# This script sets up and runs comprehensive PageRank testing for the attestation system

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ANVIL_PID=""

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

# Function to start anvil if not running
start_anvil() {
    if ! pgrep -f "anvil" > /dev/null; then
        print_step "Starting Anvil local blockchain"
        anvil --host 0.0.0.0 --accounts 20 --balance 1000 > /dev/null 2>&1 &
        ANVIL_PID=$!
        sleep 3
        print_success "Anvil started (PID: $ANVIL_PID)"
    else
        print_info "Anvil already running"
    fi
}

# Function to stop anvil
stop_anvil() {
    if [ ! -z "$ANVIL_PID" ]; then
        print_step "Stopping Anvil"
        kill $ANVIL_PID 2>/dev/null || true
        wait $ANVIL_PID 2>/dev/null || true
        print_success "Anvil stopped"
    fi
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

    print_success "All dependencies found"
}

# Function to setup environment
setup_environment() {
    print_step "Setting up environment"

    cd "$PROJECT_ROOT"

    # Set test environment variables
    export DEPLOY_ENV=LOCAL
    export FUNDED_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

    # PageRank test specific variables
    export WAVS_ENV_PAGERANK_REWARD_POOL="1000000000000000000000"  # 1000 ETH
    export WAVS_ENV_PAGERANK_DAMPING_FACTOR="0.85"
    export WAVS_ENV_PAGERANK_MAX_ITERATIONS="100"
    export WAVS_ENV_PAGERANK_MIN_THRESHOLD="0.0001"

    print_success "Environment configured"
}

# Function to run PageRank network test
run_pagerank_test() {
    print_step "Running PageRank Network Test"

    cd "$PROJECT_ROOT"

    echo -e "${PURPLE}"
    echo "████████╗███████╗███████╗████████╗██╗███╗   ██╗ ██████╗ "
    echo "╚══██╔══╝██╔════╝██╔════╝╚══██╔══╝██║████╗  ██║██╔════╝ "
    echo "   ██║   █████╗  ███████╗   ██║   ██║██╔██╗ ██║██║  ███╗"
    echo "   ██║   ██╔══╝  ╚════██║   ██║   ██║██║╚██╗██║██║   ██║"
    echo "   ██║   ███████╗███████║   ██║   ██║██║ ╚████║╚██████╔╝"
    echo "   ╚═╝   ╚══════╝╚══════╝   ╚═╝   ╚═╝╚═╝  ╚═══╝ ╚═════╝ "
    echo ""
    echo "██████╗  █████╗  ██████╗ ███████╗██████╗  █████╗ ███╗   ██╗██╗  ██╗"
    echo "██╔══██╗██╔══██╗██╔════╝ ██╔════╝██╔══██╗██╔══██╗████╗  ██║██║ ██╔╝"
    echo "██████╔╝███████║██║  ███╗█████╗  ██████╔╝███████║██╔██╗ ██║█████╔╝ "
    echo "██╔═══╝ ██╔══██║██║   ██║██╔══╝  ██╔══██╗██╔══██║██║╚██╗██║██╔═██╗ "
    echo "██║     ██║  ██║╚██████╔╝███████╗██║  ██║██║  ██║██║ ╚████║██║  ██╗"
    echo "╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝"
    echo -e "${NC}"

    print_info "Creating comprehensive attestation network with 15 test accounts..."
    print_info "This will generate ~50+ attestations with various patterns:"
    print_info "• Hub and spoke (Alice as central hub)"
    print_info "• Authority endorsements (Diana with high weights)"
    print_info "• Chain of trust patterns"
    print_info "• Community clusters"
    print_info "• Bridge connections"
    print_info "• Mutual relationships"

    # Run the comprehensive PageRank network test
    if forge test --match-test testCreatePageRankNetwork -vv; then
        print_success "PageRank network test completed successfully!"
    else
        print_error "PageRank network test failed"
        return 1
    fi
}

# Function to run pattern verification tests
run_pattern_tests() {
    print_step "Running Network Pattern Verification Tests"

    cd "$PROJECT_ROOT"

    print_info "Verifying network patterns are correctly established..."

    if forge test --match-test testNetworkPatterns -vv; then
        print_success "Network pattern verification completed!"
    else
        print_error "Network pattern verification failed"
        return 1
    fi
}

# Function to display network analysis
show_network_analysis() {
    print_step "Running Network Analysis"

    cd "$PROJECT_ROOT"

    if forge test --match-test testPageRankAnalysis -vv; then
        print_success "Network analysis completed!"
    else
        print_warning "Network analysis had issues, but continuing..."
    fi
}

# Function to show next steps
show_next_steps() {
    print_step "Next Steps for PageRank Testing"

    echo -e "${CYAN}"
    echo "🎉 Your PageRank test network is ready!"
    echo ""
    echo "📊 Network Summary:"
    echo "   • 15 test accounts with realistic names"
    echo "   • 50+ attestations across different schemas"
    echo "   • Hub, authority, chain, cluster, and bridge patterns"
    echo "   • Weighted vouching attestations for nuanced scoring"
    echo ""
    echo "🔄 Next Steps:"
    echo "   1. Start WAVS services:"
    echo "      $ make start-all-local"
    echo ""
    echo "   2. Build and test PageRank component:"
    echo "      $ make wasi-build"
    echo "      $ WASI_BUILD_DIR=components/rewards make wasi-build"
    echo ""
    echo "   3. Test PageRank calculations:"
    echo "      $ make wasi-exec COMPONENT_FILENAME=rewards.wasm INPUT_DATA=\"test-pagerank\""
    echo ""
    echo "   4. Monitor attestations in your rewards component"
    echo ""
    echo "📈 Expected PageRank Leaders:"
    echo "   1. Alice (Hub) - Central node with most incoming connections"
    echo "   2. Diana (Authority) - High-weight outgoing endorsements"
    echo "   3. Charlie (Bridge) - Connects different network clusters"
    echo "   4. Bob (Influencer) - Chain member + bidirectional hub connections"
    echo "   5. Grace/Henry (Mutual) - High-weight mutual vouching pair"
    echo ""
    echo "⚙️ Recommended PageRank Parameters:"
    echo "   • Damping factor: 0.85"
    echo "   • Max iterations: 100"
    echo "   • Convergence threshold: 0.0001"
    echo "   • Use edge weights from vouching attestations"
    echo ""
    echo "📝 Environment Variables (already set):"
    echo "   export WAVS_ENV_PAGERANK_REWARD_POOL=\"1000000000000000000000\""
    echo "   export WAVS_ENV_PAGERANK_DAMPING_FACTOR=\"0.85\""
    echo "   export WAVS_ENV_PAGERANK_MAX_ITERATIONS=\"100\""
    echo "   export WAVS_ENV_PAGERANK_MIN_THRESHOLD=\"0.0001\""
    echo -e "${NC}"
}

# Function to cleanup on exit
cleanup() {
    print_step "Cleaning up"
    stop_anvil
    print_success "Cleanup completed"
}

# Main function
main() {
    echo -e "${PURPLE}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║            PageRank Attestation Network Tester            ║"
    echo "║                                                           ║"
    echo "║  This script creates a comprehensive attestation network  ║"
    echo "║  with 15 accounts and 50+ attestations for testing       ║"
    echo "║  PageRank algorithms in decentralized reputation systems  ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    # Set up cleanup trap
    trap cleanup EXIT INT TERM

    # Run test pipeline
    check_dependencies
    setup_environment
    start_anvil
    run_pagerank_test
    run_pattern_tests
    show_network_analysis
    show_next_steps

    print_success "PageRank test setup completed successfully!"
}

# Handle command line arguments
case "${1:-}" in
    "test")
        trap cleanup EXIT INT TERM
        check_dependencies
        setup_environment
        start_anvil
        run_pagerank_test
        ;;
    "patterns")
        trap cleanup EXIT INT TERM
        check_dependencies
        setup_environment
        start_anvil
        run_pattern_tests
        ;;
    "analysis")
        trap cleanup EXIT INT TERM
        check_dependencies
        setup_environment
        start_anvil
        show_network_analysis
        ;;
    "help"|"-h"|"--help")
        echo "PageRank Test Runner"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  (no args)  Run complete PageRank test suite"
        echo "  test       Run only the network creation test"
        echo "  patterns   Run only the pattern verification test"
        echo "  analysis   Run only the network analysis"
        echo "  help       Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0                    # Run full test suite"
        echo "  $0 test              # Create test network only"
        echo "  $0 patterns          # Verify network patterns"
        echo "  $0 analysis          # Show network analysis"
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
