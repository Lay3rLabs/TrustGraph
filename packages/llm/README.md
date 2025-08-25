# WAVS LLM

A WASI-compatible library for interacting with Ollama LLM API in WAVS components.

## Overview

The `wavs-llm` package provides a clean, simplified interface for interacting with Ollama language models within WASI components. This library has been refactored to focus exclusively on Ollama as the LLM backend, removing complexity and providing a more maintainable codebase.

## Features

- ✅ **Ollama-only support** - Simplified architecture focused on open-source models
- ✅ **WASI-compatible** - Uses `wstd::http` for proper WASM/WASI compatibility
- ✅ **Formatted responses** - Support for structured JSON responses and transactions
- ✅ **Structured outputs** - JSON mode and schema-based structured responses
- ✅ **Smart contract tools** - Automatic encoding of contracts into LLM-usable tools
- ✅ **Clean API design** - Fluent configuration API with sensible defaults
- ✅ **Comprehensive testing** - Unit tests and WASI-environment integration tests

## Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
wavs-llm = { workspace = true }
```

## Usage

### Basic Chat Completion

```rust
use wavs_llm::client::{LLMClient, Message};

// Create a client with default configuration
let client = LLMClient::new("llama2".to_string());

// Create messages
let messages = vec![
    Message::new_system("You are a helpful assistant.".to_string()),
    Message::new_user("What is 2+2?".to_string()),
];

// Get response
let response = client.chat_completion(messages, None)?;
println!("Response: {:?}", response.content);
```

### With Custom Configuration

```rust
use wavs_llm::client::LLMClient;
use wavs_llm::config::LlmConfig;

let config = LlmConfig::new()
    .with_temperature(0.7)
    .with_max_tokens(500)
    .with_top_p(0.95)
    .with_seed(42);

let client = LLMClient::with_config("llama2".to_string(), config);
```

### From JSON Configuration

```rust
let json_config = r#"{
    "model": "llama2",
    "temperature": 0.7,
    "max_tokens": 100
}"#;

let client = LLMClient::from_json(json_config)?;
```

### Using Tools

```rust
use wavs_llm::tools::{Tool, Function};
use serde_json::json;

let tools = vec![
    Tool {
        tool_type: "function".to_string(),
        function: Function {
            name: "get_weather".to_string(),
            description: Some("Get the current weather".to_string()),
            parameters: Some(json!({
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "City and state"
                    }
                },
                "required": ["location"]
            })),
        },
    }
];

let response = client.chat_completion(messages, Some(tools))?;
```

### Structured Responses

The LLM client supports structured output formats to ensure responses conform to specific JSON schemas:

#### JSON Mode

Ensures the response is valid JSON:

```rust
use wavs_llm::client::{LLMClient, Message, ResponseFormat};

let client = LLMClient::new("llama2".to_string());
let messages = vec![
    Message::new_user("List 3 colors as a JSON array".to_string()),
];

// Use JSON mode for guaranteed valid JSON
let format = Some(ResponseFormat::json());
let response = client.chat_completion_with_format(messages, None, format)?;
```

#### Schema-Based Structured Output

Define a JSON schema for the expected response structure:

```rust
use serde_json::json;
use serde::Deserialize;

#[derive(Deserialize)]
struct Person {
    name: String,
    age: u32,
    city: String,
}

let schema = json!({
    "type": "object",
    "properties": {
        "name": {"type": "string"},
        "age": {"type": "integer"},
        "city": {"type": "string"}
    },
    "required": ["name", "age", "city"]
});

let messages = vec![
    Message::new_user("Generate info about a person named Alice".to_string()),
];

// Get a strongly-typed response
let person: Person = client.chat_completion_structured(messages, None, schema)?;
println!("Name: {}, Age: {}, City: {}", person.name, person.age, person.city);
```

### Smart Contract Integration

```rust
use wavs_llm::contracts::Contract;
use wavs_llm::tools::Tools;

// Define a contract
let contract = Contract::new(
    "USDC",
    "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    r#"[{"type":"function","name":"transfer","inputs":[...],"outputs":[...]}]"#
);

// Generate tools from contract ABI
let contract_tools = Tools::tools_from_contract(&contract);

// Use with LLM
let response = client.chat_completion(messages, Some(&contract_tools))?;
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `temperature` | `Option<f32>` | `None` | Controls randomness (0.0-2.0) |
| `max_tokens` | `Option<u32>` | `None` | Maximum tokens to generate |
| `top_p` | `Option<f32>` | `None` | Controls diversity (0.0-1.0) |
| `seed` | `Option<u32>` | `None` | Seed for deterministic outputs |

## Environment Variables

- `WAVS_ENV_OLLAMA_API_URL`: Ollama API endpoint (default: `http://localhost:11434`)

## Testing

### Unit Tests

Run unit tests (no external dependencies required):

```bash
cargo test --lib
```

### Integration Tests

Integration tests require:
1. Ollama running locally
2. A WASI runtime environment

See [docs/TESTING.md](docs/TESTING.md) for detailed testing information.

**Important:** This is a library package designed to be imported by WASI components. Direct use of `cargo component test` will not work as this package doesn't export a `run` function.

## Architecture

### Key Components

- **`client`** - Main LLM client implementation
- **`config`** - Configuration structures and builders
- **`tools`** - Tool definitions and contract-to-tool conversion
- **`contracts`** - Smart contract interaction utilities
- **`encoding`** - ABI encoding/decoding utilities
- **`errors`** - Error types and handling

### WASI Compatibility

This library uses `wstd::http::Client` for HTTP requests, ensuring full compatibility with WASI environments. This means:
- HTTP requests work correctly in WASM components
- No native dependencies that would break WASI compatibility
- Proper async handling with `wstd::runtime::block_on`

## Migration from Previous Version

### Key Changes

1. **Removed OpenAI support** - Only Ollama is supported
2. **Simplified configuration** - `LlmOptions` → `LlmConfig` with optional fields
3. **Better error handling** - New `LlmError` type with specific error variants
4. **Environment variables** - Changed from `OLLAMA_BASE_URL` to `WAVS_ENV_OLLAMA_API_URL`

### Breaking Changes

- No longer supports OpenAI models (gpt-3.5-turbo, gpt-4, etc.)
- Configuration structure has changed
- All configuration values are now optional

## Requirements

- Rust 1.70+
- Ollama (for runtime)
- WASI runtime (for deployment)

## License

See the repository's LICENSE file for details.

## Contributing

Contributions are welcome! Please ensure:
- All unit tests pass
- Code follows existing patterns
- Documentation is updated
- Changes maintain WASI compatibility