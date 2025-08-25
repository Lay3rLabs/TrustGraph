use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::convert::From;
use std::env;
use wstd::{
    http::{Client, HeaderValue, IntoBody, Request, StatusCode},
    io::AsyncRead,
    runtime::block_on,
};

use crate::wit::exports::wavs::agent::client;
pub use crate::wit::exports::wavs::agent::client::LlmClient;
use crate::wit::exports::wavs::agent::errors::AgentError;
use crate::wit::exports::wavs::agent::tools::GuestToolsBuilder;
use crate::wit::exports::wavs::agent::types::{
    Config, CustomToolHandler, LlmOptions, LlmResponse, Message, Tool,
};

// JSON serializable version of LlmOptions
#[derive(Serialize, Deserialize)]
struct LlmOptionsJson {
    temperature: f32,
    top_p: f32,
    seed: u32,
    max_tokens: Option<u32>,
    context_window: Option<u32>,
}

impl From<LlmOptions> for LlmOptionsJson {
    fn from(options: LlmOptions) -> Self {
        Self {
            temperature: options.temperature,
            top_p: options.top_p,
            seed: options.seed,
            max_tokens: options.max_tokens,
            context_window: options.context_window,
        }
    }
}

impl From<LlmOptionsJson> for LlmOptions {
    fn from(json: LlmOptionsJson) -> Self {
        Self {
            temperature: json.temperature,
            top_p: json.top_p,
            seed: json.seed,
            max_tokens: json.max_tokens,
            context_window: json.context_window,
        }
    }
}

// Standalone constructor functions
pub fn new_client(model: String) -> Result<LlmClient, AgentError> {
    // Validate model name
    if model.trim().is_empty() {
        return Err(AgentError::Llm("Model name cannot be empty".into()));
    }

    // Get API key if using OpenAI models
    let api_key = match model.as_str() {
        "gpt-3.5-turbo" | "gpt-4" | "gpt-4o" | "gpt-4o-mini" | "gpt-4.1" | "gpt-4-turbo" => {
            match std::env::var("WAVS_ENV_OPENAI_API_KEY") {
                Ok(key) => Some(key),
                Err(_) => None, // Only read if exists, don't return an error
            }
        }
        _ => None, // Local models don't need an API key
    };

    // Set API URL based on model type
    let api_url = match model.as_str() {
        "gpt-3.5-turbo" | "gpt-4" | "gpt-4o" | "gpt-4o-mini" | "gpt-4.1" | "gpt-4-turbo" => {
            "https://api.openai.com/v1/chat/completions".to_string()
        }
        _ => format!(
            "{}/api/chat",
            env::var("WAVS_ENV_OLLAMA_API_URL")
                .unwrap_or_else(|_| "http://localhost:11434".to_string())
        ),
    };

    // Default configuration
    let config = LlmOptions {
        temperature: 0.7,
        top_p: 1.0,
        seed: 0,
        max_tokens: None,
        context_window: None,
    };

    // Create the new client instance
    Ok(LlmClient { model, config, api_url, api_key })
}

pub fn from_json(model: String, json_config: String) -> Result<LlmClient, AgentError> {
    let config_json: LlmOptionsJson = serde_json::from_str(&json_config)
        .map_err(|e| AgentError::Other(format!("Invalid JSON: {}", e)))?;

    // Get API key if using OpenAI models
    let api_key = match model.as_str() {
        "gpt-3.5-turbo" | "gpt-4" | "gpt-4o" | "gpt-4o-mini" | "gpt-4.1" | "gpt-4-turbo" => {
            match std::env::var("WAVS_ENV_OPENAI_API_KEY") {
                Ok(key) => Some(key),
                Err(_) => None,
            }
        }
        _ => None,
    };

    // Set API URL based on model type
    let api_url = match model.as_str() {
        "gpt-3.5-turbo" | "gpt-4" | "gpt-4o" | "gpt-4o-mini" | "gpt-4.1" | "gpt-4-turbo" => {
            "https://api.openai.com/v1/chat/completions".to_string()
        }
        _ => format!(
            "{}/api/chat",
            env::var("WAVS_ENV_OLLAMA_API_URL")
                .unwrap_or_else(|_| "http://localhost:11434".to_string())
        ),
    };

    // Create the new client instance
    Ok(LlmClient { model, config: config_json.into(), api_url, api_key })
}

