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

        function getSentAttestationUIDs(
            address attester,
            bytes32 schemaUID,
            uint256 start,
            uint256 length,
            bool reverseOrder
        ) external view returns (bytes32[] memory);

        function getSentAttestationUIDCount(address attester, bytes32 schemaUID) external view returns (uint256);

        function getSchemaAttesterRecipientAttestationUIDs(
            bytes32 schemaUID,
            address attester,
            address recipient,
            uint256 start,
            uint256 length,
            bool reverseOrder
        ) external view returns (bytes32[] memory);

        function getSchemaAttesterRecipientAttestationUIDCount(
            bytes32 schemaUID,
            address attester,
            address recipient
        ) external view returns (uint256);

        function getSchemaAttestationUIDs(
            bytes32 schemaUID,
            uint256 start,
            uint256 length,
            bool reverseOrder
        ) external view returns (bytes32[] memory);

        function getSchemaAttestationUIDCount(bytes32 schemaUID) external view returns (uint256);

        function isAttestationIndexed(bytes32 attestationUID) external view returns (bool);
    }
}

/// Configuration for EAS query operations
#[derive(Clone)]
pub struct QueryConfig {
    pub eas_address: Address,
    pub indexer_address: Address,
    pub chain_name: String,
}

impl Default for QueryConfig {
    fn default() -> Self {
        Self {
            eas_address: Address::from([0u8; 20]), // Replace with actual EAS address
            indexer_address: Address::from([0u8; 20]), // Replace with actual Indexer address
            chain_name: "local".to_string(),
        }
    }
}

/// Creates a provider instance for EVM queries
async fn create_provider(chain_name: &str) -> Result<RootProvider<Ethereum>, String> {
    let chain_config = get_evm_chain_config(chain_name)
        .ok_or(format!("Failed to get chain config for {}", chain_name))?;

    let provider = new_evm_provider::<Ethereum>(
        chain_config.http_endpoint.ok_or("No HTTP endpoint configured")?,
    );

    Ok(provider)
}

/// Executes a contract call and returns the result
async fn execute_call(
    provider: &RootProvider<Ethereum>,
    contract_address: Address,
    call_data: Vec<u8>,
) -> Result<Vec<u8>, String> {
    let tx_request = TransactionRequest {
        to: Some(contract_address.into()),
        input: TransactionInput::new(call_data.into()),
        ..Default::default()
    };

    provider
        .call(tx_request)
        .await
        .map(|result| result.to_vec())
        .map_err(|e| format!("Contract call failed: {}", e))
}

// =============================================================================
// Received Attestations Queries
// =============================================================================

/// Queries the EAS Indexer to count attestations received by a recipient for a specific schema
pub async fn query_received_attestation_count(
    recipient: Address,
    schema_uid: FixedBytes<32>,
    config: Option<QueryConfig>,
) -> Result<U256, String> {
    let config = config.unwrap_or_default();
    let provider = create_provider(&config.chain_name).await?;

    let count_call =
        IIndexer::getReceivedAttestationUIDCountCall { recipient, schemaUID: schema_uid };

    let result = execute_call(&provider, config.indexer_address, count_call.abi_encode()).await?;
    let attestation_count = U256::from_be_slice(&result);

    println!(
        "Found {} received attestations for recipient {} and schema {}",
        attestation_count, recipient, schema_uid
    );

    Ok(attestation_count)
}

/// Queries the EAS Indexer to get attestation UIDs received by a recipient for a specific schema
pub async fn query_received_attestation_uids(
    recipient: Address,
    schema_uid: FixedBytes<32>,
    start: U256,
    length: U256,
    reverse_order: bool,
    config: Option<QueryConfig>,
) -> Result<Vec<FixedBytes<32>>, String> {
    let config = config.unwrap_or_default();
    let provider = create_provider(&config.chain_name).await?;

    let uids_call = IIndexer::getReceivedAttestationUIDsCall {
        recipient,
        schemaUID: schema_uid,
        start,
        length,
        reverseOrder: reverse_order,
    };

    let result = execute_call(&provider, config.indexer_address, uids_call.abi_encode()).await?;
    let decoded = IIndexer::getReceivedAttestationUIDsCall::abi_decode_returns(&result)
        .map_err(|e| format!("Failed to decode UIDs result: {}", e))?;

    println!("Retrieved {} received attestation UIDs for recipient {}", decoded.len(), recipient);

    Ok(decoded)
}

// =============================================================================
// Sent Attestations Queries
// =============================================================================

