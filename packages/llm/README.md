# WAVS LLM

A WASI-compatible library for interacting with Ollama LLM API in WAVS components.

## Overview

The `wavs-llm` package provides a clean, simplified interface for interacting with Ollama language models within WASI components. This library has been refactored to focus exclusively on Ollama as the LLM backend, with a streamlined builder pattern API that reduces complexity while maintaining full functionality.

## Features

- ✅ **Ollama-only support** - Simplified architecture focused on open-source models
- ✅ **WASI-compatible** - Uses `wstd::http` for proper WASM/WASI compatibility
- ✅ **Simplified API** - Just 2 core methods with fluent builder pattern
- ✅ **Structured outputs** - JSON mode and schema-based structured responses with automatic schema generation
- ✅ **Smart contract tools** - Automatic encoding of contracts into LLM-usable tools
- ✅ **Tool execution** - Automatic tool call processing and chaining
- ✅ **Builder pattern** - Fluent configuration API with method chaining
- ✅ **Comprehensive testing** - Unit tests and WASI-environment integration tests

## Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
wavs-llm = { workspace = true }
```

## API Overview

The new API consists of just 2 core methods:

- **`chat(messages)`** - For text responses with builder pattern
- **`chat_structured::<T>(messages)`** - For typed/structured responses

All configuration is done through method chaining on the returned builder.

## Usage

### Basic Text Completion

```rust
use wavs_llm::{LLMClient, Message};

// Create a client with default configuration
let client = LLMClient::new("llama3.2");

// Simple text completion
let response = client.chat("What is 2+2?").text()?;
println!("Response: {}", response);

// Multi-message conversation
let messages = vec![
    Message::system("You are a helpful math tutor"),
    Message::user("Explain why 2+2 equals 4")
];
let response = client.chat(messages).text()?;
println!("Response: {}", response);

// Get full Message object (for tool calls, etc.)
let message = client.chat("Hello").send()?;
println!("Role: {}, Content: {:?}", message.role, message.content);
```

### Custom Configuration

```rust
use wavs_llm::{LLMClient, LlmOptions};

let config = LlmOptions::new()
    .with_temperature(0.7)
    .with_max_tokens(500)
    .with_top_p(0.95)
    .with_seed(42);

let client = LLMClient::with_config("llama3.2", config);

// Configuration applies to all requests from this client
let response = client.chat("Write a haiku about coding").text()?;
```

### From JSON Configuration

```rust
let json_config = r#"{
    "model": "llama3.2",
    "temperature": 0.8,
    "max_tokens": 200,
    "seed": 42
}"#;

let client = LLMClient::from_json(json_config)?;
let response = client.chat("Hello").text()?;
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
let analysis: Analysis = client
    .chat_structured("Analyze: The market is looking bullish today")
    .send()?;

println!("Sentiment: {}, Score: {}", analysis.sentiment, analysis.score);

// With system context for better results
let messages = vec![
    Message::system("You are a financial sentiment analyzer"),
    Message::user("Analyze: Strong earnings beat expectations")
];
let analysis: Analysis = client.chat_structured(messages).send()?;
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
let tasks: TaskList = client
    .chat_structured("Create a task list for launching a new product")
    .send()?;

for task in &tasks.tasks {
    println!("[{}] {} - {}", 
        task.id, 
        task.description, 
        if task.completed { "✓" } else { "○" }
    );
}
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

let response = client
    .chat("What's the weather in San Francisco?")
    .with_tools(tools)
    .send()?;
```

### Smart Contract Integration

```rust
use wavs_llm::contracts::Contract;

// Define a contract
let contract = Contract::new(
    "USDC",
    "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    r#"[{"type":"function","name":"transfer","inputs":[...],"outputs":[...]}]"#
);

// Generate tools from contract ABI automatically
let response = client
    .chat("Transfer 100 USDC to Alice")
    .with_contract_tools(&[contract])
    .send()?;
```

### Automatic Tool Execution

For scenarios where you want the LLM to automatically execute tool calls:

```rust
// This will automatically handle tool calls and return the final result
let final_result = client
    .chat("What's the weather and send 1 ETH to Alice")
    .with_tools(tools)
    .execute_tools()?;

println!("Final result: {}", final_result);
```

### Builder Pattern Configuration

All options can be chained together:

```rust
let response = client
    .chat("Analyze the market and execute trades")
    .with_contract_tools(&contracts)
    .with_tools(custom_tools)
    .with_retries(3)
    .text()?;

