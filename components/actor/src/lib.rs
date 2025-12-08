#[allow(warnings)]
mod bindings;
pub mod context;
pub mod sol_interfaces;

use crate::sol_interfaces::TransactionPayload;
use alloy_primitives::{Address, Bytes, U256};
use alloy_sol_types::{SolType, SolValue};
use bindings::WasmResponse;
use bindings::{
    export, wavs::operator::input::TriggerData, wavs::types::events::TriggerDataEvmContractEvent,
    Guest, TriggerAction,
};
use context::DaoContext;
use sol_interfaces::{Operation, Transaction};
use std::str::FromStr;
use wavs_llm::{client, errors::AgentError, ToolCall};
use wavs_llm::{LlmResponse, Message};

struct Component;

impl Component {
    /// Handle a tool call from JSON content (when LLM returns tool call as JSON in content)
    fn handle_tool_call_json(
        name: &str,
        parameters: &serde_json::Value,
        llm_context: &wavs_llm::config::Config,
    ) -> Result<LlmResponse, String> {
        println!("Processing tool call: {} with parameters: {}", name, parameters);

        match name {
            "send_eth" => {
                let to = parameters
                    .get("to")
                    .and_then(|v| v.as_str())
                    .ok_or("Missing 'to' parameter in send_eth tool call")?;
                let value = parameters
                    .get("value")
                    .and_then(|v| v.as_str())
                    .ok_or("Missing 'value' parameter in send_eth tool call")?;

                let tx = wavs_llm::contracts::Transaction {
                    to: to.to_string(),
                    value: value.to_string(),
                    contract_call: None,
                    data: String::new(), // Will be populated later
                    description: format!("Send {} wei to {}", value, to),
                };

                println!("Created ETH transaction: to={}, value={}", to, value);
                Ok(LlmResponse::Transaction(tx))
            }
            // Handle contract function calls (like "contract_usdc_transfer")
            name if name.starts_with("contract_") => {
                // Extract contract name and function from tool name
                let parts: Vec<&str> = name.split('_').collect();
                if parts.len() < 3 {
                    return Err(format!("Invalid contract tool call format: {}", name));
                }

                let contract_name = parts[1]; // e.g., "usdc"
                let function_name = parts[2..].join("_"); // e.g., "transfer"

                // Find the contract in the config
                let contract = llm_context
                    .contracts
                    .iter()
                    .find(|c| c.name.to_lowercase() == contract_name.to_lowercase())
                    .ok_or_else(|| {
                        format!("Contract '{}' not found in configuration", contract_name)
                    })?;

                // Convert parameters to function arguments
                let mut function_args = Vec::new();
                if let Some(obj) = parameters.as_object() {
                    for (_key, value) in obj {
                        function_args.push(value.clone());
                    }
                }

                let contract_call = wavs_llm::contracts::ContractCall {
                    function: function_name.clone(),
                    args: function_args.clone(),
                };

                let tx = wavs_llm::contracts::Transaction {
                    to: contract.address.clone(),
                    value: "0".to_string(), // Contract calls typically don't send ETH
                    contract_call: Some(contract_call),
                    data: String::new(), // Will be populated later
                    description: format!("Call {} on contract {}", function_name, contract_name),
                };

                println!(
                    "Created contract transaction: to={}, function={}, args={:?}",
                    contract.address, function_name, function_args
                );
                Ok(LlmResponse::Transaction(tx))
            }
            _ => Err(format!("Unknown tool call: {}", name)),
        }
    }

    /// Convert a ToolCall to a transaction (for actual tool_calls field)
    fn convert_tool_call_to_transaction(
        tool_call: &ToolCall,
        llm_context: &wavs_llm::config::Config,
    ) -> Result<LlmResponse, String> {
        let args: serde_json::Value = serde_json::from_str(&tool_call.function.arguments)
            .map_err(|e| format!("Failed to parse tool call arguments: {}", e))?;

        Self::handle_tool_call_json(&tool_call.function.name, &args, llm_context)
    }
}

