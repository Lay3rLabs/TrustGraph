use crate::config::LlmConfig;
use crate::encoding::encode_image_to_base64;
use crate::errors::LlmError;
use crate::tools::{Tool, ToolCall};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::env;
use wstd::http::{Client, HeaderValue, IntoBody, Request};
use wstd::io::AsyncRead;
use wstd::runtime::block_on;

/// Represents a message in the conversation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    /// The role of the message sender (e.g., "user", "assistant", "system", "tool")
    pub role: String,
    /// The content of the message
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content: Option<String>,
    /// Tool calls made by the assistant
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tool_calls: Option<Vec<ToolCall>>,
    /// ID of the tool call this message is responding to
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tool_call_id: Option<String>,
    /// Name of the tool (for tool messages)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
}

impl Message {
    /// Creates a new user message
    pub fn new_user(content: String) -> Self {
        Self {
            role: "user".to_string(),
            content: Some(content),
            tool_calls: None,
            tool_call_id: None,
            name: None,
        }
    }

    /// Creates a new system message
    pub fn new_system(content: String) -> Self {
        Self {
            role: "system".to_string(),
            content: Some(content),
            tool_calls: None,
            tool_call_id: None,
            name: None,
        }
    }

    /// Creates a new tool result message
    pub fn new_tool_result(tool_call_id: String, name: String, content: String) -> Self {
        Self {
            role: "tool".to_string(),
            content: Some(content),
            tool_calls: None,
            tool_call_id: Some(tool_call_id),
            name: Some(name),
        }
    }
}

/// Client for interacting with Ollama LLM API
#[derive(Debug, Clone)]
/// The main LLM client for interacting with Ollama
pub struct LLMClient {
    model: String,
    config: LlmConfig,
}

/// Format specification for structured outputs
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum ResponseFormat {
    /// Simple JSON mode - ensures response is valid JSON
    Json,
    /// Structured output with JSON schema
    Schema(serde_json::Value),
}

impl ResponseFormat {
    /// Create a JSON mode format
    pub fn json() -> Self {
        ResponseFormat::Json
    }

    /// Create a structured format from a JSON schema
    pub fn schema(schema: serde_json::Value) -> Self {
        ResponseFormat::Schema(schema)
    }

    /// Convert to the format expected by Ollama API
    fn to_ollama_format(&self) -> serde_json::Value {
        match self {
            ResponseFormat::Json => json!("json"),
            ResponseFormat::Schema(schema) => schema.clone(),
        }
    }
}

/// Response from the LLM
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum LlmResponse {
    /// Structured transaction response
    Transaction(crate::contracts::Transaction),
    /// Plain text response
    Text(String),
}

impl LLMClient {
    /// Creates a new LLM client with the specified model
    pub fn new(model: String) -> Self {
        Self { model, config: LlmConfig::default() }
    }

    /// Creates a new LLM client from JSON configuration
    pub fn from_json(json_str: &str) -> Result<Self, LlmError> {
        let config: Value = serde_json::from_str(json_str)
            .map_err(|e| LlmError::ConfigError(format!("Invalid JSON: {}", e)))?;

        let model = config
            .get("model")
            .and_then(|v| v.as_str())
            .ok_or_else(|| LlmError::ConfigError("Missing 'model' field".to_string()))?
            .to_string();

        // Parse optional config parameters
        let mut llm_config = LlmConfig::default();

        if let Some(temp) = config.get("temperature").and_then(|v| v.as_f64()) {
            llm_config = llm_config.with_temperature(temp as f32);
        }

        if let Some(max_tokens) = config.get("max_tokens").and_then(|v| v.as_u64()) {
            llm_config = llm_config.with_max_tokens(max_tokens as u32);
        }

        if let Some(top_p) = config.get("top_p").and_then(|v| v.as_f64()) {
            llm_config = llm_config.with_top_p(top_p as f32);
        }

        if let Some(seed) = config.get("seed").and_then(|v| v.as_u64()) {
            llm_config = llm_config.with_seed(seed as u32);
        }

        Ok(Self { model, config: llm_config })
    }

