use crate::bindings::wavs::operator::input::TriggerData;
use crate::bindings::wavs::types::events::TriggerDataEvmContractEvent;
use crate::bindings::WasmResponse;
use crate::solidity::MerkleRootUpdated;
use anyhow::Result;
use wavs_wasi_utils::decode_event_log_data;

/// Represents the destination where the trigger output should be sent
///
/// # Variants
/// - `Ethereum`: Output will be ABI encoded and sent to an Ethereum contract
/// - `CliOutput`: Raw output for local testing/debugging
/// Note: Cosmos destination is also possible but not implemented in this example
#[allow(dead_code)]
pub enum Destination {
    Ethereum,
    CliOutput,
}

/// Decodes incoming trigger event data into its components
///
/// # Arguments
/// * `trigger_data` - The raw trigger data received from WAVS
///
/// # Returns
/// A tuple containing:
/// * `u64` - Trigger ID for tracking the request
/// * `Vec<u8>` - The actual data payload
/// * `Destination` - Where the processed result should be sent
///
/// # Implementation Details
/// Handles two types of triggers:
/// 1. EvmContractEvent - Decodes Ethereum event logs using the NewTrigger ABI
/// 2. Raw - Used for direct CLI testing with no encoding
pub fn decode_trigger_event(trigger_data: TriggerData) -> Result<(MerkleRootUpdated, Destination)> {
    match trigger_data {
        TriggerData::EvmContractEvent(TriggerDataEvmContractEvent { log, .. }) => {
            let event: MerkleRootUpdated = decode_event_log_data!(log.data)?;
            Ok((event, Destination::Ethereum))
        }
        // TODO fixme
        // TriggerData::Raw(data) => Ok((Attested::abi_decode(&data)?, Destination::CliOutput)),
        _ => Err(anyhow::anyhow!("Unsupported trigger data type")),
    }
}

/// Encodes the output data for submission back to Ethereum
///
/// For VotingPower contracts that implement IWavsServiceHandler, the payload
/// should be the VotingPowerPayload directly, not wrapped in DataWithId.
/// The envelope.payload will contain the ABI-encoded VotingPowerPayload.
///
/// # Arguments
/// * `trigger_id` - The ID of the original trigger request (unused for VotingPower payloads)
/// * `output` - The ABI-encoded VotingPowerPayload data
///
/// # Returns
/// WasmResponse with the VotingPowerPayload as the direct payload
pub fn encode_trigger_output(output: impl AsRef<[u8]>) -> WasmResponse {
    WasmResponse { payload: output.as_ref().to_vec(), ordering: None }
}