/// Queries the EAS Indexer to count attestations sent by an attester for a specific schema
pub async fn query_sent_attestation_count(
    attester: Address,
    schema_uid: FixedBytes<32>,
    config: Option<QueryConfig>,
) -> Result<U256, String> {
    let config = config.unwrap_or_default();
    let provider = create_provider(&config.chain_name).await?;

    let count_call = IIndexer::getSentAttestationUIDCountCall { attester, schemaUID: schema_uid };

    let result = execute_call(&provider, config.indexer_address, count_call.abi_encode()).await?;
    let attestation_count = U256::from_be_slice(&result);

    println!(
        "Found {} sent attestations for attester {} and schema {}",
        attestation_count, attester, schema_uid
    );

    Ok(attestation_count)
}

/// Queries the EAS Indexer to get attestation UIDs sent by an attester for a specific schema
pub async fn query_sent_attestation_uids(
    attester: Address,
    schema_uid: FixedBytes<32>,
    start: U256,
    length: U256,
    reverse_order: bool,
    config: Option<QueryConfig>,
) -> Result<Vec<FixedBytes<32>>, String> {
    let config = config.unwrap_or_default();
    let provider = create_provider(&config.chain_name).await?;

    let uids_call = IIndexer::getSentAttestationUIDsCall {
        attester,
        schemaUID: schema_uid,
        start,
        length,
        reverseOrder: reverse_order,
    };

    let result = execute_call(&provider, config.indexer_address, uids_call.abi_encode()).await?;
    let decoded = IIndexer::getSentAttestationUIDsCall::abi_decode_returns(&result)
        .map_err(|e| format!("Failed to decode UIDs result: {}", e))?;

    println!("Retrieved {} sent attestation UIDs for attester {}", decoded.len(), attester);

    Ok(decoded)
}

// =============================================================================
// Schema Attestations Queries
// =============================================================================

/// Queries the EAS Indexer to count all attestations for a specific schema
pub async fn query_schema_attestation_count(
    schema_uid: FixedBytes<32>,
    config: Option<QueryConfig>,
) -> Result<U256, String> {
    let config = config.unwrap_or_default();
    let provider = create_provider(&config.chain_name).await?;

    let count_call = IIndexer::getSchemaAttestationUIDCountCall { schemaUID: schema_uid };

    let result = execute_call(&provider, config.indexer_address, count_call.abi_encode()).await?;
    let attestation_count = U256::from_be_slice(&result);

    println!("Found {} total attestations for schema {}", attestation_count, schema_uid);

    Ok(attestation_count)
}

/// Queries the EAS Indexer to get all attestation UIDs for a specific schema
pub async fn query_schema_attestation_uids(
    schema_uid: FixedBytes<32>,
    start: U256,
    length: U256,
    reverse_order: bool,
    config: Option<QueryConfig>,
) -> Result<Vec<FixedBytes<32>>, String> {
    let config = config.unwrap_or_default();
    let provider = create_provider(&config.chain_name).await?;

    let uids_call = IIndexer::getSchemaAttestationUIDsCall {
        schemaUID: schema_uid,
        start,
        length,
        reverseOrder: reverse_order,
    };

    let result = execute_call(&provider, config.indexer_address, uids_call.abi_encode()).await?;
    let decoded = IIndexer::getSchemaAttestationUIDsCall::abi_decode_returns(&result)
        .map_err(|e| format!("Failed to decode UIDs result: {}", e))?;

    println!("Retrieved {} attestation UIDs for schema {}", decoded.len(), schema_uid);

    Ok(decoded)
}

// =============================================================================
// Schema-Attester-Recipient Queries
// =============================================================================

/// Queries the EAS Indexer to count attestations for a specific schema/attester/recipient combination
pub async fn query_schema_attester_recipient_count(
    schema_uid: FixedBytes<32>,
    attester: Address,
    recipient: Address,
    config: Option<QueryConfig>,
) -> Result<U256, String> {
    let config = config.unwrap_or_default();
    let provider = create_provider(&config.chain_name).await?;

    let count_call = IIndexer::getSchemaAttesterRecipientAttestationUIDCountCall {
        schemaUID: schema_uid,
        attester,
        recipient,
    };

    let result = execute_call(&provider, config.indexer_address, count_call.abi_encode()).await?;
    let attestation_count = U256::from_be_slice(&result);

    println!(
        "Found {} attestations for schema {} from attester {} to recipient {}",
        attestation_count, schema_uid, attester, recipient
    );

    Ok(attestation_count)
}

