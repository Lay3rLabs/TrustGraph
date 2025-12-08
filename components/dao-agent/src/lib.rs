#[allow(warnings)]
mod bindings;
pub mod context;
pub mod sol_interfaces;

use crate::bindings::host::config_var;
use crate::sol_interfaces::{decode_trigger_event, Destination, TransactionPayload};
use alloy_primitives::{Address, Bytes, U256};
use alloy_sol_types::{SolType, SolValue};
use bindings::WasmResponse;
use bindings::{export, wavs::operator::input::TriggerData, Guest, TriggerAction};
use context::DaoContext;
use sol_interfaces::{Operation, Transaction};
use std::str::FromStr;
use wavs_eas::query::{query_attestation, QueryConfig};
use wavs_llm::{client, errors::AgentError, ToolCall};
use wavs_llm::{LlmResponse, Message};
use wstd::runtime::block_on;

struct Component;

impl Guest for Component {
    fn run(trigger_action: TriggerAction) -> std::result::Result<Option<WasmResponse>, String> {
        // Check if this is a raw trigger for testing
        let (prompt, _dest) = match &trigger_action.data {
            TriggerData::Raw(data) => {
                // For raw/CLI testing, use the data directly as the prompt
                let prompt = std::str::from_utf8(data)
                    .map_err(|e| format!("Failed to decode prompt from bytes: {}", e))?;
                (prompt.to_string(), Destination::CliOutput)
            }
            _ => {
                // Decode the AttestationAttested event from PayableEASIndexerResolver
                let (event, dest) = decode_trigger_event(trigger_action.data)
                    .map_err(|e| format!("Failed to decode trigger event: {}", e))?;

                // Extract event data - AttestationAttested only has eas address and uid
                let eas_address = event.eas;
                let attestation_uid = event.uid;

                println!("📋 AttestationAttested event received:");
                println!("  - EAS Address: {}", eas_address);
                println!("  - Attestation UID: {}", attestation_uid);

                // Create query config to fetch the full attestation
                let query_config = QueryConfig::from_strings(
                    &format!("{}", eas_address),
                    "0x0000000000000000000000000000000000000000", // indexer not needed
                    "http://127.0.0.1:8545".to_string(),          // TODO: get from config
                )
                .map_err(|e| format!("Failed to create query config: {}", e))?;

                let attestation = block_on(async move {
                    // Query the full attestation details from chain using the uid
                    let attestation =
                        query_attestation(attestation_uid, Some(query_config.clone()))
                            .await
                            .unwrap();
                    // Get original referenced attestation, with proposal information
                    query_attestation(attestation.refUID, Some(query_config.clone())).await
                })
                .map_err(|e| format!("Failed to query attestation {}: {}", attestation_uid, e))?;

                println!(
                    "✅ Retrieved attestation {} from attester {} to recipient {}",
                    attestation.uid, attestation.attester, attestation.recipient
                );

                // Extract the prompt from the attestation data
                // Try to decode as UTF-8 string first
                let prompt = if attestation.data.is_empty() {
                    return Err("Attestation data is empty - no prompt found".to_string());
                } else if let Ok(decoded) = String::from_utf8(attestation.data.to_vec()) {
                    decoded
                } else {
                    // Try ABI decoding as a string
                    alloy_sol_types::sol_data::String::abi_decode(&attestation.data).map_err(
                        |e| format!("Failed to decode attestation data as string: {}", e),
                    )?
                };

                (prompt, dest)
            }
        };

        println!("Processing prompt: {}", prompt);

        // Load context from `config_uri` variable, or default if not configured
        let context = DaoContext::load()?;
        let llm_context = context.llm_context.clone();

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
