# Debugging Structured LLM Responses

This guide helps troubleshoot issues with structured LLM responses in the WAVS LLM package.

## Common Issues

### 1. EOF While Parsing String Error

**Symptom:** `Failed to get structured LLM completion: Parse error: Failed to parse structured response: EOF while parsing a string at line 1 column 507`

**Root Causes:**
- LLM returns incomplete JSON (cuts off mid-string)
- Network timeouts during response generation
- Model struggles with complex schema requirements
- Insufficient context length for complete response

**Solutions:**

#### Enhanced Error Handling
The updated client now provides detailed error messages showing both the parsing error and the actual response content:

```rust
// Old error: Generic parsing failure
// New error: Shows actual content received
LlmError::ParseError(format!(
    "Failed to parse structured response: {}. Extracted JSON: '{}'. Original content: '{}'",
    e, json_content, trimmed_content
))
```

#### JSON Extraction
The client now automatically extracts JSON from responses that may contain extra text:

```rust
// Handles responses like:
"Here's my analysis: {\"like\": true, \"confidence\": 0.95} Hope this helps!"
// Extracts: {"like": true, "confidence": 0.95}
```

### 2. Schema Validation Issues

**Symptom:** LLM doesn't follow the provided JSON schema

**Solutions:**

#### Enhanced Prompting
The client now automatically enhances prompts to emphasize JSON-only output:

```rust
let enhanced_prompt = format!(
    "{}\n\nIMPORTANT: Respond with valid JSON only. Do not include any explanatory text before or after the JSON.",
    original_prompt
);
```

#### Schema Validation
Schema generation now includes validation to ensure required fields are present:

```rust
if let Some(obj) = schema_value.as_object() {
    if !obj.contains_key("type") && !obj.contains_key("$schema") {
        return Err(LlmError::ConfigError(
            "Generated schema is missing required fields".to_string(),
        ));
    }
}
```

## Debugging Steps

### 1. Enable Detailed Logging

Set environment variables for debugging:

```bash
export RUST_LOG=debug
export WAVS_ENV_OLLAMA_API_URL=http://localhost:11434
```

### 2. Check Ollama Model Capabilities

Verify your model supports structured output:

```bash
# Test basic JSON mode
curl http://localhost:11434/api/generate -d '{
  "model": "your-model",
  "prompt": "Return {\"test\": true} as JSON",
  "format": "json",
  "stream": false
}'
```

### 3. Test Schema Compliance

Test your schema with a simple example:

```rust
#[derive(Serialize, Deserialize, JsonSchema)]
struct SimpleTest {
    success: bool,
    message: String,
}

// Test with minimal prompt
let result = client.complete_structured::<SimpleTest>(
    "Return a simple success message as JSON"
);
```

### 4. Incremental Complexity

Start with simple schemas and gradually add complexity:

```rust
// Level 1: Basic boolean
#[derive(Serialize, Deserialize, JsonSchema)]
struct Level1 { like: bool }

// Level 2: Add confidence
#[derive(Serialize, Deserialize, JsonSchema)]
struct Level2 { like: bool, confidence: f32 }

// Level 3: Add reasoning
#[derive(Serialize, Deserialize, JsonSchema)]
struct Level3 { like: bool, confidence: f32, reasoning: String }
```

## Best Practices

### 1. Retry Logic

Use the built-in retry functionality:

```rust
// Automatic retries (3 attempts)
let result = client.complete_structured::<MyType>("prompt");

// Custom retry count
let result = client.complete_structured_with_retries::<MyType>("prompt", 5);
```

### 2. Model Selection

Choose models with good structured output support:

- **Recommended:** `llama3.2`, `qwen2.5`, `mistral`
- **Avoid:** Very small models (<7B parameters) for complex schemas

### 3. Schema Design

Keep schemas simple and well-documented:

```rust
#[derive(Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
struct OptimalSchema {
    /// Primary decision (required)
    like: bool,
    
    /// Confidence level between 0.0 and 1.0 (optional with default)
    #[serde(default)]
    confidence: Option<f32>,
    
    /// Brief reasoning (optional)
    #[serde(default)]
    reasoning: Option<String>,
}
```

