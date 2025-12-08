# LLM Attester Component

A WASI component that processes EAS (Ethereum Attestation Service) attestations using Large Language Models (LLMs) to analyze attestation data and create new attestations based on the analysis.

## Overview

The LLM Attester component:
1. Receives attestation events from the blockchain
2. Queries the referenced attestation data from EAS
3. Analyzes the attestation data using an LLM
4. Creates a new attestation with the LLM's analysis

## Configuration

The component is configured through environment variables prefixed with `WAVS_ENV_`:

### EAS Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `WAVS_ENV_eas_address` | EAS contract address | Base Sepolia EAS address |
| `WAVS_ENV_chain_name` | Blockchain network name | `base-sepolia` |
| `WAVS_ENV_attestation_schema_uid` | Schema UID to use for new attestations | Uses incoming schema |
| `WAVS_ENV_attestation_revocable` | Whether attestations can be revoked | `true` |
| `WAVS_ENV_attestation_expiration` | Expiration timestamp (0 = no expiration) | `0` |
| `WAVS_ENV_attestation_value` | ETH value to send with attestation | `0` |

### LLM Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `WAVS_ENV_llm_model` | LLM model to use | `llama3.2` |
| `WAVS_ENV_llm_temperature` | Temperature for LLM sampling (0-2) | `0.0` |
| `WAVS_ENV_llm_top_p` | Top-p sampling parameter | `1.0` |
| `WAVS_ENV_llm_seed` | Random seed for reproducibility | `42` |
| `WAVS_ENV_llm_max_tokens` | Maximum tokens in response | `100` |
| `WAVS_ENV_llm_context_window` | Context window size | `250` |
| `WAVS_ENV_llm_system_message` | System prompt for the LLM | Default analysis prompt |

## Schema Encoding

The component properly encodes attestation data according to EAS schema definitions using ABI encoding.

### Supported Schema Types

#### Simple String Schema
```
string statement
string message
string data
```

For these schemas, the LLM response is ABI-encoded as a single string value.

#### Complex Schemas (Planned)
```
bytes32 triggerId,string data,uint256 timestamp
address creator,string content,bool verified
```

Complex schemas with multiple fields will be supported in future versions.

### Encoding Examples

#### Example 1: String Statement Schema

**Schema Definition:**
```
string statement
```

**LLM Response:**
```
"This attestation represents a user verification"
```

**Encoded Data (ABI):**
```
0x0000000000000000000000000000000000000000000000000000000000000020  // Offset to string data
0x0000000000000000000000000000000000000000000000000000000000000029  // String length (41 bytes)
0x5468697320617474657374...                                          // UTF-8 string bytes
```

#### Example 2: Multiple Fields (Future)

**Schema Definition:**
```
bytes32 triggerId,string data,uint256 timestamp
```

**Data Values:**
```
triggerId: 0x1234...5678
data: "Analysis result"
timestamp: 1699564800
```

**Encoded Data (ABI):**
```
0x1234...5678                                                          // bytes32 triggerId
0x0000000000000000000000000000000000000000000000000000000000000060  // Offset to string
0x00000000000000000000000000000000000000000000000000000065673a00    // uint256 timestamp
0x000000000000000000000000000000000000000000000000000000000000000f  // String length
0x416e616c7973697320726573756c74...                                  // String bytes
```

## Usage

### Basic Usage

1. Deploy the component with appropriate configuration:
```bash
# Set configuration
export WAVS_ENV_llm_model="llama3.2"
export WAVS_ENV_attestation_schema_uid="0x..."

# Build and deploy
make wasi-build WASI_BUILD_DIR=components/llm-attester
```

2. The component will automatically:
   - Listen for attestation events
   - Query attestation data
   - Process with LLM
   - Create new attestations

### Advanced Configuration

#### Custom System Prompts

Configure the LLM's analysis approach:

```bash
export WAVS_ENV_llm_system_message="You are a compliance auditor. Analyze the attestation for regulatory compliance and provide a detailed assessment."
```

#### Schema Filtering

Process only specific attestation schemas:

```bash
export WAVS_ENV_attestation_schema_uid="0x1234567890abcdef..."
```

## Best Practices

### 1. Schema Consistency
Always ensure the output attestation schema matches the expected encoding format. For `string statement` schemas, the LLM response will be encoded as a single ABI-encoded string.

### 2. Error Handling
The component includes fallback mechanisms:
- If attestation query fails, uses minimal attestation data
- If schema encoding fails, defaults to simple string encoding
- Schema mismatches are logged and skipped

### 3. Resource Management
Configure appropriate limits:
- `llm_max_tokens`: Limit response size
- `llm_context_window`: Control context size
- `attestation_expiration`: Set appropriate expiration times

### 4. Security Considerations
- Never include sensitive data in attestations
- Use appropriate revocability settings
- Consider attestation expiration for time-sensitive data

## Development

### Testing Locally

```bash
# Build the component
WASI_BUILD_DIR=components/llm-attester make wasi-build

# Test with sample data
make wasi-exec COMPONENT_FILENAME=llm-attester.wasm INPUT_DATA='{"schemaUID":"0x...","uid":"0x...","recipient":"0x..."}'
```

### Validation

```bash
# Validate component structure
make validate-component COMPONENT=llm-attester
```

## Troubleshooting

### Common Issues

1. **Schema Mismatch**
   - Check `attestation_schema_uid` configuration
   - Verify incoming schema matches expected format

2. **Encoding Errors**
   - Ensure LLM response fits the schema type
   - Check for proper ABI encoding in logs

3. **LLM Timeouts**
   - Reduce `llm_max_tokens`
   - Adjust `llm_context_window`

## Future Enhancements

- [ ] Support for complex multi-field schemas
- [ ] Automatic schema detection and parsing
- [ ] IPFS integration for large attestation data
- [ ] Batch attestation processing
- [ ] Custom encoding strategies per schema type

## References

- [EAS Documentation](https://docs.attest.sh/)
- [ABI Encoding Specification](https://docs.soliditylang.org/en/latest/abi-spec.html)
- [WAVS Component Development](../README.md)