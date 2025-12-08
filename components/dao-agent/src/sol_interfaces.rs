use alloy_sol_types::sol;

// Import the AttestationAttested event from IIndexedEvents.sol
sol!("../../src/interfaces/IIndexedEvents.sol");

// Define just the TransactionPayload we need for submitting to the blockchain
sol! {
    #[derive(Debug)]
    enum Operation {
      Call,
      DelegateCall
    }

    /// @dev Single transaction to execute
    #[derive(Debug)]
    struct Transaction {
        address target; // Target address for the transaction
        uint256 value; // ETH value to send
        bytes data; // Calldata for the transaction
        Operation operation; // Operation type (Call or DelegateCall)
    }

    /// @dev Main payload structure for WAVS envelope
    #[derive(Debug)]
    struct TransactionPayload {
        uint256 nonce; // Nonce for tracking/ordering
        Transaction[] transactions; // Array of transactions to execute
        string description; // Optional description of the batch
    }
}

/// Represents the destination where the trigger output should be sent
pub enum Destination {
    /// Output will be ABI encoded and sent to an Ethereum contract
    Ethereum,
    /// Raw output for local testing/debugging
    CliOutput,
}

use crate::bindings::wavs::operator::input::TriggerData;
use crate::bindings::wavs::types::events::TriggerDataEvmContractEvent;
use anyhow::Result;
use wavs_wasi_utils::decode_event_log_data;

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

            Ok((event, Destination::Ethereum))
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
