use crate::bindings::wavs::operator::input::TriggerData;
use crate::bindings::wavs::types::chain::EvmEventLogData;
use crate::bindings::wavs::types::events::TriggerDataEvmContractEvent;
use crate::bindings::{TriggerAction, WasmResponse};
use crate::solidity::IndexingPayload;
use alloy_primitives::Address as AlloyAddress;
use alloy_provider::Provider;
use alloy_sol_types::SolValue;
use anyhow::Result;

/// Represents the destination where the trigger output should be sent
pub enum Destination {
    /// Output will be ABI encoded and sent to an Ethereum contract
    Ethereum,
    /// Raw output for local testing/debugging
    CliOutput,
}

/// Simplified event data structure for transformers
#[derive(Debug, Clone)]
pub struct EventData {
    pub contract_address: AlloyAddress,
    pub log: EvmEventLogData,
    pub block_number: u64,
    pub block_timestamp: u64,
    pub chain: String,
}

/// Decodes incoming trigger event data
pub async fn decode_trigger_event(action: TriggerAction) -> Result<(EventData, Destination)> {
    match &action.data {
        TriggerData::EvmContractEvent(TriggerDataEvmContractEvent { chain, log }) => {
            // Convert the EvmAddress to AlloyAddress
            let alloy_address = AlloyAddress::from_slice(&log.address.raw_bytes);

            let block_timestamp = action
                .execution_timestamp_seconds()
                .await
                .map_err(|e| anyhow::anyhow!("Failed to get block timestamp: {}", e))?;

            let event_data = EventData {
                contract_address: alloy_address,
                log: log.data.clone(),
                block_number: log.block_number,
                block_timestamp,
                chain: chain.clone(),
            };
            Ok((event_data, Destination::Ethereum))
        }
        TriggerData::Raw(data) => {
            // For CLI testing - create dummy event data
            let dummy_log = EvmEventLogData { topics: vec![], data: data.clone() };

            let event_data = EventData {
                contract_address: AlloyAddress::ZERO,
                log: dummy_log,
                block_number: 0,
                block_timestamp: 0,
                chain: "test".to_string(),
            };
            Ok((event_data, Destination::CliOutput))
        }
        _ => Err(anyhow::anyhow!("Unsupported trigger data type")),
    }
}

/// Encodes the indexing output for submission to the WAVS Indexer contract
pub fn encode_indexing_output(payload: IndexingPayload) -> WasmResponse {
    WasmResponse { payload: payload.abi_encode(), ordering: None }
}

impl TriggerAction {
    /// Get the timestamp in seconds since Unix epoch that this component is executing at.
    pub async fn execution_timestamp_seconds(&self) -> Result<u64, String> {
        let (chain, block_number) = match &self.data {
            crate::bindings::wavs::types::events::TriggerData::EvmContractEvent(
                crate::bindings::wavs::types::events::TriggerDataEvmContractEvent {
                    chain,
                    log:
                        crate::bindings::wavs::types::events::EvmEventLog {
                            block_number,
                            block_timestamp,
                            ..
                        },
                    ..
                },
            ) => {
                if let Some(block_timestamp) = block_timestamp {
                    return Ok(*block_timestamp);
                }

                (chain, *block_number)
            }
            crate::bindings::wavs::types::events::TriggerData::BlockInterval(
                crate::bindings::wavs::types::events::TriggerDataBlockInterval {
                    chain,
                    block_height,
                },
            ) => (chain, *block_height),
            crate::bindings::wavs::types::events::TriggerData::Cron(
                crate::bindings::wavs::types::events::TriggerDataCron { trigger_time },
            ) => return Ok(trigger_time.nanos / 1_000_000_000),

            // for CLI-based triggers, system time is fine
            crate::bindings::wavs::types::events::TriggerData::Raw(_) => {
                return Ok(std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs())
            }

            _ => return Err("Unsupported trigger type".to_string()),
        };

        let chain_config = crate::bindings::host::get_evm_chain_config(chain)
            .ok_or_else(|| format!("Failed to get chain config for {chain}"))?;
        let provider = wavs_wasi_utils::evm::new_evm_provider::<alloy_network::Ethereum>(
            chain_config
                .http_endpoint
                .ok_or_else(|| format!("Failed to get HTTP endpoint for {chain}"))?,
        );
        let block = provider
            .get_block(alloy_rpc_types::BlockId::Number(alloy_rpc_types::BlockNumberOrTag::Number(
                block_number,
            )))
            .await
            .map_err(|e| format!("Failed to get block {block_number}: {e}"))?
            .ok_or_else(|| format!("Block {block_number} not found"))?;

        Ok(block.header.timestamp)
    }
}
