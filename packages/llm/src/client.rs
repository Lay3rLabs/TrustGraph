use crate::config::{Config, LlmOptions};
use crate::contracts::Transaction;
use crate::errors::LlmError;
use crate::tools::{CustomToolHandler, Tool, ToolCall, Tools};
use schemars::JsonSchema;
use serde::{de::DeserializeOwned, Deserialize, Serialize};
use serde_json::Value;
use std::marker::PhantomData;
use wstd::http::{IntoBody, Method, Request, Response};
use wstd::io::AsyncRead;
use wstd::runtime::block_on;

/// Represents a message in a chat conversation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    /// The role of the message sender
    pub role: String,

    /// The text content of the message
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content: Option<String>,

    /// Tool calls made by the assistant
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tool_calls: Option<Vec<ToolCall>>,

    /// ID for tool call responses
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tool_call_id: Option<String>,

    /// Name of the tool (for tool responses)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
}

impl Message {
    /// Create a user message
    pub fn user(content: impl Into<String>) -> Self {
        Self {
            role: "user".to_string(),
            content: Some(content.into()),
            tool_calls: None,
            tool_call_id: None,
            name: None,
        }
    }

    /// Create a system message
    pub fn system(content: impl Into<String>) -> Self {
        Self {
            role: "system".to_string(),
            content: Some(content.into()),
            tool_calls: None,
            tool_call_id: None,
            name: None,
        }
    }

    /// Create an assistant message
    pub fn assistant(content: impl Into<String>) -> Self {
        Self {
            role: "assistant".to_string(),
            content: Some(content.into()),
            tool_calls: None,
            tool_call_id: None,
            name: None,
        }
    }

    /// Create a tool result message
    pub fn tool_result(tool_call_id: String, name: String, content: String) -> Self {
        Self {
            role: "tool".to_string(),
            content: Some(content),
            tool_calls: None,
            tool_call_id: Some(tool_call_id),
            name: Some(name),
        }
    }
}

// Allow converting a single string into a Message vector (user message)
impl From<&str> for Message {
    fn from(content: &str) -> Self {
        Message::user(content)
    }
}

impl From<String> for Message {
    fn from(content: String) -> Self {
        Message::user(content)
    }
}

// Trait for converting various types into a Vec<Message>
pub trait IntoMessages {
    fn into_messages(self) -> Vec<Message>;
}

impl IntoMessages for Vec<Message> {
    fn into_messages(self) -> Vec<Message> {
        self
    }
}

impl IntoMessages for Message {
    fn into_messages(self) -> Vec<Message> {
        vec![self]
    }
}

impl IntoMessages for &str {
    fn into_messages(self) -> Vec<Message> {
        vec![Message::user(self)]
    }
}

impl IntoMessages for String {
    fn into_messages(self) -> Vec<Message> {
        vec![Message::user(self)]
    }
}

impl<const N: usize> IntoMessages for [Message; N] {
    fn into_messages(self) -> Vec<Message> {
        self.to_vec()
    }
}

/// The main LLM client with simplified API
pub struct LLMClient {
    model: String,
    config: LlmOptions,
}

impl LLMClient {
    /// Creates a new LLM client with the specified model
    pub fn new(model: impl Into<String>) -> Self {
        Self { model: model.into(), config: LlmOptions::default() }
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

        let mut llm_config = LlmOptions::default();

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
    pub fn with_config(model: impl Into<String>, config: LlmOptions) -> Self {
        Self { model: model.into(), config }
    }

    /// Get the model name
    pub fn get_model(&self) -> &str {
        &self.model
    }

    /// Get the configuration
    pub fn get_config(&self) -> &LlmOptions {
        &self.config
    }

    /// Chat - handles everything from simple completion to complex conversations
    pub fn chat(&self, messages: impl IntoMessages) -> ChatRequest<'_> {
        ChatRequest::new(self, messages.into_messages())
    }

    /// Chat with structured/typed response
    pub fn chat_structured<T>(&self, messages: impl IntoMessages) -> StructuredChatRequest<'_, T>
    where
        T: JsonSchema + DeserializeOwned,
    {
        StructuredChatRequest::new(self, messages.into_messages())
    }
}