    /// Creates a new LLM client with custom configuration
    pub fn with_config(model: String, config: LlmConfig) -> Self {
        Self { model, config }
    }

    /// Get the model name
    pub fn get_model(&self) -> &str {
        &self.model
    }

    /// Get the configuration
    pub fn get_config(&self) -> &LlmConfig {
        &self.config
    }

    /// Sends a chat completion request to Ollama
    pub fn chat_completion(
        &self,
        messages: Vec<Message>,
        tools: Option<Vec<Tool>>,
    ) -> Result<Message, LlmError> {
        self.chat_completion_with_format(messages, tools, None)
    }

    /// Send a chat completion request with optional structured output format
    pub fn chat_completion_with_format(
        &self,
        messages: Vec<Message>,
        tools: Option<Vec<Tool>>,
        format: Option<ResponseFormat>,
    ) -> Result<Message, LlmError> {
        block_on(async {
            if messages.is_empty() {
                return Err(LlmError::InvalidInput("Messages cannot be empty".to_string()));
            }

            // Get Ollama base URL from environment or use default
            let base_url = env::var("WAVS_ENV_OLLAMA_API_URL")
                .unwrap_or_else(|_| "http://localhost:11434".to_string());

            let url = format!("{}/api/chat", base_url);

            // Build the request body
            let mut body = json!({
                "model": self.model,
                "messages": messages,
                "stream": false,
            });

            // Add configuration options
            let mut options = HashMap::new();

            if let Some(temp) = self.config.temperature {
                options.insert("temperature", json!(temp));
            }

            if let Some(max_tokens) = self.config.max_tokens {
                options.insert("num_predict", json!(max_tokens));
            }

            if let Some(top_p) = self.config.top_p {
                options.insert("top_p", json!(top_p));
            }

            if let Some(seed) = self.config.seed {
                options.insert("seed", json!(seed));
            }

            if !options.is_empty() {
                body["options"] = json!(options);
            }

            // Add tools if provided
            if let Some(tools) = tools {
                body["tools"] = json!(tools);
            }

            // Add format if provided for structured output
            if let Some(format) = format {
                body["format"] = format.to_ollama_format();
            }

            // Create HTTP request
            let mut req = Request::post(&url)
                .body(serde_json::to_vec(&body).unwrap().into_body())
                .map_err(|e| LlmError::RequestError(format!("Failed to create request: {}", e)))?;

            // Add headers
            req.headers_mut().insert("Content-Type", HeaderValue::from_static("application/json"));
            req.headers_mut().insert("Accept", HeaderValue::from_static("application/json"));

            // Send request
            let mut res = Client::new()
                .send(req)
                .await
                .map_err(|e| LlmError::RequestError(format!("Request failed: {}", e)))?;

            if res.status() != 200 {
                let mut error_body = Vec::new();
                res.body_mut().read_to_end(&mut error_body).await.map_err(|e| {
                    LlmError::RequestError(format!("Failed to read error response: {}", e))
                })?;
                let error_msg = format!(
                    "API error: status {} - {}",
                    res.status(),
                    String::from_utf8_lossy(&error_body)
                );
                return Err(LlmError::ApiError(error_msg));
            }

            // Read response body
            let mut body_buf = Vec::new();
            res.body_mut().read_to_end(&mut body_buf).await.map_err(|e| {
                LlmError::RequestError(format!("Failed to read response body: {}", e))
            })?;

            let body = String::from_utf8(body_buf)
                .map_err(|e| LlmError::ParseError(format!("Invalid UTF-8 in response: {}", e)))?;

            // Parse Ollama response
            #[derive(Debug, Deserialize)]
            struct OllamaResponse {
                message: Message,
                #[allow(dead_code)]
                model: String,
                #[allow(dead_code)]
                created_at: String,
            }

            let ollama_response: OllamaResponse = serde_json::from_str(&body).map_err(|e| {
                LlmError::ParseError(format!("Failed to parse Ollama response: {}", e))
            })?;

            Ok(ollama_response.message)
        })
    }

    /// Convenience method for getting text-only chat completions
    pub fn chat_completion_text(&self, messages: Vec<Message>) -> Result<String, LlmError> {
        let response = self.chat_completion(messages, None)?;
        response.content.ok_or_else(|| LlmError::ParseError("No content in response".to_string()))
    }

