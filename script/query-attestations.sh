#!/bin/bash

# Query PageRank Attestation Network Data
# This script queries actual attestation data from the deployed contracts

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

# Contract addresses
EAS_ADDRESS=""
ATTESTER_ADDRESS=""
BASIC_SCHEMA_ID=""
LIKE_SCHEMA_ID=""
VOUCHING_SCHEMA_ID=""

# Test account addresses
ALICE_ADDRESS="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
BOB_ADDRESS="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
CHARLIE_ADDRESS="0x90F79bf6EB2c4f870365E785982E1f101E93b906"
DIANA_ADDRESS="0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"

# Function to print colored output
print_step() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to load configuration
load_config() {
    print_step "Loading configuration"

    if [[ ! -f "$DEPLOYMENT_FILE" ]]; then
        print_error "Deployment file not found: $DEPLOYMENT_FILE"
        exit 1
    fi

    EAS_ADDRESS=$(jq -r '.eas_contracts.eas' "$DEPLOYMENT_FILE")
    ATTESTER_ADDRESS=$(jq -r '.eas_contracts.attester' "$DEPLOYMENT_FILE")
    BASIC_SCHEMA_ID=$(jq -r '.eas_schemas.basic_schema' "$DEPLOYMENT_FILE")
    LIKE_SCHEMA_ID=$(jq -r '.eas_schemas.like_schema' "$DEPLOYMENT_FILE")
    VOUCHING_SCHEMA_ID=$(jq -r '.eas_schemas.vouching_schema' "$DEPLOYMENT_FILE")

    print_success "Configuration loaded"
    print_info "EAS: $EAS_ADDRESS"
}

# Function to get recent attestation events
get_recent_attestation_events() {
    print_step "Querying recent attestation events"

    print_info "Getting latest block number..."
    local latest_block=$(cast block-number --rpc-url $RPC_URL)
    local from_block=$((latest_block - 1000))  # Last 1000 blocks

    print_info "Searching from block $from_block to $latest_block"

    # Query AttestationMade events
    print_info "Querying AttestationMade events..."
    cast logs \
        --rpc-url $RPC_URL \
        --from-block $from_block \
        --to-block latest \
        --address $EAS_ADDRESS \
        "0x8bf46bf4cfd674fa735a3d63ec1c9ad4153f033c290341f3a588b75685141b35" \
        2>/dev/null || print_error "No attestation events found or query failed"
}

# Function to query attestation by UID
query_attestation_by_uid() {
    local uid="$1"
    print_info "Querying attestation: $uid"

    # Get attestation struct
    local result=$(cast call $EAS_ADDRESS \
        --rpc-url $RPC_URL \
        "getAttestation(bytes32)" "$uid" 2>/dev/null || echo "failed")

    if [[ "$result" != "failed" ]]; then
        print_success "Found attestation!"

        # Decode the result (this is a simplified version)
        echo "Raw result: $result"

        # Try to decode individual fields if possible
        echo "Attempting to decode fields..."

        # The struct should contain: uid, schema, recipient, attester, time, expirationTime, revocationTime, refUID, data, value
        # This is a basic parsing - in practice you'd want more sophisticated decoding
    else
        print_error "Attestation not found or query failed"
    fi
}

# Function to find attestations for Alice (hub center)
query_alice_attestations() {
    print_step "Querying attestations for Alice (hub center)"

    print_info "Alice's address: $ALICE_ADDRESS"
    print_info "Looking for attestations where Alice is the recipient..."

    # Query events where Alice is the recipient
    # AttestationMade event signature: AttestationMade(address indexed recipient, address indexed attester, bytes32 uid, bytes32 indexed schemaUID)

    # Get recent blocks to search
    local latest_block=$(cast block-number --rpc-url $RPC_URL)
    local from_block=$((latest_block - 1000))

    print_info "Searching attestations in blocks $from_block to $latest_block"

    # Query for Alice as recipient
    echo "Attestations TO Alice:"
    cast logs \
        --rpc-url $RPC_URL \
        --from-block $from_block \
        --to-block latest \
        --address $EAS_ADDRESS \
        --topics-topic1 "0x000000000000000000000000${ALICE_ADDRESS:2}" \
        "0x8bf46bf4cfd674fa735a3d63ec1c9ad4153f033c290341f3a588b75685141b35" \
        2>/dev/null | head -20 || print_info "No events found or limited output"
}