impl Guest for Component {
    fn run(trigger_action: TriggerAction) -> std::result::Result<Option<WasmResponse>, String> {
        let prompt = match trigger_action.data {
            TriggerData::EvmContractEvent(TriggerDataEvmContractEvent { log, .. }) => {
                // Decode the ABI-encoded string first
                let decoded = alloy_sol_types::sol_data::String::abi_decode(&log.data.data)
                    .map_err(|e| format!("Failed to decode ABI string: {}", e))?;

                Ok(decoded.to_string())
            }
            // Fired from a raw data event (e.g. from a CLI command or from another component).
            // Note: this is just for testing ATM.
            TriggerData::Raw(data) => {
                let prompt = std::str::from_utf8(&data)
                    .map_err(|e| format!("Failed to decode prompt from bytes: {}", e))?;
                Ok(prompt.to_string())
            }
            _ => Err("Unsupported trigger data".to_string()),
        }?;

        println!("Processing prompt: {}", prompt);

        // Get the DAO context with all our configuration
        let context = DaoContext::load()?;
        let mut llm_context = context.llm_context.clone();

        // Get the current DAO state with balances
        let dao_state = context.get_context_with_balances();

        // Get the original system message to append our state
        if let Some(system_msg) = llm_context.messages.iter_mut().find(|msg| msg.role == "system") {
            // Append the current DAO state to the system message
            if let Some(content) = &system_msg.content {
                let new_content = format!("{}\n\n{}", content, dao_state);
                system_msg.content = Some(new_content);
            }
        } else {
            // If no system message exists, create one with the DAO state
            llm_context.messages.push(Message::system(dao_state));
        }

        // Create LLM client implementation using the standalone constructor
        let llm_client = client::LLMClient::with_config(
            llm_context.model.clone(),
            llm_context.llm_config.clone(),
        );

        // Get the response from the LLM and handle tool calls properly
        let result = {
            let response = llm_client
                .chat(prompt.clone())
                .with_config(&llm_context)
                .send()
                .map_err(|e| e.to_string())?;

            println!(
                "LLM response received. Content: {:?}, Tool calls: {:?}",
                response.content, response.tool_calls
            );

            // Handle tool calls first (if they exist in the tool_calls field)
            if let Some(tool_calls) = &response.tool_calls {
                if !tool_calls.is_empty() {
                    let tool_call = &tool_calls[0];
                    Self::convert_tool_call_to_transaction(tool_call, &llm_context)?
                } else {
                    // No tool calls, check content
                    Self::parse_response_content(&response, &llm_context)?
                }
            } else {
                // No tool_calls field, check content for tool call JSON or other formats
                Self::parse_response_content(&response, &llm_context)?
            }
        };

        // Handle the response
        match result {
            LlmResponse::Transaction(tx) => {
                println!("Transaction to execute: {:?}", tx);

                // Parse address
                let to: Address = tx
                    .to
                    .parse()
                    .map_err(|e| AgentError::Transaction(format!("Invalid address: {}", e)))?;

                // Parse value
                let value = U256::from_str(&tx.value)
                    .map_err(|e| AgentError::Transaction(format!("Invalid value: {}", e)))?;

                // Handle contract calls
                let data = if let Some(contract_call) = &tx.contract_call {
                    // Try to find the contract by address
                    let contract = llm_context
                        .contracts
                        .iter()
                        .find(|c| c.address.to_lowercase() == tx.to.to_lowercase())
                        .ok_or_else(|| {
                            AgentError::Contract(format!(
                                "Cannot find contract at address {}",
                                tx.to
                            ))
                        })?;

                    contract
                        .encode_function_call(&contract_call.function, &contract_call.args)
                        .map_err(|e| format!("Failed to encode contract call: {}", e))?
                } else {
                    Bytes::default()
                };

                println!("Encoded transaction data: 0x{}", hex::encode(&data));

                Ok(Some(WasmResponse {
                    payload: TransactionPayload {
                        nonce: U256::ZERO,
                        transactions: vec![Transaction {
                            target: to,
                            data,
                            value,
                            operation: Operation::Call,
                        }],
                        description: "DAO Agent Transaction".to_string(),
                    }
                    .abi_encode(),
                    ordering: None,
                }))
            }
            LlmResponse::Text(text) => {
                println!("LLM response text (no transaction): {}", text);
                Ok(None)
            }
        }
    }
}

impl Component {
    /// Parse response content for different formats
    fn parse_response_content(
        response: &Message,
        llm_context: &wavs_llm::config::Config,
    ) -> Result<LlmResponse, String> {
        if let Some(content) = &response.content {
            // Try to parse as tool call JSON first
            if let Ok(tool_call_json) = serde_json::from_str::<serde_json::Value>(content) {
                // Check if it looks like a tool call with "name" and "parameters" fields
                if let (Some(name), Some(parameters)) = (
                    tool_call_json.get("name").and_then(|v| v.as_str()),
                    tool_call_json.get("parameters"),
                ) {
                    println!(
                        "Detected tool call JSON in content: name={}, parameters={}",
                        name, parameters
                    );
                    return Self::handle_tool_call_json(name, parameters, llm_context);
                }
            }

            // Try to parse as transaction directly
            if let Ok(tx) = serde_json::from_str::<wavs_llm::contracts::Transaction>(content) {
                return Ok(LlmResponse::Transaction(tx));
            }

            // Otherwise, return as text
            Ok(LlmResponse::Text(content.clone()))
        } else {
            Ok(LlmResponse::Text(String::new()))
        }
    }
}

export!(Component with_types_in bindings);
