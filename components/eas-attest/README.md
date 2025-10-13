# Basic EAS Attestation Component Example

A generic WAVS component that receives attestation input data and creates EAS (Ethereum Attestation Service) attestations. This component provides a simple interface for creating attestations from various input formats.

IT is not used as part of demo.

## Overview

This component serves as a generic attestation creator that can:

1. **Parse multiple input formats** (JSON, ABI-encoded, raw bytes)
2. **Validate attestation data** (schema, recipient, data fields)
3. **Create formatted attestation responses** for EAS submission
4. **Handle both Ethereum and CLI output destinations**

## Input Formats

### 1. JSON Format
```json
{
  "schema": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  "recipient": "0x1234567890abcdef1234567890abcdef12345678",
  "data": "This is my attestation data",
  "expiration_time": 1735689600,
  "revocable": true,
  "ref_uid": "0x0000000000000000000000000000000000000000000000000000000000000000"
}
```

### 2. ABI-Encoded Format
The component can decode ABI-encoded attestation data with the structure:
- `bytes32 schema`
- `address recipient`
- `bytes data`
- `uint64 expiration_time`
- `bool revocable`
- `bytes32 ref_uid`

### 3. Raw Bytes
Any raw byte data will be treated as attestation data with default values:
- Schema: `0x0000...` (should be configured)
- Recipient: `0x0000...` (zero address)
- Expiration: `0` (no expiration)
- Revocable: `true`
- Ref UID: `0x0000...`

## Output Format

The component outputs an `AttestationResponse` structure:

```json
{
  "schema": [0, 0, 0, ...],
  "recipient": [0, 0, 0, ...],
  "data": [72, 101, 108, 108, 111],
  "expiration_time": 0,
  "revocable": true,
  "ref_uid": [0, 0, 0, ...]
}
```

## Usage Examples

### CLI Testing

```bash
# JSON input
echo '{"schema":"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef","recipient":"0x1234567890abcdef1234567890abcdef12345678","data":"Hello EAS!"}' | make wasi-exec WASI_BUILD_DIR=components/eas-attest

# Raw text input (uses defaults)
echo "Simple attestation data" | make wasi-exec WASI_BUILD_DIR=components/eas-attest
```

### Integration with Contracts

The component is designed to work directly with EAS events or raw data:

1. **Direct EAS Integration**: Processes `Attested` events from EAS contracts
2. **Raw Data Processing**: Handles direct attestation data input
3. **Clean Output**: Returns formatted attestation data ready for EAS submission

Example usage patterns:
```solidity
// Direct integration - WAVS monitors EAS Attested events
// No additional trigger contracts needed!

// Or for custom triggers, just pass raw attestation data:
function createCustomAttestation(bytes calldata attestationData) external {
    // Component processes attestationData directly
    // Much simpler than wrapping in trigger events
}
```

## Configuration

### Default Values

The component uses these defaults for raw data input:
- **Schema**: `0x0000...` (configure this for your use case)
- **Recipient**: `0x0000...` (zero address means no specific recipient)
- **Expiration**: `0` (no expiration)
- **Revocable**: `true`
- **Reference UID**: `0x0000...` (no reference)

### Customization

To customize default values, modify the fallback case in `parse_attestation_input()`:

```rust
// Fallback: treat as raw data with custom defaults
Ok(AttestationInput {
    schema: YOUR_DEFAULT_SCHEMA, // Set your schema here
    recipient: [0u8; 20],
    data: data.to_vec(),
    expiration_time: 0,
    revocable: true,
    ref_uid: [0u8; 32],
})
```

## Building

```bash
# Build the component
make wasi-build WASI_BUILD_DIR=components/eas-attest

# Build all components
make wasi-build
```

## Integration with EAS

This component creates the data structure needed for EAS attestation submission. The output can be used directly with EAS contracts:

```solidity
AttestationRequest memory request = AttestationRequest({
    schema: response.schema,
    data: AttestationRequestData({
        recipient: response.recipient,
        expirationTime: response.expiration_time,
        revocable: response.revocable,
        refUID: response.ref_uid,
        data: response.data,
        value: 0
    })
});

bytes32 uid = eas.attest(request);
```

## License

MIT
