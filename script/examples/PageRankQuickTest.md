# PageRank Quick Test Examples

This guide provides simple examples for quickly testing the PageRank attestation network.

## Quick Start

### 1. Run the Complete Test Suite
```bash
# Run all PageRank tests with network creation
./script/run-pagerank-test.sh
```

### 2. Run Individual Tests
```bash
# Test network creation only
forge test --match-test testCreatePageRankNetwork -vv

# Test network patterns
forge test --match-test testNetworkPatterns -vv

# Show network analysis
forge test --match-test testPageRankAnalysis -vv
```

### 3. Simple Network Creation Test
```bash
# Start local blockchain
anvil --accounts 20 --balance 1000 &

# Run basic test
cd symbient
forge test --match-contract PageRankNetworkTest -vv

# Stop anvil when done
pkill anvil
```

## Expected Test Results

### Network Statistics Example
```
Alice (0x...): Out=4, In=9, Weight=0
Bob (0x...): Out=3, In=2, Weight=80
Charlie (0x...): Out=7, In=1, Weight=0
Diana (0x...): Out=6, In=1, Weight=495
```

### PageRank Leaders (Expected Order)
1. **Alice** - Hub with 9+ incoming connections
2. **Diana** - Authority with 495+ total vouching weight
3. **Charlie** - Bridge connecting 7+ different groups
4. **Bob** - Influencer in trust chain + bidirectional hub
5. **Grace/Henry** - Mutual high-weight vouching pair

## Environment Variables

Set these for PageRank component testing:
```bash
export WAVS_ENV_PAGERANK_REWARD_POOL="1000000000000000000000"
export WAVS_ENV_PAGERANK_DAMPING_FACTOR="0.85"
export WAVS_ENV_PAGERANK_MAX_ITERATIONS="100"
export WAVS_ENV_PAGERANK_MIN_THRESHOLD="0.0001"
```

## Testing with WASI Components

### Build PageRank Component
```bash
# Build all components
make wasi-build

# Or build specific rewards component
WASI_BUILD_DIR=components/rewards make wasi-build
```

### Test PageRank Calculation
```bash
# Execute PageRank component with test data
make wasi-exec COMPONENT_FILENAME=rewards.wasm INPUT_DATA="test-pagerank"

# Or test with specific attestation data
make wasi-exec COMPONENT_FILENAME=rewards.wasm INPUT_DATA='{"chain_id":"31337","schema_id":"0x...","limit":50}'
```

## Manual Network Creation (Solidity)

If you want to create attestations manually:

```solidity
// Deploy contracts first
forge script script/DeployEAS.s.sol --rpc-url http://localhost:8545 --private-key 0xac0974... --broadcast

// Create test attestations
address alice = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;
address bob = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC;

// Bob likes Alice
attester.attest(likeSchemaId, alice, abi.encode(true));

// Alice vouches for Bob with weight 80
attester.attest(vouchingSchemaId, bob, abi.encode(80));
```

## Verification Commands

### Check Attestation Count
```bash
# Query EAS contract for total attestations
cast call $EAS_ADDRESS "getAttestationCount()" --rpc-url http://localhost:8545
```

### Check Schema Registry
```bash
# List registered schemas
cast call $SCHEMA_REGISTRY "getSchemaCount()" --rpc-url http://localhost:8545
```

## Troubleshooting

### Common Issues

**Test fails with "Invalid EAS address"**
- Ensure anvil is running: `anvil --accounts 20 --balance 1000`
- Check environment variables are set

**No attestations created**
- Verify accounts have ETH balance
- Check private key permissions
- Ensure contracts deployed successfully

**PageRank component errors**
- Verify WASI components built: `make wasi-build`
- Check environment variables for PageRank parameters
- Ensure input data format is correct

### Debug Commands
```bash
# Check anvil is running
pgrep anvil

# Check account balances
cast balance 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --rpc-url http://localhost:8545

# Verbose test output
forge test --match-test testCreatePageRankNetwork -vvv

# Check gas usage
forge test --match-test testCreatePageRankNetwork --gas-report
```

## Network Patterns Created

The test creates these specific patterns for PageRank analysis:

### 1. Hub Pattern (Alice)
- 8 accounts attest TO Alice (high indegree)
- Alice attests back to 4 accounts (bidirectional)
- Creates central authority figure

### 2. Authority Pattern (Diana)
- Diana gives high-weight endorsements (95, 90, 85, 80, 75, 70)
- Targets key network players
- Creates weighted influence distribution

### 3. Chain Pattern
- Bob → Charlie → Diana → Eve → Frank → Grace
- Decreasing weights (80, 75, 70, 65, 60)
- Tests transitivity and chain influence

### 4. Cluster Patterns
- Kate ↔ Liam ↔ Mia (triangular cluster)
- Noah ↔ Olivia (partnership cluster)
- Tests community detection

### 5. Bridge Pattern (Charlie)
- Charlie connects to 6 different groups/individuals
- Creates inter-community connections
- Tests bridging centrality

### 6. Random Connections
- 8 strategic random connections
- Adds network complexity and realism
- Tests algorithm robustness

## Success Metrics

A successful test should show:
- ✅ 50+ total attestations created
- ✅ All 15 test accounts funded and active
- ✅ Alice has highest incoming count (9+)
- ✅ Diana has highest weight total (495+)
- ✅ Charlie has highest outgoing count (7+)
- ✅ Network patterns verified
- ✅ No failed transactions

## Next Steps

After successful testing:
1. Analyze PageRank component output
2. Compare expected vs actual rankings
3. Tune PageRank parameters if needed
4. Scale to larger networks
5. Add temporal dynamics
6. Test Sybil resistance