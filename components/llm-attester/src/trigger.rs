use crate::bindings::wavs::operator::input::TriggerData;
use crate::bindings::wavs::types::events::TriggerDataEvmContractEvent;
use crate::bindings::WasmResponse;
use anyhow::Result;
use wavs_wasi_utils::decode_event_log_data;

/// Represents the destination where the trigger output should be sent
pub enum Destination {
    /// Output will be ABI encoded and sent to an Ethereum contract
    Ethereum,
    /// Raw output for local testing/debugging
    CliOutput,
}

/// Decodes incoming trigger event data into its components
///
/// # Arguments
/// * `trigger_data` - The raw trigger data received from WAVS
///
/// # Returns
/// A tuple containing:
/// * `AttestationAttested` - The decoded attestation event with eas address and uid
/// * `Destination` - Where the processed result should be sent
pub fn decode_trigger_event(
    trigger_data: TriggerData,
) -> Result<(AttestationAttested, Destination)> {
    match trigger_data {
        TriggerData::EvmContractEvent(TriggerDataEvmContractEvent { log, .. }) => {
            // Decode the AttestationAttested event from IIndexedEvents.sol
            let event: AttestationAttested = decode_event_log_data!(log.data)?;

            println!(
                "DEBUG: AttestationAttested event decoded - eas: {}, uid: {}",
                event.eas, event.uid
            );

            return Ok((event, Destination::Ethereum));
        }
        TriggerData::Raw(_data) => {
            // For raw/CLI testing, create a minimal AttestationAttested event
            // This allows the component to work with test data
            let event = AttestationAttested {
                eas: alloy_primitives::Address::ZERO,
                uid: alloy_primitives::FixedBytes::ZERO,
            };
            Ok((event, Destination::CliOutput))
        }
        _ => Err(anyhow::anyhow!("Unsupported trigger data type")),
    }
}

/// Encodes the attestation output data for submission back to Ethereum
///
/// # Arguments
/// * `output` - The attestation data to be encoded
///
/// # Returns
/// ABI encoded bytes ready for submission to Ethereum
pub fn encode_trigger_output(output: impl AsRef<[u8]>) -> WasmResponse {
    WasmResponse { payload: output.as_ref().to_vec().into(), ordering: None }
}

/// Solidity type definitions for EAS attestation processing
///
/// Uses AttestationAttested event from IIndexedEvents.sol which is emitted
/// by PayableEASIndexerResolver when attestations are created.
use alloy_sol_macro::sol;

// Import the AttestationAttested event from IIndexedEvents.sol
sol!("../../src/interfaces/IIndexedEvents.sol");

sol! {
    /// @notice Operation types for attestation operations
    #[derive(Debug)]
    enum OperationType {
        ATTEST,
        REVOKE,
        MULTI_ATTEST,
        MULTI_REVOKE
    }

    /// @notice Payload structure for attestation operations
    struct AttestationPayload {
        OperationType operationType;
        bytes data;
    }

    /// @notice A struct representing the arguments of the attestation request.
    struct AttestationRequestData {
        address recipient; // The recipient of the attestation.
        uint64 expirationTime; // The time when the attestation expires (Unix timestamp).
        bool revocable; // Whether the attestation is revocable.
        bytes32 refUID; // The UID of the related attestation.
        bytes data; // Custom attestation data.
        uint256 value; // An explicit ETH amount to send to the resolver. This is important to prevent accidental user errors.
    }

    /// @notice A struct representing the full arguments of the attestation request.
    struct AttestationRequest {
        bytes32 schema; // The unique identifier of the schema.
        AttestationRequestData data; // The arguments of the attestation request.
    }
}