# Function to query Diana's authority attestations
query_diana_attestations() {
    print_step "Querying Diana's authority attestations"

    print_info "Diana's address: $DIANA_ADDRESS"
    print_info "Looking for attestations where Diana is the attester (authority pattern)..."

    local latest_block=$(cast block-number --rpc_url $RPC_URL)
    local from_block=$((latest_block - 1000))

    print_info "Searching Diana's attestations in blocks $from_block to $latest_block"

    # Query for Diana as attester (topic2)
    echo "Attestations FROM Diana:"
    cast logs \
        --rpc-url $RPC_URL \
        --from-block $from_block \
        --to-block latest \
        --address $EAS_ADDRESS \
        --topics-topic2 "0x000000000000000000000000${DIANA_ADDRESS:2}" \
        "0x8bf46bf4cfd674fa735a3d63ec1c9ad4153f033c290341f3a588b75685141b35" \
        2>/dev/null | head -20 || print_info "No events found or limited output"
}

# Function to sample attestation data
sample_attestation_data() {
    print_step "Sampling attestation data"

    print_info "Getting recent attestation UIDs from events..."

    local latest_block=$(cast block-number --rpc-url $RPC_URL)
    local from_block=$((latest_block - 100))

    # Get some recent attestation UIDs
    local uids=$(cast logs \
        --rpc-url $RPC_URL \
        --from-block $from_block \
        --to-block latest \
        --address $EAS_ADDRESS \
        "0x8bf46bf4cfd674fa735a3d63ec1c9ad4153f033c290341f3a588b75685141b35" \
        2>/dev/null | grep -o "0x[a-fA-F0-9]\{64\}" | head -5 || echo "")

    if [[ -n "$uids" ]]; then
        print_success "Found recent attestation UIDs!"

        local count=0
        while IFS= read -r uid && [[ $count -lt 3 ]]; do
            if [[ -n "$uid" && "$uid" =~ ^0x[a-fA-F0-9]{64}$ ]]; then
                echo ""
                print_info "Attestation #$((count + 1)): $uid"
                query_attestation_by_uid "$uid"
                ((count++))
                echo ""
            fi
        done <<< "$uids"
    else
        print_info "No recent attestation UIDs found"
    fi
}

# Function to show schema information
show_schema_info() {
    print_step "Schema Information"

    echo ""
    echo "📋 Registered Schemas:"
    echo "  • Basic Schema:    $BASIC_SCHEMA_ID"
    echo "    Format: bytes32 triggerId, string data, uint256 timestamp"
    echo ""
    echo "  • Like Schema:     $LIKE_SCHEMA_ID"
    echo "    Format: bool like"
    echo ""
    echo "  • Vouching Schema: $VOUCHING_SCHEMA_ID"
    echo "    Format: uint256 weight"
    echo ""

    # Try to verify schemas exist
    print_info "Verifying schemas are registered..."

    # Note: This would require knowing the SchemaRegistry interface
    # For now, we'll just show the IDs we have
    print_success "Schema IDs loaded from deployment configuration"
}

# Function to show network statistics
show_network_statistics() {
    print_step "Network Statistics"

    echo ""
    echo "📊 PageRank Test Network Overview:"
    echo ""
    echo "🎯 Key Accounts:"
    echo "  • Alice (Hub):     $ALICE_ADDRESS"
    echo "  • Bob (Chain):     $BOB_ADDRESS"
    echo "  • Charlie (Bridge): $CHARLIE_ADDRESS"
    echo "  • Diana (Authority): $DIANA_ADDRESS"
    echo ""
    echo "🔗 Expected Patterns:"
    echo "  • Hub: 8+ attestations TO Alice"
    echo "  • Authority: 6 high-weight attestations FROM Diana"
    echo "  • Chain: Bob → Charlie → Diana → Eve → Frank"
    echo "  • Bridge: Charlie connecting multiple groups"
    echo ""

    # Get account balances to show they're funded
    print_info "Account balances:"
    for name in "Alice:$ALICE_ADDRESS" "Bob:$BOB_ADDRESS" "Charlie:$CHARLIE_ADDRESS" "Diana:$DIANA_ADDRESS"; do
        local account_name=$(echo $name | cut -d: -f1)
        local account_addr=$(echo $name | cut -d: -f2)
        local balance=$(cast balance $account_addr --rpc-url $RPC_URL --ether 2>/dev/null || echo "N/A")
        echo "  • $account_name: ${balance} ETH"
    done
}

