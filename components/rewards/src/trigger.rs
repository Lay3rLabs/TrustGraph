use crate::{
    bindings::wavs::worker::layer_types::{
        TriggerData, TriggerDataCron, TriggerDataEvmContractEvent,
    },
    solidity,
};
use alloy_sol_types::SolValue;
use anyhow::Result;
use wavs_wasi_utils::decode_event_log_data;

pub fn decode_trigger_event(trigger_data: TriggerData) -> Result<u64> {
    match trigger_data {
        TriggerData::Cron(TriggerDataCron { trigger_time }) => Ok(trigger_time.nanos),
        TriggerData::EvmContractEvent(TriggerDataEvmContractEvent { log, .. }) => {
            let solidity::WavsRewardsTrigger { triggerId } = decode_event_log_data!(log)?;
            Ok(triggerId)
        }
        _ => Err(anyhow::anyhow!("Unsupported trigger data type")),
    }
}

pub fn encode_trigger_output(trigger_id: u64, output: solidity::AvsOutput) -> Vec<u8> {
    solidity::DataWithId { triggerId: trigger_id, data: output.abi_encode().to_vec().into() }
        .abi_encode()
}
