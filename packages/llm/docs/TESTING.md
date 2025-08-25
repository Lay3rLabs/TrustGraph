# Testing Guide for wavs-llm Package

## Overview

The `wavs-llm` package is a WASI-compatible library designed to work with Ollama LLM API. Since this is a WASM/WASI component library, testing requires special consideration.

## Test Categories

### 1. Unit Tests

Unit tests are standard Rust tests that don't require external dependencies or network access.

**Run unit tests:**
```bash
cd packages/llm
cargo test
```

These tests cover:
- Configuration parsing and building
- Message construction
- Error handling
- Encoding/decoding functions
- Tool definitions and contract parsing

### 2. Integration Tests

Integration tests require Ollama to be running and are designed to work in a WASI environment.

**Important:** Integration tests use the WASI HTTP client (`wstd::http`) which requires a WASI runtime. They will NOT work with native `cargo test`.

#### Why Integration Tests Don't Work Natively

The `wavs-llm` package uses `wstd::http::Client` for HTTP requests, which is a WASI-specific implementation. When running `cargo test` natively:
- The WASI HTTP client attempts to use WASI system calls
- These system calls are not available in native environments
- This causes a panic/abort (SIGABRT) when the tests run

#### Running Integration Tests in WASI Environment

To properly test Ollama integration:

1. **Ensure Ollama is running:**
   ```bash
   ollama serve
   ollama pull llama2  # or your preferred model
   ```

2. **Build the component for testing:**
   ```bash
   cargo component build --features integration-tests
   ```

3. **Create a test harness component** that imports this library and runs the tests

4. **Run with a WASI runtime** like wasmtime:
   ```bash
   wasmtime run --env WAVS_ENV_OLLAMA_API_URL=http://localhost:11434 your-test-component.wasm
   ```

## Testing Architecture

### Library vs Component

`wavs-llm` is a **library package**, not a standalone component. This means:
- It doesn't have a `run` function export
- It's meant to be imported by other WASI components
- `cargo component test` won't work directly

### Test Environment Variables

The following environment variables affect testing:

- `WAVS_ENV_OLLAMA_API_URL`: Ollama API endpoint (default: `http://localhost:11434`)

### Mock Testing Strategy

For development without Ollama, consider:

1. **Create mock responses** in your component tests
2. **Use dependency injection** to swap the HTTP client in tests
3. **Test against recorded responses** from actual Ollama calls

## Common Issues and Solutions

### Issue: "failed to decode world from module"

**Cause:** Trying to use `cargo component test` on a library package.

**Solution:** Use `cargo test` for unit tests, or create a test harness component for integration tests.

### Issue: "process abort signal (SIGABRT)"

**Cause:** Running WASI-dependent integration tests in a native environment.

**Solution:** Either:
- Skip integration tests: `cargo test`
- Run in WASI environment (see above)
- Create native integration tests with a different HTTP client (for development only)

### Issue: "Ollama not responding"

**Cause:** Ollama server not running or wrong URL.

**Solution:**
```bash
# Start Ollama
ollama serve

# Verify it's running
curl http://localhost:11434/api/tags
```

## Development Testing Workflow

### 1. During Development

Focus on unit tests that don't require external dependencies:
```bash
cargo test --lib
```

### 2. Before Committing

Run all unit tests and check compilation:
```bash
cargo test
cargo build --features integration-tests
```

### 3. For Full Integration Testing

Use a proper WASI environment or create a test component that imports this library.

## Example Test Component

To create a test component for integration testing:

```rust
// components/llm-test/src/lib.rs
use wavs_llm::client::{LLMClient, Message};

wit_bindgen::generate!({ generate_all });

struct Component;

impl Guest for Component {
    fn run() -> Result<(), String> {
        // Run integration tests here
        let client = LLMClient::new("llama2".to_string());
        let messages = vec![
            Message::new_user("Test message".to_string())
        ];
        
        match client.chat_completion(messages, None) {
            Ok(_) => println!("Test passed!"),
            Err(e) => return Err(format!("Test failed: {:?}", e)),
        }
        
        Ok(())
    }
}

export!(Component);
```

Then build and run:
```bash
cd components/llm-test
cargo component build
wasmtime run target/wasm32-wasip1/release/llm_test.wasm
```

## Continuous Integration

For CI/CD pipelines:

1. **Unit tests only:** Safe to run anywhere
   ```yaml
   - run: cargo test --lib
   ```

2. **Full testing:** Requires Ollama service
   ```yaml
   services:
     ollama:
       image: ollama/ollama
   steps:
     - run: cargo test --lib  # Unit tests
     # Integration tests would require WASI runtime setup
   ```

## Summary

- **Unit tests:** Work everywhere, use `cargo test`
- **Integration tests:** Require WASI runtime + Ollama
- **Library package:** Cannot use `cargo component test` directly
- **Best practice:** Focus on unit tests, use integration tests in proper WASI environment