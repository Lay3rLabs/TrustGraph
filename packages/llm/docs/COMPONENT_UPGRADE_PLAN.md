# WAVS Components Upgrade Plan

## Overview

This document outlines the upgrade plan for migrating WAVS components from the old `wavs-llm` API to the new simplified API. Two components need updating:

1. **DAO Agent** (`components/dao-agent/`)
2. **LLM Attester** (`components/llm-attester/`)

## Pre-Upgrade Checklist

- [ ] Ensure all tests pass before starting migration
- [ ] Create a backup branch: `git checkout -b wavs-llm-upgrade-backup`
- [ ] Review the [Migration Guide](./MIGRATION_GUIDE.md)
- [ ] Verify `wavs-llm` package builds successfully with `cargo component build`

## Component 1: DAO Agent

### Current Usage Analysis

The DAO Agent component currently uses:
- `LLMClient::with_config()` - ✅ No change needed
- `process_with_config()` - ❌ Needs migration
- Direct `Message` struct construction - ❌ Needs update
- `LlmResponse` enum - ✅ Preserved for compatibility

### Required Changes

#### File: `components/dao-agent/src/lib.rs`

**Change 1: Update Message Construction (Line 55-63)**

```rust
// OLD CODE:
llm_context.messages.push(Message {
    role: "system".into(),
    content: Some(dao_state),
    tool_calls: None,
    tool_call_id: None,
    name: None,
});

// NEW CODE:
llm_context.messages.push(Message::system(dao_state));
```

**Change 2: Update LLM Client Usage (Line 72-74)**

```rust
// OLD CODE:
let result = llm_client
    .process_with_config(prompt.clone(), &llm_context)
    .map_err(|e| e.to_string())?;

// NEW CODE:
let result = llm_client
    .chat(prompt.clone())
    .with_config(&llm_context)
    .text()
    .map(|text| LlmResponse::Text(text))
    .or_else(|_| {
        // If text fails, try to get the full message for potential transactions
        llm_client
            .chat(prompt.clone())
            .with_config(&llm_context)
            .send()
            .map(|msg| {
                if let Some(content) = msg.content {
                    // Try to parse as transaction
                    if let Ok(tx) = serde_json::from_str::<wavs_llm::contracts::Transaction>(&content) {
                        LlmResponse::Transaction(tx)
                    } else {
                        LlmResponse::Text(content)
                    }
                } else {
                    LlmResponse::Text(String::new())
                }
            })
    })
    .map_err(|e| e.to_string())?;
```

### Testing Steps for DAO Agent

1. Update the imports if needed (should be automatic)
2. Run component-specific tests:
   ```bash
   cd components/dao-agent
   cargo component build
   cargo test
   ```
3. Test with a sample prompt:
   ```bash
   make wasi-exec COMPONENT_FILENAME=dao-agent.wasm INPUT_DATA="What is the treasury balance?"
   ```

## Component 2: LLM Attester

### Current Usage Analysis

The LLM Attester component currently uses:
- `LLMClient::with_config()` - ✅ No change needed
- `complete_structured::<LikeResponse>()` - ❌ Needs migration
- Structured response with `JsonSchema` - ✅ Works with new API

### Required Changes

#### File: `components/llm-attester/src/lib.rs`

**Change 1: Update Structured Completion (Line 105-108)**

```rust
// OLD CODE:
let llm_response = llm
    .complete_structured::<LikeResponse>(&user_prompt)
    .map_err(|e| format!("Failed to get structured LLM completion: {}", e))?;

// NEW CODE:
let llm_response = llm
    .chat_structured::<LikeResponse>(&user_prompt)
    .send()
    .map_err(|e| format!("Failed to get structured LLM completion: {}", e))?;
```

### Testing Steps for LLM Attester

1. Run component-specific tests:
   ```bash
   cd components/llm-attester
   cargo component build
   cargo test
   ```
2. Validate the component with test data:
   ```bash
   make validate-component COMPONENT=llm-attester
   ```
3. Test with sample attestation data:
   ```bash
   make wasi-exec COMPONENT_FILENAME=llm-attester.wasm INPUT_DATA="test-attestation-data"
   ```

## Migration Procedure

### Step 1: Update DAO Agent (Estimated time: 15 minutes)

1. Open `components/dao-agent/src/lib.rs`
2. Apply Change 1 (Message construction)
3. Apply Change 2 (LLM client usage)
4. Run `cargo check` to verify no compilation errors
5. Run `cargo component build`
6. Execute testing steps

### Step 2: Update LLM Attester (Estimated time: 10 minutes)

1. Open `components/llm-attester/src/lib.rs`
2. Apply Change 1 (Structured completion)
3. Run `cargo check` to verify no compilation errors
4. Run `cargo component build`

## Rollback Plan

If issues are encountered:

1. **Immediate Rollback:**
   ```bash
   git stash
   git checkout main
   ```

2. **Partial Rollback:**
   - The old API methods are removed, so if you need to rollback, you'll need to:
     - Revert the wavs-llm package changes
     - Or temporarily implement compatibility wrappers

3. **Emergency Fixes:**
   - If a component partially works, you can add temporary compatibility shims:
   ```rust
   // Temporary compatibility wrapper
   impl LLMClient {
       pub fn process_with_config_compat(&self, prompt: String, config: &Config) -> Result<LlmResponse, LlmError> {
           self.chat(prompt)
               .with_config(config)
               .send()
               .map(|msg| {
                   // Convert Message to LlmResponse
                   // ... conversion logic ...
               })
       }
   }
   ```

## Post-Migration Verification

### Checklist

- [ ] Both components compile without errors
- [ ] All existing unit tests pass
- [ ] Components can be built with `cargo component build`

### Performance Verification

Compare before and after:
1. Build times
2. Component file sizes
3. Execution times for standard prompts

### Documentation Updates

After successful migration:
1. Update component READMEs if they reference the old API
2. Update any example code in the components
3. Add migration notes to component changelogs

## Troubleshooting Guide

### Common Issues and Solutions

**Issue 1: Type mismatch errors**
- Solution: Ensure you're using the new `IntoMessages` trait implementations
- The new API accepts: `&str`, `String`, `Message`, `Vec<Message>`

**Issue 2: Missing structured response**
- Solution: Ensure `.send()` is called after `chat_structured::<T>()`
- For text-only responses, use `.text()` instead

**Issue 3: Tool/contract integration issues**
- Solution: Use `.with_contract_tools(&contracts)` instead of manually creating tools
- Ensure contracts are passed as a slice reference

**Issue 4: Message creation errors**
- Solution: Use the new builder methods: `Message::user()`, `Message::system()`, etc.
- Remove manual struct construction with all fields

**Issue 5: Config integration problems**
- Solution: Use `.with_config(&config)` in the builder chain
- Config now automatically adds system messages and contract tools

## Success Metrics

The migration is considered successful when:
1. ✅ All components compile without warnings
2. ✅ All existing tests pass
3. ✅ Components execute correctly in WASI runtime
4. ✅ No regression in functionality
5. ✅ Code is cleaner and more maintainable


## Support

If you encounter issues during migration:
1. Check the [Migration Guide](./MIGRATION_GUIDE.md)
2. Review the updated examples in `packages/llm/examples/`
3. Run `cargo doc --open` for API documentation
4. Check component logs for detailed error messages