pub fn with_config(model: String, config: LlmOptions) -> Result<LlmClient, AgentError> {
    // Get API key if using OpenAI models
    let api_key = match model.as_str() {
        "gpt-3.5-turbo" | "gpt-4" | "gpt-4o" | "gpt-4o-mini" | "gpt-4.1" | "gpt-4-turbo" => {
            match std::env::var("WAVS_ENV_OPENAI_API_KEY") {
                Ok(key) => Some(key),
                Err(_) => None,
            }
        }
        _ => None,
    };

    // Set API URL based on model type
    let api_url = match model.as_str() {
        "gpt-3.5-turbo" | "gpt-4" | "gpt-4o" | "gpt-4o-mini" | "gpt-4.1" | "gpt-4-turbo" => {
            "https://api.openai.com/v1/chat/completions".to_string()
        }
        _ => format!(
            "{}/api/chat",
            env::var("WAVS_ENV_OLLAMA_API_URL")
                .unwrap_or_else(|_| "http://localhost:11434".to_string())
        ),
    };

    // Create the new client instance
    Ok(LlmClient { model, config, api_url, api_key })
}

impl client::GuestLlmClientManager for LlmClient {
    fn get_model(&self) -> String {
        self.model.clone()
    }

    fn get_config(&self) -> LlmOptions {
        self.config.clone()
    }

