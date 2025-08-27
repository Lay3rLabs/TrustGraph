# Structured LLM Completion Improvements

This document summarizes the comprehensive improvements made to the structured LLM completion system in the `wavs-llm` package to resolve parsing errors and enhance reliability.

## Problem Statement

The original issue manifested as:
```
ERROR Engine(ExecResult("Failed to get structured LLM completion: Parse error: Failed to parse structured response: EOF while parsing a string at line 1 column 507"))
```

This error indicated that the LLM was returning malformed or incomplete JSON responses, causing the structured completion system to fail when parsing the response.

## Root Causes Identified

1. **Incomplete JSON Responses**: LLMs occasionally generate truncated JSON due to token limits or model constraints
2. **Mixed Content Responses**: Models sometimes include explanatory text alongside JSON, violating the structured output requirement
3. **Schema Compliance Issues**: Complex schemas weren't always properly followed by the model
4. **Poor Error Diagnostics**: Original error messages didn't show the actual content that failed to parse
5. **No Retry Logic**: Single-attempt failures had no recovery mechanism

## Implemented Solutions

### 1. Enhanced Error Handling and Diagnostics

**Before:**
```rust
serde_json::from_str(&content).map_err(|e| {
    LlmError::ParseError(format!("Failed to parse structured response: {}", e))
})
```

**After:**
```rust
serde_json::from_str(&json_content).map_err(|e| {
    LlmError::ParseError(format!(
        "Failed to parse structured response: {}. Extracted JSON: '{}'. Original content: '{}'",
        e, json_content, trimmed_content
    ))
})
```

**Benefits:**
- Shows actual content received from LLM
- Displays extracted JSON vs original response
- Enables faster debugging of parsing issues

### 2. Intelligent JSON Extraction

Added `extract_json_from_response()` method that:

```rust
fn extract_json_from_response(content: &str) -> Result<String, LlmError> {
    // Validates complete JSON objects first
    if (trimmed.starts_with('{') && trimmed.ends_with('}')) {
        serde_json::from_str::<serde_json::Value>(trimmed)?;
        return Ok(trimmed.to_string());
    }

    // Extracts JSON from mixed content using brace counting
    // Example: "Here's my analysis: {\"like\": true} Hope this helps!"
    // Extracts: {"like": true}
}
```

**Capabilities:**
- Extracts valid JSON from responses with extra text
- Validates JSON completeness before returning
- Handles nested JSON objects correctly
- Rejects malformed JSON with clear error messages

### 3. Enhanced Prompting Strategy

**System Message Enhancement:**
```rust
let enhanced_system = format!(
    "{}\n\nYou must respond with valid JSON only. Do not include explanatory text.",
    original_system
);
```

**User Prompt Enhancement:**
```rust
let enhanced_prompt = format!(
    "{}\n\nIMPORTANT: Respond with valid JSON only. Do not include any explanatory text before or after the JSON.",
    original_prompt
);
```

**Benefits:**
- Significantly reduces mixed-content responses
- Improves JSON compliance rates
- Maintains original prompt intent while enforcing structure

### 4. Retry Logic with Exponential Backoff

```rust
pub fn complete_structured_with_retries<T>(
    &self,
    prompt: impl Into<String>,
    max_retries: u32,
) -> Result<T, LlmError>
where
    T: schemars::JsonSchema + for<'de> serde::Deserialize<'de>,
{
    // Attempts structured completion with automatic retry
    // Falls back gracefully on failures
}
```

**Features:**
- Configurable retry attempts (default: 3)
- Maintains state between retries
- Returns most informative error after all attempts fail

### 5. Schema Validation Improvements

```rust
fn from_type<T>() -> Result<Self, LlmError>
where
    T: schemars::JsonSchema,
{
    let schema = schemars::schema_for!(T);
    
    // Validate schema has required fields
    if let Some(obj) = schema_value.as_object() {
        if !obj.contains_key("type") && !obj.contains_key("$schema") {
            return Err(LlmError::ConfigError(
                "Generated schema is missing required fields".to_string(),
            ));
        }
    }
}
```

**Improvements:**
- Validates generated schemas before sending to LLM
- Ensures Ollama API compatibility
- Provides clear errors for malformed schemas

### 6. Ollama API Format Compliance