/// Builder for chat requests
pub struct ChatRequest<'a> {
    client: &'a LLMClient,
    messages: Vec<Message>,
    tools: Option<Vec<Tool>>,
    retries: u32,
    custom_handlers: Vec<Box<dyn CustomToolHandler>>,
}

impl<'a> ChatRequest<'a> {
    fn new(client: &'a LLMClient, messages: Vec<Message>) -> Self {
        Self { client, messages, tools: None, retries: 0, custom_handlers: Vec::new() }
    }

    /// Add tools to the request
    pub fn with_tools(mut self, tools: Vec<Tool>) -> Self {
        self.tools = Some(tools);
        self
    }

    /// Add tools from smart contracts (auto-generated from ABIs)
    pub fn with_contract_tools(mut self, contracts: &[crate::contracts::Contract]) -> Self {
        let mut all_tools = self.tools.unwrap_or_default();
        for contract in contracts {
            all_tools.extend(Tools::tools_from_contract(contract));
        }
        self.tools = Some(all_tools);
        self
    }

    /// Add a full config (automatically includes contract tools)
    pub fn with_config(mut self, config: &Config) -> Self {
        // Add contract tools
        self = self.with_contract_tools(&config.contracts);

        // Add any configured system messages
        if !config.messages.is_empty() {
            // Prepend system messages before user messages
            let mut new_messages = Vec::new();
            for msg in &config.messages {
                if msg.role == "system" {
                    new_messages.push(msg.clone());
                }
            }
            new_messages.extend(self.messages);
            self.messages = new_messages;
        }

        self
    }

    /// Set the number of retries
    pub fn with_retries(mut self, retries: u32) -> Self {
        self.retries = retries;
        self
    }

    /// Add custom tool handlers for execution
    pub fn with_custom_handlers(mut self, handlers: Vec<Box<dyn CustomToolHandler>>) -> Self {
        self.custom_handlers = handlers;
        self
    }

    /// Send the request and return the full Message response
    pub fn send(self) -> Result<Message, LlmError> {
        let mut attempts = 0;
        let max_attempts = self.retries + 1;

        loop {
            match self.try_send() {
                Ok(response) => return Ok(response),
                Err(e) if attempts < max_attempts - 1 => {
                    attempts += 1;
                    eprintln!("Request failed (attempt {}/{}): {}", attempts, max_attempts, e);
                    continue;
                }
                Err(e) => return Err(e),
            }
        }
    }

    /// Convenience method for just getting text content
    pub fn text(self) -> Result<String, LlmError> {
        let message = self.send()?;
        message.content.ok_or_else(|| LlmError::ApiError("No text content in response".to_string()))
    }

    /// Execute tool calls automatically and return final response
    pub fn execute_tools(self) -> Result<String, LlmError> {
        let messages = self.messages.clone();
        let mut iterations = 0;
        const MAX_ITERATIONS: usize = 10;

        // Extract what we need before moving self
        let client = self.client;
        let tools = self.tools.clone();
        let retries = self.retries;

        loop {
            iterations += 1;
            if iterations > MAX_ITERATIONS {
                return Err(LlmError::ApiError(
                    "Maximum tool execution iterations reached".to_string(),
                ));
            }

            // Create a new request for this iteration (without custom handlers since we can't clone them)
            let request = ChatRequest {
                client,
                messages: messages.clone(),
                tools: tools.clone(),
                retries,
                custom_handlers: Vec::new(), // Can't clone trait objects, so use empty vec
            };

            let response = request.send()?;

            // Check if there are tool calls to process
            if let Some(tool_calls) = &response.tool_calls {
                if !tool_calls.is_empty() {
                    // Process the tool calls
                    let tool_results = Tools::process_tool_calls(
                        client,
                        messages.clone(),
                        response.clone(),
                        tool_calls.clone(),
                        None, // Custom handlers not available after first iteration
                    )
                    .map_err(|e| LlmError::ApiError(e))?;

                    // The tool_results is a single String containing the final result
                    // We can return it directly
                    return Ok(tool_results);
                }
            }

            // No more tool calls, return the final text
            return response.content.ok_or_else(|| {
                LlmError::ApiError("No text content in final response".to_string())
            });
        }
    }

