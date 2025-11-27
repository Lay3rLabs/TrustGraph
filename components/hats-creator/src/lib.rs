#[allow(warnings)]
mod bindings;
use alloy_sol_types::{sol, SolValue};
use bindings::{
    export,
    wavs::{operator::input::TriggerData, types::events::TriggerDataEvmContractEvent},
    Guest, TriggerAction, WasmResponse,
};
use wavs_wasi_utils::{decode_event_log_data, evm::alloy_primitives::Uint};

sol!("../../src/interfaces/IHatsAvsTypes.sol");

struct Component;

impl Guest for Component {
    fn run(trigger_action: TriggerAction) -> std::result::Result<Option<WasmResponse>, String> {
        match trigger_action.data {
            TriggerData::EvmContractEvent(TriggerDataEvmContractEvent { log, .. }) => {
                // Decode the HatCreationTrigger event
                let IHatsAvsTypes::HatCreationTrigger {
                    triggerId,
                    creator,
                    admin,
                    details,
                    maxSupply,
                    eligibility,
                    toggle,
                    mutable_,
                    imageURI,
                } = decode_event_log_data!(log.data)
                    .map_err(|e| format!("Failed to decode event log data: {}", e))?;

                eprintln!("Successfully decoded hat creation trigger");
                eprintln!("Trigger ID: {}", u64::from(triggerId));
                eprintln!("Creator: {}", creator);
                eprintln!("Admin hat ID: {}", admin);
                eprintln!("Details: {}", details);
                eprintln!("Max supply: {}", maxSupply);

                // Create HatCreationData with the extracted data
                let result = IHatsAvsTypes::HatCreationData {
                    admin,
                    details,
                    maxSupply,
                    eligibility,
                    toggle,
                    mutable_,
                    imageURI,
                    requestor: creator,
                    hatId: Uint::from(0), // Filled in by the contract after creation
                    success: true,
                };

                // Log success message
                eprintln!("Hat creation component successfully processed the trigger");

                // Return the ABI-encoded result wrapped in WasmResponse
                Ok(Some(WasmResponse { payload: result.abi_encode().into(), ordering: None }))
            }
            _ => Err("Unsupported trigger data".to_string()),
        }
    }
}

export!(Component with_types_in bindings);
