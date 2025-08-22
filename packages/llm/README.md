# WAVS LLM WASM Component

## Overview

The WAVS LLM WASM Component is a WebAssembly component that enables AI-assisted interactions with smart contracts and blockchain networks. It provides a modular architecture for integrating large language models into applications that need to interpret user requests, execute transactions, and interact with custom tools. As a WebAssembly component, it can be used across multiple programming languages including Rust, Go, and TypeScript.

## Features

- **LLM Integration**: Connects to language models from providers like OpenAI and Ollama
- **Smart Contract Interaction**: Automatically generates tools for smart contract functions
- **Transaction Construction**: Creates properly formatted transaction payloads
- **ABI Encoding**: Handles Ethereum ABI encoding for function calls
- **Extensible Tools System**: Supports custom tools for additional functionality
- **Configurable**: Flexible JSON configuration for customizing behavior

## Architecture

The WAVS LLM WASM Component consists of several key modules:

- **Client**: Handles communication with LLM providers, managing API requests and response processing
- **Config**: Manages component configuration, including contract definitions and LLM settings
- **Contracts**: Processes smart contract ABIs and handles transaction creation
- **Encoding**: Provides ABI encoding for Ethereum function calls
- **Tools**: Manages the tools system, including contract function calls and custom tools
- **Serialization**: Handles serialization/deserialization of WIT types

## Usage

### Rust Example

Here's a basic example of using the WAVS LLM component in a Rust application:

```rust
use wavs_llm::types::{Config, Contract, LlmOptions, Message};
use wavs_llm::client::completion;

// Create LLM configuration
let llm_options = LlmOptions {
    temperature: 0.0,
    top_p: 1.0,
    seed: 42,
    max_tokens: Some(500),
    context_window: Some(4096),
};

// Define system message
let system_message = "You are an AI assistant that helps users interact with blockchain applications.";

// Create configuration
let config = Config {
    model: "llama3.2".to_string(),
    llm_config: llm_options,
    messages: vec![Message {
        role: "system".into(),
        content: Some(system_message.into()),
        tool_calls: None,
        tool_call_id: None,
        name: None,
    }],
    contracts: vec![Contract {
        name: "USDC".into(),
        address: "0xb7278a61aa25c888815afc32ad3cc52ff24fe575".into(),
        abi: r#"[{"type":"function","name":"transfer","inputs":[{"name":"to","type":"address","internalType":"address"},{"name":"value","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"bool","internalType":"bool"}],"stateMutability":"nonpayable"}]"#.into(),
        description: Some("USDC is a stablecoin pegged to the US Dollar".into()),
    }],
    config: vec![],
};

// User prompt
let user_prompt = "How can I transfer USDC tokens?";

// Add user message to config
config.messages.push(Message {
    role: "user".into(),
    content: Some(user_prompt.into()),
    tool_calls: None,
    tool_call_id: None,
    name: None,
});

// Get completion
let result = completion(&config).await.unwrap();
println!("LLM Response: {}", result.message.content.unwrap_or_default());
```

### Real-World Usage

For a complete, working example of the WAVS LLM component in action, see the [DAO Agent component](../components/dao-agent) which demonstrates:

- Loading configuration from external sources (HTTP or IPFS)
- Dynamic balance checking for tokens
- Smart contract interactions
- Token transfers with proper decimal handling
- Security measures for financial transactions

## Environment Variables

The WAVS LLM component uses the following environment variables:

- `WAVS_ENV_OPENAI_API_KEY`: OpenAI API key for LLM access
- `WAVS_ENV_OPENAI_API_URL`: OpenAI API endpoint (default: "https://api.openai.com/v1/chat/completions")
- `WAVS_ENV_OLLAMA_API_URL`: Ollama API endpoint for local LLM hosting
- `WAVS_ENV_IPFS_GATEWAY_URL`: IPFS gateway URL for loading configurations (default: "https://gateway.lighthouse.storage")

## License

[MIT License](LICENSE)
