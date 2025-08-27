# WAVS-EAS

A comprehensive Rust library for querying Ethereum Attestation Service (EAS) data with no bindings dependencies, designed for excellent developer experience.

## Features

- 🚀 **Zero bindings dependencies** - Use anywhere in your Rust code
- 🔧 **Flexible configuration** - Builder pattern and presets for easy setup
- 📊 **Complete EAS coverage** - Query attestations, indexer data, and more
- 🎯 **Type-safe** - Full type safety with alloy primitives
- ⚡ **Async/await support** - Built for modern async Rust
- 🛠 **Developer-friendly** - Intuitive API with helpful error messages

## Quick Start

```rust
use wavs_eas::query::{QueryConfig, query_attestation};
use wavs_wasi_utils::evm::alloy_primitives::{Address, FixedBytes};

// Create a configuration
let config = QueryConfig::local(); // For local development

// Or use the builder pattern
let config = QueryConfig::from_strings(
    "0x4200000000000000000000000000000000000021", // EAS address
    "0x4200000000000000000000000000000000000022", // Indexer address
    "https://sepolia.infura.io/v3/YOUR_API_KEY".to_string()
)?;

// Query an attestation
let attestation_uid = FixedBytes::from([0u8; 32]); // Your attestation UID
let attestation = query_attestation(attestation_uid, Some(config)).await?;

println!("Attester: {}", attestation.attester);
println!("Recipient: {}", attestation.recipient);
```

## Configuration Options

### 1. Preset Configurations

```rust
// Local development (default)
let config = QueryConfig::local();

// Sepolia testnet
let config = QueryConfig::sepolia(eas_address, indexer_address);

// Ethereum mainnet
let config = QueryConfig::mainnet(eas_address, indexer_address);
```

### 2. From String Addresses

```rust
let config = QueryConfig::from_strings(
    "0x4200000000000000000000000000000000000021", // EAS address
    "0x4200000000000000000000000000000000000022", // Indexer address
    "https://your-rpc-endpoint.com".to_string()
)?;
```

### 3. Builder Pattern

```rust
use wavs_eas::query::QueryConfigBuilder;

let config = QueryConfigBuilder::new()
    .eas_address_str("0x4200000000000000000000000000000000000021")?
    .indexer_address_str("0x4200000000000000000000000000000000000022")?
    .rpc_endpoint("https://your-rpc-endpoint.com".to_string())
    .build()?;
```

### 4. Direct Construction

```rust
let config = QueryConfig::new(
    eas_address,     // Address type
    indexer_address, // Address type
    "https://your-rpc-endpoint.com".to_string()
);
```

## Core Functions

### Attestation Queries

```rust
use wavs_eas::query::*;
use wavs_wasi_utils::evm::alloy_primitives::{Address, FixedBytes, U256};

// Get a single attestation
let attestation = query_attestation(attestation_uid, Some(config)).await?;

// Batch query multiple attestations
let uids = vec![uid1, uid2, uid3];
let attestations = query_attestations_batch(uids, Some(config)).await?;

// Check if attestation is indexed
let is_indexed = is_attestation_indexed(attestation_uid, Some(config)).await?;
```

### Received Attestations

```rust
// Count attestations received by address for schema
let count = query_received_attestation_count(
    recipient_address,
    schema_uid,
    Some(config)
).await?;

// Get attestation UIDs received by address
let uids = query_received_attestation_uids(
    recipient_address,
    schema_uid,
    U256::from(0),    // start
    U256::from(10),   // length
    true,             // reverse order (newest first)
    Some(config)
).await?;

// Get recent received attestations with data
let recent = query_recent_received_attestations(
    recipient_address,
    schema_uid,
    5,  // limit
    Some(config)
).await?;
```

### Sent Attestations

```rust
// Count attestations sent by address for schema
let count = query_sent_attestation_count(
    attester_address,
    schema_uid,
    Some(config)
).await?;

// Get attestation UIDs sent by address
let uids = query_sent_attestation_uids(
    attester_address,
    schema_uid,
    U256::from(0),    // start
    U256::from(10),   // length
    true,             // reverse order
    Some(config)
).await?;

// Get recent sent attestations with data
let recent = query_recent_sent_attestations(
    attester_address,
    schema_uid,
    5,  // limit
    Some(config)
).await?;
```

