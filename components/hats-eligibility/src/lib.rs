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
                // Decode the EligibilityCheckTrigger event
                let event: IHatsAvsTypes::EligibilityCheckTrigger =
                    decode_event_log_data!(log.data)
                        .map_err(|e| format!("Failed to decode event log data: {}", e))?;

                // For this simplified implementation, we're just setting:
                // eligible = true and standing = true
                let eligible = true;
                let standing = true;

                // Create EligibilityResult with the proper triggerId from decoded data
                let result = IHatsAvsTypes::EligibilityResult {
                    triggerId: event.triggerId,
                    eligible,
                    standing,
                    wearer: event.wearer,
                    hatId: event.hatId,
                };

                // Log success message
                eprintln!("Processed TriggerId: {}", event.triggerId);

                // Return the ABI-encoded result wrapped in WasmResponse
                Ok(Some(WasmResponse { payload: result.abi_encode().into(), ordering: None }))
            }
            _ => Err("Unsupported trigger data".to_string()),
        }
    }
}

export!(Component with_types_in bindings);
