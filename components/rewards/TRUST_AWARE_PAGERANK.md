# Trust Aware PageRank Configuration Guide

## Overview

Trust Aware PageRank is an enhanced version of the traditional PageRank algorithm that incorporates **trusted seed attestors** to create spam-resistant reputation systems. This implementation prevents Sybil attacks and spam manipulation while maintaining the distributed nature of reputation computation.

## Key Features

- **Backwards Compatible**: If no trusted seeds are configured, behaves exactly like standard PageRank
- **Trusted Seed Weighting**: Attestations from trusted seeds receive higher weight
- **Initial Score Boost**: Trusted seeds start with elevated PageRank scores
- **Spam Resistance**: Artificial attestation rings are isolated from trusted pathways
- **Configurable Parameters**: Flexible trust multipliers and boost factors

## How It Works

### Standard PageRank vs Trust Aware PageRank

**Standard PageRank:**
- All attestations treated equally
- Uniform initial score distribution
- Vulnerable to Sybil attacks

**Trust Aware PageRank:**
- Attestations from trusted seeds get multiplied weight (e.g., 2x, 3x)
- Trusted seeds receive initial score boost
- Trust flows through the network via weighted edges

### Trust Mechanisms

1. **Attestation Weight Multiplier**: Trusted seed endorsements receive weight `W_trust > 1.0`
2. **Initial Score Boost**: Trusted seeds start with higher PageRank scores
3. **Enhanced Teleportation**: Trusted seeds get boosted teleportation probability

## Configuration

### Environment Variables

Configure Trust Aware PageRank using these environment variables:

#### Standard PageRank (No Trust)
```bash
# Basic PageRank rewards
WAVS_ENV_pagerank_reward_pool=1000000000000000000000  # 1000 tokens in wei
WAVS_ENV_pagerank_damping_factor=0.85
WAVS_ENV_pagerank_max_iterations=100
WAVS_ENV_pagerank_tolerance=0.000001
WAVS_ENV_pagerank_min_threshold=0.0001
```

#### Trust Aware PageRank
```bash
# Trust Aware PageRank configuration
WAVS_ENV_pagerank_reward_pool=5000000000000000000000   # 5000 tokens in wei
WAVS_ENV_pagerank_trusted_seeds="0x742d35Cc6634C0532925a3b8D58C9e5F9d6b2244,0x1234567890123456789012345678901234567890"
WAVS_ENV_pagerank_trust_multiplier=2.5  # 2.5x weight for trusted attestors
WAVS_ENV_pagerank_trust_boost=0.15      # 15% initial score boost for trusted seeds
WAVS_ENV_pagerank_damping_factor=0.85
WAVS_ENV_pagerank_max_iterations=100
WAVS_ENV_pagerank_tolerance=0.000001
WAVS_ENV_pagerank_min_threshold=0.0001
```

### Configuration Parameters

| Parameter | Description | Default | Range |
|-----------|-------------|---------|-------|
| `pagerank_trusted_seeds` | Comma-separated list of trusted attestor addresses | None | Valid Ethereum addresses |
| `pagerank_trust_multiplier` | Weight multiplier for trusted attestations | 2.0 | ≥ 1.0 |
| `pagerank_trust_boost` | Initial score boost for trusted seeds (as fraction) | 0.15 | 0.0 - 1.0 |
| `pagerank_damping_factor` | PageRank damping factor | 0.85 | 0.0 - 1.0 |
| `pagerank_max_iterations` | Maximum iterations for convergence | 100 | > 0 |
| `pagerank_tolerance` | Convergence tolerance | 1e-6 | > 0 |
| `pagerank_min_threshold` | Minimum score to receive rewards | 0.0001 | ≥ 0 |

## Usage Examples

### Example 1: DAO Governance

Configure trusted founding members and key contributors:

```bash
# Trusted DAO founders and core contributors
WAVS_ENV_pagerank_trusted_seeds="0xFounder1...,0xFounder2...,0xCoreContrib1..."
WAVS_ENV_pagerank_trust_multiplier=3.0  # 3x weight for founder endorsements
WAVS_ENV_pagerank_trust_boost=0.2       # 20% initial boost
```

### Example 2: Content Platform

Use verified creators and moderators as trusted seeds:

```bash
# Verified creators and platform moderators
WAVS_ENV_pagerank_trusted_seeds="0xVerifiedCreator1...,0xModerator1..."
WAVS_ENV_pagerank_trust_multiplier=2.0  # 2x weight for verified endorsements
WAVS_ENV_pagerank_trust_boost=0.1       # 10% initial boost
```

### Example 3: Identity Verification Network

Government entities and certified organizations as trust anchors:

```bash
# Government and certified organizations
WAVS_ENV_pagerank_trusted_seeds="0xGovEntity...,0xCertifiedOrg..."
WAVS_ENV_pagerank_trust_multiplier=5.0  # 5x weight for official endorsements
WAVS_ENV_pagerank_trust_boost=0.25      # 25% initial boost
```

