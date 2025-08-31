# LLM Client API Refactor Plan

## Current Problem

The existing LLM client API in `packages/llm/src/client.rs` has become overly complex with 13+ different methods that have overlapping functionality:

- `chat_completion()`
- `chat_completion_with_format()`
- `chat_completion_with_format_and_retries()`
- `complete()`
- `complete_with_system()`
- `complete_structured()`
- `complete_structured_with_retries()`
- `complete_structured_with_system()`
- `complete_structured_with_system_and_retries()`
- `chat_completion_text()`
- `chat_completion_structured()`
- `process_prompt()`
- `process_with_config()`

This creates confusion for developers and makes the API difficult to learn and use effectively.

## Design Principles for New API

1. **Conceptual Consistency**: All LLM interactions are fundamentally "chat" - you send messages, you get a message back
2. **Progressive Disclosure**: Simple things should be simple, complex things should be possible
3. **No Artificial Distinctions**: The difference between "completion" and "chat" is just whether you have 1 message or multiple
4. **Type Safety**: Structured responses should be type-safe and automatic
5. **Fluent Interface**: Method chaining for configuration feels natural
6. **Sensible Defaults**: Common use cases require minimal configuration

## New Simplified API Design

### Core Methods (Only 2!)

```rust
impl LLMClient {
    /// Chat - handles everything from simple completion to complex conversations
    pub fn chat(&self, messages: impl Into<Vec<Message>>) -> ChatRequest {
        ChatRequest::new(self, messages.into())
    }

    /// Chat with structured/typed response
    pub fn chat_structured<T>(&self, messages: impl Into<Vec<Message>>) -> StructuredChatRequest<T>
    where T: JsonSchema + DeserializeOwned {
        StructuredChatRequest::new(self, messages.into())
    }
}
```

### Request Builders

```rust
pub struct ChatRequest<'a> {
    client: &'a LLMClient,
    messages: Vec<Message>,
    tools: Option<Vec<Tool>>,
    retries: u32,
}

impl<'a> ChatRequest<'a> {
    pub fn with_tools(mut self, tools: Vec<Tool>) -> Self { ... }
    pub fn with_retries(mut self, retries: u32) -> Self { ... }

    /// Return full Message (for tool calls, etc.)
    pub fn send(self) -> Result<Message, LlmError> { ... }

    /// Convenience method for just getting text content
    pub fn text(self) -> Result<String, LlmError> { ... }
}

pub struct StructuredChatRequest<'a, T> { ... }
// Similar interface but returns parsed T
```

### Message Creation Helpers

```rust
impl Message {
    pub fn user(content: impl Into<String>) -> Self { ... }
    pub fn system(content: impl Into<String>) -> Self { ... }
    pub fn assistant(content: impl Into<String>) -> Self { ... }
}
```

## Usage Examples

### Simple Text Completion
```rust
// Single question - simplest case
let answer = client
    .chat("What is 2+2?")
    .text()?;

// With system context
let answer = client
    .chat(vec![
        Message::system("You are a math tutor"),
        Message::user("What is 2+2?")
    ])
    .text()?;

// With retries
let answer = client
    .chat("What is 2+2?")
    .with_retries(5)
    .text()?;
```

### Multi-turn Conversation
```rust
let conversation = vec![
    Message::system("You are a helpful assistant"),
    Message::user("Hello!"),
    Message::assistant("Hi! How can I help you?"),
    Message::user("What's the weather like?"),
];

let response = client
    .chat(conversation)
    .text()?;
```

### Structured Responses
```rust
#[derive(Deserialize, JsonSchema)]
struct Analysis {
    sentiment: String,
    confidence: f32,
    keywords: Vec<String>,
}

let analysis = client
    .chat_structured::<Analysis>("Analyze this text: 'I love this product!'")
    .send()?;

println!("Sentiment: {}, Confidence: {}", analysis.sentiment, analysis.confidence);
```

### Function/Tool Calling
```rust
let response = client
    .chat("What's the weather in San Francisco?")
    .with_tools(weather_tools)
    .send()?;

// Handle tool calls in the response
if let Some(tool_calls) = response.tool_calls {
    // Process tool calls...
}
```

## Tools and Smart Contract Integration

The refactor must preserve and enhance the existing sophisticated tools system that includes:

1. **Automatic Tool Generation from Smart Contract ABIs** (`Tools::tools_from_contract()`)
2. **Custom Tool Handlers** via the `CustomToolHandler` trait
3. **Built-in Tool Execution** for ETH transfers and contract calls
4. **Transaction Generation** from tool calls

### Enhanced Builder API for Tools

The new API will extend the builder pattern to support the existing tools ecosystem:

