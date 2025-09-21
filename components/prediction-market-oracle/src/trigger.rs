use crate::bindings::wavs::{
    operator::input::TriggerData,
    types::events::{TriggerDataCron, TriggerDataEvmContractEvent},
};
use alloy_sol_types::SolValue;
use anyhow::Result;
use wavs_wasi_utils::evm::alloy_primitives::Address;

pub struct TriggerInfo {
    // Execution time in nanos
    pub execution_time: u64,
}

pub fn decode_trigger_event(trigger_data: TriggerData) -> Result<TriggerInfo, String> {
    match trigger_data {
        TriggerData::EvmContractEvent(TriggerDataEvmContractEvent { log, .. }) => {
            Ok(TriggerInfo { execution_time: log.block_timestamp.saturating_mul(1000) })
        }
        TriggerData::Cron(TriggerDataCron { trigger_time }) => {
            Ok(TriggerInfo { execution_time: trigger_time.nanos })
        }
        // CLI testing
        TriggerData::Raw(_) => Ok(TriggerInfo { execution_time: 0 }),
        _ => Err("Unsupported trigger data type".to_string()),
    }
}

pub fn encode_trigger_output(
    lmsr_market_maker: Address,
    conditional_tokens: Address,
    result: bool,
) -> Vec<u8> {
    solidity::PredictionMarketOracleAvsOutput {
        lmsrMarketMaker: lmsr_market_maker,
        conditionalTokens: conditional_tokens,
        result,
    }
    .abi_encode()
    .to_vec()
    .into()
}

mod solidity {
    use alloy_sol_macro::sol;

    pub use IPredictionMarketOracleController::*;
    // imports PredictionMarketOracleAvsOutput
    sol!("../../src/interfaces/IPredictionMarketOracleController.sol");
}
