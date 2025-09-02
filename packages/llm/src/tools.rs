use crate::client::{LLMClient, Message};
use crate::contracts::{Contract, ContractCall, Transaction};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use wstd::runtime::block_on;

/// Function parameter for tool calls
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FunctionParameter {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(rename = "type", skip_serializing_if = "Option::is_none")]
    pub parameter_type: Option<String>,
}

/// Function definition for tool calls
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Function {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parameters: Option<serde_json::Value>,
}

/// Tool definition for chat completions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tool {
    #[serde(rename = "type")]
    pub tool_type: String,
    pub function: Function,
}

/// Tool call for chat completions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolCall {
    #[serde(default = "default_tool_id")]
    pub id: String,
    #[serde(rename = "type")]
    #[serde(default = "default_tool_type")]
    pub tool_type: String,
    pub function: ToolCallFunction,
}

/// Function call details
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolCallFunction {
    pub name: String,
    #[serde(default)]
    #[serde(deserialize_with = "deserialize_arguments")]
    pub arguments: String,
}

/// Custom deserializer for function arguments that can be either a string or an object
fn deserialize_arguments<'de, D>(deserializer: D) -> Result<String, D::Error>
where
    D: serde::Deserializer<'de>,
{
    use serde::de::Error;
    use serde_json::Value;

    // First try to deserialize as a Value to handle both string and object
    let value = Value::deserialize(deserializer)?;

    match value {
        // If it's already a string, return it directly
        Value::String(s) => Ok(s),

        // If it's an object, convert it to a JSON string
        Value::Object(_) => serde_json::to_string(&value)
            .map_err(|e| D::Error::custom(format!("Failed to serialize object to string: {}", e))),

        // For any other type, try to convert to string representation
        _ => serde_json::to_string(&value)
            .map_err(|e| D::Error::custom(format!("Failed to serialize value to string: {}", e))),
    }
}

pub struct Tools;

impl Tools {
    /// Create a tool to send ETH through the DAO's Safe
    pub fn send_eth_tool() -> Tool {
        Tool {
            tool_type: "function".to_string(),
            function: Function {
                name: "send_eth".to_string(),
                description: Some("Send ETH through the DAO's Gnosis Safe".to_string()),
                parameters: Some(json!({
                    "type": "object",
                    "properties": {
                        "to": {
                            "type": "string",
                            "description": "Destination address (0x...)"
                        },
                        "value": {
                            "type": "string",
                            "description": "Amount in wei to send (as string)"
                        },
                        "data": {
                            "type": "string",
                            "description": "Hex-encoded transaction data, usually '0x' for simple transfers"
                        },
                        "description": {
                            "type": "string",
                            "description": "Description of the transaction"
                        }
                    },
                    "required": ["to", "value"]
                })),
            },
        }
    }

