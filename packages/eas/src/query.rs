use alloy_network::Ethereum;
use alloy_provider::{Provider, RootProvider};
use alloy_rpc_types::{TransactionInput, TransactionRequest};
use alloy_sol_types::{sol, SolCall};
use wavs_indexer_api::{IndexedAttestation, WavsIndexerQuerier};
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
}

/// Configuration for EAS query operations
#[derive(Clone, Debug)]
pub struct QueryConfig {
    pub eas_address: Address,
    pub indexer_address: Address,
    pub rpc_endpoint: String,
}

impl QueryConfig {
    /// Creates a new QueryConfig with the provided parameters
    pub fn new(eas_address: Address, indexer_address: Address, rpc_endpoint: String) -> Self {
        Self { eas_address, indexer_address, rpc_endpoint }
    }

    /// Creates a QueryConfig from string addresses
    pub fn from_strings(
        eas_address: &str,
        indexer_address: &str,
        rpc_endpoint: String,
    ) -> Result<Self, String> {
        let eas_address = eas_address
            .parse::<Address>()
            .map_err(|e| format!("Invalid EAS address format: {}", e))?;
        let indexer_address = indexer_address
            .parse::<Address>()
            .map_err(|e| format!("Invalid indexer address format: {}", e))?;

        Ok(Self::new(eas_address, indexer_address, rpc_endpoint))
    }

    /// Creates a QueryConfig for local development
    pub fn local() -> Self {
        Self {
            eas_address: Address::from([0u8; 20]),
            indexer_address: Address::from([0u8; 20]),
            rpc_endpoint: "http://127.0.0.1:8545".to_string(),
        }
    }

    /// Creates a QueryConfig for Sepolia testnet
    pub fn sepolia(eas_address: Address, indexer_address: Address) -> Self {
        Self::new(
            eas_address,
            indexer_address,
            "https://sepolia.infura.io/v3/YOUR_API_KEY".to_string(),
        )
    }

    /// Creates a QueryConfig for Ethereum mainnet
    pub fn mainnet(eas_address: Address, indexer_address: Address) -> Self {
        Self::new(
            eas_address,
            indexer_address,
            "https://mainnet.infura.io/v3/YOUR_API_KEY".to_string(),
        )
    }

    pub async fn indexer_querier(&self) -> Result<WavsIndexerQuerier, String> {
        WavsIndexerQuerier::new(self.indexer_address, self.rpc_endpoint.clone()).await
    }
}

impl Default for QueryConfig {
    fn default() -> Self {
        Self::local()
    }
}

/// Creates a provider instance for EVM queries
async fn create_provider(rpc_endpoint: &str) -> Result<RootProvider<Ethereum>, String> {
    let provider = new_evm_provider::<Ethereum>(rpc_endpoint.to_string());
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
    println!("Querying with config {:?}", config);
    let indexer_querier = config.indexer_querier().await?;
    let attestation_count = indexer_querier
        .get_attestation_count_by_schema_and_recipient(schema_uid, &recipient)
        .await?;

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
) -> Result<Vec<IndexedAttestation>, String> {
    let config = config.unwrap_or_default();
    let indexer_querier = config.indexer_querier().await?;
    let uids = indexer_querier
        .get_indexed_attestations_by_schema_and_recipient(
            schema_uid,
            &recipient,
            start,
            length,
            reverse_order,
        )
        .await?;

    println!("Retrieved {} received attestation UIDs for recipient {}", uids.len(), recipient);

    Ok(uids)
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
    let indexer_querier = config.indexer_querier().await?;
    let attestation_count =
        indexer_querier.get_attestation_count_by_schema_and_attester(schema_uid, &attester).await?;

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
) -> Result<Vec<IndexedAttestation>, String> {
    let config = config.unwrap_or_default();
    let indexer_querier = config.indexer_querier().await?;
    let uids = indexer_querier
        .get_indexed_attestations_by_schema_and_attester(
            schema_uid,
            &attester,
            start,
            length,
            reverse_order,
        )
        .await?;

    println!("Retrieved {} sent attestation UIDs for attester {}", uids.len(), attester);

    Ok(uids)
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
    let indexer_querier = config.indexer_querier().await?;
    let attestation_count = indexer_querier.get_attestation_count_by_schema(schema_uid).await?;

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
) -> Result<Vec<IndexedAttestation>, String> {
    let config = config.unwrap_or_default();
    let indexer_querier = config.indexer_querier().await?;
    let uids = indexer_querier
        .get_indexed_attestations_by_schema(
            schema_uid,
            start.to::<u64>(),
            length.to::<u64>(),
            reverse_order,
        )
        .await?;

    println!("Retrieved {} attestation UIDs for schema {}", uids.len(), schema_uid);

    Ok(uids)
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
    let indexer_querier = config.indexer_querier().await?;
    let attestation_count = indexer_querier
        .get_attestation_count_by_schema_and_attester_and_recipient(schema_uid, attester, recipient)
        .await?;

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
) -> Result<Vec<IndexedAttestation>, String> {
    let config = config.unwrap_or_default();
    let indexer_querier = config.indexer_querier().await?;
    let uids = indexer_querier
        .get_indexed_attestations_by_schema_and_attester_and_recipient(
            schema_uid,
            attester,
            recipient,
            start,
            length,
            reverse_order,
        )
        .await?;

    println!(
        "Retrieved {} attestation UIDs for schema {} from attester {} to recipient {}",
        uids.len(),
        schema_uid,
        attester,
        recipient
    );

    Ok(uids)
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
    let indexer_querier = config.indexer_querier().await?;
    let is_indexed = indexer_querier.is_attestation_indexed(attestation_uid).await?;

    println!("Attestation {} is {}indexed", attestation_uid, if is_indexed { "" } else { "not " });

    Ok(is_indexed)
}