### 4. Prompt Engineering

Structure prompts for reliable JSON output:

```rust
let system_prompt = "You are a JSON-only response system. Always return valid JSON matching the required schema. Never include explanatory text.";

let user_prompt = format!(
    "Evaluate this statement and respond with JSON only: '{}'
    
    Required format: {{\"like\": boolean, \"confidence\": number}}",
    statement
);
```

## Configuration Tuning

### Ollama Parameters

Optimize for structured output:

```rust
let config = LlmOptions::default()
    .with_temperature(0.1)      // Low temperature for consistency
    .with_top_p(0.9)           // Focused sampling
    .with_max_tokens(150);     // Limit response length
```

### Environment Variables

```bash
# Ollama API endpoint
WAVS_ENV_OLLAMA_API_URL=http://localhost:11434

# Model-specific settings (passed to components)
WAVS_ENV_LLM_MODEL=llama3.2
WAVS_ENV_LLM_TEMPERATURE=0.1
WAVS_ENV_LLM_MAX_TOKENS=150
```

## Testing Structured Responses

### Unit Tests

Test JSON extraction and schema validation:

```rust
#[test]
fn test_my_structured_response() {
    let client = LLMClient::new("llama3.2".to_string());
    
    // Test successful parsing
    let result = client.complete_structured::<MySchema>(
        "Test prompt for my schema"
    );
    assert!(result.is_ok());
    
    // Test specific field values
    let response = result.unwrap();
    assert!(response.like == true || response.like == false);
    if let Some(confidence) = response.confidence {
        assert!(confidence >= 0.0 && confidence <= 1.0);
    }
}
```

### Integration Tests

Test with actual Ollama instance:

```bash
# Start Ollama
ollama serve

# Pull test model
ollama pull llama3.2

# Run integration tests
cargo test --features integration-tests -- --ignored
```

## Troubleshooting Checklist

- [ ] Ollama is running and accessible
- [ ] Model supports structured output
- [ ] Schema is valid and not too complex
- [ ] Prompt emphasizes JSON-only output
- [ ] Temperature is low enough for consistency
- [ ] Max tokens allows complete response
- [ ] Network connection is stable
- [ ] Model has sufficient context length

## Model-Specific Notes

### Llama 3.2
- Excellent structured output support
- Handles complex schemas well
- Recommended temperature: 0.1-0.3

### Mistral
- Good JSON compliance
- May need more explicit prompting
- Works well with retry logic

### Qwen 2.5
- Strong schema adherence
- Fast response generation
- Good for production use

## Performance Optimization

### Caching Strategies
Consider caching structured responses for repeated queries:

```rust
use std::collections::HashMap;

struct CachedLLMClient {
    client: LLMClient,
    cache: HashMap<String, String>,
}

impl CachedLLMClient {
    fn complete_structured_cached<T>(&mut self, prompt: &str) -> Result<T, LlmError> 
    where
        T: schemars::JsonSchema + for<'de> serde::Deserialize<'de>,
    {
        if let Some(cached) = self.cache.get(prompt) {
            return serde_json::from_str(cached).map_err(|e| 
                LlmError::ParseError(format!("Cache parse error: {}", e))
            );
        }
        
        let result = self.client.complete_structured::<T>(prompt)?;
        let json_str = serde_json::to_string(&result)?;
        self.cache.insert(prompt.to_string(), json_str);
        Ok(result)
    }
}
```

### Batch Processing
For multiple evaluations, consider batching:

```rust
fn batch_evaluate_statements(
    client: &LLMClient,
    statements: Vec<String>
) -> Result<Vec<LikeResponse>, LlmError> {
    let batch_prompt = format!(
        "Evaluate these statements and return a JSON array: {:?}
        Format: [{{\"like\": boolean, \"confidence\": number}}, ...]",
        statements
    );
    
    client.complete_structured::<Vec<LikeResponse>>(batch_prompt)
}
```

This debugging guide should help you identify and resolve structured LLM response issues quickly and effectively.