    /// Generate a tool from a smart contract's ABI
    pub fn tools_from_contract(contract: &Contract) -> Vec<Tool> {
        let mut tools = Vec::new();
        println!("Generating tools from contract: {}", contract.name);
        // Parse the ABI
        let abi_value: Result<serde_json::Value, _> = serde_json::from_str(&contract.abi);
        if abi_value.is_err() {
            println!("Failed to parse ABI: {:?}", abi_value.err());
            return tools;
        }

        let abi = abi_value.unwrap();

        println!("ABI: {:?}", abi);
        // ABI can be either an array or an object with an "abi" field
        let functions = if abi.is_array() {
            abi.as_array().unwrap()
        } else if abi.is_object() && abi.get("abi").is_some() && abi["abi"].is_array() {
            abi["abi"].as_array().unwrap()
        } else {
            println!("Unexpected ABI format");
            return tools;
        };

        println!("Functions: {:?}", functions);

        // Process each function in the ABI
        for func in functions {
            // Skip if not a function or is not externally callable
            // Handle both newer ABIs with stateMutability and older ABIs with constant field
            if !func.is_object()
                || func.get("type").is_none()
                || func["type"] != "function"
                || (func.get("stateMutability").is_none() && func.get("constant").is_none())
                || (func.get("stateMutability").is_some()
                    && func["stateMutability"] != "nonpayable"
                    && func["stateMutability"] != "payable")
                || (func.get("constant").is_some() && func["constant"] == true)
            {
                continue;
            }

            let name = match func.get("name") {
                Some(n) if n.is_string() => n.as_str().unwrap(),
                _ => continue, // Skip if no valid name
            };

            // Create properties for the function inputs
            let mut properties = json!({});
            let mut required = Vec::new();

            // Add value field for payable functions
            if func["stateMutability"] == "payable" {
                properties["value"] = json!({
                    "type": "string",
                    "description": "Amount of ETH to send with the call (in wei)"
                });
                required.push("value");
            }

            // Process function inputs
            if let Some(inputs) = func.get("inputs").and_then(|i| i.as_array()) {
                for input in inputs {
                    if let (Some(param_name), Some(param_type)) = (
                        input.get("name").and_then(|n| n.as_str()),
                        input.get("type").and_then(|t| t.as_str()),
                    ) {
                        // Only skip empty param names
                        if param_name.is_empty() {
                            continue;
                        }

                        // Convert Solidity type to JSON Schema type
                        let (json_type, format) = Self::solidity_type_to_json_schema(param_type);

                        let mut param_schema = json!({
                            "type": json_type,
                            "description": format!("{} ({})", param_name, param_type)
                        });

                        // Add format if specified
                        if let Some(fmt) = format {
                            param_schema["format"] = json!(fmt);
                        }

                        properties[param_name] = param_schema;
                        required.push(param_name);
                    }
                }
            }

            // Create the tool for this function
            let tool_name = format!("contract_{}_{}", contract.name.to_lowercase(), name);
            let tool = Tool {
                tool_type: "function".to_string(),
                function: Function {
                    name: tool_name.clone(),
                    description: Some(format!(
                        "Call the {} function on the {} contract at {}",
                        name, contract.name, contract.address
                    )),
                    parameters: Some(json!({
                        "type": "object",
                        "properties": properties,
                        "required": required
                    })),
                },
            };

            tools.push(tool);
        }

        tools
    }

    /// Convert Solidity type to JSON Schema type
    fn solidity_type_to_json_schema(solidity_type: &str) -> (&'static str, Option<&'static str>) {
        match solidity_type {
            t if t.starts_with("uint") => ("string", None), // Use string for all integers to handle large numbers
            t if t.starts_with("int") => ("string", None),
            "address" => ("string", Some("ethereum-address")),
            "bool" => ("boolean", None),
            "string" => ("string", None),
            t if t.starts_with("bytes") => ("string", Some("byte")),
            _ => ("string", None), // Default to string for unknown types
        }
    }

    /// Create a custom tool with the specified name, description, and parameters
    ///
    /// # Example
    /// ```
    /// use serde_json::json;
    /// use wavs_llm::tools::Tools;
    ///
    /// let weather_tool = Tools::custom_tool(
    ///     "get_weather",
    ///     "Get the current weather for a location",
    ///     json!({
    ///         "type": "object",
    ///         "properties": {
    ///             "location": {
    ///                 "type": "string",
    ///                 "description": "The city name or zip code"
    ///             }
    ///         },
    ///         "required": ["location"]
    ///     })
    /// );
    /// ```
    pub fn custom_tool(name: &str, description: &str, parameters: serde_json::Value) -> Tool {
        Tool {
            tool_type: "function".to_string(),
            function: Function {
                name: name.to_string(),
                description: Some(description.to_string()),
                parameters: Some(parameters),
            },
        }
    }

