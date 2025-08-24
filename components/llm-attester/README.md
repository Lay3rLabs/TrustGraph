# LLM Attester

A WASI component that receives attestation events, processes them with an LLM, and creates new attestations based on the LLM's response.

## Overview

The LLM Attester component integrates with the EAS (Ethereum Attestation Service) to:
1. Receive attestation events as triggers
2. Process the attestation data with a configured LLM
3. Generate new attestations that include the LLM's response
4. Submit these attestations back to the blockchain

## Configuration Variables

All configuration variables are optional and will use default values if not provided. Variables should be set in your deployment configuration or environment.

### LLM Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `llm_model` | string | `"llama3.2"` | The LLM model to use for processing |
| `llm_temperature` | float | `0.0` | Controls randomness in responses (0.0 = deterministic, 1.0 = creative) |
| `llm_top_p` | float | `1.0` | Nucleus sampling parameter for response diversity |
| `llm_seed` | integer | `42` | Random seed for reproducible outputs |
| `llm_max_tokens` | integer | `500` | Maximum number of tokens in the LLM response |
| `llm_context_window` | integer | `4096` | Size of the context window for the LLM |
| `llm_system_message` | string | `"You are an AI assistant that helps users interact with blockchain applications and creates attestations about their queries."` | System prompt that defines the LLM's behavior |
| `llm_user_prompt` | string | `"How can I transfer USDC tokens?"` | User prompt to send to the LLM (in production, this would typically come from the attestation payload) |

### Attestation Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `attestation_schema_uid` | string | Uses payload schema | The schema UID for the new attestation |
| `attestation_revocable` | boolean | `true` | Whether the attestation can be revoked |
| `attestation_expiration` | integer | `0` | Unix timestamp when the attestation expires (0 = no expiration) |
| `attestation_value` | integer | `0` | Amount of ETH/tokens to transfer with the attestation (in wei) |

## Usage Example

### Deployment Configuration

When deploying this component, you can set configuration variables in your service configuration:

```json
{
  "config": {
    "llm_model": "llama3.2",
    "llm_temperature": "0.3",
    "llm_top_p": "0.95",
    "llm_max_tokens": "1000",
    "llm_system_message": "You are a blockchain expert assistant. Analyze attestations and provide helpful insights.",
    "attestation_schema_uid": "0x12345...",
    "attestation_revocable": "true",
    "attestation_expiration": "0"
  }
}
```

### Environment Variables

For sensitive configuration or API keys, use the `WAVS_ENV_` prefix:

```bash
export WAVS_ENV_LLM_API_KEY="your-api-key-here"
export WAVS_ENV_LLM_ENDPOINT="https://api.example.com/v1"
```

## Building and Testing

### Build the Component

```bash
# From the project root
WASI_BUILD_DIR=components/llm-attester make wasi-build
```

### Validate the Component

```bash
make validate-component COMPONENT=llm-attester
```

### Test Locally

```bash
make wasi-exec COMPONENT_FILENAME=llm-attester.wasm INPUT_DATA="test-attestation-data"
```

## Architecture

The component follows this execution flow:

1. **Trigger Reception**: Receives an attestation event via the `run` function
2. **Configuration Loading**: Loads all configuration variables with defaults
3. **LLM Processing**: 
   - Configures the LLM client with specified parameters
   - Sends the system and user prompts
   - Receives and processes the LLM response
4. **Attestation Creation**:
   - Builds an attestation payload with the LLM response
   - Includes reference to the original attestation
   - Encodes the data according to EAS standards
5. **Output**: Returns the encoded attestation for submission to the blockchain

## Response Format

The component creates attestations with the following structure:
- **Recipient**: From the original attestation
- **Schema**: Configurable or inherited from trigger
- **Data**: Contains the LLM's response as attestation data
- **RefUID**: References the original attestation UID
- **Revocable**: Configurable (default: true)
- **Expiration**: Configurable (default: no expiration)
- **Value**: Optional ETH/token transfer amount

## Error Handling

The component includes error handling for:
- Invalid trigger data decoding
- LLM client initialization failures
- LLM completion request failures
- Configuration parsing errors

All errors are logged with descriptive messages for debugging.

## Logging

The component provides detailed logging output:
- 🚀 Component startup
- 📋 Configuration values loaded
- 💬 User prompts being processed
- 🤖 LLM responses received
- ✅ Successful attestation creation
- 📤 Output destination (Ethereum/CLI)

## Development Notes

- The component uses async operations internally via `block_on`
- All numeric configuration values are parsed with safe defaults
- The LLM response is embedded directly in the attestation data field
- Schema UIDs should be valid hex strings when configured