/// Queries the EAS Indexer to get attestation UIDs for a specific schema/attester/recipient combination
pub async fn query_schema_attester_recipient_uids(
    schema_uid: FixedBytes<32>,
    attester: Address,
    recipient: Address,
    start: U256,
    length: U256,
    reverse_order: bool,
    config: Option<QueryConfig>,
) -> Result<Vec<FixedBytes<32>>, String> {
    let config = config.unwrap_or_default();
    let provider = create_provider(&config.chain_name).await?;

    let uids_call = IIndexer::getSchemaAttesterRecipientAttestationUIDsCall {
        schemaUID: schema_uid,
        attester,
        recipient,
        start,
        length,
        reverseOrder: reverse_order,
    };

    let result = execute_call(&provider, config.indexer_address, uids_call.abi_encode()).await?;
    let decoded =
        IIndexer::getSchemaAttesterRecipientAttestationUIDsCall::abi_decode_returns(&result)
            .map_err(|e| format!("Failed to decode UIDs result: {}", e))?;

    println!(
        "Retrieved {} attestation UIDs for schema {} from attester {} to recipient {}",
        decoded.len(),
        schema_uid,
        attester,
        recipient
    );

    Ok(decoded)
}

// =============================================================================
// Attestation Data Queries
// =============================================================================

/// Checks if an attestation has been indexed
pub async fn is_attestation_indexed(
    attestation_uid: FixedBytes<32>,
    config: Option<QueryConfig>,
) -> Result<bool, String> {
    let config = config.unwrap_or_default();
    let provider = create_provider(&config.chain_name).await?;

    let indexed_call = IIndexer::isAttestationIndexedCall { attestationUID: attestation_uid };

    let result = execute_call(&provider, config.indexer_address, indexed_call.abi_encode()).await?;
    let is_indexed = result[31] != 0; // Boolean is stored as the last byte

    println!("Attestation {} is {}indexed", attestation_uid, if is_indexed { "" } else { "not " });

    Ok(is_indexed)
}

/// Queries the EAS contract to get full attestation data
pub async fn query_attestation(
    attestation_uid: FixedBytes<32>,
    config: Option<QueryConfig>,
) -> Result<IEAS::Attestation, String> {
    let config = config.unwrap_or_default();
    let provider = create_provider(&config.chain_name).await?;

    let attestation_call = IEAS::getAttestationCall { uid: attestation_uid };

    let result = execute_call(&provider, config.eas_address, attestation_call.abi_encode()).await?;
    let decoded = IEAS::getAttestationCall::abi_decode_returns(&result)
        .map_err(|e| format!("Failed to decode attestation result: {}", e))?;

    println!(
        "Retrieved attestation {} from attester {} to recipient {}",
        attestation_uid, decoded.attester, decoded.recipient
    );

    Ok(decoded)
}

// =============================================================================
// Convenience Functions
// =============================================================================

/// Convenience function to query attestations for a recipient (backwards compatibility)
pub async fn query_attestations_for_recipient(recipient: Address) -> Result<U256, String> {
    let schema_uid = FixedBytes([0u8; 32]); // Query all schemas
    query_received_attestation_count(recipient, schema_uid, None).await
}

/// Retrieves all attestation data for a list of UIDs
pub async fn query_attestations_batch(
    uids: Vec<FixedBytes<32>>,
    config: Option<QueryConfig>,
) -> Result<Vec<IEAS::Attestation>, String> {
    let mut attestations = Vec::new();

    for uid in uids {
        match query_attestation(uid, config.clone()).await {
            Ok(attestation) => attestations.push(attestation),
            Err(e) => {
                println!("Warning: Failed to retrieve attestation {}: {}", uid, e);
                continue;
            }
        }
    }

    Ok(attestations)
}

/// Gets the most recent attestations for a recipient and schema
pub async fn query_recent_received_attestations(
    recipient: Address,
    schema_uid: FixedBytes<32>,
    limit: u64,
    config: Option<QueryConfig>,
) -> Result<Vec<IEAS::Attestation>, String> {
    let uids = query_received_attestation_uids(
        recipient,
        schema_uid,
        U256::from(0),
        U256::from(limit),
        true, // reverse order to get most recent first
        config.clone(),
    )
    .await?;

    query_attestations_batch(uids, config).await
}

/// Gets the most recent attestations sent by an attester for a schema
pub async fn query_recent_sent_attestations(
    attester: Address,
    schema_uid: FixedBytes<32>,
    limit: u64,
    config: Option<QueryConfig>,
) -> Result<Vec<IEAS::Attestation>, String> {
    let uids = query_sent_attestation_uids(
        attester,
        schema_uid,
        U256::from(0),
        U256::from(limit),
        true, // reverse order to get most recent first
        config.clone(),
    )
    .await?;

    query_attestations_batch(uids, config).await
}