    /// Execute a tool call and return the result
    pub fn execute_tool_call(
        tool_call: &ToolCall,
        custom_handlers: Option<&[Box<dyn CustomToolHandler>]>,
    ) -> Result<String, String> {
        let function_name = &tool_call.function.name;

        // First, check if any custom handlers can handle this tool
        if let Some(handlers) = custom_handlers {
            for handler in handlers {
                if handler.can_handle(function_name) {
                    return handler.execute(tool_call);
                }
            }
        }

        // If no custom handlers or none matched, use built-in handlers
        match function_name.as_str() {
            "send_eth" => Self::parse_eth_transaction(tool_call),
            // Handle dynamically generated contract tools
            _ if function_name.starts_with("contract_") => {
                Self::parse_contract_function_call(tool_call)
            }
            _ => Err(format!("Unknown tool: {}", function_name)),
        }
    }

    /// Parse an ETH transaction from tool call
    pub fn parse_eth_transaction(tool_call: &ToolCall) -> Result<String, String> {
        // Parse the tool call arguments
        let args: Value = serde_json::from_str(&tool_call.function.arguments)
            .map_err(|e| format!("Failed to parse transaction arguments: {}", e))?;

        // Create a Transaction from the arguments with default values for optional fields
        let transaction = Transaction {
            to: args["to"].as_str().ok_or("Missing 'to' field")?.to_string(),
            value: args["value"].as_str().ok_or("Missing 'value' field")?.to_string(),
            data: args["data"].as_str().unwrap_or("0x").to_string(),
            description: args["description"].as_str().unwrap_or("ETH transfer").to_string(),
            contract_call: None,
        };

        // Serialize back to a string for passing between functions
        let tx_json = serde_json::to_string(&transaction)
            .map_err(|e| format!("Failed to serialize transaction: {}", e))?;

        Ok(tx_json)
    }

    /// Parse a contract function call from a dynamic tool
    fn parse_contract_function_call(tool_call: &ToolCall) -> Result<String, String> {
        // Extract contract name and function from the tool name
        // Format is "contract_{contract_name}_{function_name}"
        let parts: Vec<&str> = tool_call.function.name.splitn(3, '_').collect();
        if parts.len() < 3 {
            return Err(format!("Invalid contract tool name: {}", tool_call.function.name));
        }

        let contract_name = parts[1];
        let function_name = parts[2];

        // Parse the arguments
        let args: Value = serde_json::from_str(&tool_call.function.arguments)
            .map_err(|e| format!("Failed to parse function arguments: {}", e))?;

        // Get the contract from context to check ABI
        let context = crate::config::Config::default();
        let contract = context
            .get_contract_by_name(contract_name)
            .ok_or_else(|| format!("Unknown contract: {}", contract_name))?;

        // Check if this function is payable by examining the ABI
        let is_payable = contract.abi.contains(&format!("\"name\":\"{}\",", function_name))
            && contract.abi.contains("\"stateMutability\":\"payable\"");

        // Extract args for the function call
        let mut function_args = Vec::new();
        let mut value = "0".to_string();

        // Collect all args except 'value' (for ETH transfers)
        for (key, val) in args.as_object().unwrap() {
            if key == "value" {
                // For ERC20 transfers and other nonpayable functions, include "value"
                // as a function argument but don't set ETH value
                function_args.push(val.clone());

                // Only set transaction ETH value for payable functions
                if is_payable {
                    value = val.as_str().unwrap_or("0").to_string();
                }
            } else {
                function_args.push(val.clone());
            }
        }

        // Create contract call
        let contract_call =
            Some(ContractCall { function: function_name.to_string(), args: function_args });

        // Create a Transaction targeting the contract
        let transaction = Transaction {
            to: contract.address.clone(),
            value,
            data: "0x".to_string(), // Will be encoded by the execution layer
            description: format!("Calling {} on {} contract", function_name, contract_name),
            contract_call,
        };

        // Serialize to JSON
        let tx_json = serde_json::to_string(&transaction)
            .map_err(|e| format!("Failed to serialize transaction: {}", e))?;

        Ok(tx_json)
    }

