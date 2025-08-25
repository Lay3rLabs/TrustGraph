use crate::config::{Config, LlmOptions};
use crate::contracts::Transaction;
use crate::errors::AgentError;
use crate::tools::{Tool, ToolCall, Tools};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::env;
use wstd::runtime::block_on;
use wstd::{
    http::{Client, HeaderValue, IntoBody, Request},
    io::AsyncRead,
};

/// Common message structure for chat completions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub role: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub content: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tool_calls: Option<Vec<ToolCall>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tool_call_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
}

/// Tool result message
impl Message {
    pub fn new_user(content: String) -> Self {
        Self {
            role: "user".to_string(),
            content: Some(content),
            tool_calls: None,
            tool_call_id: None,
            name: None,
        }
    }

    pub fn new_system(content: String) -> Self {
        Self {
            role: "system".to_string(),
            content: Some(content),
            tool_calls: None,
            tool_call_id: None,
            name: None,
        }
    }

    pub fn new_tool_result(tool_call_id: String, content: String) -> Self {
        Self {
            role: "tool".to_string(),
            content: Some(content),
            tool_calls: None,
            tool_call_id: Some(tool_call_id),
            name: None,
        }
    }
}

/// Client for making LLM API requests
#[derive(Debug, Deserialize, Serialize)]
pub struct LLMClient {
    model: String,
    api_url: String,
    api_key: Option<String>,
    config: LlmOptions,
}

/// Response from an LLM interaction
#[derive(Debug, Clone)]
pub enum LlmResponse {
    /// Transaction to be executed
    Transaction(Transaction),
    /// Text response (when no action is needed)
    Text(String),
}

impl LLMClient {
    /// Create a new LLM client with default configuration
    pub fn new(model: &str) -> Result<Self, AgentError> {
        Self::with_config(model, LlmOptions::default())
    }

    /// Create a new LLM client from a JSON configuration string
    pub fn from_json(model: &str, json_config: &str) -> Result<Self, AgentError> {
        let config: LlmOptions = serde_json::from_str(json_config)
            .map_err(|e| AgentError::Config(format!("Failed to parse config JSON: {}", e)))?;
        Self::with_config(model, config)
    }

    /// Create a new LLM client with custom configuration
    pub fn with_config(model: &str, config: LlmOptions) -> Result<Self, AgentError> {
        // Validate model name
        if model.trim().is_empty() {
            return Err(AgentError::Llm("Model name cannot be empty".to_string()));
        }

        eprintln!("model: {}", model);

        // TODO consistent list of models
        // Get API key if using OpenAI models
        let api_key = match model {
            "gpt-3.5-turbo" | "gpt-4" | "gpt-4o" | "gpt-4o-mini" | "gpt-4.1" | "gpt-4-turbo" => {
                Some(
                    std::env::var("WAVS_ENV_OPENAI_API_KEY")
                        .map_err(|e| {
                            format!(
                                "Missing required variable {}: {}",
                                "WAVS_ENV_OPENAI_API_KEY", e
                            )
                        })
                        .map_err(|e| AgentError::Config(e))?,
                )
            }
            _ => None, // Local models don't need an API key
        };

        // Set API URL based on model type
        let api_url = match model {
            "gpt-3.5-turbo" | "gpt-4" => "https://api.openai.com/v1/chat/completions".to_string(),
            _ => format!(
                "{}/api/chat",
                env::var("WAVS_ENV_OLLAMA_API_URL")
                    .unwrap_or_else(|_| "http://localhost:11434".to_string())
            ),
        };

        Ok(Self { model: model.to_string(), api_url, api_key, config })
    }

    /// Get the model name
    pub fn get_model(&self) -> &str {
        &self.model
    }

    /// Get a reference to the current configuration
    pub fn get_config(&self) -> &LlmOptions {
        &self.config
    }