// For structured responses
let analysis: Analysis = client
    .chat_structured("Analyze this data")
    .with_retries(5)
    .send()?;
```

### Using Config Objects

For complex configurations, use the Config object:

```rust
use wavs_llm::config::Config;

let mut config = Config::default();
config.messages = vec![Message::system("You are a trading expert")];
config.contracts = vec![usdc_contract, eth_contract];

let response = client
    .chat("What should I trade today?")
    .with_config(&config)
    .text()?;
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `temperature` | `Option<f32>` | `None` | Controls randomness (0.0-2.0) |
| `max_tokens` | `Option<u32>` | `None` | Maximum tokens to generate |
| `top_p` | `Option<f32>` | `None` | Controls diversity (0.0-1.0) |
| `seed` | `Option<u32>` | `None` | Seed for deterministic outputs |

## Message Types

```rust
// Create messages with convenience methods
let messages = vec![
    Message::system("You are helpful"),
    Message::user("Hello"),
    Message::assistant("Hi there!"),
    Message::tool_result("call_123", "weather", "Sunny, 75°F"),
];

// Auto-conversion from strings
let response = client.chat("Hello").text()?;  // Converts to Message::user("Hello")
```

## Builder Methods Reference

### ChatRequest Methods
- `.with_tools(tools: Vec<Tool>)` - Add custom tools
- `.with_contract_tools(contracts: &[Contract])` - Add tools from smart contracts
- `.with_config(config: &Config)` - Add full configuration
- `.with_retries(retries: u32)` - Set retry count
- `.send() -> Result<Message, LlmError>` - Execute and get full response
- `.text() -> Result<String, LlmError>` - Execute and get text content
- `.execute_tools() -> Result<String, LlmError>` - Execute with automatic tool handling

### StructuredChatRequest Methods
- `.with_tools(tools: Vec<Tool>)` - Add custom tools
- `.with_contract_tools(contracts: &[Contract])` - Add tools from smart contracts
- `.with_config(config: &Config)` - Add full configuration
- `.with_retries(retries: u32)` - Set retry count
- `.send() -> Result<T, LlmError>` - Execute and get parsed response

## Environment Variables

- `WAVS_ENV_OLLAMA_API_URL`: Ollama API endpoint (default: `http://localhost:11434`)

## Testing

### Unit Tests

Run unit tests (no external dependencies required):

```bash
cd packages/llm
cargo test --lib
```

### Integration Tests

Integration tests require:
1. Ollama running locally
2. A WASI runtime environment

**Important:** This is a library package designed to be imported by WASI components. Direct use of `cargo component test` will not work as this package doesn't export a `run` function.

## Architecture

### Key Components

- **`client`** - Main LLM client with simplified builder API
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

The API has been significantly simplified while maintaining all functionality:

### Key Changes

1. **Simplified API** - From 13+ methods down to just 2 core methods
2. **Builder Pattern** - All configuration through method chaining
3. **Better Type Safety** - Automatic schema generation for structured responses
4. **Cleaner Message API** - Convenient constructors for common message types

### Migration Examples

**Old API:**
```rust
// Multiple different methods
let response = client.complete("What is 2+2?")?;
let response = client.complete_with_system("Be helpful", "What is 2+2?")?;
let result = client.complete_structured::<Analysis>("Analyze this")?;
```

**New API:**
```rust
// Everything is a chat with builder pattern
let response = client.chat("What is 2+2?").text()?;
let response = client.chat(vec![
    Message::system("Be helpful"),
    Message::user("What is 2+2?")
]).text()?;
let result: Analysis = client.chat_structured("Analyze this").send()?;
```

See [MIGRATION_GUIDE.md](docs/MIGRATION_GUIDE.md) for complete migration details.

## Error Handling

```rust
use wavs_llm::errors::LlmError;

match client.chat("Hello").text() {
    Ok(response) => println!("Success: {}", response),
    Err(LlmError::ApiError(msg)) => eprintln!("API Error: {}", msg),
    Err(LlmError::ParseError(msg)) => eprintln!("Parse Error: {}", msg),
    Err(LlmError::RequestError(msg)) => eprintln!("Request Error: {}", msg),
    Err(e) => eprintln!("Other Error: {}", e),
}
```

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

The simplified API design makes the codebase more maintainable and easier to extend with new features.