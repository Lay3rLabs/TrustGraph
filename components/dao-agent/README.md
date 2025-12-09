# DAO Agent Component

A WASI-based agent that controls a Gnosis Safe Module. This component uses an LLM to make financial decisions and execute transactions on behalf of a DAO.

## Overview

The DAO Agent acts as an AI-powered financial controller for a Gnosis Safe wallet. It can:

- Process natural language instructions about financial transactions
- Send ETH to allowlisted addresses
- Transfer ERC20 tokens (e.g., USDC) to allowlisted addresses
- Interact with smart contracts
- Validate transactions based on security rules

## Configuration

The DAO Agent can be configured via a JSON configuration file, which can be loaded from:

- HTTP/HTTPS URLs
- IPFS URLs (using the format `ipfs://HASH`)

The configuration can be passed via the `config_uri` key-value pair when deploying the service:

```bash
SERVICE_CONFIG='{"fuel_limit":100000000,"max_gas":5000000,"host_envs":["WAVS_ENV_OPENAI_API_KEY", "WAVS_ENV_OPENAI_API_URL", "WAVS_ENV_IPFS_GATEWAY_URL", "WAVS_ENV_OLLAMA_API_URL"],"kv":[["config_uri", "ipfs://bafkreigflglas3bfv2qe5dik3lwag5lyuotwzbp5p6fw5cd73ibr5qczc4"]],"workflow_id":"default","component_id":"default"}'
```

If no configuration is provided, the component will use the default settings defined in `context.rs`.

### Configuration Format

The configuration file should follow this structure:

```json
{
  "account_address": "0x47937d0d01b7d71201ca10138ebc14d22618ebce",
  "allowlisted_addresses": ["0xDf3679681B87fAE75CE185e4f01d98b64Ddb64a3"],
  "supported_tokens": [
    {
      "address": "0x0000000000000000000000000000000000000000",
      "symbol": "ETH",
      "decimals": 18,
      "description": "Native Ethereum token"
    },
    {
      "address": "0xb7278a61aa25c888815afc32ad3cc52ff24fe575",
      "symbol": "USDC",
      "decimals": 6,
      "description": "USD Coin - a stablecoin pegged to the US Dollar"
    }
  ],
  "llm_context": {
    "model": "llama3.2",
    "llm_config": {
      "temperature": 0.0,
      "top_p": 1.0,
      "seed": 42,
      "max_tokens": 500,
      "context_window": 4096
    },
    "messages": [
      {
        "role": "system",
        "content": "You are a DAO agent responsible for making and executing financial decisions through a Gnosis Safe Module..."
      }
    ],
    "contracts": [
      {
        "name": "USDC",
        "address": "0xb7278a61aa25c888815afc32ad3cc52ff24fe575",
        "abi": "[{\"type\":\"function\",\"name\":\"transfer\",\"inputs\":[{\"name\":\"to\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"value\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"outputs\":[{\"name\":\"\",\"type\":\"bool\",\"internalType\":\"bool\"}],\"stateMutability\":\"nonpayable\"}]",
        "description": "USDC is a stablecoin pegged to the US Dollar"
      }
    ],
    "config": []
  }
}
```

See `agent-config.example.json` for a full example.

## Environment Variables

The DAO Agent supports the following environment variables:

- `WAVS_ENV_IPFS_GATEWAY_URL`: IPFS gateway URL for loading configurations (default: "https://gateway.lighthouse.storage")
- `WAVS_ENV_OLLAMA_API_URL`: Ollama Server API endpoint (default: "http://localhost:11434")

## Building and Running

### Build the Component

```bash
cd components/dao-agent
cargo component build --release
```

Or use the project-level build command:

```bash
make wasi-build
```

### Run Locally

You can test the DAO Agent locally with:

```bash
COMPONENT_FILENAME="dao_agent.wasm" PROMPT='We should donate 1 ETH to 0xDf3679681B87fAE75CE185e4f01d98b64Ddb64a3.' SERVICE_CONFIG='{"fuel_limit":100000000,"max_gas":5000000,"host_envs":["WAVS_ENV_IPFS_GATEWAY_URL", "WAVS_ENV_OLLAMA_API_URL"],"kv":[["config_uri", "ipfs://bafkreigflglas3bfv2qe5dik3lwag5lyuotwzbp5p6fw5cd73ibr5qczc4"]],"workflow_id":"default","component_id":"default"}' make wasi-exec
```

## Security Considerations

The DAO Agent includes several security measures:

1. **Allowlisted Addresses**: Only addresses in the allowlist can receive funds
2. **Supported Tokens**: Only explicitly supported tokens can be transferred
3. **Token Amount Limits**: Transfers are limited to prevent large, unauthorized moves
4. **Decimal Handling**: Careful handling of token decimals to avoid mistakes
5. **Balance Checks**: Transactions that would spend more than the current balance are rejected
6. **Suspicious Request Detection**: The agent is programmed to reject unclear or suspicious requests

## Technical Implementation

### Dynamic Balance Fetching

The agent can query current token balances on-chain to verify transactions:

```rust
// Query all supported token balances
let balances = context.query_all_token_balances()?;
```

### Smart Contract Interactions

The agent can interact with smart contracts using their ABIs:

```rust
// Execute a USDC transfer
let transfer_call = ... // Create transfer call from ABI
let transaction = ... // Build transaction
let result = provider.send_transaction(transaction).await?;
```

### Token Decimal Handling

The agent automatically handles token decimal conversion:

- ETH: 18 decimals (1 ETH = 10^18 wei)
- USDC: 6 decimals (1 USDC = 10^6 base units)

All human-readable amounts are converted to the correct base units before transactions are executed.

## Extending the Agent

To add support for new tokens or contracts:

1. Add the token to the `supported_tokens` array in your configuration
2. Add the contract ABI to the `contracts` array
3. Update the system prompt to include instructions for the new token/contract

## Limitations

This is a demonstration agent and has several limitations:

- Limited to pre-defined token types
- No complex DeFi operations
- No governance capabilities
- Simple security rules