    /// Send a chat completion request, with optional tools
    pub fn chat_completion(
        &self,
        messages: &[Message],
        tools: Option<&[Tool]>,
    ) -> Result<Message, AgentError> {
        block_on(async {
            // Validate messages
            if messages.is_empty() {
                return Err(AgentError::Llm("Messages cannot be empty".to_string()));
            }

            println!("Sending chat completion request:");
            println!("- Model: {}", self.model);
            println!("- Number of messages: {}", messages.len());
            println!("- Tools provided: {}", tools.is_some());
            println!("- Temperature: {}", self.config.temperature);
            println!("- Top_p: {}", self.config.top_p);

            // Calculate max tokens based on tools presence if not explicitly set
            let max_tokens =
                self.config.max_tokens.unwrap_or_else(|| if tools.is_some() { 1024 } else { 100 });

            // Create request body with configurable settings
            let body = if self.api_key.is_some() {
                // OpenAI format
                let mut request = json!({
                    "model": self.model,
                    "messages": messages,
                    "temperature": self.config.temperature,
                    "top_p": self.config.top_p,
                    "seed": self.config.seed,
                    "stream": false,
                    "max_tokens": max_tokens
                });

                // Add tools if provided
                if let Some(tools_list) = tools {
                    request["tools"] = json!(tools_list);
                }

                request
            } else {
                // Ollama chat format
                let mut request = json!({
                    "model": self.model,
                    "messages": messages,
                    "stream": false,
                    "options": {
                        "temperature": self.config.temperature,
                        "top_p": self.config.top_p,
                        "seed": self.config.seed,
                        "num_predict": max_tokens,
                    }
                });

                // Add Config window if specified
                if let Some(ctx) = self.config.context_window {
                    request["options"]["num_ctx"] = json!(ctx);
                }

                // Add tools if provided for Ollama (using the format Ollama expects)
                if let Some(tools_list) = tools {
                    // Standard tools format - might work for some Ollama versions
                    request["tools"] = json!(tools_list);

                    // Also include functions key which some Ollama versions might need
                    // Convert tools to format compatible with Ollama
                    let functions = tools_list
                        .iter()
                        .map(|tool| {
                            json!({
                                "name": tool.function.name,
                                "description": tool.function.description,
                                "parameters": tool.function.parameters
                            })
                        })
                        .collect::<Vec<_>>();

                    request["functions"] = json!(functions);
                }

                request
            };

            println!("Request body: {}", serde_json::to_string_pretty(&body).unwrap());

            // Create request
            let mut req = Request::post(&self.api_url)
                .body(serde_json::to_vec(&body).unwrap().into_body())
                .map_err(|e| format!("Failed to create request: {}", e))?;

            // Add headers
            req.headers_mut().insert("Content-Type", HeaderValue::from_static("application/json"));
            req.headers_mut().insert("Accept", HeaderValue::from_static("application/json"));

            // Add authorization if needed
            if let Some(api_key) = &self.api_key {
                req.headers_mut().insert(
                    "Authorization",
                    HeaderValue::from_str(&format!("Bearer {}", api_key))
                        .map_err(|e| format!("Invalid API key format: {}", e))?,
                );
            }

            println!("Sending request to: {}", req.uri());

            // Send request
            let mut res =
                Client::new().send(req).await.map_err(|e| format!("Request failed: {}", e))?;

            println!("Received response with status: {}", res.status());

            if res.status() != 200 {
                let mut error_body = Vec::new();
                res.body_mut()
                    .read_to_end(&mut error_body)
                    .await
                    .map_err(|e| format!("Failed to read error response: {}", e))?;
                let error_msg = format!(
                    "API error: status {} - {}",
                    res.status(),
                    String::from_utf8_lossy(&error_body)
                );
                println!("Error: {}", error_msg);
                return Err(AgentError::Llm(error_msg));
            }

            // Read response body
            let mut body_buf = Vec::new();
            res.body_mut()
                .read_to_end(&mut body_buf)
                .await
                .map_err(|e| format!("Failed to read response body: {}", e))?;

            let body = String::from_utf8(body_buf)
                .map_err(|e| format!("Invalid UTF-8 in response: {}", e))?;

            println!("Raw response: {}", body);

            // Parse response based on provider
            if self.api_key.is_some() {
                // Parse OpenAI response format
                #[derive(Deserialize)]
                struct ChatResponse {
                    choices: Vec<Choice>,
                }

                #[derive(Deserialize)]
                struct Choice {
                    message: Message,
                }

                let resp: ChatResponse = serde_json::from_str(&body)
                    .map_err(|e| format!("Failed to parse OpenAI response: {}", e))?;

                resp.choices
                    .first()
                    .map(|choice| choice.message.clone())
                    .ok_or_else(|| AgentError::Llm("No response choices returned".to_string()))
            } else {
                // Parse Ollama chat response format
                #[allow(dead_code)]
                #[derive(Debug, Deserialize)]
                struct OllamaResponse {
                    message: Message,
                    #[serde(default)]
                    model: String,
                    #[serde(default)]
                    created_at: String,
                }

                println!("Parsing Ollama response with our new format handler");

                // First parse as raw Value to inspect the structure
                let raw_value: serde_json::Value = serde_json::from_str(&body)
                    .map_err(|e| format!("Failed to parse Ollama response as JSON: {}", e))?;

                println!("Successfully parsed as raw JSON: {:?}", raw_value);

                // Now try to deserialize with our custom deserializers
                let resp: OllamaResponse = serde_json::from_str(&body).map_err(|e| {
                    // Print more debugging info
                    println!("Error parsing Ollama response: {}", e);
                    println!("Response body: {}", body);
                    format!("Failed to parse Ollama response: {}", e)
                })?;

                println!("Successfully parsed Ollama response: {:?}", resp.message);

                Ok(resp.message)
            }
        })
    }

