# EAS Compute Component - Advanced Attestation Analytics

A comprehensive WAVS component for querying and analyzing Ethereum Attestation Service (EAS) data with advanced analytics capabilities for governance, reputation systems, and attestation-based applications.

## Overview

This component provides a complete toolkit for EAS attestation analysis, from basic queries to sophisticated network analytics and fraud detection. It demonstrates modular design principles with clear separation between data querying, analysis, and business logic.

## 🚀 Quick Start

### Basic Usage

```bash
# Build the component
WASI_BUILD_DIR=components/eas-compute make wasi-build

# Test basic attestation counting
export INPUT_DATA="0x1234567890123456789012345678901234567890"
make wasi-exec
```

### Input Formats

```bash
# Hex address string
export INPUT_DATA="0x1234567890123456789012345678901234567890"

# JSON format (for complex inputs)
export INPUT_DATA='{"recipient": "0x1234567890123456789012345678901234567890"}'
```

## 📁 Architecture

```
src/
├── lib.rs          # Main component entry point and basic voting power logic
├── query.rs        # Comprehensive EAS Indexer query functions
├── analytics.rs    # Advanced statistical and network analysis
├── examples.rs     # Usage examples and analysis patterns
├── solidity.rs     # Solidity type definitions
└── trigger.rs      # WAVS trigger event handling
```

## 🔍 Core Query Functions

### Received Attestations
```rust
// Count attestations received by an address for a specific schema
query_received_attestation_count(recipient, schema_uid, config).await?;

// Get attestation UIDs with pagination
query_received_attestation_uids(recipient, schema_uid, start, length, reverse_order, config).await?;

// Get recent attestations with full data
query_recent_received_attestations(recipient, schema_uid, limit, config).await?;
```

### Sent Attestations
```rust
// Count attestations sent by an address
query_sent_attestation_count(attester, schema_uid, config).await?;

// Get sent attestation UIDs
query_sent_attestation_uids(attester, schema_uid, start, length, reverse_order, config).await?;

// Get recent sent attestations
query_recent_sent_attestations(attester, schema_uid, limit, config).await?;
```

### Schema Analysis
```rust
// Count all attestations for a schema
query_schema_attestation_count(schema_uid, config).await?;

// Get all attestation UIDs for a schema
query_schema_attestation_uids(schema_uid, start, length, reverse_order, config).await?;

// Complex relationship queries
query_schema_attester_recipient_count(schema_uid, attester, recipient, config).await?;
```

### Individual Attestations
```rust
// Check if an attestation is indexed
is_attestation_indexed(attestation_uid, config).await?;

// Get full attestation data
query_attestation(attestation_uid, config).await?;

// Batch query multiple attestations
query_attestations_batch(uids, config).await?;
```

## 📊 Advanced Analytics

### Statistical Analysis

#### Address Statistics
```rust
let stats = analyze_address_statistics(address, None).await?;
println!("Total attestations: {}", stats.total_count);
println!("Unique attesters: {}", stats.unique_attesters);
println!("Schema diversity: {}", stats.unique_schemas);
```

#### Schema Popularity
```rust
let analysis = analyze_schema_statistics(schema_uid, None).await?;
println!("Total attestations: {}", analysis.total_attestations);
println!("Unique users: {}", analysis.unique_attesters + analysis.unique_recipients);
println!("Average per user: {:.2}", analysis.avg_attestations_per_user);
```

### Time Series Analysis

```rust
let time_metrics = analyze_time_series(schema_uid, None).await?;
println!("Active days: {}", time_metrics.active_days);
println!("Peak activity: Day {}", time_metrics.peak_activity_day);
println!("Daily velocity: {:.2}", time_metrics.attestation_velocity);

// Access daily breakdown
for (day, count) in time_metrics.attestations_by_day {
    println!("Day {}: {} attestations", day, count);
}
```

### Network Analysis

```rust
let network = analyze_attestation_network(schema_uid, None).await?;
println!("Network nodes: {}", network.total_nodes);
println!("Network density: {:.4}", network.network_density);
println!("Most connected attester: {}", network.most_connected_attester);
println!("Clustering coefficient: {:.4}", network.clustering_coefficient);
```