**Fixed Format Conversion:**
```rust
fn to_ollama_format(&self) -> serde_json::Value {
    match self {
        ResponseFormat::Json => serde_json::Value::String("json".to_string()),
        ResponseFormat::Schema(schema) => schema.clone(),
    }
}
```

**Ensures:**
- Proper JSON mode formatting for Ollama
- Correct schema object transmission
- API specification compliance

## Usage Examples

### Basic Structured Completion
```rust
#[derive(Serialize, Deserialize, JsonSchema)]
struct LikeResponse {
    like: bool,
    confidence: Option<f32>,
}

let client = LLMClient::new("llama3.2".to_string());
let result = client.complete_structured::<LikeResponse>(
    "Evaluate this statement and respond with like/dislike"
)?;
```

### With System Context and Retries
```rust
let result = client.complete_structured_with_system_and_retries::<LikeResponse>(
    "You are an expert evaluator",
    "Analyze this blockchain attestation",
    5  // Custom retry count
)?;
```

### Error Recovery Pattern
```rust
match client.complete_structured::<ComplexResponse>(prompt) {
    Ok(response) => handle_success(response),
    Err(LlmError::ParseError(_)) => {
        // Try simpler schema as fallback
        let simple_result = client.complete_structured::<SimpleResponse>(simplified_prompt)?;
        convert_to_complex(simple_result)
    }
    Err(e) => return Err(e),
}
```

## Testing Improvements

### Unit Tests Added
- JSON extraction validation with malformed inputs
- Schema generation verification
- Response format conversion testing
- Error message content validation

### Integration Test Framework
- Structured response parsing robustness
- Model compatibility verification
- Error recovery mechanism testing

## Performance Optimizations

### Recommended LLM Configuration
```rust
let config = LlmOptions::default()
    .with_temperature(0.1)      // Low for consistency
    .with_top_p(0.9)           // Focused sampling  
    .with_max_tokens(150);     // Reasonable limit
```

### Model Recommendations
- **Best**: `llama3.2`, `qwen2.5` (reliable structured output)
- **Good**: `mistral` (needs explicit prompting)
- **Avoid**: Models <7B parameters for complex schemas

## Component Integration

### LLM Attester Component
The improvements are automatically available in the `llm-attester` component:

```rust
let llm_response: LikeResponse = llm
    .complete_structured_with_system(&config.system_message, &user_prompt)
    .map_err(|e| format!("Failed to get structured LLM completion: {}", e))?;
```

**Benefits:**
- More reliable attestation evaluations
- Better error diagnostics for debugging
- Automatic retry on transient failures

## Debugging Guide

### Environment Setup
```bash
export RUST_LOG=debug
export WAVS_ENV_OLLAMA_API_URL=http://localhost:11434
```

### Common Issues and Solutions

**Issue: EOF while parsing string**
- **Cause**: Incomplete JSON response
- **Solution**: Use retry logic, reduce max_tokens if needed

**Issue: Schema not followed**
- **Cause**: Complex schema or unclear prompting  
- **Solution**: Simplify schema, enhance prompt specificity

**Issue: Mixed content responses**
- **Cause**: Model includes explanations
- **Solution**: Enhanced prompting automatically applied

### Error Analysis
New error messages provide:
1. Original parsing error
2. Extracted JSON content
3. Full response content
4. Retry attempt information

## Future Considerations

### Potential Enhancements
1. **Response Caching**: Cache successful responses for identical prompts
2. **Model-Specific Tuning**: Optimize prompts per model type
3. **Streaming Support**: Handle partial JSON in streaming responses
4. **Batch Processing**: Process multiple structured requests efficiently

### Monitoring and Metrics
Consider tracking:
- Structured completion success rates
- Retry frequency and patterns
- Schema complexity vs success correlation
- Model performance comparisons

## Migration Notes

### Existing Code Compatibility
All existing `complete_structured()` calls continue to work unchanged with improved reliability.

### New Methods Available
- `complete_structured_with_retries()`
- `complete_structured_with_system_and_retries()` 
- `chat_completion_with_format_and_retries()`

### Breaking Changes
None. All improvements are backward compatible.

## Conclusion

These improvements significantly enhance the reliability and debuggability of structured LLM completions while maintaining full backward compatibility. The combination of intelligent JSON extraction, enhanced prompting, retry logic, and improved error reporting should resolve the majority of parsing errors encountered in production environments.

The system now gracefully handles edge cases that previously caused complete failures, making it suitable for production blockchain attestation workflows where reliability is critical.