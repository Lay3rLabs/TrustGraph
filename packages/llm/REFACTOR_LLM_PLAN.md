# REFACTOR_LLM_PLAN.md

## Overview
Refactor the `wavs-llm` package to provide a clean, simple interface for interacting with open-source LLMs in WAVS components. The focus is on simplicity, maintainability, and clear separation of concerns.

## Current Issues
1. **Mixed Provider Support**: Both OpenAI and Ollama code intertwined in client.rs
2. **Complex Tool System**: The tools.rs file is overly complex for the use case
3. **Coupled Concerns**: LLM logic is tightly coupled with smart contract logic
4. **Redundant Code**: sol_interfaces.rs duplicates functionality available elsewhere
5. **Unclear API**: The current API mixes configuration, contracts, and LLM interactions
6. **Limited Response Formats**: No clear support for structured/formatted responses

## Code Smells Analysis

### High Priority Issues
1. **God Object**: `client.rs` (463 lines) handles too many responsibilities:
   - HTTP communication
   - Message formatting
   - Response parsing
   - Configuration management
   - Both Ollama and OpenAI logic

2. **Feature Envy**: `tools.rs` heavily depends on contract internals:
   - Knows too much about contract ABI encoding
   - Mixes LLM concerns with blockchain concerns
   - Complex tool execution logic that belongs elsewhere
   - Should still support other basic tools that are not blockchain-specific

3. **Duplicate Code**:
   - `sol_interfaces.rs` assumes `TransactionPayload`, kill
   - Test setup code repeated across test modules
   - Similar HTTP request patterns in multiple places

4. **Leaky Abstractions**:
   - `LlmResponse` enum exposes `Transaction` type at top level
   - Contract details leak into LLM client interface
   - Configuration mixes LLM settings with application logic

5. **Unclear Dependencies**:
   - Circular knowledge between contracts, tools, and client
   - Config module knows about contracts AND LLM details
   - Error types not properly scoped to their domains

## Refactor Goals
- **Single Responsibility**: Separate LLM interaction from contract encoding
- **Open Source Only**: Support only Ollama (and compatible) models
- **Simple API**: Clear, intuitive methods for common operations
- **Structured Responses**: Built-in support for JSON/structured outputs
- **Better Testing**: Integration tests that work with local models

## Proposed Structure

### 1. Core Modules

```
src/
├── lib.rs           # Public API exports
├── client.rs        # LLM client (Ollama only)
├── response.rs      # Response types and formatting
├── prompt.rs        # Prompt building utilities
├── error.rs         # Simplified error types
└── tests/           # Integration tests
```

### 2. Remove/Simplify

- **DELETE**: `sol_interfaces.rs` - Use alloy types directly
- **SIMPLIFY**: `config.rs` - Split into LLM config only
- **SIMPLIFY**: `contracts.rs` - Move to separate package or make optional feature
- **SIMPLIFY**: `encoding.rs` - Move to contracts package if kept

### 3. New API Design

```rust
// Simple client initialization
let client = LlmClient::new("llama3.2")
    .with_temperature(0.7)
    .with_max_tokens(500);

// Text completion
let response = client.complete("Explain smart contracts").await?;

// Structured response
#[derive(Deserialize)]
struct Analysis {
    sentiment: String,
    score: f32,
}
let analysis: Analysis = client.complete_structured::<Analysis>(
    "Analyze: The market is looking bullish today"
).await?;

// Chat with context
let chat = client.chat()
    .system("You are a helpful assistant")
    .user("What is Ethereum?")
    .complete().await?;

// Function calling (simplified)
let function = Function::new("get_price")
    .param("symbol", "string", "The token symbol")
    .build();

let response = client.chat()
    .with_function(function)
    .user("What's the price of ETH?")
    .complete().await?;
```

### 4. Immediate Actions (Quick Wins)

These can be done immediately without breaking changes:

#### Day 1 Actions
1. **Delete `sol_interfaces.rs`** - Use alloy types directly
   ```rust
   // Replace TransactionPayload with alloy types
   use alloy_rpc_types::TransactionRequest;
   ```