### Reputation System

```rust
let reputation = calculate_reputation_score(address, None).await?;
println!("Reputation score: {:.2}/100", reputation.score);
println!("Attestations received: {}", reputation.attestations_received);
println!("Network diversity: {}", reputation.unique_attesters);
println!("Schema participation: {}", reputation.schema_diversity);
```

## 🛡️ Fraud Detection

### Suspicious Pattern Detection
```rust
let suspicious = detect_suspicious_patterns(schema_uid, None).await?;
if !suspicious.is_empty() {
    println!("⚠️ Suspicious addresses found:");
    for addr in suspicious {
        println!("- {}", addr);
    }
}
```

### Community Health Assessment
```rust
// Analyze overall ecosystem health
example_community_health_analysis(schema_uid).await?;

// Outputs metrics like:
// - Network centralization
// - Participation rate  
// - Activity consistency
// - Overall health score (0-100)
```

## 🏆 Advanced Use Cases

### 1. Sophisticated Voting Power

Instead of simple 1:1 attestation-to-vote conversion:

```rust
let voting_power_payload = example_advanced_voting_power(recipient, schema_uid).await?;
// Factors in:
// - Base attestation count
// - Reputation score multiplier
// - Recent activity bonus
// - Schema diversity bonus
```

### 2. Multi-Schema Analysis

Compare performance across different attestation schemas:

```rust
let schemas = vec![schema_a, schema_b, schema_c];
example_multi_schema_comparison(schemas, address).await?;
// Shows ranking, unique attesters, timing patterns per schema
```

### 3. Trust Network Identification

Find key community members and influencers:

```rust
let leaders = identify_schema_leaders(schema_uid, 10, None).await?;
for leader in leaders {
    println!("{} - Score: {:.2}", leader.address, leader.score);
}
```

### 4. Growth Trend Analysis

Track adoption and usage patterns over time:

```rust
let weekly_trends = analyze_growth_trends(schema_uid, 7, None).await?;
let monthly_trends = analyze_growth_trends(schema_uid, 30, None).await?;
// Returns (period_start, attestation_count, growth_rate) tuples
```

## ⚙️ Configuration

### QueryConfig Setup

```rust
use crate::query::QueryConfig;

let config = QueryConfig {
    eas_address: Address::from_str("0x...")?, // EAS contract address
    indexer_address: Address::from_str("0x...")?, // Indexer contract address  
    chain_name: "mainnet".to_string(), // or "local", "sepolia", etc.
};

// Use with any query function
let count = query_received_attestation_count(recipient, schema, Some(config)).await?;
```

### Chain Configuration (wavs.toml)

```toml
[default.chains.evm.mainnet]
chain_id = "1"
http_endpoint = "https://mainnet.infura.io/v3/YOUR_KEY"

[default.chains.evm.sepolia]
chain_id = "11155111"  
http_endpoint = "https://sepolia.infura.io/v3/YOUR_KEY"

[default.chains.evm.local]
chain_id = "31337"
http_endpoint = "http://localhost:8545"
```

## 🔗 Integration Examples

### With VotingPower Contract

```solidity
contract AdvancedVotingPower is IWavsServiceHandler {
    function handleSignedEnvelope(
        Envelope calldata envelope, 
        SignatureData calldata signatureData
    ) external {
        VotingPowerPayload memory payload = abi.decode(
            envelope.payload, 
            (VotingPowerPayload)
        );
        
        for (uint i = 0; i < payload.operations.length; i++) {
            Operation memory op = payload.operations[i];
            if (op.operationType == OperationType.MINT) {
                _mint(op.account, op.amount);
            }
        }
    }
}
```

### Custom Analytics Pipeline