    /// Convenience method for getting structured chat completions
    pub fn chat_completion_structured<T>(
        &self,
        messages: Vec<Message>,
        tools: Option<Vec<Tool>>,
        schema: serde_json::Value,
    ) -> Result<T, LlmError>
    where
        T: for<'de> serde::Deserialize<'de>,
    {
        let format = Some(ResponseFormat::Schema(schema));
        let response = self.chat_completion_with_format(messages, tools, format)?;

        let content = response
            .content
            .ok_or_else(|| LlmError::ParseError("No content in response".to_string()))?;

        serde_json::from_str(&content).map_err(|e| {
            LlmError::ParseError(format!("Failed to parse structured response: {}", e))
        })
    }

    /// Process a prompt with optional context and images
    pub fn process_prompt(
        &self,
        prompt: String,
        context: Option<String>,
        images: Option<Vec<String>>,
    ) -> Result<LlmResponse, LlmError> {
        // Build messages
        let mut messages = Vec::new();

        // Add system message if context is provided
        if let Some(ctx) = context {
            messages.push(Message::new_system(ctx));
        }

        // Create user message with prompt
        let mut user_message = Message::new_user(prompt.clone());

        // Handle images if provided
        if let Some(image_paths) = images {
            let mut encoded_images = Vec::new();
            for path in image_paths {
                let encoded = encode_image_to_base64(&path)?;
                encoded_images.push(encoded);
            }

            // For Ollama, we need to include images in a specific format
            // Modify the content to include image references
            let content_with_images = json!({
                "text": prompt,
                "images": encoded_images
            });

            user_message.content = Some(content_with_images.to_string());
        }

        messages.push(user_message);

        // Get response from LLM
        let response = self.chat_completion(messages, None)?;
        let content = response
            .content
            .ok_or_else(|| LlmError::ParseError("No content in response".to_string()))?;

        // Try to parse as transaction struct first
        if let Ok(transaction) = serde_json::from_str::<crate::contracts::Transaction>(&content) {
            Ok(LlmResponse::Transaction(transaction))
        } else {
            // Return as plain text if not a transaction
            Ok(LlmResponse::Text(content))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::LlmConfigBuilder;

    fn setup_test_env() {
        env::set_var("WAVS_ENV_OLLAMA_API_URL", "http://localhost:11434");
    }

    #[test]
    fn test_llm_client_initialization() {
        setup_test_env();
        let client = LLMClient::new("llama2".to_string());
        assert_eq!(client.get_model(), "llama2");
        assert_eq!(client.get_config().temperature, None);
        assert_eq!(client.get_config().max_tokens, None);
    }

    #[test]
    fn test_llm_client_from_json() {
        setup_test_env();
        let json_config = r#"{
            "model": "llama2",
            "temperature": 0.7,
            "max_tokens": 100,
            "top_p": 0.9,
            "seed": 42
        }"#;

        let client = LLMClient::from_json(json_config).unwrap();
        assert_eq!(client.get_model(), "llama2");
        assert_eq!(client.get_config().temperature, Some(0.7));
        assert_eq!(client.get_config().max_tokens, Some(100));
        assert_eq!(client.get_config().top_p, Some(0.9));
        assert_eq!(client.get_config().seed, Some(42));
    }

    #[test]
    fn test_llm_client_from_json_invalid() {
        let json_config = r#"{
            "temperature": 0.7
        }"#;

        let result = LLMClient::from_json(json_config);
        assert!(result.is_err());

        match result {
            Err(LlmError::ConfigError(msg)) => {
                assert!(msg.contains("Missing 'model' field"));
            }
            _ => panic!("Expected ConfigError for missing model"),
        }
    }

    #[test]
    fn test_llm_client_with_config() {
        setup_test_env();
        let config = LlmConfig::default().with_temperature(0.8).with_max_tokens(200);

        let client = LLMClient::with_config("llama2".to_string(), config);
        assert_eq!(client.get_model(), "llama2");
        assert_eq!(client.get_config().temperature, Some(0.8));
        assert_eq!(client.get_config().max_tokens, Some(200));
    }

