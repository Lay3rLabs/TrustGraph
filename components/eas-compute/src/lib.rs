//! # EAS Compute Component - Modular Attestation Analysis
//!
//! This component demonstrates a modular approach to querying Ethereum Attestation Service (EAS)
//! data and computing voting power based on attestation data.
//!

mod analytics;
mod examples;
mod query;
mod solidity;
mod trigger;
use query::query_attestations_for_recipient;
use trigger::{decode_trigger_event, encode_trigger_output, Destination};
pub mod bindings;
use crate::bindings::{export, Guest, TriggerAction, WasmResponse};
use crate::solidity::{Operation, OperationType, VotingPowerPayload};
use alloy_sol_types::SolValue;
use wavs_wasi_utils::evm::alloy_primitives::{Address, U256};
use wstd::runtime::block_on;

struct Component;
export!(Component with_types_in bindings);

impl Guest for Component {
    /// EAS Compute Component - Queries attestations for a recipient and returns voting power payload
    ///
    /// This component queries the EAS Indexer to count attestations received by a specific address
    /// and returns a VotingPowerPayload with mint operations based on attestation count.
    ///
    /// Input formats supported:
    /// 1. Ethereum address (20 bytes hex string with 0x prefix)
    /// 2. JSON with recipient address: {"recipient": "0x..."}
    /// 3. Raw bytes representing the address
    ///
    /// The component will:
    /// 1. Parse the input to extract recipient address
    /// 2. Query the EAS Indexer to count attestations for the recipient
    /// 3. Create a VotingPowerPayload with mint operation based on attestation count
    /// 4. Return the encoded payload
    fn run(action: TriggerAction) -> std::result::Result<Option<WasmResponse>, String> {
        let (attestation, dest) = decode_trigger_event(action.data).map_err(|e| e.to_string())?;

        // TODO load schema from config. If attestation is not for the schema id do nothing.
        // TODO maybe make this a cron workflow.

        // Parse the input to get recipient address
        let recipient_address = attestation.recipient;

        println!("Querying EAS attestations for recipient: {}", recipient_address);

        // Query the indexer for attestation count
        let attestation_count =
            block_on(async move { query_attestations_for_recipient(recipient_address).await })?;

        // Create voting power payload based on attestation count
        let voting_power_payload =
            create_voting_power_payload(recipient_address, attestation_count);

        println!(
            "Created voting power payload with {} operations",
            voting_power_payload.operations.len()
        );

        // Encode the response
        let encoded_response = voting_power_payload.abi_encode();

        let output = match dest {
            Destination::Ethereum => Some(encode_trigger_output(&encoded_response)),
            Destination::CliOutput => {
                Some(WasmResponse { payload: encoded_response.into(), ordering: None })
            }
        };

        Ok(output)
    }
}

/// Creates a VotingPowerPayload with mint operation based on attestation count
fn create_voting_power_payload(recipient: Address, attestation_count: U256) -> VotingPowerPayload {
    // Create voting power based on attestation count
    // For this example: 1 attestation = 1 voting token
    let voting_power = attestation_count;

    // Create a mint operation for the recipient
    let mint_operation = Operation {
        operationType: OperationType::MINT,
        account: recipient,
        target: Address::ZERO, // Not used for mint operations
        amount: voting_power,
    };

    // Create the payload with the mint operation
    VotingPowerPayload { operations: vec![mint_operation] }
}
