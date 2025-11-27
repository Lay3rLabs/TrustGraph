#[allow(warnings)]
mod bindings;
use alloy_sol_types::{sol, SolValue};
use bindings::{
    export,
    wavs::{operator::input::TriggerData, types::events::TriggerDataEvmContractEvent},
    Guest, TriggerAction, WasmResponse,
};
use wavs_wasi_utils::decode_event_log_data;

sol!("../../src/interfaces/IHatsAvsTypes.sol");

struct Component;

impl Guest for Component {
    fn run(trigger_action: TriggerAction) -> std::result::Result<Option<WasmResponse>, String> {
        match trigger_action.data {
            TriggerData::EvmContractEvent(TriggerDataEvmContractEvent { log, .. }) => {
                // Decode the StatusCheckTrigger event
                let IHatsAvsTypes::StatusCheckTrigger { triggerId, creator: _, hatId } =
                    decode_event_log_data!(log.data)
                        .map_err(|e| format!("Failed to decode event log data: {}", e))?;

                eprintln!("Successfully decoded status check trigger");
                eprintln!("Trigger ID: {}", u64::from(triggerId));
                eprintln!("Hat ID: {}", hatId);

                // For this simplified implementation, we're just setting active to true
                // In a real implementation, you would use the hatId to determine if the hat should be active
                let active = true;

                // Create a StatusResult with the proper triggerId from decoded data
                let result = IHatsAvsTypes::StatusResult { triggerId, active, hatId };

                // Log success message
                eprintln!("Hat toggle component successfully processed the trigger");

                // Return the ABI-encoded result wrapped in WasmResponse
                Ok(Some(WasmResponse { payload: result.abi_encode().into(), ordering: None }))
            }
            _ => Err("Unsupported trigger data".to_string()),
        }
    }
}

export!(Component with_types_in bindings);