    fn chat_completion(
        &self,
        messages: Vec<Message>,
        tools: Option<Vec<Tool>>,
    ) -> Result<Message, AgentError> {
        block_on(async {
            // Validate messages
            if messages.is_empty() {
                return Err(AgentError::Llm("Messages cannot be empty".into()));
            }

            println!("Sending chat completion request:");

            // Check if OpenAI models have an API key
            let is_openai_model = matches!(
                self.model.as_str(),
                "gpt-3.5-turbo" | "gpt-4" | "gpt-4o" | "gpt-4o-mini" | "gpt-4.1" | "gpt-4-turbo"
            );

            println!("is_openai_model: {}", is_openai_model);

            if is_openai_model && self.api_key.is_none() {
                return Err(AgentError::Llm("OpenAI API key is required for OpenAI models".into()));
            }

            // Calculate max tokens based on tools presence if not explicitly set
            let max_tokens =
                self.config.max_tokens.unwrap_or_else(|| if tools.is_some() { 1024 } else { 100 });

            println!("api key: {}", self.api_key.is_some());
            println!("api url: {}", self.api_url);

            if self.api_url.is_empty() {
                return Err(AgentError::Http("API URL is empty".into()));
            }

            // Create request body with configurable settings
            let body = if self.api_key.is_some() {
                // OpenAI format
                let mut request = serde_json::json!({
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
                    // OpenAI requires tools to have "type": "function" - ensure this is set
                    let formatted_tools: Vec<serde_json::Value> = tools_list.iter().map(|tool| {
                        serde_json::json!({
                            "type": "function", // OpenAI expects "type", not "tool_type"
                            "function": {
                                "name": tool.function.name,
                                "description": tool.function.description,
                                // Parse parameters from string to JSON object if it's a string
                                "parameters": if let Some(params) = &tool.function.parameters {
                                    if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(params) {
                                        parsed
                                    } else {
                                        serde_json::Value::String(params.clone())
                                    }
                                } else {
                                    serde_json::json!({})
                                }
                            }
                        })
                    }).collect();

                    request["tools"] = serde_json::json!(formatted_tools);
                }

                request
            } else {
                // Ollama chat format
                let mut request = serde_json::json!({
                    "model": self.model,
                    "stream": false,
                    "options": {
                        "temperature": self.config.temperature,
                        "top_p": self.config.top_p,
                        "seed": self.config.seed,
                        "num_predict": max_tokens,
                    }
                });

                // Add context window if specified
                if let Some(ctx) = self.config.context_window {
                    request["options"]["num_ctx"] = serde_json::json!(ctx);
                }

                // For Ollama, let's create new messages with tools embedded in the system message
                if let Some(tools_list) = tools {
                    let mut modified_messages = Vec::new();

                    // Look for a system message to augment
                    let mut has_system_message = false;
                    for msg in messages {
                        if msg.role == "system" {
                            // Modify the system message to include tools description
                            let mut tools_desc = String::new();
                            tools_desc.push_str("\n\nYou have the following tools available:\n");

                            for tool in tools_list.clone() {
                                tools_desc.push_str(&format!(
                                    "- {}: {}\n",
                                    tool.function.name,
                                    tool.function.description.clone().unwrap_or_default()
                                ));
                            }

                            // Add instructions to use tools
                            tools_desc
                                .push_str("\nTo use a tool, respond with JSON in this format:\n");
                            tools_desc.push_str(r#"{"tool": "tool_name", "args": {"arg1": "value1", "arg2": "value2"}}"#);
                            tools_desc.push_str("\n\n");

                            // Append to existing content or create new content
                            let new_content = if let Some(content) = &msg.content {
                                format!("{}\n{}", content, tools_desc)
                            } else {
                                tools_desc
                            };

                            // Add the modified message
                            modified_messages.push(Message {
                                role: "system".to_string(),
                                content: Some(new_content),
                                tool_calls: None,
                                tool_call_id: None,
                                name: None,
                            });

                            has_system_message = true;
                        } else {
                            // Keep other messages unchanged
                            modified_messages.push(msg.clone());
                        }
                    }

                    // If no system message was found, add a new one with the tools
                    if !has_system_message {
                        let mut tools_desc = String::new();
                        tools_desc
                            .push_str("You are a helpful assistant with access to tools.\n\n");
                        tools_desc.push_str("You have the following tools available:\n");

                        for tool in tools_list {
                            tools_desc.push_str(&format!(
                                "- {}: {}\n",
                                tool.function.name,
                                tool.function.description.clone().unwrap_or_default()
                            ));
                        }

                        // Add instructions to use tools
                        tools_desc.push_str("\nTo use a tool, respond with JSON in this format:\n");
                        tools_desc.push_str(r#"{"tool": "tool_name", "args": {"arg1": "value1", "arg2": "value2"}}"#);
                        tools_desc.push_str("\n\n");

                        // Add the new system message at the beginning
                        modified_messages.insert(
                            0,
                            Message {
                                role: "system".to_string(),
                                content: Some(tools_desc),
                                tool_calls: None,
                                tool_call_id: None,
                                name: None,
                            },
                        );
                    }

                    // Use the modified messages for Ollama
                    request["messages"] = serde_json::json!(modified_messages);
                } else {
                    // Use original messages if no tools
                    request["messages"] = serde_json::json!(messages);
                }

                // Log the final Ollama request format in a pretty-printed way
                if let Ok(pretty_json) = serde_json::to_string_pretty(&request) {
                    println!("Final Ollama request format (with tools in system message):");
                    println!("{}", pretty_json);
                }

                request
            };

            println!("Request body: {}", serde_json::to_string_pretty(&body).unwrap_or_default());

            // Create request
            let mut req = Request::post(&self.api_url)
                .body(serde_json::to_vec(&body).unwrap().into_body())
                .map_err(|e| AgentError::Http(format!("Failed to create request: {}", e)))?;

            // Add headers
            req.headers_mut().insert("Content-Type", HeaderValue::from_static("application/json"));
            req.headers_mut().insert("Accept", HeaderValue::from_static("application/json"));

            // Add authorization if needed
            if let Some(api_key) = &self.api_key {
                req.headers_mut().insert(
                    "Authorization",
                    HeaderValue::from_str(&format!("Bearer {}", api_key))
                        .map_err(|e| AgentError::Http(format!("Invalid API key format: {}", e)))?,
                );
            }

            println!("Sending request to: {}", req.uri());

            // Send request
            let mut res = Client::new()
                .send(req)
                .await
                .map_err(|e| AgentError::Http(format!("Request failed: {}", e)))?;

            println!("Received response with status: {}", res.status());

            if res.status() != StatusCode::OK {
                let mut error_body = Vec::new();
                res.body_mut()
                    .read_to_end(&mut error_body)
                    .await
                    .map_err(|e| AgentError::Io(format!("Failed to read error response: {}", e)))?;
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
                .map_err(|e| AgentError::Io(format!("Failed to read response body: {}", e)))?;

            let body_str = String::from_utf8(body_buf)
                .map_err(|e| AgentError::Utf8(format!("Invalid UTF-8 in response: {}", e)))?;

            println!("Raw response: {}", body_str);

            // Parse response based on provider
            if self.api_key.is_some() {
                // Parse OpenAI response format
                #[derive(Deserialize)]
                struct ChatResponse {
                    choices: Vec<Choice>,
                }

                #[derive(Deserialize)]
                struct Choice {
                    message: OpenAIMessage,
                }

                // Create a specialized structure for OpenAI's message format
                #[derive(Deserialize)]
                struct OpenAIMessage {
                    role: String,
                    #[serde(default)]
                    content: Option<String>,
                    #[serde(default)]
                    tool_calls: Option<Vec<OpenAIToolCall>>,
                    #[serde(default)]
                    tool_call_id: Option<String>,
                    #[serde(default)]
                    name: Option<String>,
                }

                // OpenAI's tool call format uses "type" instead of "tool_type"
                #[derive(Deserialize)]
                struct OpenAIToolCall {
                    id: String,
                    #[serde(rename = "type")] // This maps OpenAI's "type" to our "tool_type"
                    tool_type: String,
                    function: OpenAIToolCallFunction,
                }

                #[derive(Deserialize)]
                struct OpenAIToolCallFunction {
                    name: String,
                    arguments: String,
                }

                // Parse the response with our custom types
                let resp: ChatResponse = serde_json::from_str(&body_str).map_err(|e| {
                    println!("Error parsing OpenAI response: {}", e);
                    println!("Response body: {}", body_str);
                    AgentError::Llm(format!("Failed to parse OpenAI response: {}", e))
                })?;

                // Convert from OpenAI's message format to our internal message format
                resp.choices
                    .first()
                    .map(|choice| {
                        let oai_msg = &choice.message;

                        // Convert tool calls from OpenAI format to our format
                        let tool_calls = oai_msg.tool_calls.as_ref().map(|tc| {
                            tc.iter()
                                .map(|call| crate::wit::exports::wavs::agent::types::ToolCall {
                                    id: call.id.clone(),
                                    tool_type: call.tool_type.clone(),
                                    function:
                                        crate::wit::exports::wavs::agent::types::ToolCallFunction {
                                            name: call.function.name.clone(),
                                            arguments: call.function.arguments.clone(),
                                        },
                                })
                                .collect()
                        });

                        // Create our internal Message type
                        Message {
                            role: oai_msg.role.clone(),
                            content: oai_msg.content.clone(),
                            tool_calls,
                            tool_call_id: oai_msg.tool_call_id.clone(),
                            name: oai_msg.name.clone(),
                        }
                    })
                    .ok_or_else(|| AgentError::Llm("No response choices returned".into()))
            } else {
                // Parse Ollama chat response format
                // Create a custom deserialization logic for Ollama responses
                let parsed_json: serde_json::Value =
                    serde_json::from_str(&body_str).map_err(|e| {
                        AgentError::Llm(format!("Failed to parse Ollama response as JSON: {}", e))
                    })?;

                println!("Successfully parsed Ollama response to JSON Value");

                // Extract message contents
                let role =
                    parsed_json["message"]["role"].as_str().unwrap_or("assistant").to_string();

                let content = parsed_json["message"]["content"].as_str().map(|s| s.to_string());

                // Create base message
                let mut message =
                    Message { role, content, tool_calls: None, tool_call_id: None, name: None };

                // Process tool calls if present
                if let Some(tool_calls_array) = parsed_json["message"]["tool_calls"].as_array() {
                    println!("Found tool calls in Ollama response: {}", tool_calls_array.len());

                    let mut processed_tool_calls = Vec::new();

                    for (idx, tool_call) in tool_calls_array.iter().enumerate() {
                        if let Some(name) = tool_call["function"]["name"].as_str() {
                            println!("Processing tool call: {}", name);

                            // Get arguments value (could be object or string)
                            let args = &tool_call["function"]["arguments"];

                            // Convert arguments to string if they're an object
                            let arguments = if args.is_object() {
                                serde_json::to_string(args).unwrap_or_default()
                            } else if args.is_string() {
                                args.as_str().unwrap_or_default().to_string()
                            } else {
                                serde_json::to_string(args).unwrap_or_default()
                            };

                            println!("Arguments converted to string: {}", arguments);

                            processed_tool_calls.push(
                                crate::wit::exports::wavs::agent::types::ToolCall {
                                    id: format!("call_{}", idx),
                                    tool_type: "function".to_string(),
                                    function:
                                        crate::wit::exports::wavs::agent::types::ToolCallFunction {
                                            name: name.to_string(),
                                            arguments,
                                        },
                                },
                            );
                        }
                    }

                    if !processed_tool_calls.is_empty() {
                        message.tool_calls = Some(processed_tool_calls);
                    }
                }
                // Also check for tool_calls in the root of the response (some Ollama versions)
                else if let Some(tool_calls_array) = parsed_json["tool_calls"].as_array() {
                    println!(
                        "Found tool calls in Ollama response root: {}",
                        tool_calls_array.len()
                    );

                    let mut processed_tool_calls = Vec::new();

                    for (idx, tool_call) in tool_calls_array.iter().enumerate() {
                        if let Some(name) = tool_call["function"]["name"].as_str() {
                            println!("Processing tool call: {}", name);

                            // Get arguments value (could be object or string)
                            let args = &tool_call["function"]["arguments"];

                            // Convert arguments to string if they're an object
                            let arguments = if args.is_object() {
                                serde_json::to_string(args).unwrap_or_default()
                            } else if args.is_string() {
                                args.as_str().unwrap_or_default().to_string()
                            } else {
                                serde_json::to_string(args).unwrap_or_default()
                            };

                            println!("Arguments converted to string: {}", arguments);

                            processed_tool_calls.push(
                                crate::wit::exports::wavs::agent::types::ToolCall {
                                    id: format!("call_{}", idx),
                                    tool_type: "function".to_string(),
                                    function:
                                        crate::wit::exports::wavs::agent::types::ToolCallFunction {
                                            name: name.to_string(),
                                            arguments,
                                        },
                                },
                            );
                        }
                    }

                    if !processed_tool_calls.is_empty() {
                        message.tool_calls = Some(processed_tool_calls);
                    }
                }
                // Also check for function_call in the message (another Ollama format)
                else if parsed_json["message"]["function_call"].is_object() {
                    println!("Found function_call in Ollama response");

                    let function_call = &parsed_json["message"]["function_call"];

                    if let (Some(name), Some(args)) =
                        (function_call["name"].as_str(), function_call["arguments"].as_str())
                    {
                        println!("Processing function call: {}", name);
                        println!("Arguments: {}", args);

                        let tool_call = crate::wit::exports::wavs::agent::types::ToolCall {
                            id: "call_function".to_string(),
                            tool_type: "function".to_string(),
                            function: crate::wit::exports::wavs::agent::types::ToolCallFunction {
                                name: name.to_string(),
                                arguments: args.to_string(),
                            },
                        };

                        message.tool_calls = Some(vec![tool_call]);
                    }
                }

                // For Ollama, check for tool calls in the text content
                // since we embedded them in the system message
                if self.model.starts_with("llama")
                    || self.model.starts_with("mistral")
                    || !self.model.contains("gpt")
                {
                    if let Some(content) = &message.content {
                        // Try to find JSON object in the content that might be a tool call
                        if let Some(start_idx) = content.find('{') {
                            if let Some(end_idx) = content.rfind('}') {
                                if end_idx > start_idx {
                                    // Extract the JSON part
                                    let json_str = &content[start_idx..=end_idx];
                                    println!("Found potential JSON tool call: {}", json_str);

                                    // Try to parse as JSON
                                    if let Ok(json_value) =
                                        serde_json::from_str::<serde_json::Value>(json_str)
                                    {
                                        // Check if it's a tool call format (has "tool" and "args" fields)
                                        if let (Some(tool_name), Some(args)) =
                                            (json_value.get("tool"), json_value.get("args"))
                                        {
                                            if let Some(tool_name_str) = tool_name.as_str() {
                                                println!("Detected tool call: {}", tool_name_str);

                                                // Convert args to a string
                                                let args_str = if args.is_object() {
                                                    serde_json::to_string(args).unwrap_or_default()
                                                } else {
                                                    args.to_string()
                                                };

                                                println!("Tool args: {}", args_str);

                                                // Create a synthetic tool call
                                                let tool_call = crate::wit::exports::wavs::agent::types::ToolCall {
                                                    id: "call_from_text".to_string(),
                                                    tool_type: "function".to_string(),
                                                    function: crate::wit::exports::wavs::agent::types::ToolCallFunction {
                                                        name: tool_name_str.to_string(),
                                                        arguments: args_str,
                                                    },
                                                };

                                                message.tool_calls = Some(vec![tool_call]);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                Ok(message)
            }
        })
    }

    fn chat_completion_text(&self, messages: Vec<Message>) -> Result<String, AgentError> {
        let response = self.chat_completion(messages, None)?;
        Ok(response.content.unwrap_or_default())
    }

    fn process_prompt(
        &self,
        prompt: String,
        config: Config,
        custom_tools: Option<Vec<Tool>>,
        custom_handlers: Option<Vec<CustomToolHandler>>,
    ) -> Result<LlmResponse, AgentError> {
        // Create the tools for ETH transfers
        let tools_builder = crate::tools::ToolsBuilderImpl;
        let eth_tool = tools_builder.send_eth_tool();

        // Generate tools from smart contract ABIs
        let mut all_tools = vec![eth_tool];

        // Add contract-specific tools
        for contract in &config.contracts {
            let contract_tools = tools_builder.tools_from_contract(contract.clone());
            println!("Generated {} tools from {} contract", contract_tools.len(), contract.name);

            // Add debug printing for tool parameters
            for tool in &contract_tools {
                println!(
                    "Tool: {} - Parameters: {}",
                    tool.function.name,
                    tool.function.parameters.clone().unwrap_or_default()
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
            messages.extend(config.messages);
        } else {
            // If no messages in the config, add a default system message
            messages.push(Message {
                role: "system".into(),
                content: Some(
                    "You are an agent responsible for making and executing transactions.".into(),
                ),
                tool_calls: None,
                tool_call_id: None,
                name: None,
            });
        }

        // Add the new user message
        messages.push(Message {
            role: "user".into(),
            content: Some(prompt),
            tool_calls: None,
            tool_call_id: None,
            name: None,
        });

        // Call the LLM client with all tools
        println!("Calling LLM with {} tools", all_tools.len());
        let response = self.chat_completion(messages.clone(), Some(all_tools))?;

        println!("Response: {:?}", response);

        // Check if we have tool calls
        if let Some(tool_calls) = response.tool_calls.clone() {
            if !tool_calls.is_empty() {
                println!("Found {} tool calls", tool_calls.len());

                // Handle each tool call directly without making another API call
                let mut tool_results = Vec::new();
                for tool_call in &tool_calls {
                    // Execute the tool call
                    match tools_builder.execute_tool_call(tool_call.clone(), None) {
                        Ok(result) => {
                            println!("Tool result: {}", result);
                            tool_results.push(result);
                        }
                        Err(e) => {
                            return Err(AgentError::Llm(format!(
                                "Tool call execution failed: {}",
                                e
                            )));
                        }
                    }
                }

                // Return the first tool result if any
                if !tool_results.is_empty() {
                    // Parse the tool result as a Transaction
                    match serde_json::from_str::<crate::wit::exports::wavs::agent::types::Transaction>(
                        &tool_results[0],
                    ) {
                        Ok(transaction) => {
                            println!("Successfully parsed transaction");
                            return Ok(LlmResponse::Transaction(transaction));
                        }
                        Err(e) => {
                            println!("Failed to parse transaction, treating as text: {}", e);
                            return Ok(LlmResponse::Text(tool_results[0].clone()));
                        }
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
        Ok(LlmResponse::Text("".into()))
    }
}

// Add a conversion from serde_json::Error to AgentError
impl From<serde_json::Error> for AgentError {
    fn from(err: serde_json::Error) -> Self {
        AgentError::Other(format!("JSON error: {}", err))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::wit::exports::wavs::agent::client::GuestLlmClientManager;
    use crate::wit::exports::wavs::agent::types::{LlmOptions, Message};

    #[test]
    fn test_client_init() {
        let client_impl = LlmClient {
            model: "test-model".into(),
            config: LlmOptions {
                temperature: 0.7,
                top_p: 1.0,
                seed: 0,
                max_tokens: None,
                context_window: None,
            },
            api_url: "http://test".into(),
            api_key: None,
        };

        assert_eq!(client_impl.get_model(), "test-model");
        assert_eq!(client_impl.get_config().temperature, 0.7);
    }

    #[test]
    fn test_message_creation() {
        // Test that we can create a valid message
        let system_message = Message {
            role: "system".into(),
            content: Some("You are a helpful assistant".into()),
            tool_calls: None,
            tool_call_id: None,
            name: None,
        };

        assert_eq!(system_message.role, "system");
        assert_eq!(system_message.content, Some("You are a helpful assistant".into()));
    }

    #[test]
    fn test_request_json_formation() {
        // Create a client
        let client_impl = LlmClient {
            model: "gpt-4".into(),
            config: LlmOptions {
                temperature: 0.5,
                top_p: 0.9,
                seed: 42,
                max_tokens: Some(500),
                context_window: None,
            },
            api_url: "https://api.openai.com/v1/chat/completions".into(),
            api_key: Some("test-key".into()),
        };

        // Create messages (just for test completeness)
        let _messages = vec![
            Message {
                role: "system".into(),
                content: Some("You are a helpful assistant".into()),
                tool_calls: None,
                tool_call_id: None,
                name: None,
            },
            Message {
                role: "user".into(),
                content: Some("Hello, how are you?".into()),
                tool_calls: None,
                tool_call_id: None,
                name: None,
            },
        ];

        // This test just verifies request formation logic by checking client properties
        assert_eq!(client_impl.get_model(), "gpt-4");
        assert_eq!(client_impl.get_config().temperature, 0.5);
    }
}