```rust
// Create your own analysis workflow
pub async fn custom_analysis_pipeline(
    target_address: Address,
    schemas: Vec<FixedBytes<32>>
) -> Result<CustomReport, String> {
    let mut report = CustomReport::new();
    
    // 1. Basic metrics
    for schema in &schemas {
        let stats = analyze_schema_statistics(*schema, None).await?;
        report.add_schema_stats(*schema, stats);
    }
    
    // 2. Reputation analysis
    let reputation = calculate_reputation_score(target_address, None).await?;
    report.set_reputation(reputation);
    
    // 3. Network position
    for schema in &schemas {
        let network = analyze_attestation_network(*schema, None).await?;
        report.add_network_metrics(*schema, network);
    }
    
    // 4. Fraud detection
    for schema in &schemas {
        let suspicious = detect_suspicious_patterns(*schema, None).await?;
        report.add_fraud_alerts(*schema, suspicious);
    }
    
    Ok(report)
}
```

## 📚 Complete Examples

Run the comprehensive example suite:

```rust
use crate::examples::run_complete_analysis_example;

// This demonstrates all capabilities:
run_complete_analysis_example().await?;
```

Output includes:
- Basic address analysis
- Schema popularity metrics  
- Trust network identification
- Growth trend analysis
- Advanced voting power calculation
- Multi-schema comparison
- Fraud detection pipeline
- Community health assessment

## 🎯 Key Features

- ✅ **Complete EAS Query API** - All Indexer functions covered
- ✅ **Advanced Analytics** - Statistical, network, and time-series analysis
- ✅ **Fraud Detection** - Suspicious pattern identification
- ✅ **Reputation System** - Multi-factor scoring algorithm
- ✅ **Modular Design** - Easy customization and extension
- ✅ **Performance Optimized** - Batching and pagination support
- ✅ **Production Ready** - Comprehensive error handling
- ✅ **Well Documented** - Extensive examples and patterns

## 🔧 Advanced Configuration

### Custom Reputation Scoring

```rust
// Modify the reputation algorithm in analytics.rs
pub async fn calculate_custom_reputation_score(
    address: Address,
    weights: ReputationWeights,
    config: Option<QueryConfig>
) -> Result<ReputationScore, String> {
    // Your custom scoring logic here
    let base_score = received_count.to::<u64>() as f64 * weights.attestation_weight;
    let diversity_bonus = unique_schemas.len() as f64 * weights.diversity_weight;
    // ... additional factors
}
```

### Custom Analytics

```rust
// Add your own analysis functions
pub async fn analyze_attestation_quality(
    schema_uid: FixedBytes<32>,
    quality_threshold: f64,
    config: Option<QueryConfig>
) -> Result<QualityMetrics, String> {
    // Your quality analysis logic
}
```

## 🚨 Error Handling

All functions return `Result<T, String>` with descriptive error messages:

```rust
match query_received_attestation_count(recipient, schema, None).await {
    Ok(count) => println!("Attestations: {}", count),
    Err(e) => {
        eprintln!("Query failed: {}", e);
        // Handle error appropriately
    }
}
```

## 🔄 Migration from Basic Version

If upgrading from the basic attestation counter:

```rust
// Old way
let count = query_attestations_for_recipient(recipient).await?;

// New way (same result, more options)
let schema_uid = FixedBytes([0u8; 32]); // All schemas
let count = query_received_attestation_count(recipient, schema_uid, None).await?;

// Or use the backwards-compatible function
let count = query_attestations_for_recipient(recipient).await?; // Still works!
```

## 💡 Best Practices

1. **Use Config Objects** - Always provide QueryConfig for production
2. **Handle Pagination** - Use start/length parameters for large datasets  
3. **Batch Operations** - Use batch functions when querying multiple attestations
4. **Cache Results** - Store frequently accessed data to reduce RPC calls
5. **Monitor Suspicious Activity** - Integrate fraud detection in production systems
6. **Validate Inputs** - Always validate addresses and schema UIDs

## 📈 Performance Tips

- Use `query_attestations_batch()` instead of individual queries
- Implement pagination for large result sets
- Configure appropriate RPC endpoints with good performance
- Cache reputation scores and network metrics when possible
- Use schema-specific queries when you don't need all schemas

---

This component provides a complete foundation for building sophisticated attestation-based applications with EAS. The modular design allows you to use only what you need while providing room for advanced analytics and custom business logic.