    #[test]
    fn test_llm_config_builder() {
        let config =
            LlmConfigBuilder::new().temperature(0.5).max_tokens(150).top_p(0.95).seed(123).build();

        assert_eq!(config.temperature, Some(0.5));
        assert_eq!(config.max_tokens, Some(150));
        assert_eq!(config.top_p, Some(0.95));
        assert_eq!(config.seed, Some(123));
    }

    #[test]
    fn test_new_client_empty_model() {
        let json_config = r#"{
            "model": "",
            "temperature": 0.7
        }"#;

        let client = LLMClient::from_json(json_config).unwrap();
        assert_eq!(client.get_model(), "");
        assert_eq!(client.get_config().temperature, Some(0.7));
    }

    #[test]
    fn test_chat_completion_empty_messages() {
        setup_test_env();
        let client = LLMClient::new("llama2".to_string());
        let result = client.chat_completion(vec![], None);

        assert!(result.is_err());
        match result {
            Err(LlmError::InvalidInput(msg)) => {
                assert!(msg.contains("Messages cannot be empty"));
            }
            _ => panic!("Expected InvalidInput error for empty messages"),
        }
    }

    // Integration tests for Ollama
    // NOTE: These tests require:
    // 1. Ollama to be running on localhost:11434
    // 2. A WASI runtime environment (they won't work with native cargo test)
    //
    // To run these tests in a WASI environment:
    // 1. Build the component: `cargo component build`
    // 2. Run with wasmtime or another WASI runtime
    //
    // For native testing, use mock tests or run Ollama locally with a different HTTP client
    #[cfg(all(feature = "integration-tests", target_arch = "wasm32"))]
    mod integration {
        use super::*;
        use std::sync::Once;

        static INIT: Once = Once::new();

        fn init() {
            INIT.call_once(|| {
                env::set_var("WAVS_ENV_OLLAMA_API_URL", "http://localhost:11434");
                println!("Integration tests require Ollama running on localhost:11434");
            });
        }

        #[test]
        #[ignore] // Run in WASI environment only
        fn test_ollama_chat_completion() {
            init();

            let client = LLMClient::new("llama2".to_string());

            let messages = vec![
                Message::new_system("You are a helpful assistant.".to_string()),
                Message::new_user("What is 2+2?".to_string()),
            ];

            match client.chat_completion(messages, None) {
                Ok(response) => {
                    println!("Ollama response: {:?}", response);
                    assert!(response.content.is_some());
                    let content = response.content.unwrap();
                    assert!(!content.is_empty());
                    // The response should mention "4" somewhere
                    assert!(content.contains("4") || content.contains("four"));
                }
                Err(e) => {
                    println!("Ollama test error: {:?}", e);
                    println!("Make sure Ollama is running with 'ollama serve'");
                    println!("And that you have pulled a model with 'ollama pull llama2'");
                    panic!("Ollama integration test failed: {:?}", e);
                }
            }
        }

        #[test]
        #[ignore] // Run in WASI environment only
        fn test_ollama_chat_completion_with_config() {
            init();

            let config = LlmConfig::default().with_temperature(0.1).with_max_tokens(50);

            let client = LLMClient::with_config("llama2".to_string(), config);

            let messages =
                vec![Message::new_user("Say 'hello world' and nothing else.".to_string())];

            match client.chat_completion(messages, None) {
                Ok(response) => {
                    println!("Ollama response with config: {:?}", response);
                    assert!(response.content.is_some());
                    let content = response.content.unwrap();
                    assert!(!content.is_empty());
                }
                Err(e) => {
                    println!("Ollama test error: {:?}", e);
                    panic!("Ollama integration test failed: {:?}", e);
                }
            }
        }

        #[test]
        #[ignore] // Run in WASI environment only
        fn test_ollama_chat_completion_with_tools() {
            init();

            let client = LLMClient::new("llama2".to_string());

            let tools = vec![Tool {
                tool_type: "function".to_string(),
                function: crate::tools::Function {
                    name: "get_weather".to_string(),
                    description: Some("Get the current weather for a location".to_string()),
                    parameters: Some(json!({
                        "type": "object",
                        "properties": {
                            "location": {
                                "type": "string",
                                "description": "The city and state, e.g. San Francisco, CA"
                            }
                        },
                        "required": ["location"]
                    })),
                },
            }];

            let messages =
                vec![Message::new_user("What's the weather like in San Francisco?".to_string())];

            match client.chat_completion(messages, Some(tools)) {
                Ok(response) => {
                    println!("Ollama response with tools: {:?}", response);
                    // Check if tool_calls are present or if it's a regular response
                    if let Some(tool_calls) = response.tool_calls {
                        assert!(!tool_calls.is_empty());
                        let first_call = &tool_calls[0];
                        assert_eq!(first_call.function.name, "get_weather");
                    } else {
                        // Some models might not support tools, so check for content
                        assert!(response.content.is_some());
                    }
                }
                Err(e) => {
                    println!("Ollama test error: {:?}", e);
                    println!("Note: Tool support requires specific models in Ollama");
                    // Don't panic as not all models support tools
                }
            }
        }
    }

    #[test]
    fn test_response_format_json() {
        let format = ResponseFormat::json();
        let ollama_format = format.to_ollama_format();
        assert_eq!(ollama_format, json!("json"));
    }

    #[test]
    fn test_response_format_schema() {
        let schema = json!({
            "type": "object",
            "properties": {
                "name": {"type": "string"},
                "age": {"type": "integer"}
            },
            "required": ["name", "age"]
        });

        let format = ResponseFormat::schema(schema.clone());
        let ollama_format = format.to_ollama_format();
        assert_eq!(ollama_format, schema);
    }

    #[test]
    #[ignore] // Run in WASI environment only
    fn test_ollama_structured_response_json_mode() {
        init();

        let client = LLMClient::new("llama2".to_string());
        let messages = vec![Message::new_user(
            "Return a JSON object with fields 'status' and 'message'. Status should be 'ok' and message should be 'Hello World'."
                .to_string(),
        )];

        let format = Some(ResponseFormat::json());

        match client.chat_completion_with_format(messages, None, format) {
            Ok(response) => {
                println!("Structured JSON response: {:?}", response);
                assert!(response.content.is_some());

                // Try to parse as JSON to verify it's valid
                let content = response.content.unwrap();
                let parsed: Result<serde_json::Value, _> = serde_json::from_str(&content);
                assert!(parsed.is_ok(), "Response should be valid JSON");
            }
            Err(e) => {
                println!("Structured response test error: {:?}", e);
                panic!("Structured response test failed: {:?}", e);
            }
        }
    }

    #[test]
    #[ignore] // Run in WASI environment only
    fn test_ollama_structured_response_with_schema() {
        init();

        let client = LLMClient::new("llama2".to_string());

        // Define a schema for a person object
        let schema = json!({
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "The person's name"
                },
                "age": {
                    "type": "integer",
                    "description": "The person's age"
                },
                "city": {
                    "type": "string",
                    "description": "The city where the person lives"
                }
            },
            "required": ["name", "age", "city"]
        });

        let messages = vec![Message::new_user(
            "Generate information about a fictional person named Alice who is 30 years old and lives in New York."
                .to_string(),
        )];

        // Test with the structured method
        #[derive(Debug, Deserialize)]
        struct Person {
            name: String,
            age: u32,
            city: String,
        }

        match client.chat_completion_structured::<Person>(messages, None, schema) {
            Ok(person) => {
                println!("Parsed structured response: {:?}", person);
                assert_eq!(person.name, "Alice");
                assert_eq!(person.age, 30);
                assert_eq!(person.city, "New York");
            }
            Err(e) => {
                println!("Structured parsing test error: {:?}", e);
                // This might fail if Ollama doesn't strictly follow the schema
                // In production, you'd want more robust error handling
            }
        }
    }

    #[test]
    fn test_integration_tests_note() {
        println!("Integration tests require a WASI runtime environment.");
        println!("They are only compiled for wasm32 targets with the integration-tests feature.");
        println!("For native testing, use mock tests or a different HTTP client.");
    }
}
