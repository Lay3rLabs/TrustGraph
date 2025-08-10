# EAS Attestations Reward Source

This document describes the EAS (Ethereum Attestation Service) attestations reward source implementation for the WAVS rewards component.

## Overview

The EAS source (`src/sources/eas.rs`) enables reward distribution based on EAS attestation activity. It supports multiple types of attestation-based rewards and integrates seamlessly with the existing rewards system.

## Reward Types

The EAS source supports three types of attestation-based rewards:

### 1. Received Attestations (`ReceivedAttestations`)
- Rewards users based on the number of attestations they have received
- Useful for rewarding users who are frequently attested to by others
- Example: Community reputation systems, skill verification

### 2. Sent Attestations (`SentAttestations`)  
- Rewards users based on the number of attestations they have created
- Encourages active participation in the attestation ecosystem
- Example: Rewarding validators, reviewers, or active community members

### 3. Schema-Specific Attestations (`SchemaAttestations(schema_uid)`)
- Rewards users based on attestations to a specific schema
- Enables targeted incentives for particular use cases
- Example: Rewarding contributions to specific projects or meeting certain criteria

## Configuration

The EAS source requires the following configuration variables:

```rust
// Required configuration
let eas_address = config_var("eas_address")?;                    // EAS contract address
let eas_indexer_address = config_var("eas_indexer_address")?;   // EAS indexer contract address
let chain_name = config_var("chain_name").unwrap_or("local");    // Chain configuration name

// Optional for schema-specific rewards
let schema_uid = config_var("reward_schema_uid")?;               // Schema UID for schema-specific rewards
```

## Usage Examples

### Basic Setup with Multiple Reward Types

```rust
use sources::eas::{EasSource, EasRewardType};
use wavs_wasi_utils::evm::alloy_primitives::U256;

let mut registry = SourceRegistry::new();

// Reward users for received attestations - 5e17 rewards per attestation
registry.add_source(EasSource::new(
    &eas_address,
    &eas_indexer_address,
    &chain_name,
    EasRewardType::ReceivedAttestations,
    U256::from(5e17),
));

// Reward users for sent attestations - 3e17 rewards per attestation  
registry.add_source(EasSource::new(
    &eas_address,
    &eas_indexer_address,
    &chain_name,
    EasRewardType::SentAttestations,
    U256::from(3e17),
));
```

### Schema-Specific Rewards

```rust
// Reward attestations to a specific schema - 1e18 rewards per attestation
if let Ok(schema_uid) = config_var("reward_schema_uid") {
    registry.add_source(EasSource::new(
        &eas_address,
        &eas_indexer_address, 
        &chain_name,
        EasRewardType::SchemaAttestations(schema_uid),
        U256::from(1e18),
    ));
}
```

### Combined with Other Sources

```rust
// Combine EAS rewards with NFT-based rewards
registry.add_source(sources::erc721::Erc721Source::new(
    &reward_source_nft_address,
    U256::from(1e18), // 1e18 rewards per NFT
));

registry.add_source(EasSource::new(
    &eas_address,
    &eas_indexer_address,
    &chain_name,
    EasRewardType::ReceivedAttestations,
    U256::from(5e17), // 5e17 rewards per received attestation
));
```

## Environment Variables

Set these environment variables or configuration values:

- `eas_address`: Address of the EAS contract
- `eas_indexer_address`: Address of the EAS indexer contract  
- `chain_name`: Chain configuration name (defaults to "local")
- `reward_schema_uid` (optional): Schema UID for schema-specific rewards

## Technical Implementation

### Key Components

1. **EasSource struct**: Main implementation of the `Source` trait
2. **EasRewardType enum**: Defines the three types of supported rewards
3. **IEASIndexer interface**: Solidity interface for interacting with the EAS indexer

### Query Methods

The implementation uses several query methods:
- `receivedAttestationCount(address)`: Get attestation count for recipients
- `sentAttestationCount(address)`: Get attestation count for attesters  
- `schemaAttestationCount(bytes32, address)`: Get schema-specific attestation count
- `getAllRecipients()`: Get all accounts that have received attestations
- `getAllAttesters()`: Get all accounts that have sent attestations
- `getSchemaAccounts(bytes32)`: Get all accounts with schema-specific attestations

### Reward Calculation

Rewards are calculated as:
```
total_rewards = attestation_count × rewards_per_attestation
```

### Metadata

The source provides comprehensive metadata including:
- EAS contract address
- Indexer contract address  
- Chain name
- Reward type configuration
- Rewards per attestation amount

## Integration with Rewards System

The EAS source integrates seamlessly with the existing rewards infrastructure:

1. **Account Discovery**: Automatically discovers all relevant accounts based on attestation activity
2. **Reward Calculation**: Calculates rewards based on attestation counts and configured reward amounts
3. **Metadata Tracking**: Provides transparent metadata about reward sources and calculations
4. **Merkle Tree Generation**: Participates in the standard merkle tree generation for claimable rewards

## Error Handling

The implementation includes robust error handling for:
- Network connectivity issues
- Invalid addresses or configuration
- Contract call failures
- Data parsing errors

## Future Enhancements

Potential future improvements could include:

1. **Time-based Filtering**: Reward attestations only within specific time periods
2. **Attestation Quality Scoring**: Weight rewards based on attestation content or validator reputation
3. **Cross-chain Support**: Support attestations across multiple chains
4. **Custom Query Logic**: Support for more complex attestation queries and filtering
5. **Caching**: Cache attestation data to improve performance

## Troubleshooting

Common issues and solutions:

1. **"Failed to get chain config"**: Ensure `chain_name` matches a configured chain
2. **"No HTTP endpoint configured"**: Verify the chain configuration includes an HTTP RPC endpoint
3. **Contract call failures**: Check that EAS and indexer contracts are deployed at the specified addresses
4. **Zero rewards**: Verify accounts have relevant attestation activity and reward amounts are configured correctly