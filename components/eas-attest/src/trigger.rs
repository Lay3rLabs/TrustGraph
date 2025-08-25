use crate::bindings::wavs::worker::input::{TriggerData, TriggerDataEvmContractEvent};
use crate::bindings::WasmResponse;

use alloy_sol_types::SolValue;
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
/// * `u64` - Trigger ID for tracking the request (0 for direct events)
/// * `Vec<u8>` - The actual attestation data payload
/// * `Destination` - Where the processed result should be sent
pub fn decode_trigger_event(
    trigger_data: TriggerData,
) -> Result<(AttestationPayload, Destination)> {
    match trigger_data {
        TriggerData::EvmContractEvent(TriggerDataEvmContractEvent { log, .. }) => {
            // Decode the AttestationRequested event
            let event: AttestationRequested = decode_event_log_data!(log)?;

            println!(
                "DEBUG: Event decoded - schema: {}, recipient: {}, data_len: {}",
                event.schema,
                event.recipient,
                event.data.len()
            );
            println!("DEBUG: Event data bytes: {:?}", event.data);

            // Create attestation payload for ATTEST operation
            // Data contains (schema, recipient, data) for the _attest internal function
            // Convert Bytes to Vec<u8> to ensure proper ABI encoding as bytes type
            let data_bytes: Vec<u8> = event.data.to_vec();
            let attest_data = (event.schema, event.recipient, data_bytes).abi_encode();
            println!("DEBUG: Encoded attest_data length: {}", attest_data.len());
            println!(
                "DEBUG: Attest_data bytes: {:?}",
                &attest_data[..std::cmp::min(64, attest_data.len())]
            );

            let attestation_payload = AttestationPayload {
                operationType: OperationType::ATTEST,
                data: attest_data.into(),
            };

            println!(
                "DEBUG: Final payload - operationType: {:?}, data_len: {}",
                attestation_payload.operationType,
                attestation_payload.data.len()
            );

            return Ok((attestation_payload, Destination::Ethereum));
        }
        TriggerData::Raw(data) => {
            Ok((<AttestationPayload as SolValue>::abi_decode(&data)?, Destination::CliOutput))
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
/// Minimal types needed for this component, defined inline for simplicity.
/// Focuses on direct EAS event processing without redundant trigger wrappers.
use alloy_sol_macro::sol;

sol! {
    /// Event emitted when an attestation is requested
    event AttestationRequested(
        address indexed creator,
        bytes32 indexed schema,
        address indexed recipient,
        bytes data
    );

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