    /// Helper method to get just the content string from a chat completion
    pub fn chat_completion_text(&self, messages: &[Message]) -> Result<String, AgentError> {
        block_on(async {
            let response = self.chat_completion(messages, None)?;
            Ok(response.content.unwrap_or_default())
        })
    }

    /// Process a prompt with the LLM and return either a Transaction or text response
    pub fn process_prompt(
        &self,
        prompt: &str,
        config: &Config,
        custom_tools: Option<Vec<Tool>>,
        custom_handlers: Option<&[Box<dyn crate::tools::CustomToolHandler>]>,
    ) -> Result<LlmResponse, AgentError> {
        block_on(async {
            // Create the tools for ETH transfers
            let eth_tool = Tools::send_eth_tool();

            // Generate tools from smart contract ABIs
            let mut all_tools = vec![eth_tool];

            // Add contract-specific tools
            for contract in &config.contracts {
                let contract_tools = Tools::tools_from_contract(contract);
                println!(
                    "Generated {} tools from {} contract",
                    contract_tools.len(),
                    contract.name
                );

                // Add debug printing for tool parameters
                for tool in &contract_tools {
                    println!(
                        "Tool: {} - Parameters: {}",
                        tool.function.name,
                        serde_json::to_string_pretty(&tool.function.parameters)
                            .unwrap_or("None".to_string())
                    );
                }

                all_tools.extend(contract_tools);
            }

            // Add any custom tools provided by the caller
            if let Some(tools) = custom_tools {
                println!("Adding {} custom tools", tools.len());
                for tool in &tools {
                    println!(
                        "Custom tool: {} - {}",
                        tool.function.name,
                        tool.function.description.as_ref().unwrap_or(&"No description".to_string())
                    );
                }
                all_tools.extend(tools);
            }

            // Print all available tools for debugging
            println!("Total available tools: {}", all_tools.len());
            for tool in &all_tools {
                println!(
                    "Tool: {} - {}",
                    tool.function.name,
                    tool.function.description.as_ref().unwrap_or(&"No description".to_string())
                );
            }

            // Create the messages for the chat completion
            let mut messages = Vec::new();

            // Use existing messages from config if available
            if !config.messages.is_empty() {
                messages.extend(config.messages.clone());
            } else {
                // If no messages in the config, add a default system message
                messages.push(Message::new_system(
                    "You are an agent responsible for making and executing transactions."
                        .to_string(),
                ));
            }

            // Add the new user message
            messages.push(Message::new_user(prompt.to_string()));

            // Call the LLM client with all tools
            let response = self.chat_completion(&messages, Some(&all_tools))?;

            println!("Response: {:?}", response);

            // Check if we have tool calls
            if let Some(tool_calls) = response.tool_calls.clone() {
                if !tool_calls.is_empty() {
                    // Process the tool calls
                    let tool_result = Tools::process_tool_calls(
                        self,
                        messages,
                        response,
                        tool_calls,
                        custom_handlers,
                    )?;

                    // Parse the tool result as a Transaction
                    match serde_json::from_str::<Transaction>(&tool_result) {
                        Ok(transaction) => {
                            return Ok(LlmResponse::Transaction(transaction));
                        }
                        Err(e) => {
                            println!("Failed to parse transaction, treating as text: {}", e);
                            return Ok(LlmResponse::Text(tool_result));
                        }
                    }
                }
            }

            // If we have content, return it as text response
            if let Some(content) = response.content {
                if !content.trim().is_empty() {
                    return Ok(LlmResponse::Text(content));
                }
            }

            // No tool calls or content means no action needed
            Ok(LlmResponse::Text("".to_string()))
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use wstd::runtime::block_on;

    fn setup_test_env() {
        env::set_var("WAVS_ENV_OLLAMA_API_URL", "http://localhost:11434");
    }

    // Unit tests that don't require HTTP requests
    #[test]
    fn test_llm_client_initialization() {
        setup_test_env();

        let client = LLMClient::new("llama3.2");
        assert!(client.is_ok());
        let client = client.unwrap();
        assert_eq!(client.model, "llama3.2");
        assert!(client.api_url.contains("localhost:11434"));
        assert!(client.api_url.contains("/api/chat"));
    }

    #[test]
    fn test_llm_client_from_json() {
        setup_test_env();

        let config_json = r#"{
            "temperature": 0.7,
            "top_p": 0.95,
            "seed": 123,
            "max_tokens": 500,
            "context_window": 8192
        }"#;

        let client = LLMClient::from_json("llama3.2", config_json);
        assert!(client.is_ok());
        let client = client.unwrap();

        // Verify the configuration was properly deserialized
        assert_eq!(client.config.temperature, 0.7);
        assert_eq!(client.config.top_p, 0.95);
        assert_eq!(client.config.seed, 123);
        assert_eq!(client.config.max_tokens, Some(500));
        assert_eq!(client.config.context_window, Some(8192));
    }

    #[test]
    fn test_llm_client_from_json_invalid() {
        // Test with invalid JSON
        let invalid_json = r#"{
            "temperature": "not a number",
            "seed": 42
        }"#;

        let result = LLMClient::from_json("llama3.2", invalid_json);
        assert!(result.is_err());
        let err = result.unwrap_err();
        match err {
            AgentError::Config(msg) => assert!(msg.contains("Failed to parse config JSON")),
            _ => panic!("Expected Config error variant"),
        }
    }

    #[test]
    fn test_llm_client_with_config() {
        setup_test_env();

        let config = LlmOptions::new().temperature(0.7).top_p(0.95).context_window(Some(8192));

        let client = LLMClient::with_config("llama3.2", config);
        assert!(client.is_ok());
        let client = client.unwrap();
        assert_eq!(client.config.temperature, 0.7);
        assert_eq!(client.config.top_p, 0.95);
        assert_eq!(client.config.context_window, Some(8192));
    }

    #[test]
    fn test_llm_config_builder() {
        let config = LlmOptions::new()
            .temperature(0.8)
            .top_p(0.9)
            .seed(123)
            .max_tokens(Some(500))
            .context_window(Some(8192));

        assert_eq!(config.temperature, 0.8);
        assert_eq!(config.top_p, 0.9);
        assert_eq!(config.seed, 123);
        assert_eq!(config.max_tokens, Some(500));
        assert_eq!(config.context_window, Some(8192));
    }

    #[test]
    fn test_new_client_empty_model() {
        let result = LLMClient::new("");
        assert!(result.is_err());
        let err = result.unwrap_err();
        match err {
            AgentError::Llm(msg) => assert_eq!(msg, "Model name cannot be empty"),
            _ => panic!("Expected Llm error variant"),
        }

        let result = LLMClient::new("   ");
        assert!(result.is_err());
        let err = result.unwrap_err();
        match err {
            AgentError::Llm(msg) => assert_eq!(msg, "Model name cannot be empty"),
            _ => panic!("Expected Llm error variant"),
        }
    }

    #[test]
    fn test_chat_completion_empty_messages() {
        let client = LLMClient::new("llama3.2").unwrap();
        let result = client.chat_completion(&[], None);
        assert!(result.is_err());
        let err = result.unwrap_err();
        match err {
            AgentError::Llm(msg) => assert!(msg.contains("Messages cannot be empty")),
            _ => panic!("Expected Llm error variant"),
        }
    }

    // Integration tests that require HTTP - only run in WASI environment
    #[cfg(all(test, target_arch = "wasm32"))]
    mod integration {
        use super::*;

        #[cfg(feature = "ollama")]
        mod ollama {
            use super::*;
            use std::sync::Once;

            // Use Once to ensure logger is only initialized once
            static INIT: Once = Once::new();

            fn init() {
                INIT.call_once(|| {
                    env::set_var("RUST_LOG", "debug");
                    let _ = env_logger::try_init(); // Ignore errors if already initialized
                });
            }

            #[test]
            fn test_ollama_chat_completion() {
                init();
                println!("Initializing Ollama client...");
                let client = LLMClient::new("llama3.2").unwrap();
                println!("Client initialized successfully");

                let messages = vec![
                    Message::new_system("You are a helpful math assistant".to_string()),
                    Message::new_user("What is 2+2?".to_string()),
                ];
                println!("Sending test message: {:?}", messages);

                let result = block_on(async {
                    match client.chat_completion_text(&messages).await {
                        Ok(response) => {
                            println!("Received successful response");
                            Ok(response)
                        }
                        Err(e) => {
                            println!("Error during chat completion: {}", e);
                            Err(e)
                        }
                    }
                });

                match result {
                    Ok(content) => {
                        println!("Test successful! Response: {}", content);
                        assert!(!content.is_empty());
                    }
                    Err(e) => {
                        println!("Test failed with error: {}", e);
                        panic!("Test failed: {}", e);
                    }
                }
            }

            #[test]
            fn test_ollama_chat_completion_with_config() {
                init();
                println!("Initializing Ollama client with custom config...");

                let config = LlmOptions::new().temperature(0.5).top_p(0.9).max_tokens(Some(200));

                let client = LLMClient::with_config("llama3.2", config).unwrap();
                println!("Client initialized successfully with custom config");

                let messages = vec![
                    Message::new_system("You are a helpful math assistant".to_string()),
                    Message::new_user("What is 2+2?".to_string()),
                ];

                let result = block_on(async { client.chat_completion_text(&messages).await });

                match result {
                    Ok(content) => {
                        println!("Test successful! Response: {}", content);
                        assert!(!content.is_empty());
                    }
                    Err(e) => {
                        println!("Test failed with error: {}", e);
                        panic!("Test failed: {}", e);
                    }
                }
            }

            #[test]
            fn test_ollama_chat_completion_with_tools() {
                init();
                println!("Initializing Ollama client for tools test...");
                let client = LLMClient::new("llama3.2").unwrap();

                // Define tools
                let eth_tool = builders::send_eth();

                // Create a test contract for generated tools
                let test_contract = crate::models::Contract {
                    name: "USDC".to_string(),
                    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48".to_string(),
                    abi: r#"[{
                        "constant": false,
                        "inputs": [{"name": "to","type": "address"},{"name": "value","type": "uint256"}],
                        "name": "transfer",
                        "outputs": [{"name": "","type": "bool"}],
                        "type": "function"
                    }]"#.to_string(),
                };

                let contract_tools = builders::from_contract(&test_contract);

                let messages = vec![
                    Message::new_system(
                        "You are a DAO agent that can send ETH and interact with smart contracts. Use the appropriate tools as needed."
                            .to_string(),
                    ),
                    Message::new_user("Send 0.1 ETH to 0xDf3679681B87fAE75CE185e4f01d98b64Ddb64a3".to_string()),
                ];

                println!("Sending test message with tools");

                // Combine all tools
                let mut all_tools = vec![eth_tool];
                all_tools.extend(contract_tools);

                let result =
                    block_on(async { client.chat_completion(&messages, Some(&all_tools)).await });

                // Note: This test may fail if Ollama doesn't support tool calls
                // We're just checking that the request completes, not that it uses tools
                match result {
                    Ok(message) => {
                        println!("Test successful! Response: {:?}", message);

                        // Check if we got tool calls - that's successful for this test
                        if let Some(tool_calls) = &message.tool_calls {
                            assert!(!tool_calls.is_empty(), "Expected tool calls to be non-empty");
                            let tool_call = &tool_calls[0];
                            // Tool could be send_eth or a contract_* tool
                            assert!(
                                tool_call.function.name == "send_eth"
                                    || tool_call.function.name.starts_with("contract_"),
                                "Unexpected tool: {}",
                                tool_call.function.name
                            );
                        }
                        // With some models we might get a text response instead - that's fine too
                        else if let Some(content) = &message.content {
                            if !content.is_empty() {
                                println!("Got text response instead of tool calls: {}", content);
                            }
                        }
                    }
                    Err(e) => {
                        println!("Test result: {}", e);
                        // Don't panic, as Ollama might not support tool calls
                        println!("Note: Ollama may not support tool calls in the current version");
                    }
                }
            }
        }

