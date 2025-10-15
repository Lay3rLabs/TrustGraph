# PageRank Rewards Configuration

This document explains how to configure and use PageRank-based rewards in the rewards component.

## Overview

PageRank rewards distribute tokens based on the authority and influence of participants in the attestation network. Unlike simple count-based rewards, PageRank considers the quality and interconnectedness of attestations, making it more resistant to Sybil attacks.

## How PageRank Works

1. **Graph Construction**: Builds a directed graph where:

   - Nodes = Ethereum addresses (attesters and recipients)
   - Edges = Attestations (attester → recipient with weight 1.0)

2. **Authority Calculation**: Uses the PageRank algorithm to calculate authority scores based on:

   - Incoming attestations from high-authority users have more weight
   - Authority flows through the network via the damping factor
   - Scores converge through iterative calculation

3. **Reward Distribution**: Distributes the total reward pool proportionally based on PageRank scores

## Configuration

### Required Environment Variables

```bash
# Enable PageRank rewards by setting the total reward pool
export WAVS_ENV_PAGERANK_REWARD_POOL="1000000000000000000000"  # 1000 tokens in wei

# Required: Schema UID for attestations to analyze
export WAVS_ENV_REWARD_SCHEMA_UID="0x1234..."  # 32-byte schema UID
```

### Optional Tuning Parameters

```bash
# PageRank Algorithm Parameters
export WAVS_ENV_PAGERANK_DAMPING_FACTOR="0.85"        # Default: 0.85 (85% authority flows through links)
export WAVS_ENV_PAGERANK_MAX_ITERATIONS="100"         # Default: 100 (maximum iterations)
export WAVS_ENV_PAGERANK_TOLERANCE="0.000001"         # Default: 1e-6 (convergence threshold)
export WAVS_ENV_PAGERANK_MIN_THRESHOLD="0.0001"       # Default: 0.0001 (minimum score to receive rewards)
```

## Parameter Explanation

### Damping Factor (0.0 - 1.0)

- **0.85 (recommended)**: 85% of authority flows through attestation links, 15% is distributed equally
- **Higher values (0.9+)**: More emphasis on network connections, slower convergence
- **Lower values (0.7-)**: Less emphasis on connections, faster convergence but less network effect

### Max Iterations

- **100 (default)**: Usually sufficient for convergence
- **Increase if**: Large networks or high precision requirements
- **Decrease if**: Performance concerns or smaller networks

### Tolerance

- **1e-6 (default)**: Good balance of precision and performance
- **Smaller values**: Higher precision but slower convergence
- **Larger values**: Faster convergence but less precision

### Minimum Threshold

- **0.0001 (default)**: Only addresses with >0.01% of total authority receive rewards
- **Higher values**: Fewer recipients, more concentrated rewards
- **Lower values**: More recipients, more distributed rewards

## Example Configurations

### High Network Effect (Favor Influential Users)

```bash
export WAVS_ENV_PAGERANK_DAMPING_FACTOR="0.9"
export WAVS_ENV_PAGERANK_MIN_THRESHOLD="0.001"        # Top 1% get rewards
```

### Balanced Distribution

```bash
export WAVS_ENV_PAGERANK_DAMPING_FACTOR="0.85"
export WAVS_ENV_PAGERANK_MIN_THRESHOLD="0.0001"       # Top 10% get rewards
```

### Wide Distribution (Include More Users)

```bash
export WAVS_ENV_PAGERANK_DAMPING_FACTOR="0.8"
export WAVS_ENV_PAGERANK_MIN_THRESHOLD="0.00001"      # Top 50% get rewards
```

## Usage in Code

The PageRank source is automatically added if the `pagerank_points_pool` configuration is present:

```rust
// Automatically configured in lib.rs
if let Some(pagerank_pool_str) = config_var("pagerank_points_pool") {
    // Creates PageRank source with specified configuration
}
```

## Network Analysis

### What PageRank Rewards Measure

- **Authority**: Users who receive attestations from other influential users
- **Trust Centrality**: Users who are important connection points in the trust network
- **Network Position**: Users who are well-connected within the attestation ecosystem

### Sybil Resistance

- **Costly to Game**: Requires building a large, interconnected network of real attestations
- **Network Effects**: Fake attestations from low-authority accounts have minimal impact
- **Authority Propagation**: Only attestations from trusted sources significantly boost scores

## Monitoring and Debugging

The component outputs detailed logs during PageRank calculation:

```
🏗️  Building attestation graph for schema: 0x1234...
📊 Processing 1500 total attestations
🔄 Processing attestation batch: 0 to 99
✅ Built attestation graph with 250 nodes
🔄 Starting PageRank calculation for 250 nodes
🔄 PageRank iteration 0: max delta = 0.234567
✅ PageRank converged after 23 iterations
🎯 Distributing 1000000000000000000000 total rewards based on PageRank scores
💰 Calculated rewards for 45 addresses
🏆 Top 5 rewards:
  1. 0xabcd...: 150000000000000000000 tokens
  2. 0x1234...: 120000000000000000000 tokens
```

## Integration with Other Reward Sources

PageRank rewards work alongside other reward sources:

```rust
// Combines with count-based rewards
registry.add_source(eas_count_source);       // Count-based: 5e17 per attestation
registry.add_source(pagerank_source);        // Authority-based: PageRank distribution
```

Total rewards = Count-based rewards + PageRank rewards + Other sources

## Performance Considerations

- **Graph Size**: O(n²) complexity for PageRank calculation
- **Batch Processing**: Attestations are fetched in batches of 100
- **Memory Usage**: Graph structure scales with number of unique addresses
- **Network Calls**: Multiple RPC calls to fetch attestation details

For large networks (>10,000 attestations), consider:

- Increasing batch sizes
- Reducing precision requirements
- Implementing caching strategies