    /// Process tool calls and generate a response
    pub fn process_tool_calls(
        client: &LLMClient,
        initial_messages: Vec<Message>,
        response: Message,
        tool_calls: Vec<ToolCall>,
        custom_handlers: Option<&[Box<dyn CustomToolHandler>]>,
    ) -> Result<String, String> {
        block_on(async {
            println!("Processing tool calls...");

            // Check if we're using Ollama based on the model name
            let model = client.get_model();
            // TODO: This is a hack and could be improved
            let is_ollama = model.starts_with("llama")
                || model.starts_with("mistral")
                || !model.contains("gpt");

            // Process each tool call and collect the results
            let mut tool_results = Vec::new();
            for tool_call in &tool_calls {
                let tool_result = Self::execute_tool_call(tool_call, custom_handlers)?;
                println!("Tool result: {}", tool_result);
                tool_results.push(tool_result);
            }

            if is_ollama {
                // For Ollama: Don't make a second call, just use the tool result directly
                println!("Using direct tool result handling for Ollama");

                if tool_results.len() == 1 {
                    Ok(tool_results[0].clone())
                } else {
                    // For multiple tool calls, combine the results
                    Ok(tool_results.join("\n"))
                }
            } else {
                // For OpenAI: Use the standard tool calls protocol
                println!("Using OpenAI-compatible tool call handling");
                let mut tool_messages = initial_messages.clone();

                // Add the assistant's response with tool calls, ensuring content is not null
                // When we're sending tool calls, OpenAI requires content to be a string (even if empty)
                // We MUST preserve the original tool_calls so OpenAI can match the tool responses
                let sanitized_response = Message {
                    role: response.role,
                    content: Some(response.content.unwrap_or_default()),
                    tool_calls: Some(tool_calls.clone()), // Important: preserve the tool_calls!
                    tool_call_id: response.tool_call_id,
                    name: response.name,
                };
                tool_messages.push(sanitized_response);

                // Process each tool call and add the results
                for (i, tool_call) in tool_calls.iter().enumerate() {
                    tool_messages.push(Message::tool_result(
                        tool_call.id.clone(),
                        tool_call.function.name.clone(),
                        tool_results[i].clone(),
                    ));
                }

                // Call OpenAI to get final response, but we don't use it for parsing
                // It's mainly for human readable confirmation
                let final_response = client.chat(tool_messages.clone()).text();
                println!("OpenAI final response (for logs only): {:?}", final_response);

                // Return the original tool result which contains valid JSON
                // Only handle the first tool result for now since we expect a single transaction
                if tool_results.len() >= 1 {
                    Ok(tool_results[0].clone())
                } else {
                    Err("No tool results available".to_string())
                }
            }
        })
    }
}

// TODO make WIT resource
/// Handler for custom tool calls
pub trait CustomToolHandler {
    /// Returns true if this handler can handle the given tool name
    fn can_handle(&self, tool_name: &str) -> bool;

    /// Execute the tool call and return a result
    fn execute(&self, tool_call: &ToolCall) -> Result<String, String>;
}

/// Default function for tool ID
fn default_tool_id() -> String {
    use std::sync::atomic::{AtomicU64, Ordering};

    // Use a static counter to ensure unique, sequential IDs
    static COUNTER: AtomicU64 = AtomicU64::new(1);

    // Get the next ID and increment the counter
    let id = COUNTER.fetch_add(1, Ordering::SeqCst);

    // Format as a predictable string
    format!("call_{:016x}", id)
}

