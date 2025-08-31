# Migration Guide: wavs-llm Simplified API

## Overview

The `wavs-llm` package has been refactored to provide a simpler, more intuitive API while maintaining all existing functionality. The new API reduces the number of methods from 13+ to just 2 main methods, using a fluent builder pattern for configuration.

## Key Changes

### Core API Simplification

**Before:** 13+ different methods with overlapping functionality
```rust
client.complete(prompt)
client.complete_with_system(system, prompt)
client.complete_structured::<T>(prompt)
client.complete_structured_with_retries::<T>(prompt, retries)
client.chat_completion(messages, tools)
client.chat_completion_with_format(messages, tools, format)
// ... and many more
```

**After:** Just 2 main methods with builder pattern
```rust
client.chat(messages)           // For text responses
client.chat_structured::<T>(messages)  // For typed responses
```

## Migration Examples

### Simple Text Completion

**Old API:**
```rust
let response = client.complete("What is 2+2?")?;
```

**New API:**
```rust
let response = client.chat("What is 2+2?").text()?;
```

### Completion with System Context

**Old API:**
```rust
let response = client.complete_with_system(
    "You are a math tutor",
    "What is 2+2?"
)?;
```

**New API:**
```rust
let response = client
    .chat(vec![
        Message::system("You are a math tutor"),
        Message::user("What is 2+2?")
    ])
    .text()?;
```

### Structured Responses

**Old API:**
```rust
#[derive(Deserialize, JsonSchema)]
struct Analysis {
    sentiment: String,
    confidence: f32,
}

let result = client.complete_structured::<Analysis>(prompt)?;
```

**New API:**
```rust
let result = client
    .chat_structured::<Analysis>(prompt)
    .send()?;
```

### Structured with Retries

**Old API:**
```rust
let result = client.complete_structured_with_retries::<T>(prompt, 5)?;
```

**New API:**
```rust
let result = client
    .chat_structured::<T>(prompt)
    .with_retries(5)
    .send()?;
```

### Multi-turn Conversations

**Old API:**
```rust
let messages = vec![
    Message::new_system("You are helpful"),
    Message::new_user("Hello"),
    // ...
];
let response = client.chat_completion(messages, None)?;
```

**New API:**
```rust
let messages = vec![
    Message::system("You are helpful"),
    Message::user("Hello"),
    // ...
];
let response = client.chat(messages).send()?;
```

### Tool/Function Calling

**Old API:**
```rust
let response = client.chat_completion(messages, Some(tools))?;
```

**New API:**
```rust
let response = client
    .chat(messages)
    .with_tools(tools)
    .send()?;
```

### Smart Contract Integration

**Old API:**
```rust
let tools = Tools::tools_from_contract(&contract);
let response = client.chat_completion(messages, Some(tools))?;
```

**New API:**
```rust
let response = client
    .chat(messages)
    .with_contract_tools(&[contract])
    .send()?;
```

### Full Configuration

**Old API:**
```rust
let response = client.process_with_config(prompt, &config)?;
```

**New API:**
```rust
let response = client
    .chat(prompt)
    .with_config(&config)
    .text()?;
```

### Automatic Tool Execution

**New API Only** - This is a new feature:
```rust
let final_result = client
    .chat("What's the weather and send 1 ETH to Alice")
    .with_tools(tools)
    .execute_tools()?;  // Automatically handles tool calls
```

## Message Builder Changes

### Creating Messages

**Old API:**
```rust
Message::new_user("Hello")
Message::new_system("You are helpful")
Message::new_tool_result(id, name, content)
```

**New API:**
```rust
Message::user("Hello")
Message::system("You are helpful")
Message::assistant("Hi there")
Message::tool_result(id, name, content)
```

## Complete Migration Table

| Old Method | New Equivalent |
|------------|----------------|
| `complete(prompt)` | `chat(prompt).text()` |
| `complete_with_system(sys, prompt)` | `chat(vec![Message::system(sys), Message::user(prompt)]).text()` |
| `complete_structured::<T>(prompt)` | `chat_structured::<T>(prompt).send()` |
| `complete_structured_with_retries::<T>(prompt, n)` | `chat_structured::<T>(prompt).with_retries(n).send()` |
| `complete_structured_with_system::<T>(sys, prompt)` | `chat_structured::<T>(vec![Message::system(sys), Message::user(prompt)]).send()` |
| `chat_completion(msgs, tools)` | `chat(msgs).with_tools(tools).send()` |
| `chat_completion_text(msgs)` | `chat(msgs).text()` |
| `chat_completion_with_format(msgs, tools, fmt)` | Use `chat_structured` for structured output |
| `process_prompt(prompt, ctx, imgs)` | Not needed - use `chat` with appropriate messages |
| `process_with_config(prompt, cfg)` | `chat(prompt).with_config(cfg).text()` |

## Convenience Features

### Automatic Message Conversion

The new API automatically converts strings to user messages:
```rust
// These are equivalent:
client.chat("Hello")
client.chat(vec![Message::user("Hello")])
client.chat(Message::user("Hello"))
```

### Method Chaining

All configuration is done through method chaining:
```rust
let response = client
    .chat("Analyze this")
    .with_tools(tools)
    .with_retries(3)
    .with_config(&config)
    .text()?;
```

### Response Methods

Two ways to get responses:
- `.send()` - Returns the full `Message` object (for tool calls, etc.)
- `.text()` - Returns just the text content as `String`

## Benefits of the New API

1. **Simpler Mental Model**: Everything is a chat, whether it's one message or many
2. **Discoverable**: IDE autocomplete shows available options
3. **Type-Safe**: Structured responses are strongly typed
4. **Flexible**: Progressive disclosure - simple things are simple, complex things are possible
5. **Consistent**: Same pattern for all interactions
6. **Future-Proof**: Easy to add new options without breaking changes

## Getting Help

If you encounter any issues during migration:
1. Check the examples in `examples/` directory
2. Run tests with `cargo test` to verify functionality
3. Use `cargo check` to catch type errors early

The refactored API maintains full backward compatibility at the functionality level - everything you could do before, you can still do, just with a cleaner interface.