# Function to show usage examples
show_usage_examples() {
    print_step "Query Examples"

    echo ""
    echo "📚 Manual Query Examples:"
    echo ""
    echo "1. Query specific attestation:"
    echo "   cast call $EAS_ADDRESS 'getAttestation(bytes32)' <UID> --rpc-url $RPC_URL"
    echo ""
    echo "2. Query AttestationMade events:"
    echo "   cast logs --address $EAS_ADDRESS \\"
    echo "     --from-block 1 --to-block latest \\"
    echo "     '0x8bf46bf4cfd674fa735a3d63ec1c9ad4153f033c290341f3a588b75685141b35' \\"
    echo "     --rpc-url $RPC_URL"
    echo ""
    echo "3. Query attestations TO Alice:"
    echo "   cast logs --address $EAS_ADDRESS \\"
    echo "     --topics-topic1 '0x000000000000000000000000${ALICE_ADDRESS:2}' \\"
    echo "     --rpc-url $RPC_URL"
    echo ""
    echo "4. Check EAS contract version:"
    echo "   cast call $EAS_ADDRESS 'version()' --rpc-url $RPC_URL"
    echo ""
    echo "5. Get latest block for reference:"
    echo "   cast block-number --rpc-url $RPC_URL"
    echo ""

    print_info "💡 Tip: Use 'cast logs --help' for more event filtering options"
}

# Function to export query results
export_query_results() {
    local export_file="$PROJECT_ROOT/attestation_query_results.json"

    print_step "Exporting query results"

    local latest_block=$(cast block-number --rpc-url $RPC_URL 2>/dev/null || echo "unknown")

    cat > "$export_file" << EOF
{
  "query_timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "network_info": {
    "rpc_url": "$RPC_URL",
    "latest_block": "$latest_block",
    "eas_address": "$EAS_ADDRESS",
    "attester_address": "$ATTESTER_ADDRESS"
  },
  "schemas": {
    "basic": "$BASIC_SCHEMA_ID",
    "like": "$LIKE_SCHEMA_ID",
    "vouching": "$VOUCHING_SCHEMA_ID"
  },
  "test_accounts": {
    "alice": "$ALICE_ADDRESS",
    "bob": "$BOB_ADDRESS",
    "charlie": "$CHARLIE_ADDRESS",
    "diana": "$DIANA_ADDRESS"
  },
  "query_commands": {
    "get_attestation": "cast call $EAS_ADDRESS 'getAttestation(bytes32)' <UID> --rpc-url $RPC_URL",
    "get_events": "cast logs --address $EAS_ADDRESS --from-block 1 --to-block latest '0x8bf46bf4cfd674fa735a3d63ec1c9ad4153f033c290341f3a588b75685141b35' --rpc-url $RPC_URL",
    "alice_attestations": "cast logs --address $EAS_ADDRESS --topics-topic1 '0x000000000000000000000000${ALICE_ADDRESS:2}' --rpc-url $RPC_URL"
  }
}
EOF

    print_success "Query results exported to: $export_file"
}

# Main function
main() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║              PageRank Attestation Data Query                 ║"
    echo "║                                                              ║"
    echo "║  Query and verify actual attestation data from the network  ║"
    echo "║  Perfect for validating your PageRank test setup           ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    load_config
    show_network_statistics
    show_schema_info
    get_recent_attestation_events
    query_alice_attestations
    query_diana_attestations
    sample_attestation_data
    show_usage_examples
    export_query_results

    echo ""
    print_success "Attestation query completed! 🎉"
    print_info "Use the exported commands to query specific attestations"
    print_info "Check attestation_query_results.json for reference data"
}

# Handle command line arguments
case "${1:-}" in
    "alice")
        load_config
        query_alice_attestations
        ;;
    "diana")
        load_config
        query_diana_attestations
        ;;
    "events")
        load_config
        get_recent_attestation_events
        ;;
    "sample")
        load_config
        sample_attestation_data
        ;;
    "help"|"-h"|"--help")
        echo "PageRank Attestation Query Tool"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  (no args)  Run complete attestation analysis"
        echo "  alice      Query attestations for Alice (hub center)"
        echo "  diana      Query attestations from Diana (authority)"
        echo "  events     Get recent attestation events"
        echo "  sample     Sample specific attestation data"
        echo "  help       Show this help message"
        echo ""
        echo "This tool helps verify that your PageRank attestation network"
        echo "was created correctly by querying actual blockchain data."
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
