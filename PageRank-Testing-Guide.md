# PageRank Testing Guide

A comprehensive testing framework for PageRank-based attestation reward systems.

## Overview

This guide provides tools and scripts to create realistic attestation networks for testing PageRank algorithms in decentralized reputation systems. The framework generates a diverse network of 15 test accounts with 48+ attestations across various relationship patterns.

## Quick Start

### 1. Run Complete Test Suite
```bash
# Run all tests with automatic setup
./script/run-pagerank-test.sh

# Or run specific components
./script/run-pagerank-test.sh test      # Network creation only
./script/run-pagerank-test.sh patterns # Pattern verification
./script/run-pagerank-test.sh analysis # Network analysis
```

### 2. Run Individual Tests
```bash
# Test network creation
forge test --match-test testCreatePageRankNetwork -vv

# Test network patterns
forge test --match-test testNetworkPatterns -v

# Show analysis and recommendations
forge test --match-test testPageRankAnalysis -v
```

### 3. Manual Setup
```bash
# Start local blockchain
anvil --accounts 20 --balance 1000 &

# Run tests
forge test --match-contract PageRankNetworkTest -vv

# Stop when done
pkill anvil
```

## Test Network Architecture

The framework creates a sophisticated network with realistic patterns:

### 15 Test Accounts with Defined Roles

| Account | Role | Network Function |
|---------|------|------------------|
| **Alice** | Central Hub | Receives 11 incoming attestations, 4 outgoing |
| **Diana** | Authority | Issues 565 total vouching weight across 8 attestations |
| **Charlie** | Bridge | Connects different groups with 8 outgoing connections |
| **Bob** | Influencer | Chain member + bidirectional hub connections |
| **Grace/Henry** | Mutual Pair | High-weight bidirectional vouching (75/80) |
| **Kate/Liam/Mia** | Cluster | Tightly connected triangular community |
| **Noah/Olivia** | Partners | High-weight mutual vouching (85/85) |
| **Eve** | Newcomer | Limited connections (3 in, 3 out) |
| **Frank/Ivy/Jack** | Connectors | Bridge between different network segments |

### 6 Network Pattern Types

#### 1. Hub and Spoke (Alice-Centered)
- 8 accounts attest TO Alice (high indegree)
- Alice attests back to 4 accounts (bidirectional)
- Tests centrality-based ranking

#### 2. Authority Pattern (Diana)
- High-weight endorsements: 95, 90, 85, 80, 75, 70
- Targets key network players
- Tests weighted influence distribution

#### 3. Chain of Trust
- Sequential: Bob → Charlie → Diana → Eve → Frank
- Decreasing weights: 80, 75, 70, 65
- Tests transitivity and influence propagation

#### 4. Community Clusters
- **Cluster 1**: Kate ↔ Liam ↔ Mia (triangular)
- **Cluster 2**: Noah ↔ Olivia (partnership)
- Tests community detection and local influence

#### 5. Bridge Connections (Charlie)
- Connects 6 different groups/individuals
- Creates inter-community pathways
- Tests bridging centrality

#### 6. Random Connections
- 8 strategic cross-network links
- Adds realism and complexity
- Tests algorithm robustness

## Expected PageRank Results

Based on network structure, expected ranking order:

1. **Alice** (Hub) - Highest PageRank due to 11 incoming connections
2. **Diana** (Authority) - High influence from 565 total vouching weight  
3. **Charlie** (Bridge) - Strong bridging centrality with 8 outgoing connections
4. **Bob** (Influencer) - Chain position + bidirectional hub connections
5. **Grace/Henry** - Mutual high-weight vouching pair

### Network Statistics (Typical Run)
```
Alice: Out=4, In=11, Weight=0      # Hub center
Diana: Out=8, In=2, Weight=565     # Authority figure  
Charlie: Out=8, In=3, Weight=75    # Bridge connector
Bob: Out=2, In=3, Weight=80        # Influencer
Grace: Out=2, In=3, Weight=75      # Mutual pair member
Henry: Out=3, In=2, Weight=145     # Mutual pair member
```

## Schema Types Used

The test creates attestations across 4 different schemas:

- **Basic Schema**: `bytes32 triggerId, string data, uint256 timestamp`
- **Like Schema**: `bool like` (simple endorsements)
- **Vouching Schema**: `uint256 weight` (weighted endorsements)
- **Statement Schema**: `string statement` (text-based attestations)

## Integration with Rewards System

