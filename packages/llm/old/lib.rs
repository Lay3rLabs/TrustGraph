#[allow(warnings)]
mod bindings;
pub mod client;
pub mod config;
pub mod contracts;
pub mod encoding;
pub mod errors;
pub mod sol_interfaces;
pub mod tools;

// TODO: component behind a feature flag for composability
// use alloy_sol_types::{SolType, SolValue};
// use bindings::{
//     export,
//     wavs::worker::layer_types::{TriggerData, TriggerDataEthContractEvent},
//     Guest, TriggerAction,
// };
// use context::Context;
// use errors::{AgentError, AgentResult};
// use llm::{LLMClient, LlmResponse};
// use serde::{Deserialize, Serialize};
// use wstd::runtime::block_on;

// /// Input structure for the component
// #[derive(Debug, Deserialize, Serialize)]
// struct AgentInput {
//     prompt: String,
//     #[serde(default)]
//     context_uri: Option<String>,
//     #[serde(default)]
//     context_json: Option<String>,
// }

// struct Component;

// impl Guest for Component {
//     fn run(trigger_action: TriggerAction) -> std::result::Result<Option<Vec<u8>>, String> {
//         let result = inner_run(trigger_action);

//         match result {
//             Ok(data) => Ok(data),
//             Err(err) => {
//                 // Log the full error
//                 eprintln!("Error: {:?}", err);
//                 // Return a simplified error message
//                 Err(err.to_string())
//             }
//         }
//     }
// }

// /// Inner implementation of the run function to use our custom error handling
// fn inner_run(trigger_action: TriggerAction) -> AgentResult<Option<Vec<u8>>> {
//     let agent_input = match trigger_action.data {
//         // Handle raw data - expected to be JSON containing prompt and optional context
//         TriggerData::Raw(data) => {
//             let input_str = std::str::from_utf8(&data).map_err(AgentError::Utf8)?;

//             // First try to parse as AgentInput
//             match serde_json::from_str::<AgentInput>(input_str) {
//                 Ok(input) => Ok(input),
//                 Err(_) => {
//                     // Fall back to treating the entire input as just the prompt
//                     Ok(AgentInput {
//                         prompt: input_str.to_string(),
//                         context_uri: None,
//                         context_json: None,
//                     })
//                 }
//             }
//         }
//         // Handle Ethereum events - decode the string from ABI-encoded data
//         TriggerData::EthContractEvent(TriggerDataEthContractEvent { log, .. }) => {
//             // Decode the ABI-encoded string first
//             let decoded = alloy_sol_types::sol_data::String::abi_decode(&log.data, false)
//                 .map_err(|e| AgentError::Other(format!("Failed to decode ABI string: {}", e)))?;

//             let input_str = decoded.to_string();

//             // Try to parse as AgentInput
//             match serde_json::from_str::<AgentInput>(&input_str) {
//                 Ok(input) => Ok(input),
//                 Err(_) => {
//                     // Fall back to treating the entire input as just the prompt
//                     Ok(AgentInput { prompt: input_str, context_uri: None, context_json: None })
//                 }
//             }
//         }
//         _ => Err(AgentError::Other("Unsupported trigger data".to_string())),
//     }?;

//     return block_on(async move {
//         // Load context - either from the environment, from a provided URI, or from inline JSON
//         let context = if let Some(uri) = agent_input.context_uri {
//             // Use provided URI to load context
//             Context::load_from_uri(&uri).await.map_err(|e| {
//                 AgentError::ContextLoading(format!("Failed to load context from URI: {}", e))
//             })?
//         } else if let Some(json) = agent_input.context_json {
//             // Parse inline JSON context
//             Context::from_json(&json).map_err(|e| {
//                 AgentError::ContextLoading(format!("Failed to parse context JSON: {}", e))
//             })?
//         } else {
//             // Default to environment-based context loading
//             Context::load()
//                 .await
//                 .map_err(|e| AgentError::ContextLoading(format!("Failed to load context: {}", e)))?
//         };

//         // Validate the context
//         context.validate().map_err(|e| AgentError::ContextValidation(e.to_string()))?;

//         // Create LLM client
//         let client = LLMClient::with_config(&context.model, context.llm_config.clone())
//             .map_err(|e| AgentError::Llm(format!("Failed to create LLM client: {}", e)))?;

//         // Process prompt using LLM with tools
//         let llm_response = client
//             .process_prompt(&agent_input.prompt, &context, None, None)
//             .await
//             .map_err(|e| AgentError::Llm(format!("LLM processing error: {}", e)))?;

//         // Match the response type
//         match llm_response {
//             LlmResponse::Transaction(transaction) => {
//                 // Validate the transaction first
//                 contracts::transaction_operations::validate_transaction(&transaction).map_err(
//                     |e| AgentError::Transaction(format!("Transaction validation failed: {}", e)),
//                 )?;

//                 // Create the transaction payload
//                 let payload = contracts::create_payload_from_tx(&transaction).map_err(|e| {
//                     AgentError::Transaction(format!("Failed to create transaction: {}", e))
//                 })?;

//                 println!("Payload: {:?}", payload);

//                 Ok(Some(payload.abi_encode().to_vec()))
//             }
//             LlmResponse::Text(text) => {
//                 if !text.is_empty() {
//                     println!("LLM response: {}", text);
//                     Ok(Some(text.as_bytes().to_vec()))
//                 } else {
//                     println!("No action needed");
//                     Ok(None)
//                 }
//             }
//         }
//     });
// }

// export!(Component with_types_in bindings);