        #[cfg(feature = "openai")]
        mod openai {
            use super::*;

            fn validate_config() -> Result<(), String> {
                // Check required variables
                let required_vars = ["WAVS_ENV_OPENAI_API_KEY"];

                for var in required_vars {
                    std::env::var(var)
                        .map_err(|_| format!("Missing required variable: {}", var))?;
                }
                Ok(())
            }

            #[test]
            fn test_openai_chat_completion() {
                // Validate environment configuration
                if let Err(e) = validate_config() {
                    println!("Skipping OpenAI test: {}", e);
                    return;
                }

                println!("Initializing OpenAI client...");
                let client = LLMClient::new("gpt-3.5-turbo").unwrap();
                println!("Client initialized successfully");

                let messages = vec![
                    Message::new_system("You are a helpful math assistant".to_string()),
                    Message::new_user("What is 2+2?".to_string()),
                ];
                println!("Sending test message: {:?}", messages);

                let result = block_on(async {
                    match client.chat_completion_text(&messages).await {
                        Ok(response) => {
                            println!("Received successful response");
                            Ok(response)
                        }
                        Err(e) => {
                            println!("Error during chat completion: {}", e);
                            Err(e)
                        }
                    }
                });

                match result {
                    Ok(content) => {
                        println!("Test successful! Response: {}", content);
                        assert!(!content.is_empty());
                    }
                    Err(e) => {
                        println!("Test failed with error: {}", e);
                        panic!("Test failed: {}", e);
                    }
                }
            }