```rust
impl<'a> ChatRequest<'a> {
    /// Add individual tools
    pub fn with_tools(mut self, tools: Vec<Tool>) -> Self { ... }

    /// Add tools from smart contracts (auto-generated from ABIs)
    pub fn with_contract_tools(mut self, contracts: &[Contract]) -> Self {
        let mut all_tools = self.tools.unwrap_or_default();
        for contract in contracts {
            all_tools.extend(Tools::tools_from_contract(contract));
        }
        self.tools = Some(all_tools);
        self
    }

    /// Add a full config (automatically includes contract tools)
    pub fn with_config(mut self, config: &Config) -> Self {
        self = self.with_contract_tools(&config.contracts);
        // Could also add configured messages, etc.
        self
    }

    /// Add custom tool handlers for execution
    pub fn with_custom_handlers(mut self, handlers: Vec<Box<dyn CustomToolHandler>>) -> Self { ... }

    /// Execute tool calls automatically and return final response
    pub fn execute_tools(self) -> Result<String, LlmError> { ... }
}
```

### Enhanced Usage Examples

```rust
// Smart contract integration - auto-generate tools from ABIs
let contract_tools = Tools::tools_from_contract(&erc20_contract);
let response = client
    .chat("Transfer 100 tokens to Alice")
    .with_tools(contract_tools)
    .send()?;

// Multiple contracts
let response = client
    .chat("Check my balance and transfer some tokens")
    .with_contract_tools(&[erc20_contract, governance_contract])
    .send()?;

// Full config integration (existing functionality)
let response = client
    .chat("What should we do with the treasury?")
    .with_config(&dao_config) // Automatically includes all configured contracts as tools
    .send()?;

// Tool execution with custom handlers
struct WeatherHandler;
impl CustomToolHandler for WeatherHandler { ... }

let final_result = client
    .chat("What's the weather in SF and send 1 ETH to Alice?")
    .with_tools(vec![Tools::send_eth_tool(), weather_tool])
    .with_custom_handlers(vec![Box::new(WeatherHandler)])
    .execute_tools()?; // Automatically handles tool calls and returns final result

// Advanced: Structured response with tools
#[derive(Deserialize, JsonSchema)]
struct TransactionPlan {
    actions: Vec<String>,
    total_cost: String,
    risk_level: String,
}

let plan = client
    .chat_structured::<TransactionPlan>("Create a plan to diversify our treasury")
    .with_config(&dao_config)
    .send()?;
```

### Preserving Existing Tool Functionality

All existing tool capabilities are preserved:

1. **Contract ABI Parsing**: `Tools::tools_from_contract()` continues to work unchanged
2. **Tool Execution**: `Tools::execute_tool_call()` and `Tools::process_tool_calls()` remain functional
3. **Custom Handlers**: The `CustomToolHandler` trait system is fully supported
4. **Transaction Generation**: Tool calls still generate `Transaction` objects for execution
5. **Built-in Tools**: ETH transfers, contract calls, etc. work as before

### Implementation Notes

- The existing `tools.rs` and `contracts.rs` modules require minimal changes
- Tool execution logic can be extracted into the builder for the `execute_tools()` convenience method
- All existing tool generation and validation code is reused
- The `with_config()` method provides seamless migration from `process_with_config()`

### Migration Path for Tools

| Old Method | New Equivalent |
|------------|----------------|
| `process_with_config(prompt, config)` | `chat(prompt).with_config(config).text()` |
| `chat_completion(msgs, Some(tools))` | `chat(msgs).with_tools(tools).send()` |
| Manual tool processing | `chat(prompt).with_tools(tools).execute_tools()` |

## Implementation Strategy

1. Create new request builder structs (`ChatRequest`, `StructuredChatRequest`)
2. Add new `chat()` and `chat_structured()` methods to `LLMClient`
3. **Integrate existing tools system**: Add `with_tools()`, `with_config()`, etc. to builders
4. Implement builders by calling existing internal methods
5. **Preserve tool execution**: Integrate `Tools::process_tool_calls()` into new API
6. Add comprehensive tests for new API including tool integration
7. Update documentation with new examples
8. No backwards compatibility is needed for the final API. Remove all unnecessary code.

## Migration Guide

| Old Method | New Equivalent |
|------------|----------------|
| `complete("prompt")` | `chat("prompt").text()` |
| `complete_with_system("sys", "prompt")` | `chat(vec![Message::system("sys"), Message::user("prompt")]).text()` |
| `complete_structured::<T>("prompt")` | `chat_structured::<T>("prompt").send()` |
| `chat_completion(messages, None)` | `chat(messages).send()` |
| `chat_completion_text(messages)` | `chat(messages).text()` |
| `chat_completion(messages, Some(tools))` | `chat(messages).with_tools(tools).send()` |
| `process_with_config(prompt, config)` | `chat(prompt).with_config(config).text()` |

## Benefits of New Design

1. **Reduced Complexity**: 2 methods instead of 13+
2. **Conceptual Clarity**: Everything is chat, just with different message counts
3. **Type Safety**: Structured responses are strongly typed
4. **Flexibility**: Handles simple Q&A to complex multi-turn conversations
5. **Discoverability**: Method chaining reveals available options
6. **Maintainability**: Single code path for similar functionality
7. **Future-proof**: Easy to add new options via builder pattern

## Breaking Changes

No backwards compatibility is needed.

## Testing Strategy

1. **Unit Tests**: Test all builder combinations and edge cases
2. **Documentation Tests**: Verify all examples compile and work
