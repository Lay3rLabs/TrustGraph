use crate::bindings::wavs::worker::input::{TriggerData, TriggerDataEvmContractEvent};
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
/// * `u64` - Trigger ID for tracking the request (0 for direct events)
/// * `Vec<u8>` - The actual attestation data payload
/// * `Destination` - Where the processed result should be sent
pub fn decode_trigger_event(trigger_data: TriggerData) -> Result<(Attested, Destination)> {
    match trigger_data {
        TriggerData::EvmContractEvent(TriggerDataEvmContractEvent { log, .. }) => {
            // Decode the Attested event
            let event: Attested = decode_event_log_data!(log)?;

            println!(
                "DEBUG: Event decoded - schema: {}, attester: {}, recipient: {}, uid: {}",
                event.schemaUID, event.attester, event.recipient, event.uid
            );

            return Ok((event, Destination::Ethereum));
        }
        TriggerData::Raw(_data) => {
            // For raw/CLI testing, create a minimal Attested event
            // This allows the component to work with test data
            let event = Attested {
                recipient: alloy_primitives::Address::ZERO,
                attester: alloy_primitives::Address::ZERO,
                uid: alloy_primitives::FixedBytes::ZERO,
                schemaUID: alloy_primitives::FixedBytes::ZERO,
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
/// Minimal types needed for this component, defined inline for simplicity.
/// Focuses on direct EAS event processing without redundant trigger wrappers.
use alloy_sol_macro::sol;

sol! {
    /// @notice Emitted when an attestation has been made.
    /// @param recipient The recipient of the attestation.
    /// @param attester The attesting account.
    /// @param uid The UID of the new attestation.
    /// @param schemaUID The UID of the schema.
    event Attested(address indexed recipient, address indexed attester, bytes32 uid, bytes32 indexed schemaUID);

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
