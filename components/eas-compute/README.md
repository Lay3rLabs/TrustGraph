# EAS Compute Component

A WAVS component that queries Ethereum Attestation Service (EAS) attestation data and computes voting power based on attestation counts for governance systems.

## Overview

This component demonstrates a modular approach to attestation-based governance:

1. **Input**: Takes an Ethereum address (recipient)
2. **Query**: Counts attestations received by that address from EAS Indexer
3. **Compute**: Converts attestation count to voting power (1:1 ratio)
4. **Output**: Returns `VotingPowerPayload` for blockchain submission

## Architecture

```
src/
├── lib.rs      # Main component logic and payload creation
├── query.rs    # EAS Indexer queries and blockchain interaction
└── trigger.rs  # WAVS trigger event handling
```

### Modular Design

- **`query::query_attestations_for_recipient()`** - Pure EAS Indexer data fetching
- **`create_voting_power_payload()`** - Business logic for voting power conversion
- **Separation of concerns** - Easy to customize computation logic between querying and payload creation

## Usage

### Input Formats

The component accepts recipient addresses in multiple formats:

```bash
# Hex address string
export INPUT_DATA="0x1234567890123456789012345678901234567890"

# JSON format
export INPUT_DATA='{"recipient": "0x1234567890123456789012345678901234567890"}'

# Raw 20-byte address data also supported
```

### Testing

```bash
# Build the component
WASI_BUILD_DIR=components/eas-compute make wasi-build

# Test locally
export COMPONENT_FILENAME=wavs_eas_compute.wasm
export INPUT_DATA="0x1234567890123456789012345678901234567890"
make wasi-exec
```

### Output

Returns a `VotingPowerPayload` containing:
- **Operation Type**: MINT
- **Account**: Recipient address
- **Amount**: Number of attestations (voting tokens)

## Integration

### With VotingPower Contract

The output integrates with `VotingPower.sol` contracts that implement `IWavsServiceHandler`:

```solidity
contract VotingPower is IWavsServiceHandler {
    function handleSignedEnvelope(Envelope calldata envelope, SignatureData calldata signatureData) external {
        // Validates and processes VotingPowerPayload
        VotingPowerPayload memory payload = abi.decode(envelope.payload, (VotingPowerPayload));
        // Executes mint operations based on attestation count
    }
}
```

### Configuration Requirements

1. **Chain Config** in `wavs.toml`:
```toml
[default.chains.evm.local]
chain_id = "31337"
http_endpoint = "http://localhost:8545"
```

2. **Contract Address**: Update placeholder `Address::from([0u8; 20])` in `query.rs` with actual EAS Indexer address

## Customization Examples

The modular design allows easy customization:

```rust
// Custom computation between query and payload
let attestation_count = query::query_attestations_for_recipient(recipient).await?;

// Apply your custom logic here
let custom_voting_power = apply_tiered_rewards(attestation_count);
let bonus_power = apply_time_decay(attestation_count);
let final_power = custom_voting_power + bonus_power;

// Create payload with computed power
let payload = create_voting_power_payload(recipient, final_power);
```

## Key Features

- ✅ **Modular Architecture** - Separate query and computation logic
- ✅ **Multiple Input Formats** - Flexible address input handling  
- ✅ **EAS Integration** - Direct EAS Indexer contract queries
- ✅ **Governance Ready** - Compatible with VotingPower contracts
- ✅ **Customizable** - Easy to modify computation strategies

## Future Enhancements

- Schema-specific attestation filtering
- Time-based attestation validity checking  
- Weighted voting power by attestation type
- Multi-recipient batch processing
- Cross-chain attestation aggregation