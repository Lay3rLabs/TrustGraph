#[allow(warnings)]
mod bindings;
pub mod context;
pub mod sol_interfaces;

use crate::sol_interfaces::TransactionPayload;
use alloy_primitives::{Address, Bytes, U256};
use alloy_sol_types::{SolType, SolValue};
use bindings::{
    export,
    wavs::worker::layer_types::{TriggerData, TriggerDataEvmContractEvent},
    Guest, TriggerAction, WasmResponse,
};
use context::DaoContext;
use std::str::FromStr;
use wavs_llm::{
    client::with_config,
    contracts::{self, ContractManagerImpl},
    traits::{GuestContractManager, GuestLlmClientManager},
    types::{LlmResponse, Message},
    AgentError,
};

struct Component;

impl Guest for Component {
    fn run(trigger_action: TriggerAction) -> std::result::Result<Option<WasmResponse>, String> {
        let prompt = match trigger_action.data {
            TriggerData::EvmContractEvent(TriggerDataEvmContractEvent { log, .. }) => {
                // Decode the ABI-encoded string first
                let decoded = alloy_sol_types::sol_data::String::abi_decode(&log.data)
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
            llm_context.messages.push(Message {
                role: "system".into(),
                content: Some(dao_state),
                tool_calls: None,
                tool_call_id: None,
                name: None,
            });
        }

        // Create LLM client implementation using the standalone constructor
        let llm_client = with_config(llm_context.model.clone(), llm_context.llm_config.clone())
            .map_err(|e| e.to_string())?;

        // Use the helper function to process the prompt
        let result = llm_client
            .process_prompt(prompt, llm_context.clone(), None, None)
            .map_err(|e| e.to_string())?;

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

                    contracts::ContractManagerImpl::encode_function_call(
                        &ContractManagerImpl,
                        contract.clone(),
                        contract_call.function.clone(),
                        contract_call.args.clone(),
                    )?
                    .into()
                } else {
                    Bytes::default()
                };

                Ok(Some(WasmResponse {
                    payload: TransactionPayload { to, value, data }.abi_encode(),
                    ordering: None,
                }))
            }
            LlmResponse::Text(text) => {
                println!("LLM response: {}", text);
                Ok(None)
            }
        }
    }
}

export!(Component with_types_in bindings);