### Schema-Based Queries

```rust
// Count all attestations for a schema
let total_count = query_schema_attestation_count(
    schema_uid,
    Some(config)
).await?;

// Get all attestation UIDs for a schema
let all_uids = query_schema_attestation_uids(
    schema_uid,
    U256::from(0),   // start
    U256::from(50),  // length
    false,           // chronological order
    Some(config)
).await?;

// Query specific attester->recipient for schema
let count = query_schema_attester_recipient_count(
    schema_uid,
    attester_address,
    recipient_address,
    Some(config)
).await?;

let uids = query_schema_attester_recipient_uids(
    schema_uid,
    attester_address,
    recipient_address,
    U256::from(0),   // start
    U256::from(10),  // length
    true,            // reverse order
    Some(config)
).await?;
```

## Real-World Examples

### Example 1: Voting Power Calculator

```rust
use wavs_eas::query::*;

async fn calculate_voting_power(
    user_address: Address,
    governance_schema: FixedBytes<32>
) -> Result<u64, String> {
    let config = QueryConfig::sepolia(eas_address, indexer_address);

    // Count attestations received (represents reputation)
    let attestation_count = query_received_attestation_count(
        user_address,
        governance_schema,
        Some(config)
    ).await?;

    // Convert to voting power (1 attestation = 1 vote)
    Ok(attestation_count.as_u64())
}
```

### Example 2: Attestation Analytics

```rust
async fn analyze_schema_activity(
    schema_uid: FixedBytes<32>
) -> Result<(), String> {
    let config = QueryConfig::mainnet(eas_address, indexer_address);

    // Get total attestation count
    let total = query_schema_attestation_count(schema_uid, Some(config.clone())).await?;
    println!("Total attestations: {}", total);

    // Get recent attestations for analysis
    let recent_uids = query_schema_attestation_uids(
        schema_uid,
        U256::from(0),
        U256::from(100),
        true, // newest first
        Some(config.clone())
    ).await?;

    // Fetch full attestation data
    let recent_attestations = query_attestations_batch(recent_uids, Some(config)).await?;

    // Analyze patterns
    for attestation in recent_attestations {
        println!("Attestation {} from {} to {}",
            attestation.uid,
            attestation.attester,
            attestation.recipient
        );
    }

    Ok(())
}
```

### Example 3: Component Integration

```rust
// In a WASI component
pub fn run(action: TriggerAction) -> Result<Option<WasmResponse>, String> {
    let config = QueryConfig::local(); // or from component config

    // Parse trigger data to get attestation UID
    let attestation_uid = parse_trigger_data(action.data)?;

    // Query the attestation
    let attestation = block_on(async move {
        query_attestation(attestation_uid, Some(config)).await
    })?;

    // Process attestation data
    process_attestation_data(&attestation)?;

    Ok(Some(create_response()))
}
```

## Error Handling

The library uses descriptive error messages to help with debugging:

```rust
match query_attestation(uid, Some(config)).await {
    Ok(attestation) => {
        // Handle success
    },
    Err(e) => {
        // Error messages are descriptive:
        // "Contract call failed: ..."
        // "Failed to decode attestation result: ..."
        // "Invalid EAS address format: ..."
        println!("Query failed: {}", e);
    }
}
```

## Best Practices

1. **Reuse configurations**: Create your `QueryConfig` once and reuse it across multiple queries
2. **Handle pagination**: For large result sets, use start/length parameters to paginate
3. **Batch queries**: Use `query_attestations_batch` for multiple attestations instead of individual calls
4. **Error handling**: Always handle potential network and parsing errors gracefully
5. **Use appropriate ordering**: Set `reverse_order: true` for most recent items first

## Migration from Bindings

If you're migrating from the old bindings-based API:

```rust
// Old way (with bindings)
let config = QueryConfig::from_wavs_config()?;

// New way (no bindings)
let config = QueryConfig::from_strings(eas_addr, indexer_addr, rpc_endpoint)?;
// or
let config = QueryConfig::local(); // for development
```

The function signatures remain the same, just the configuration creation has changed.