### Environment Variables
```bash
export WAVS_ENV_PAGERANK_REWARD_POOL="1000000000000000000000"  # 1000 ETH
export WAVS_ENV_PAGERANK_DAMPING_FACTOR="0.85"
export WAVS_ENV_PAGERANK_MAX_ITERATIONS="100"
export WAVS_ENV_PAGERANK_MIN_THRESHOLD="0.0001"
```

### Component Testing
```bash
# Build PageRank component
make wasi-build
WASI_BUILD_DIR=components/rewards make wasi-build

# Test PageRank calculation
make wasi-exec COMPONENT_FILENAME=rewards.wasm INPUT_DATA="test-pagerank"

# Test with specific chain/schema
make wasi-exec COMPONENT_FILENAME=rewards.wasm INPUT_DATA='{"chain_id":"31337","schema_id":"0x...","limit":50}'
```

## Files and Structure

```
script/
├── run-pagerank-test.sh          # Main test runner script
├── PageRankTest.s.sol            # Foundry script for network creation  
├── RunPageRankTest.s.sol         # Deployment + test runner
└── examples/
    └── PageRankQuickTest.md      # Quick reference guide

test/unit/
└── PageRankNetworkTest.t.sol     # Comprehensive test suite
```

## Verification and Debugging

### Success Metrics
- ✅ 48+ total attestations created
- ✅ All 15 test accounts funded and active
- ✅ Alice has highest incoming count (11)
- ✅ Diana has highest weight total (565)
- ✅ Charlie has highest outgoing count (8)
- ✅ All network patterns verified
- ✅ No failed transactions

### Debug Commands
```bash
# Check anvil status
pgrep anvil

# Verify account balances  
cast balance 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --rpc-url http://localhost:8545

# Verbose test output
forge test --match-test testCreatePageRankNetwork -vvv

# Gas usage analysis
forge test --match-test testCreatePageRankNetwork --gas-report
```

### Common Issues

**"Invalid EAS address" error**
- Ensure anvil is running: `anvil --accounts 20 --balance 1000`
- Check environment variables are set

**No attestations created**
- Verify accounts have ETH balance
- Check private key permissions
- Ensure contracts deployed successfully

**PageRank component errors**
- Verify WASI components built: `make wasi-build`
- Check PageRank environment variables
- Validate input data format

## Advanced Usage

### Custom Network Patterns
Extend `PageRankNetworkTest.t.sol` to add new patterns:

```solidity
function _createCustomPattern() internal {
    // Add your custom attestation patterns
    _createAttestation(
        accounts[0],           // from
        accounts[1].addr,      // to  
        vouchingSchemaId,      // schema
        abi.encode(100),       // data (weight)
        "Custom pattern"       // description
    );
}
```

### Scale Testing
For larger networks, modify the account creation:

```solidity
// Increase account count
string[50] memory names = [...]; // Expand array

// Add more pattern variations
_createScaleTestPatterns();
```

### Analytics Integration
Export network data for external analysis:

```bash
# Generate network graph data
forge test --match-test testCreatePageRankNetwork -vv > network_data.log

# Extract attestation relationships
grep "UID:" network_data.log | awk '{print $2, $3, $4}'
```

## Next Steps

After successful testing:

1. **Analyze Results**: Compare PageRank component output with expected rankings
2. **Tune Parameters**: Adjust damping factor, iterations, thresholds based on results  
3. **Scale Up**: Test with larger networks (50+ accounts, 200+ attestations)
4. **Add Dynamics**: Implement temporal decay, dynamic attestation weights
5. **Security Testing**: Evaluate Sybil resistance, gaming attempts
6. **Cross-Schema Analysis**: Test influence across different attestation types

## Contributing

To extend the testing framework:

1. Add new network patterns in `_createCustomPattern()` methods
2. Extend verification checks in `_verifyNetworkProperties()`
3. Add new schema types for different attestation data
4. Create specialized test cases for edge scenarios
5. Contribute analytics and visualization tools

## References

- [PageRank Algorithm](https://en.wikipedia.org/wiki/PageRank)
- [Ethereum Attestation Service](https://attest.sh/)
- [WAVS Documentation](../docs/)
- [Foundry Testing](https://book.getfoundry.sh/forge/tests)

---

*This testing framework provides a robust foundation for evaluating PageRank-based reputation systems in decentralized networks. The realistic attestation patterns help ensure your PageRank implementation performs well in real-world scenarios.*