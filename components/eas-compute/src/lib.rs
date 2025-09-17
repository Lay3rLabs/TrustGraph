//! # EAS Compute Component - Modular Attestation Analysis
//!
//! This component demonstrates a modular approach to querying Ethereum Attestation Service (EAS)
//! data and computing voting power based on attestation data.
//!

mod analytics;
mod examples;
mod solidity;
mod trigger;
use bindings::host::config_var;
use trigger::{decode_trigger_event, encode_trigger_output, Destination};
use wavs_eas::query::query_received_attestation_count;
#[rustfmt::skip]
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

        // Parse the input to get recipient address
        let recipient_address = attestation.recipient;

        println!(
            "Querying EAS attestations for recipient / schema: {} / {}",
            recipient_address, attestation.schemaUID
        );

        // Create query config for local development (you can customize this)
        let query_config = wavs_eas::query::QueryConfig::from_strings(
            &config_var("eas_address").unwrap(),
            &config_var("indexer_address").unwrap(),
            "http://127.0.0.1:8545".to_string(),
        )?;

        // Query the indexer for attestation count using the schema from the attestation event
        let attestation_count = block_on(async move {
            query_received_attestation_count(
                recipient_address,
                attestation.schemaUID,
                Some(query_config),
            )
            .await
        })?;

        println!("Attestation count: {:?}", attestation_count);

        // Create voting power payload based on attestation count
        let voting_power_payload =
            create_voting_power_payload(recipient_address, attestation_count);

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

/// Creates a VotingPowerPayload with set operation based on attestation count
fn create_voting_power_payload(recipient: Address, attestation_count: U256) -> VotingPowerPayload {
    // Create voting power based on attestation count
    // For this example: 1 attestation = 1 voting token
    let voting_power = attestation_count;

    // Create a set operation for the recipient
    let set_operation = Operation {
        operationType: OperationType::SET,
        account: recipient,
        target: Address::ZERO, // Not used for set operations
        amount: voting_power,
    };

    let operations = vec![set_operation];

    // Create the payload with the set operation
    VotingPowerPayload { operations }
}