/// Queries the EAS contract to get full attestation data
pub async fn query_attestation(
    attestation_uid: FixedBytes<32>,
    config: Option<QueryConfig>,
) -> Result<IEAS::Attestation, String> {
    let config = config.unwrap_or_default();
    let provider = create_provider(&config.rpc_endpoint).await?;

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
    let uids: Vec<FixedBytes<32>> = query_received_attestation_uids(
        recipient,
        schema_uid,
        U256::from(0),
        U256::from(limit),
        true, // reverse order to get most recent first
        config.clone(),
    )
    .await?
    .into_iter()
    .map(|indexed| indexed.uid)
    .collect();

    query_attestations_batch(uids, config).await
}

/// Gets the most recent attestations sent by an attester for a schema
pub async fn query_recent_sent_attestations(
    attester: Address,
    schema_uid: FixedBytes<32>,
    limit: u64,
    config: Option<QueryConfig>,
) -> Result<Vec<IEAS::Attestation>, String> {
    let uids: Vec<FixedBytes<32>> = query_sent_attestation_uids(
        attester,
        schema_uid,
        U256::from(0),
        U256::from(limit),
        true, // reverse order to get most recent first
        config.clone(),
    )
    .await?
    .into_iter()
    .map(|indexed| indexed.uid)
    .collect();

    query_attestations_batch(uids, config).await
}

// =============================================================================
// Builder Pattern for Easy Configuration
// =============================================================================

/// Builder for QueryConfig to provide a fluent API
pub struct QueryConfigBuilder {
    eas_address: Option<Address>,
    indexer_address: Option<Address>,
    rpc_endpoint: Option<String>,
}

impl QueryConfigBuilder {
    pub fn new() -> Self {
        Self { eas_address: None, indexer_address: None, rpc_endpoint: None }
    }

    pub fn eas_address(mut self, address: Address) -> Self {
        self.eas_address = Some(address);
        self
    }

    pub fn eas_address_str(mut self, address: &str) -> Result<Self, String> {
        let addr =
            address.parse::<Address>().map_err(|e| format!("Invalid EAS address format: {}", e))?;
        self.eas_address = Some(addr);
        Ok(self)
    }

    pub fn indexer_address(mut self, address: Address) -> Self {
        self.indexer_address = Some(address);
        self
    }

    pub fn indexer_address_str(mut self, address: &str) -> Result<Self, String> {
        let addr = address
            .parse::<Address>()
            .map_err(|e| format!("Invalid indexer address format: {}", e))?;
        self.indexer_address = Some(addr);
        Ok(self)
    }

    pub fn rpc_endpoint(mut self, endpoint: String) -> Self {
        self.rpc_endpoint = Some(endpoint);
        self
    }

    pub fn build(self) -> Result<QueryConfig, String> {
        Ok(QueryConfig {
            eas_address: self.eas_address.ok_or("EAS address is required")?,
            indexer_address: self.indexer_address.ok_or("Indexer address is required")?,
            rpc_endpoint: self.rpc_endpoint.ok_or("RPC endpoint is required")?,
        })
    }
}

impl Default for QueryConfigBuilder {
    fn default() -> Self {
        Self::new()
    }
}
