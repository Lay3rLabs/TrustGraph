use crate::bindings::host::get_evm_chain_config;
use alloy_network::Ethereum;
use alloy_provider::{Provider, RootProvider};
use alloy_rpc_types::{TransactionInput, TransactionRequest};
use alloy_sol_types::{sol, SolCall};
use wavs_wasi_utils::evm::{
    alloy_primitives::{Address, FixedBytes, U256},
    new_evm_provider,
};

// Solidity interfaces for EAS and Indexer
sol! {
    interface IEAS {
        struct Attestation {
            bytes32 uid;
            bytes32 schema;
            uint64 time;
            uint64 expirationTime;
            uint64 revocationTime;
            bytes32 refUID;
            address recipient;
            address attester;
            bool revocable;
            bytes data;
        }

        function getAttestation(bytes32 uid) external view returns (Attestation memory);
    }

    interface IIndexer {
        function getReceivedAttestationUIDs(
            address recipient,
            bytes32 schemaUID,
            uint256 start,
            uint256 length,
            bool reverseOrder
        ) external view returns (bytes32[] memory);

        function getReceivedAttestationUIDCount(address recipient, bytes32 schemaUID) external view returns (uint256);
    }
}

/// Queries the EAS Indexer to count attestations for a recipient
pub async fn query_attestations_for_recipient(recipient: Address) -> Result<U256, String> {
    // Get the chain configuration from WAVS
    let chain_config =
        get_evm_chain_config("local").ok_or("Failed to get chain config".to_string())?;

    // Create an Alloy provider instance
    let provider: RootProvider<Ethereum> = new_evm_provider::<Ethereum>(
        chain_config.http_endpoint.ok_or("No HTTP endpoint configured")?,
    );

    // EAS Indexer contract address - this should be configured or passed as parameter
    // For now using a placeholder - in production this would come from config
    let indexer_contract_address = Address::from([0u8; 20]); // Replace with actual Indexer address

    // Schema UID to query - using zero for all schemas, or specify a particular schema
    let schema_uid = FixedBytes([0u8; 32]); // Query all schemas, or specify a particular one

    // Get the total count of attestations for this recipient
    let count_call =
        IIndexer::getReceivedAttestationUIDCountCall { recipient, schemaUID: schema_uid };

    // Prepare the transaction request for count query
    let tx_request = TransactionRequest {
        to: Some(indexer_contract_address.into()),
        input: TransactionInput::new(count_call.abi_encode().into()),
        ..Default::default()
    };

    // Execute the call to get attestation count
    let result = provider
        .call(tx_request)
        .await
        .map_err(|e| format!("Failed to call Indexer contract for count: {}", e))?;

    // Decode the count result
    let attestation_count = U256::from_be_slice(&result);

    println!("Found {} attestations for recipient {}", attestation_count, recipient);

    Ok(attestation_count)
}