    fn try_send(&self) -> Result<Message, LlmError> {
        // Validate messages
        if self.messages.is_empty() {
            return Err(LlmError::InvalidInput("Messages cannot be empty".to_string()));
        }

        // Build the request body
        let mut body = serde_json::json!({
            "model": self.client.model,
            "messages": self.messages,
            "stream": false,
        });

        // Add configuration options
        if let Some(temp) = self.client.config.temperature {
            body["temperature"] = serde_json::json!(temp);
        }
        if let Some(max_tokens) = self.client.config.max_tokens {
            body["max_tokens"] = serde_json::json!(max_tokens);
        }
        if let Some(top_p) = self.client.config.top_p {
            body["top_p"] = serde_json::json!(top_p);
        }
        if let Some(seed) = self.client.config.seed {
            body["seed"] = serde_json::json!(seed);
        }

        // Add tools if provided
        if let Some(tools) = &self.tools {
            if !tools.is_empty() {
                body["tools"] = serde_json::json!(tools);
            }
        }

        // Make the HTTP request
        let request = Request::builder()
            .method(Method::POST)
            .uri("http://localhost:11434/api/chat")
            .header("Content-Type", "application/json")
            .body(
                serde_json::to_vec(&body)
                    .map_err(|e| {
                        LlmError::RequestError(format!("Failed to serialize request: {}", e))
                    })?
                    .into_body(),
            )
            .map_err(|e| LlmError::RequestError(format!("Failed to build request: {}", e)))?;

        let response: Response<Vec<u8>> = block_on(async {
            let mut http_response = wstd::http::Client::new()
                .send(request)
                .await
                .map_err(|e| LlmError::RequestError(format!("HTTP request failed: {}", e)))?;

            let mut body = Vec::new();
            http_response.body_mut().read_to_end(&mut body).await.map_err(|e| {
                LlmError::RequestError(format!("Failed to read response body: {}", e))
            })?;

            Ok::<_, LlmError>(
                Response::builder().status(http_response.status()).body(body).map_err(|e| {
                    LlmError::RequestError(format!("Failed to build response: {}", e))
                })?,
            )
        })?;

        if response.status() != 200 {
            let error_body = String::from_utf8_lossy(response.body());
            return Err(LlmError::ApiError(format!(
                "API returned status {}: {}",
                response.status(),
                error_body
            )));
        }

        // Parse the response
        #[derive(Deserialize)]
        struct OllamaResponse {
            message: Message,
            #[allow(dead_code)]
            model: String,
            #[allow(dead_code)]
            created_at: String,
        }

        let ollama_response: OllamaResponse = serde_json::from_slice(response.body())
            .map_err(|e| LlmError::ParseError(format!("Failed to parse response: {}", e)))?;

        Ok(ollama_response.message)
    }
}

/// Builder for structured chat requests
pub struct StructuredChatRequest<'a, T> {
    client: &'a LLMClient,
    messages: Vec<Message>,
    tools: Option<Vec<Tool>>,
    retries: u32,
    custom_handlers: Vec<Box<dyn CustomToolHandler>>,
    _phantom: PhantomData<T>,
}