/// Default function for tool type
fn default_tool_type() -> String {
    "function".to_string()
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_tool_definition() {
        // Create a test tool
        let tool = Tool {
            tool_type: "function".to_string(),
            function: Function {
                name: "test_tool".to_string(),
                description: Some("A test tool".to_string()),
                parameters: Some(json!({
                    "type": "object",
                    "properties": {
                        "param1": {
                            "type": "string",
                            "description": "A test parameter"
                        },
                        "param2": {
                            "type": "number",
                            "description": "Another test parameter"
                        }
                    },
                    "required": ["param1"]
                })),
            },
        };

        // Validate Tool serialization
        let serialized = serde_json::to_string(&tool).unwrap();
        let deserialized: Tool = serde_json::from_str(&serialized).unwrap();

        assert_eq!(deserialized.function.name, "test_tool");
        assert_eq!(deserialized.function.description, Some("A test tool".to_string()));
        assert!(deserialized.function.parameters.is_some());
        assert_eq!(deserialized.tool_type, "function");
    }

    #[test]
    fn test_message_creation() {
        // Test system message
        let system_msg = Message::system("System message test".to_string());
        assert_eq!(system_msg.role, "system");
        assert_eq!(system_msg.content.unwrap(), "System message test");
        assert!(system_msg.tool_calls.is_none());

        // Test user message
        let user_msg = Message::user("User message test".to_string());
        assert_eq!(user_msg.role, "user");
        assert_eq!(user_msg.content.unwrap(), "User message test");
        assert!(user_msg.tool_calls.is_none());

        // Test assistant message
        let assistant_msg = Message::assistant("Assistant message test".to_string());
        assert_eq!(assistant_msg.role, "assistant");
        assert_eq!(assistant_msg.content.unwrap(), "Assistant message test");
        assert!(assistant_msg.tool_calls.is_none());

        // Test tool message
        let tool_call_id = "call_12345";
        let tool_msg = Message::tool_result(
            tool_call_id.to_string(),
            "test_tool".to_string(),
            "Tool result test".to_string(),
        );
        assert_eq!(tool_msg.role, "tool");
        assert_eq!(tool_msg.content.unwrap(), "Tool result test");
        assert_eq!(tool_msg.tool_call_id.unwrap(), tool_call_id);
        assert_eq!(tool_msg.name.unwrap(), "test_tool");
    }

    #[test]
    fn test_tool_builders() {
        use crate::contracts::Contract;
        use serde_json::json;

        // Test send_eth tool
        let eth_tool = Tools::send_eth_tool();
        assert_eq!(eth_tool.function.name, "send_eth");
        assert!(eth_tool.function.description.is_some());

        // Safely unwrap and check parameters
        if let Some(eth_params) = &eth_tool.function.parameters {
            let properties = eth_params.as_object().unwrap().get("properties").unwrap();
            assert!(properties.as_object().unwrap().contains_key("to"));
            assert!(properties.as_object().unwrap().contains_key("value"));
        } else {
            panic!("Expected parameters to be Some");
        }

        // Test custom tool
        let weather_tool = Tools::custom_tool(
            "get_weather",
            "Get weather information",
            json!({
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "City or location"
                    }
                },
                "required": ["location"]
            }),
        );
        assert_eq!(weather_tool.function.name, "get_weather");
        assert_eq!(weather_tool.function.description, Some("Get weather information".to_string()));

        // Safely unwrap and check parameters
        if let Some(weather_params) = &weather_tool.function.parameters {
            let properties = weather_params.as_object().unwrap().get("properties").unwrap();
            assert!(properties.as_object().unwrap().contains_key("location"));
        } else {
            panic!("Expected parameters to be Some");
        }

        // Test from_contract - we need to add stateMutability for the test to work
        let contract = Contract::new_with_description(
            "TokenContract",
            "0x1234567890123456789012345678901234567890",
            r#"[{
                "name": "transfer",
                "type": "function",
                "stateMutability": "nonpayable",
                "inputs": [
                    {"name": "to", "type": "address"},
                    {"name": "amount", "type": "uint256"}
                ],
                "outputs": [{"name": "", "type": "bool"}]
            },
            {
                "name": "balanceOf",
                "type": "function",
                "stateMutability": "nonpayable",
                "inputs": [
                    {"name": "account", "type": "address"}
                ],
                "outputs": [{"name": "", "type": "uint256"}]
            }]"#,
            "A token contract",
        );

        let contract_tools = Tools::tools_from_contract(&contract);

        // Now we should have tools since we added stateMutability
        assert!(!contract_tools.is_empty(), "Expected contract tools to be non-empty");
        assert_eq!(contract_tools.len(), 2, "Expected 2 contract functions");

        // Debug: print all tool names
        println!("Generated tool names:");
        for tool in &contract_tools {
            println!("  - {}", tool.function.name);
        }

        if contract_tools.len() >= 2 {
            // Find the transfer tool
            let transfer_tool = contract_tools
                .iter()
                .find(|t| t.function.name == "contract_tokencontract_transfer")
                .expect("Transfer tool not found");

            assert!(transfer_tool.function.description.is_some());

            // Safely unwrap and check parameters
            if let Some(transfer_params) = &transfer_tool.function.parameters {
                let properties = transfer_params.as_object().unwrap().get("properties").unwrap();
                assert!(properties.as_object().unwrap().contains_key("to"));
                assert!(properties.as_object().unwrap().contains_key("amount"));
            } else {
                panic!("Expected parameters to be Some");
            }

            // Find the balanceOf tool - exact match with correct case
            let balance_tool = contract_tools
                .iter()
                .find(|t| t.function.name == "contract_tokencontract_balanceOf")
                .expect("BalanceOf tool not found");

            assert!(balance_tool.function.description.is_some());

            // Safely unwrap and check parameters
            if let Some(balance_params) = &balance_tool.function.parameters {
                let properties = balance_params.as_object().unwrap().get("properties").unwrap();
                assert!(properties.as_object().unwrap().contains_key("account"));
            } else {
                panic!("Expected parameters to be Some");
            }
        }
    }

    struct TestToolHandler;

    impl CustomToolHandler for TestToolHandler {
        fn can_handle(&self, tool_name: &str) -> bool {
            tool_name == "test_tool"
        }

        fn execute(&self, tool_call: &ToolCall) -> Result<String, String> {
            // Parse arguments
            let args: serde_json::Value = serde_json::from_str(&tool_call.function.arguments)
                .map_err(|e| format!("Failed to parse arguments: {}", e))?;

            // Check for required parameter
            if let Some(value) = args.get("test_param") {
                if let Some(val_str) = value.as_str() {
                    // Echo back the parameter value
                    Ok(format!("Executed test_tool with param: {}", val_str))
                } else {
                    Err("test_param must be a string".to_string())
                }
            } else {
                Err("Missing required parameter: test_param".to_string())
            }
        }
    }

    #[test]
    fn test_custom_tool_handler() {
        // Create a tool call
        let tool_call = ToolCall {
            id: "call_12345".to_string(),
            tool_type: "function".to_string(),
            function: ToolCallFunction {
                name: "test_tool".to_string(),
                arguments: r#"{"test_param": "test_value"}"#.to_string(),
            },
        };

        // Create a test handler
        let handler = TestToolHandler;

        // Test can_handle
        assert!(handler.can_handle("test_tool"));
        assert!(!handler.can_handle("other_tool"));

        // Test execute
        let result = handler.execute(&tool_call);
        assert!(result.is_ok());
        let output = result.unwrap();
        assert!(output.contains("test_value"));

        // Test with invalid arguments
        let invalid_tool_call = ToolCall {
            id: "call_12345".to_string(),
            tool_type: "function".to_string(),
            function: ToolCallFunction {
                name: "test_tool".to_string(),
                arguments: r#"{"wrong_param": "value"}"#.to_string(),
            },
        };

        let result = handler.execute(&invalid_tool_call);
        assert!(result.is_err());
    }
}
