use crate::{
    bindings::wavs::{operator::input::TriggerData, types::events::TriggerDataEvmContractEvent},
    solidity,
};
use anyhow::Result;
use wavs_wasi_utils::decode_event_log_data;

pub enum Destination {
    Ethereum,
    CliOutput,
}

pub fn decode_trigger_event(trigger_data: TriggerData) -> Result<(String, u64, Destination)> {
    match trigger_data {
        TriggerData::EvmContractEvent(TriggerDataEvmContractEvent { log, .. }) => {
            let solidity::UpdateService { json } = decode_event_log_data!(log.data)?;
            Ok((json, log.block_number, Destination::Ethereum))
        }
        TriggerData::Raw(e) => {
            let s = std::str::from_utf8(&e)
                .map_err(|e| anyhow::anyhow!("Failed to convert raw data to string: {}", e))?;

            Ok((s.to_string(), 0, Destination::CliOutput))
        }
        _ => Err(anyhow::anyhow!("Unsupported trigger data type")),
    }
}
