use crate::bindings::wavs::worker::input::{
    EvmEventLogData, TriggerData, TriggerDataEvmContractEvent,
};
use crate::bindings::WasmResponse;
use crate::solidity::IndexingPayload;
use alloy_primitives::Address as AlloyAddress;
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
    pub chain_name: String,
}

/// Decodes incoming trigger event data
pub fn decode_trigger_event(trigger_data: TriggerData) -> Result<(EventData, Destination)> {
    match trigger_data {
        TriggerData::EvmContractEvent(TriggerDataEvmContractEvent {
            contract_address,
            log,
            block_height,
            chain_name,
            ..
        }) => {
            // Convert the EvmAddress to AlloyAddress
            let alloy_address = AlloyAddress::from_slice(&contract_address.raw_bytes);

            let event_data = EventData {
                contract_address: alloy_address,
                log,
                block_number: block_height,
                chain_name,
            };
            Ok((event_data, Destination::Ethereum))
        }
        TriggerData::Raw(data) => {
            // For CLI testing - create dummy event data
            let dummy_log = EvmEventLogData { topics: vec![], data };

            let event_data = EventData {
                contract_address: AlloyAddress::ZERO,
                log: dummy_log,
                block_number: 0,
                chain_name: "test".to_string(),
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