impl<'a, T> StructuredChatRequest<'a, T>
where
    T: JsonSchema + DeserializeOwned,
{
    fn new(client: &'a LLMClient, messages: Vec<Message>) -> Self {
        Self {
            client,
            messages,
            tools: None,
            retries: 0,
            custom_handlers: Vec::new(),
            _phantom: PhantomData,
        }
    }

    /// Add tools to the request
    pub fn with_tools(mut self, tools: Vec<Tool>) -> Self {
        self.tools = Some(tools);
        self
    }

    /// Add tools from smart contracts (auto-generated from ABIs)
    pub fn with_contract_tools(mut self, contracts: &[crate::contracts::Contract]) -> Self {
        let mut all_tools = self.tools.unwrap_or_default();
        for contract in contracts {
            all_tools.extend(Tools::tools_from_contract(contract));
        }
        self.tools = Some(all_tools);
        self
    }

    /// Add a full config (automatically includes contract tools)
    pub fn with_config(mut self, config: &Config) -> Self {
        // Add contract tools
        self = self.with_contract_tools(&config.contracts);

        // Add any configured system messages
        if !config.messages.is_empty() {
            let mut new_messages = Vec::new();
            for msg in &config.messages {
                if msg.role == "system" {
                    new_messages.push(msg.clone());
                }
            }
            new_messages.extend(self.messages);
            self.messages = new_messages;
        }

        self
    }

    /// Set the number of retries
    pub fn with_retries(mut self, retries: u32) -> Self {
        self.retries = retries;
        self
    }

    /// Add custom tool handlers for execution
    pub fn with_custom_handlers(mut self, handlers: Vec<Box<dyn CustomToolHandler>>) -> Self {
        self.custom_handlers = handlers;
        self
    }

    /// Send the request and return the parsed structured response
    pub fn send(self) -> Result<T, LlmError> {
        let mut attempts = 0;
        let max_attempts = self.retries + 1;

        loop {
            match self.try_send() {
                Ok(response) => return Ok(response),
                Err(e) if attempts < max_attempts - 1 => {
                    attempts += 1;
                    eprintln!("Request failed (attempt {}/{}): {}", attempts, max_attempts, e);
                    continue;
                }
                Err(e) => return Err(e),
            }
        }
    }

    fn try_send(&self) -> Result<T, LlmError> {
        // Validate messages
        if self.messages.is_empty() {
            return Err(LlmError::InvalidInput("Messages cannot be empty".to_string()));
        }

        // Generate JSON schema for the type
        let schema = schemars::schema_for!(T);
        let schema_value = serde_json::to_value(schema)
            .map_err(|e| LlmError::ConfigError(format!("Failed to create schema: {}", e)))?;

        // Build the request body with structured output format
        let mut body = serde_json::json!({
            "model": self.client.model,
            "messages": self.messages,
            "stream": false,
            "format": schema_value,
        });

        // Add configuration options
        if let Some(temp) = self.client.config.temperature {
            body["temperature"] = serde_json::json!(temp);
        }
        if let Some(max_tokens) = self.client.config.max_tokens {
            body["max_tokens"] = serde_json::json!(max_tokens);
        }
        if let Some(top_p) = self.client.config.top_p {
            body["top_p"] = serde_json::json!(top_p);
        }
        if let Some(seed) = self.client.config.seed {
            body["seed"] = serde_json::json!(seed);
        }

        // Add tools if provided
        if let Some(tools) = &self.tools {
            if !tools.is_empty() {
                body["tools"] = serde_json::json!(tools);
            }
        }

        // Make the HTTP request
        let request = Request::builder()
            .method(Method::POST)
            .uri("http://localhost:11434/api/chat")
            .header("Content-Type", "application/json")
            .body(
                serde_json::to_vec(&body)
                    .map_err(|e| {
                        LlmError::RequestError(format!("Failed to serialize request: {}", e))
                    })?
                    .into_body(),
            )
            .map_err(|e| LlmError::RequestError(format!("Failed to build request: {}", e)))?;

        let response: Response<Vec<u8>> = block_on(async {
            let mut http_response = wstd::http::Client::new()
                .send(request)
                .await
                .map_err(|e| LlmError::RequestError(format!("HTTP request failed: {}", e)))?;

            let mut body = Vec::new();
            http_response.body_mut().read_to_end(&mut body).await.map_err(|e| {
                LlmError::RequestError(format!("Failed to read response body: {}", e))
            })?;

            Ok::<_, LlmError>(
                Response::builder().status(http_response.status()).body(body).map_err(|e| {
                    LlmError::RequestError(format!("Failed to build response: {}", e))
                })?,
            )
        })?;

        if response.status() != 200 {
            let error_body = String::from_utf8_lossy(response.body());
            return Err(LlmError::ApiError(format!(
                "API returned status {}: {}",
                response.status(),
                error_body
            )));
        }

        // Parse the response
        #[derive(Deserialize)]
        struct OllamaResponse {
            message: Message,
            #[allow(dead_code)]
            model: String,
            #[allow(dead_code)]
            created_at: String,
        }

        let ollama_response: OllamaResponse = serde_json::from_slice(response.body())
            .map_err(|e| LlmError::ParseError(format!("Failed to parse response: {}", e)))?;

        // Extract and parse the structured content
        let content = ollama_response
            .message
            .content
            .ok_or_else(|| LlmError::ApiError("No content in response".to_string()))?;

        // Try to parse the content as the expected type
        // First, try to extract JSON from the response
        let json_content = Self::extract_json_from_response(&content)?;

        serde_json::from_str(&json_content).map_err(|e| {
            LlmError::ParseError(format!("Failed to parse structured response: {}", e))
        })
    }

    fn extract_json_from_response(response: &str) -> Result<String, LlmError> {
        // Try to parse as-is first
        if response.trim_start().starts_with('{') || response.trim_start().starts_with('[') {
            if serde_json::from_str::<Value>(response).is_ok() {
                return Ok(response.to_string());
            }
        }

        // Look for JSON between ```json and ``` markers
        if let Some(start) = response.find("```json") {
            let json_start = start + 7;
            if let Some(end) = response[json_start..].find("```") {
                let json_str = &response[json_start..json_start + end].trim();
                if serde_json::from_str::<Value>(json_str).is_ok() {
                    return Ok(json_str.to_string());
                }
            }
        }

        // Look for JSON between ``` and ``` markers
        if let Some(start) = response.find("```") {
            let json_start = start + 3;
            if let Some(end) = response[json_start..].find("```") {
                let json_str = &response[json_start..json_start + end].trim();
                if json_str.starts_with('{') || json_str.starts_with('[') {
                    if serde_json::from_str::<Value>(json_str).is_ok() {
                        return Ok(json_str.to_string());
                    }
                }
            }
        }

        // Try to find the first { or [ and parse from there
        let trimmed = response.trim();
        for (i, ch) in trimmed.char_indices() {
            if ch == '{' || ch == '[' {
                let potential_json = &trimmed[i..];

                // Find the matching closing bracket
                let mut depth = 0;
                let mut end_index = None;
                let target_close = if ch == '{' { '}' } else { ']' };

                for (j, c) in potential_json.char_indices() {
                    if c == ch {
                        depth += 1;
                    } else if c == target_close {
                        depth -= 1;
                        if depth == 0 {
                            end_index = Some(j + 1);
                            break;
                        }
                    }
                }

                if let Some(end) = end_index {
                    let json_str = &potential_json[..end];
                    if serde_json::from_str::<Value>(json_str).is_ok() {
                        return Ok(json_str.to_string());
                    }
                }
            }
        }

        Err(LlmError::ParseError("No valid JSON found in response".to_string()))
    }
}

