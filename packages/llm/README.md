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

### Basic Completions

```rust
use wavs_llm::client::LLMClient;

// Create a client with default configuration
let client = LLMClient::new("llama2".to_string());

// Simple text completion
let response = client.complete("What is 2+2?")?;
println!("Response: {}", response);

// With system context
let response = client.complete_with_system(
    "You are a helpful math tutor",
    "Explain why 2+2 equals 4"
)?;
println!("Response: {}", response);
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

// All convenience methods work with custom config
let response = client.complete("Write a haiku about coding")?;
```

### Advanced Chat Completion

For more control, you can still use the full chat completion API:

```rust
use wavs_llm::client::{LLMClient, Message};

let messages = vec![
    Message::new_system("You are a helpful assistant.".to_string()),
    Message::new_user("What is 2+2?".to_string()),
];

let response = client.chat_completion(messages, None)?;
println!("Response: {:?}", response.content);
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

The LLM client provides automatic structured output with compile-time type safety:

```rust
use serde::Deserialize;
use schemars::JsonSchema;

// Define your response type with automatic schema derivation
#[derive(Deserialize, JsonSchema)]
struct Analysis {
    sentiment: String,
    score: f32,
    keywords: Vec<String>,
}

// Get structured response with automatic schema generation
let analysis: Analysis = client.complete_structured(
    "Analyze: The market is looking bullish today"
)?;
println!("Sentiment: {}, Score: {}", analysis.sentiment, analysis.score);

// With system context for better results
let analysis: Analysis = client.complete_structured_with_system(
    "You are a financial sentiment analyzer",
    "Analyze: Strong earnings beat expectations"
)?;
```

#### Complex Nested Structures

```rust
#[derive(Deserialize, JsonSchema)]
struct TaskList {
    title: String,
    tasks: Vec<Task>,
    priority: String,
}

#[derive(Deserialize, JsonSchema)]
struct Task {
    id: u32,
    description: String,
    completed: bool,
}

// Automatic schema generation handles complex nested types
let tasks: TaskList = client.complete_structured(
    "Create a task list for launching a new product"
)?;

for task in &tasks.tasks {
    println!("[{}] {} - {}", 
        task.id, 
        task.description, 
        if task.completed { "✓" } else { "○" }
    );
}
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

## Migration Guide

### Migrating to the Simplified API

The new API provides a much cleaner developer experience while maintaining backward compatibility:

#### Old API
```rust
// Manual message construction
let messages = vec![
    Message::new_user("What is 2+2?".to_string()),
];
let response = client.chat_completion(messages, None)?;
let text = response.content.unwrap();

// Structured responses with manual schema
let schema = json!({
    "type": "object",
    "properties": {
        "sentiment": {"type": "string"},
        "score": {"type": "number"}
    }
});
let response = client.chat_completion_structured::<Analysis>(messages, None, schema)?;
```

#### New API
```rust
// Simple completion
let text = client.complete("What is 2+2?")?;

// Structured response with automatic schema
#[derive(Deserialize, JsonSchema)]
struct Analysis {
    sentiment: String,
    score: f32,
}
let analysis: Analysis = client.complete_structured("Analyze: text here")?;
```

### Key Improvements

1. **Automatic Schema Generation**: No need to manually write JSON schemas
2. **Simpler Methods**: `complete()` and `complete_structured()` for common use cases
3. **Type Safety**: Schema is derived from your Rust types at compile time
4. **Less Boilerplate**: No manual message construction for simple prompts

### Backward Compatibility

All existing code continues to work. The new methods are additions, not replacements:
- `chat_completion()` - Still available for full control
- `chat_completion_with_format()` - Still available for custom formats
- `chat_completion_structured()` - Still available but consider using `complete_structured()`

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