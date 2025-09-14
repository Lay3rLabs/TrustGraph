use crate::{
    bindings::wavs::worker::input::{TriggerData, TriggerDataCron, TriggerDataEvmContractEvent},
    solidity,
};
use alloy_sol_types::SolValue;
use anyhow::Result;
use wavs_wasi_utils::decode_event_log_data;

#[derive(Debug)]
pub enum DecodedTrigger {
    Cron(u64),
    Trigger(u64),
}

pub fn decode_trigger_event(trigger_data: TriggerData) -> Result<DecodedTrigger> {
    match trigger_data {
        TriggerData::Cron(TriggerDataCron { trigger_time }) => {
            Ok(DecodedTrigger::Cron(trigger_time.nanos))
        }
        TriggerData::EvmContractEvent(TriggerDataEvmContractEvent { log, .. }) => {
            let solidity::MerklerTrigger { triggerId } = decode_event_log_data!(log)?;
            Ok(DecodedTrigger::Trigger(triggerId))
        }
        _ => Err(anyhow::anyhow!("Unsupported trigger data type")),
    }
}

pub fn encode_trigger_output(
    trigger: DecodedTrigger,
    root: &[u8],
    ipfs_hash: &[u8],
    ipfs_hash_cid: String,
) -> Result<Vec<u8>, String> {
    let (trigger_id, cron_nanos) = match trigger {
        DecodedTrigger::Trigger(trigger_id) => (trigger_id, 0),
        DecodedTrigger::Cron(cron_nanos) => (0, cron_nanos),
    };

    let root = serde_json::from_value(root.into()).map_err(|e| e.to_string())?;
    let ipfs_hash = serde_json::from_value(ipfs_hash.into()).map_err(|e| e.to_string())?;

    Ok(solidity::MerklerAvsOutput {
        triggerId: trigger_id,
        cronNanos: cron_nanos,
        root,
        ipfsHash: ipfs_hash,
        ipfsHashCid: ipfs_hash_cid,
    }
    .abi_encode())
}