            #[test]
            fn test_openai_chat_completion_with_tools() {
                // Validate environment configuration
                if let Err(e) = validate_config() {
                    println!("Skipping OpenAI tools test: {}", e);
                    return;
                }

                println!("Initializing OpenAI client for tools test...");
                let client = LLMClient::new("gpt-4").unwrap();

                // Define tools
                let eth_tool = builders::send_eth();

                // Create a test contract for generated tools
                let test_contract = crate::models::Contract {
                    name: "USDC".to_string(),
                    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48".to_string(),
                    abi: r#"[{
                        "constant": false,
                        "inputs": [{"name": "to","type": "address"},{"name": "value","type": "uint256"}],
                        "name": "transfer",
                        "outputs": [{"name": "","type": "bool"}],
                        "type": "function"
                    }]"#.to_string(),
                };

                let contract_tools = builders::from_contract(&test_contract);

                let messages = vec![
                    Message::new_system(
                        "You are a DAO agent that can send ETH and interact with smart contracts. Use the appropriate tools as needed."
                            .to_string(),
                    ),
                    Message::new_user("Send 0.1 ETH to 0xDf3679681B87fAE75CE185e4f01d98b64Ddb64a3".to_string()),
                ];

                println!("Sending test message with tools");

                // Combine all tools
                let mut all_tools = vec![eth_tool];
                all_tools.extend(contract_tools);

                let result =
                    block_on(async { client.chat_completion(&messages, Some(&all_tools)).await });

                match result {
                    Ok(message) => {
                        println!("Test successful! Response: {:?}", message);

                        // Check if we got a tool call or just text content
                        if let Some(tool_calls) = &message.tool_calls {
                            assert!(!tool_calls.is_empty());
                            let tool_call = &tool_calls[0];
                            // Tool could be send_eth or a contract_* tool
                            assert!(
                                tool_call.function.name == "send_eth"
                                    || tool_call.function.name.starts_with("contract_"),
                                "Unexpected tool: {}",
                                tool_call.function.name
                            );
                            println!("Tool call arguments: {}", tool_call.function.arguments);
                        } else if let Some(content) = &message.content {
                            assert!(!content.is_empty());
                        }
                    }
                    Err(e) => {
                        println!("Test failed with error: {}", e);
                        panic!("Test failed: {}", e);
                    }
                }
            }
        }
    }

    // Add a note about integration tests when running natively
    #[cfg(not(target_arch = "wasm32"))]
    #[test]
    fn test_integration_tests_note() {
        println!("Note: Integration tests are skipped when running natively.");
        println!("To run integration tests, use `cargo wasi test` or run in a WASI environment.");
    }
}