2. **Remove OpenAI code from `client.rs`**
   - Delete lines related to OpenAI API calls
   - Remove OpenAI-specific response parsing
   - Clean up configuration options

3. **Simplify error types** in `errors.rs`
   - Combine similar error variants
   - Remove unused error types
   - Use `thiserror` more effectively

#### Day 2 Actions
4. **Extract contract logic** from main package
   - Move `contracts.rs` and `encoding.rs` to `contract_utils` module
   - Make it an optional feature: `features = ["contracts"]`

5. **Simplify `Message` struct**
   - Remove tool-specific fields
   - Focus on role and content only
   - Add builder methods for convenience

6. **Create focused test utilities**
   - Single test setup function
   - Mock Ollama responses for unit tests
   - Separate integration test module

### 5. Implementation Phases

#### Phase 1: Core Refactor (Priority)
- [ ] Create new `client.rs` with Ollama-only support
- [ ] Implement `response.rs` for structured responses
- [ ] Create `prompt.rs` for prompt building
- [ ] Simplify `error.rs` to essential errors only
- [ ] Remove OpenAI support completely

#### Phase 2: Clean Separation (Priority)
- [ ] Extract contract-related code to separate module
- [ ] Simplify configuration to LLM-only concerns

#### Phase 3: Enhanced Features
- [ ] Add structured response support with JSON schema
- [ ] Implement simple function calling interface
- [ ] Add response streaming support (if needed)
- [ ] Create prompt templates system

#### Phase 4: Testing & Documentation
- [ ] Write integration tests using local Ollama
- [ ] Add comprehensive examples
- [ ] Document all public APIs
- [ ] Create usage guide for WAVS components

## Migration Guide

### Before:
```rust
let config = Config::from_json(json_str)?;
let client = LLMClient::from_json(json_str)?;
let response = client.chat_completion(messages).await?;
```

### After:
```rust
let client = LlmClient::new("llama3.2");
let response = client.complete("Your prompt").await?;
```

## Success Metrics
- [ ] API surface reduced by >50%
- [ ] All tests pass with local Ollama
- [ ] Clear separation between LLM and contract concerns
- [ ] Documentation covers 100% of public API
- [ ] Examples for common use cases

## Non-Goals
- WebAssembly streaming (not needed for current use cases)
- Multiple LLM provider support (focusing on Ollama only)
- Complex tool orchestration (keep it simple)
- Conversation management (let users handle this)

## Timeline Estimate
- Phase 1: 2-3 days
- Phase 2: 1-2 days
- Phase 3: 2-3 days
- Phase 4: 2-3 days

Total: ~8-11 days for complete refactor

## Notes
- Prioritize backward compatibility where reasonable
- Keep the wasm folder code as reference during refactor
- Consider creating a `wavs-llm-contracts` package for contract-specific features
- Ensure all changes work within WASI/WAVS constraints

## Critical Path

### Must Have (for MVP)
1. Clean Ollama-only client
2. Text completion and chat methods
3. Basic error handling
4. Minimal configuration

### Nice to Have
1. Structured responses
2. Function calling
3. Prompt templates
4. Response streaming

### Won't Have (in this iteration)
1. Multi-provider support
2. Complex tool orchestration
3. Conversation persistence
4. Token counting/management

## Example: Simplified Client After Refactor

```rust
// src/client.rs (simplified)
pub struct LlmClient {
    model: String,
    api_url: String,
    temperature: f32,
    max_tokens: Option<u32>,
}

impl LlmClient {
    pub fn new(model: impl Into<String>) -> Self {
        Self {
            model: model.into(),
            api_url: "http://localhost:11434".into(),
            temperature: 0.7,
            max_tokens: None,
        }
    }

    pub async fn complete(&self, prompt: &str) -> Result<String, LlmError> {
        // Simple Ollama API call
    }

    pub async fn complete_json<T: DeserializeOwned>(&self, prompt: &str) -> Result<T, LlmError> {
        // Structured response with JSON parsing
    }
}
```

This focused approach removes 70% of the current complexity while maintaining core functionality.
