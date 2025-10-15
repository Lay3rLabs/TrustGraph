mod trigger;
use alloy_sol_types::SolValue;
use trigger::{decode_trigger_event, encode_trigger_output, Destination};
#[rustfmt::skip]
pub mod bindings;
use crate::bindings::{export, Guest, TriggerAction, WasmResponse};

struct Component;
export!(Component with_types_in bindings);

impl Guest for Component {
    /// Generic EAS attestation component.
    ///
    /// A generic component that receives attestation input data and creates a new EAS attestation.
    fn run(action: TriggerAction) -> std::result::Result<Option<WasmResponse>, String> {
        let (payload, dest) = decode_trigger_event(action.data).map_err(|e| e.to_string())?;

        println!(
            "Creating attestation payload: operationType={:?}, data_length={}",
            payload.operationType,
            payload.data.len()
        );

        // ABI encode the attestation payload
        let encoded_response = payload.abi_encode();

        let output = match dest {
            Destination::Ethereum => Some(encode_trigger_output(&encoded_response)),
            Destination::CliOutput => {
                Some(WasmResponse { payload: encoded_response.into(), ordering: None })
            }
        };

        Ok(output)
    }
}