/// Response from the LLM (for compatibility)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum LlmResponse {
    /// Structured transaction response
    Transaction(Transaction),
    /// Plain text response
    Text(String),
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::LlmOptionsBuilder;
    use crate::contracts::Contract;
    use crate::tools::{Function, Tool};

    #[test]
    fn test_message_builders() {
        let user_msg = Message::user("Hello");
        assert_eq!(user_msg.role, "user");
        assert_eq!(user_msg.content, Some("Hello".to_string()));
        assert!(user_msg.tool_calls.is_none());
        assert!(user_msg.tool_call_id.is_none());
        assert!(user_msg.name.is_none());

        let system_msg = Message::system("You are helpful");
        assert_eq!(system_msg.role, "system");
        assert_eq!(system_msg.content, Some("You are helpful".to_string()));

        let assistant_msg = Message::assistant("Hi there!");
        assert_eq!(assistant_msg.role, "assistant");
        assert_eq!(assistant_msg.content, Some("Hi there!".to_string()));

        let tool_msg =
            Message::tool_result("123".to_string(), "weather".to_string(), "Sunny".to_string());
        assert_eq!(tool_msg.role, "tool");
        assert_eq!(tool_msg.content, Some("Sunny".to_string()));
        assert_eq!(tool_msg.tool_call_id, Some("123".to_string()));
        assert_eq!(tool_msg.name, Some("weather".to_string()));
    }

    #[test]
    fn test_message_from_string() {
        let msg: Message = "Hello".into();
        assert_eq!(msg.role, "user");
        assert_eq!(msg.content, Some("Hello".to_string()));

        let msg: Message = String::from("Hello").into();
        assert_eq!(msg.role, "user");
        assert_eq!(msg.content, Some("Hello".to_string()));
    }

    #[test]
    fn test_llm_client_creation() {
        let client = LLMClient::new("llama3.2");
        assert_eq!(client.get_model(), "llama3.2");
        assert!(client.get_config().temperature.is_none());

        let config = LlmOptions::new().with_temperature(0.7).with_max_tokens(100);
        let client = LLMClient::with_config("gpt-4", config);
        assert_eq!(client.get_model(), "gpt-4");
        assert_eq!(client.get_config().temperature, Some(0.7));
        assert_eq!(client.get_config().max_tokens, Some(100));
    }

    #[test]
    fn test_llm_client_from_json() {
        let json_str = r#"{
            "model": "llama3.2",
            "temperature": 0.8,
            "max_tokens": 200,
            "top_p": 0.95,
            "seed": 42
        }"#;

        let client = LLMClient::from_json(json_str).unwrap();
        assert_eq!(client.get_model(), "llama3.2");
        assert_eq!(client.get_config().temperature, Some(0.8));
        assert_eq!(client.get_config().max_tokens, Some(200));
        assert_eq!(client.get_config().top_p, Some(0.95));
        assert_eq!(client.get_config().seed, Some(42));
    }

    #[test]
    fn test_llm_client_from_json_missing_model() {
        let json_str = r#"{"temperature": 0.8}"#;
        let result = LLMClient::from_json(json_str);
        assert!(result.is_err());
        if let Err(LlmError::ConfigError(msg)) = result {
            assert!(msg.contains("Missing 'model' field"));
        } else {
            panic!("Expected ConfigError for missing model");
        }
    }

    #[test]
    fn test_chat_request_builder() {
        let client = LLMClient::new("test-model");

        // Basic chat request
        let request = client.chat("Hello");
        assert_eq!(request.messages.len(), 1);
        assert_eq!(request.messages[0].content, Some("Hello".to_string()));
        assert_eq!(request.retries, 0);
        assert!(request.tools.is_none());

        // With retries
        let request = client.chat("Hello").with_retries(3);
        assert_eq!(request.retries, 3);

        // With multiple messages
        let messages = vec![Message::system("Be helpful"), Message::user("What is 2+2?")];
        let request = client.chat(messages);
        assert_eq!(request.messages.len(), 2);
        assert_eq!(request.messages[0].role, "system");
        assert_eq!(request.messages[1].role, "user");
    }

    #[test]
    fn test_chat_request_with_tools() {
        let client = LLMClient::new("test-model");

        let tools = vec![Tool {
            tool_type: "function".to_string(),
            function: Function {
                name: "get_weather".to_string(),
                description: Some("Get the weather".to_string()),
                parameters: Some(serde_json::json!({
                    "type": "object",
                    "properties": {
                        "location": {"type": "string"}
                    }
                })),
            },
        }];

        let request = client.chat("What's the weather?").with_tools(tools.clone());
        assert!(request.tools.is_some());
        assert_eq!(request.tools.as_ref().unwrap().len(), 1);
        assert_eq!(request.tools.as_ref().unwrap()[0].function.name, "get_weather");
    }

    #[test]
    fn test_chat_request_with_contract_tools() {
        let client = LLMClient::new("test-model");

        let contract = Contract::new(
            "TestContract",
            "0x1234567890123456789012345678901234567890",
            r#"[{
                "name": "transfer",
                "type": "function",
                "inputs": [
                    {"name": "to", "type": "address"},
                    {"name": "amount", "type": "uint256"}
                ],
                "outputs": [{"name": "", "type": "bool"}]
            }]"#,
        );

        let request = client.chat("Transfer tokens").with_contract_tools(&[contract]);
        assert!(request.tools.is_some());
        // Contract tools generation tested in tools module
    }

    #[test]
    fn test_structured_chat_request_builder() {
        #[derive(Deserialize, JsonSchema)]
        struct TestResponse {
            name: String,
            age: u32,
        }

        let client = LLMClient::new("test-model");

        // Basic structured request
        let request = client.chat_structured::<TestResponse>("Give me a person");
        assert_eq!(request.messages.len(), 1);
        assert_eq!(request.retries, 0);

        // With retries
        let request = client.chat_structured::<TestResponse>("Give me a person").with_retries(2);
        assert_eq!(request.retries, 2);

        // With system message
        let messages =
            vec![Message::system("You generate person data"), Message::user("Give me a person")];
        let request = client.chat_structured::<TestResponse>(messages);
        assert_eq!(request.messages.len(), 2);
    }

    #[test]
    fn test_extract_json_from_response() {
        // Plain JSON
        let response = r#"{"name": "John", "age": 30}"#;
        let result = StructuredChatRequest::<()>::extract_json_from_response(response).unwrap();
        assert_eq!(result, r#"{"name": "John", "age": 30}"#);

        // JSON in markdown code block
        let response = r#"Here's the data:
```json
{"name": "Jane", "age": 25}
```"#;
        let result = StructuredChatRequest::<()>::extract_json_from_response(response).unwrap();
        assert_eq!(result, r#"{"name": "Jane", "age": 25}"#);

        // JSON with surrounding text
        let response = r#"The result is: {"status": "success", "count": 42} and that's it"#;
        let result = StructuredChatRequest::<()>::extract_json_from_response(response).unwrap();
        assert_eq!(result, r#"{"status": "success", "count": 42}"#);

        // Array JSON
        let response = r#"[{"id": 1}, {"id": 2}]"#;
        let result = StructuredChatRequest::<()>::extract_json_from_response(response).unwrap();
        assert_eq!(result, r#"[{"id": 1}, {"id": 2}]"#);

        // Nested JSON with text
        let response = r#"Here is the result: {"outer": {"inner": "value"}} done"#;
        let result = StructuredChatRequest::<()>::extract_json_from_response(response).unwrap();
        assert_eq!(result, r#"{"outer": {"inner": "value"}}"#);

        // Invalid JSON should fail
        let response = r#"This is just plain text with no JSON"#;
        let result = StructuredChatRequest::<()>::extract_json_from_response(response);
        assert!(result.is_err());

        // Malformed JSON should fail
        let response = r#"{"broken": }"#;
        let result = StructuredChatRequest::<()>::extract_json_from_response(response);
        assert!(result.is_err());
    }

    #[test]
    fn test_chat_request_with_config() {
        let client = LLMClient::new("test-model");

        let mut config = Config::default();
        config.messages = vec![Message::system("You are a helpful assistant")];

        let request = client.chat("Hello").with_config(&config);
        // System message should be prepended
        assert!(request.messages.len() >= 2);
        assert_eq!(request.messages[0].role, "system");
        assert_eq!(request.messages[0].content, Some("You are a helpful assistant".to_string()));
    }

    #[test]
    fn test_fluent_interface_chaining() {
        let client = LLMClient::new("test-model");

        let tools = vec![Tool {
            tool_type: "function".to_string(),
            function: Function {
                name: "test_function".to_string(),
                description: Some("Test function".to_string()),
                parameters: None,
            },
        }];

        // Test method chaining
        let request = client.chat("Hello").with_tools(tools).with_retries(3);

        assert_eq!(request.retries, 3);
        assert!(request.tools.is_some());
        assert_eq!(request.tools.as_ref().unwrap().len(), 1);
    }

    #[test]
    fn test_llm_options_builder() {
        let options = LlmOptionsBuilder::new()
            .temperature(0.7)
            .max_tokens(100)
            .top_p(0.9)
            .seed(42)
            .context_window(4096)
            .build();

        assert_eq!(options.temperature, Some(0.7));
        assert_eq!(options.max_tokens, Some(100));
        assert_eq!(options.top_p, Some(0.9));
        assert_eq!(options.seed, Some(42));
        assert_eq!(options.context_window, Some(4096));
    }

    #[test]
    fn test_message_validation() {
        let client = LLMClient::new("test-model");

        // Empty messages should fail when sent (not tested here due to HTTP dependency)
        let request = client.chat(Vec::<Message>::new());
        assert_eq!(request.messages.len(), 0);

        // Valid messages
        let messages = vec![Message::user("Test")];
        let request = client.chat(messages);
        assert_eq!(request.messages.len(), 1);
    }
}