## Best Practices

### Trusted Seed Selection

**Criteria for Trusted Seeds:**
- ✅ Well-established entities with strong track records
- ✅ Diverse set to prevent central points of failure  
- ✅ Economic incentives aligned with network health
- ✅ Public identities with accountability
- ✅ Active participation in the ecosystem

**Avoid:**
- ❌ Single point of control
- ❌ Unknown or unverified entities
- ❌ Conflicting interests
- ❌ Inactive or abandoned accounts

### Parameter Tuning

**Trust Multiplier Guidelines:**
- Conservative: 1.5x - 2.0x
- Moderate: 2.0x - 3.0x  
- Aggressive: 3.0x - 5.0x

**Trust Boost Guidelines:**
- Subtle: 0.05 - 0.10 (5-10%)
- Moderate: 0.10 - 0.20 (10-20%)
- Strong: 0.20 - 0.30 (20-30%)

### Monitoring

Monitor these metrics for system health:

```
📊 Trust Statistics (from logs):
  Trusted seeds: X addresses with Y total score (avg: Z)
  Regular nodes: X addresses with Y total score (avg: Z)  
  Trust advantage: X.XXx average score
```

- **Trust Advantage > 1.0x**: Trust features working correctly
- **Trust Advantage ≈ 1.0x**: Minimal trust impact (may need tuning)
- **Trust Advantage < 1.0x**: Potential configuration issue

## Security Considerations

### Attack Mitigation

| Attack Type | How Trust Aware PageRank Helps |
|-------------|--------------------------------|
| **Sybil Attack** | Trusted seed validation prevents fake identities from gaining authority |
| **Spam Rings** | Artificial attestation networks isolated from trusted pathways |
| **Collusion** | Diverse trusted seed set reduces single points of failure |
| **Trust Seed Compromise** | Multi-signature controls and governance for seed management |

### Governance Process

1. **Community Proposal**: Suggest new trusted seeds with justification
2. **Verification Period**: Validate credentials and reputation (minimum 30 days)
3. **Consensus Vote**: Community approval with supermajority (66%+)
4. **Probationary Period**: Monitored integration with removal option
5. **Regular Review**: Periodic assessment of trusted seed performance

### Risk Management

- **Diversification**: Minimum 3-5 trusted seeds from different sectors
- **Rotation**: Regular review and potential rotation of seeds
- **Monitoring**: Continuous monitoring of trust statistics
- **Emergency Controls**: Ability to disable trust features if needed

## Technical Architecture

### Algorithm Flow

1. **Attestation Collection**: Gather attestations from EAS or other sources
2. **Trust Validation**: Verify if attestors are trusted seeds
3. **Weight Calculation**: Apply trust multipliers to attestation weights
4. **Initial Scores**: Distribute initial PageRank scores with trust boost
5. **Iterative Computation**: Run PageRank with trust-weighted edges
6. **Score Distribution**: Calculate proportional rewards based on final scores

### Integration Points

```rust
// Example: Creating Trust Aware PageRank source
let trust_config = TrustConfig::new(vec![trusted_address])
    .with_trust_multiplier(2.5)
    .with_trust_boost(0.15);

let pagerank_config = PageRankConfig::default()
    .with_trust_config(trust_config);

let pagerank_source = PageRankRewardSource::new(
    schema_uid,
    reward_pool,
    pagerank_config
);
```

## Troubleshooting

### Common Issues

**Trust advantage < 1.0x:**
- Check trusted seed addresses are valid
- Ensure trusted seeds are actively participating
- Verify trust_multiplier ≥ 1.0

**No PageRank rewards distributed:**
- Check `pagerank_reward_pool` > 0
- Verify attestation data exists for schema
- Ensure `pagerank_min_threshold` not too high

**Slow convergence:**
- Increase `pagerank_max_iterations`
- Adjust `pagerank_tolerance`
- Check graph connectivity

### Debug Logging

The component provides detailed logging:
```
🔒 Trust Aware PageRank enabled with X trusted seeds
📊 Trust Statistics: [detailed breakdown]
🎯 PageRank calculation completed
```

## Migration Guide

### From Standard to Trust Aware PageRank

1. **Identify Trusted Seeds**: Select 3-5 trusted entities
2. **Configure Gradually**: Start with conservative parameters
3. **Monitor Impact**: Watch trust statistics and reward distribution
4. **Tune Parameters**: Adjust based on observed behavior
5. **Community Governance**: Establish ongoing management process

### Rollback Strategy

If issues arise, you can disable trust features by removing or commenting out:
```bash
# WAVS_ENV_pagerank_trusted_seeds="..."  # Comment out to disable
```

This reverts to standard PageRank behavior without changing other components.

---

**For support and questions, refer to the main WAVS documentation or community channels.**