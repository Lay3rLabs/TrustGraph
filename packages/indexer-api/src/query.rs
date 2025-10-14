use std::ops::{Deref, DerefMut};

use alloy_network::Ethereum;
use alloy_provider::RootProvider;
use wavs_wasi_utils::evm::{
    alloy_primitives::{Address, FixedBytes, U256},
    new_evm_provider,
};

use crate::solidity::{IWavsIndexer, IWavsIndexerInstance, IndexedEvent};

/// Configuration for EAS query operations
#[derive(Clone, Debug)]
pub struct WavsIndexerQuerier {
    pub indexer_address: Address,
    pub rpc_endpoint: String,
    pub contract: IWavsIndexerInstance<RootProvider<Ethereum>, Ethereum>,
}

// Pass queries through to the contract
impl Deref for WavsIndexerQuerier {
    type Target = IWavsIndexerInstance<RootProvider<Ethereum>, Ethereum>;
    fn deref(&self) -> &Self::Target {
        &self.contract
    }
}

// Pass queries through to the contract
impl DerefMut for WavsIndexerQuerier {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.contract
    }
}

impl WavsIndexerQuerier {
    /// Creates a new QueryConfig with the provided parameters
    pub async fn new(indexer_address: Address, rpc_endpoint: String) -> Result<Self, String> {
        let provider = new_evm_provider::<Ethereum>(rpc_endpoint.clone());
        let contract = IWavsIndexer::new(indexer_address, provider);
        Ok(Self { indexer_address, rpc_endpoint, contract })
    }

    pub async fn from_str(indexer_address: &str, rpc_endpoint: &str) -> Result<Self, String> {
        let indexer_address = indexer_address
            .parse::<Address>()
            .map_err(|e| format!("Invalid indexer address format: {}", e))?;
        Self::new(indexer_address, rpc_endpoint.to_string()).await
    }
}

// =============================================================================
// Attestation Queries
// =============================================================================

pub struct IndexedAttestation {
    pub uid: FixedBytes<32>,
    pub schema_uid: FixedBytes<32>,
    pub attester: Address,
    pub recipient: Address,
    pub event: IndexedEvent,
}

impl WavsIndexerQuerier {
    pub async fn is_attestation_indexed(&self, uid: FixedBytes<32>) -> Result<bool, String> {
        let result = self
            .getEventCountByTypeAndTag("attestation".to_string(), format!("uid:{}", uid))
            .call()
            .await
            .map_err(|e| format!("Failed to check if attestation is indexed: {}", e))?;

        Ok(result > U256::ZERO)
    }

    pub async fn get_attestation_count_by_schema(
        &self,
        schema_uid: FixedBytes<32>,
    ) -> Result<U256, String> {
        self.getEventCountByTypeAndTag("attestation".to_string(), format!("schema:{}", schema_uid))
            .call()
            .await
            .map_err(|e| format!("Failed to get schema attestation count: {}", e))
    }

    pub async fn get_indexed_attestations_by_schema(
        &self,
        schema_uid: FixedBytes<32>,
        start: u64,
        length: u64,
        reverse_order: bool,
    ) -> Result<Vec<IndexedAttestation>, String> {
        self.getEventsByTypeAndTag(
            "attestation".to_string(),
            format!("schema:{}", schema_uid),
            U256::from(start),
            U256::from(length),
            reverse_order,
        )
        .call()
        .await
        .map_err(|e| format!("Failed to get schema attestation UIDs: {}", e))?
        .into_iter()
        .map(|event| self.get_indexed_attestation(event))
        .collect::<Result<Vec<_>, _>>()
    }

    pub async fn get_attestation_count_by_recipient(
        &self,
        recipient: Address,
    ) -> Result<U256, String> {
        self.getEventCountByTypeAndTag(
            "attestation".to_string(),
            format!("recipient:{}", recipient),
        )
        .call()
        .await
        .map_err(|e| format!("Failed to get recipient attestation count: {}", e))
    }

    pub async fn get_indexed_attestations_by_recipient(
        &self,
        recipient: Address,
        start: u64,
        length: u64,
        reverse_order: bool,
    ) -> Result<Vec<IndexedAttestation>, String> {
        self.getEventsByTypeAndTag(
            "attestation".to_string(),
            format!("recipient:{}", recipient),
            U256::from(start),
            U256::from(length),
            reverse_order,
        )
        .call()
        .await
        .map_err(|e| format!("Failed to get recipient attestation UIDs: {}", e))?
        .into_iter()
        .map(|event| self.get_indexed_attestation(event))
        .collect::<Result<Vec<_>, _>>()
    }

    pub async fn get_attestation_count_by_attester(
        &self,
        attester: Address,
    ) -> Result<U256, String> {
        self.getEventCountByTypeAndTag("attestation".to_string(), format!("attester:{}", attester))
            .call()
            .await
            .map_err(|e| format!("Failed to get attester attestation count: {}", e))
    }

    pub async fn get_indexed_attestations_by_attester(
        &self,
        attester: Address,
        start: u64,
        length: u64,
        reverse_order: bool,
    ) -> Result<Vec<IndexedAttestation>, String> {
        self.getEventsByTypeAndTag(
            "attestation".to_string(),
            format!("attester:{}", attester),
            U256::from(start),
            U256::from(length),
            reverse_order,
        )
        .call()
        .await
        .map_err(|e| format!("Failed to get attester attestation UIDs: {}", e))?
        .into_iter()
        .map(|event| self.get_indexed_attestation(event))
        .collect::<Result<Vec<_>, _>>()
    }

    pub async fn get_attestation_count_by_schema_and_attester(
        &self,
        schema_uid: FixedBytes<32>,
        attester: &Address,
    ) -> Result<U256, String> {
        self.getEventCountByTypeAndTag(
            "attestation".to_string(),
            format!("schema:{}/attester:{}", schema_uid, attester),
        )
        .call()
        .await
        .map_err(|e| format!("Failed to get schema/attester attestation count: {}", e))
    }

    pub async fn get_indexed_attestations_by_schema_and_attester(
        &self,
        schema_uid: FixedBytes<32>,
        attester: &Address,
        start: U256,
        length: U256,
        reverse_order: bool,
    ) -> Result<Vec<IndexedAttestation>, String> {
        self.getEventsByTypeAndTag(
            "attestation".to_string(),
            format!("schema:{}/attester:{}", schema_uid, attester),
            U256::from(start),
            U256::from(length),
            reverse_order,
        )
        .call()
        .await
        .map_err(|e| format!("Failed to get schema/attester attestation UIDs: {}", e))?
        .into_iter()
        .map(|event| self.get_indexed_attestation(event))
        .collect::<Result<Vec<_>, _>>()
    }

    pub async fn get_attestation_count_by_schema_and_recipient(
        &self,
        schema_uid: FixedBytes<32>,
        recipient: &Address,
    ) -> Result<U256, String> {
        self.getEventCountByTypeAndTag(
            "attestation".to_string(),
            format!("schema:{}/recipient:{}", schema_uid, recipient),
        )
        .call()
        .await
        .map_err(|e| format!("Failed to get schema/recipient attestation count: {}", e))
    }

    pub async fn get_indexed_attestations_by_schema_and_recipient(
        &self,
        schema_uid: FixedBytes<32>,
        recipient: &Address,
        start: U256,
        length: U256,
        reverse_order: bool,
    ) -> Result<Vec<IndexedAttestation>, String> {
        self.getEventsByTypeAndTag(
            "attestation".to_string(),
            format!("schema:{}/recipient:{}", schema_uid, recipient),
            U256::from(start),
            U256::from(length),
            reverse_order,
        )
        .call()
        .await
        .map_err(|e| format!("Failed to get schema/recipient attestation UIDs: {}", e))?
        .into_iter()
        .map(|event| self.get_indexed_attestation(event))
        .collect::<Result<Vec<_>, _>>()
    }

    pub async fn get_attestation_count_by_schema_and_attester_and_recipient(
        &self,
        schema_uid: FixedBytes<32>,
        attester: Address,
        recipient: Address,
    ) -> Result<U256, String> {
        self.getEventCountByTypeAndTag(
            "attestation".to_string(),
            format!("schema:{}/attester:{}/recipient:{}", schema_uid, attester, recipient),
        )
        .call()
        .await
        .map_err(|e| format!("Failed to get schema/attester/recipient attestation count: {}", e))
    }

    pub async fn get_indexed_attestations_by_schema_and_attester_and_recipient(
        &self,
        schema_uid: FixedBytes<32>,
        attester: Address,
        recipient: Address,
        start: U256,
        length: U256,
        reverse_order: bool,
    ) -> Result<Vec<IndexedAttestation>, String> {
        self.getEventsByTypeAndTag(
            "attestation".to_string(),
            format!("schema:{}/attester:{}/recipient:{}", schema_uid, attester, recipient),
            U256::from(start),
            U256::from(length),
            reverse_order,
        )
        .call()
        .await
        .map_err(|e| format!("Failed to get schema/attester/recipient attestation UIDs: {}", e))?
        .into_iter()
        .map(|event| self.get_indexed_attestation(event))
        .collect::<Result<Vec<_>, _>>()
    }

    fn get_indexed_attestation(&self, event: IndexedEvent) -> Result<IndexedAttestation, String> {
        let uid = event
            .tags
            .iter()
            .find(|tag| tag.starts_with("uid:"))
            .ok_or(format!("No `uid` tag found in event with ID {:?}", event.eventId))?
            .split(":")
            .nth(1)
            .ok_or(format!("No `uid` found in tags for event with ID {:?}", event.eventId))?
            .parse::<FixedBytes<32>>()
            .map_err(|e| format!("Failed to parse uid: {}", e))?;

        let schema_uid = event
            .tags
            .iter()
            .find(|tag| tag.starts_with("schema:"))
            .ok_or(format!("No `schema` tag found in event with ID {:?}", event.eventId))?
            .split(":")
            .nth(1)
            .ok_or(format!("No `schema` found in tags for event with ID {:?}", event.eventId))?
            .parse::<FixedBytes<32>>()
            .map_err(|e| format!("Failed to parse schema uid: {}", e))?;

        let attester = event
            .tags
            .iter()
            .find(|tag| tag.starts_with("attester:"))
            .ok_or(format!("No `attester` tag found in event with ID {:?}", event.eventId))?
            .split(":")
            .nth(1)
            .ok_or(format!("No `attester` found in tags for event with ID {:?}", event.eventId))?
            .parse::<Address>()
            .map_err(|e| format!("Failed to parse attester: {}", e))?;

        let recipient = event
            .tags
            .iter()
            .find(|tag| tag.starts_with("recipient:"))
            .ok_or(format!("No `recipient` tag found in event with ID {:?}", event.eventId))?
            .split(":")
            .nth(1)
            .ok_or(format!("No `recipient` found in tags for event with ID {:?}", event.eventId))?
            .parse::<Address>()
            .map_err(|e| format!("Failed to parse recipient: {}", e))?;

        Ok(IndexedAttestation { uid, schema_uid, attester, recipient, event })
    }
}

// =============================================================================
// Interaction Queries
// =============================================================================

impl WavsIndexerQuerier {
    pub async fn get_interaction_count_by_type(
        &self,
        interaction_type: &str,
    ) -> Result<u64, String> {
        Ok(self
            .getEventCountByTypeAndTag(
                "interaction".to_string(),
                format!("type:{}", interaction_type),
            )
            .call()
            .await
            .map_err(|e| format!("Failed to get interaction count by type: {}", e))?
            .to::<u64>())
    }

    pub async fn get_interactions_by_type(
        &self,
        interaction_type: &str,
        start: u64,
        length: u64,
        reverse_order: bool,
    ) -> Result<Vec<IndexedEvent>, String> {
        self.getEventsByTypeAndTag(
            "interaction".to_string(),
            format!("type:{}", interaction_type),
            U256::from(start),
            U256::from(length),
            reverse_order,
        )
        .call()
        .await
        .map_err(|e| format!("Failed to get interactions by type: {}", e))
    }

    pub async fn get_interaction_count_by_type_and_address(
        &self,
        interaction_type: &str,
        address: Address,
    ) -> Result<u64, String> {
        Ok(self
            .getEventCountByAddressAndTypeAndTag(
                address,
                "interaction".to_string(),
                format!("type:{}", interaction_type),
            )
            .call()
            .await
            .map_err(|e| format!("Failed to get interaction count by type and address: {}", e))?
            .to::<u64>())
    }

    pub async fn get_interactions_by_type_and_address(
        &self,
        interaction_type: &str,
        address: Address,
        start: u64,
        length: u64,
        reverse_order: bool,
    ) -> Result<Vec<IndexedEvent>, String> {
        self.getEventsByAddressAndTypeAndTag(
            address,
            "interaction".to_string(),
            format!("type:{}", interaction_type),
            U256::from(start),
            U256::from(length),
            reverse_order,
        )
        .call()
        .await
        .map_err(|e| format!("Failed to get interactions by type and address: {}", e))
    }

    pub async fn get_interaction_count_by_contract_and_type(
        &self,
        chain_id: &str,
        contract: &Address,
        interaction_type: &str,
    ) -> Result<u64, String> {
        Ok(self
            .getEventCountByContractAndTypeAndTag(
                chain_id.to_string(),
                *contract,
                "interaction".to_string(),
                format!("type:{}", interaction_type),
            )
            .call()
            .await
            .map_err(|e| format!("Failed to get interaction count by contract and type: {}", e))?
            .to::<u64>())
    }

    pub async fn get_interactions_by_contract_and_type(
        &self,
        interaction_type: &str,
        chain_id: &str,
        contract: &Address,
        start: u64,
        length: u64,
        reverse_order: bool,
    ) -> Result<Vec<IndexedEvent>, String> {
        self.getEventsByContractAndTypeAndTag(
            chain_id.to_string(),
            *contract,
            "interaction".to_string(),
            format!("type:{}", interaction_type),
            U256::from(start),
            U256::from(length),
            reverse_order,
        )
        .call()
        .await
        .map_err(|e| format!("Failed to get interactions by contract and type: {}", e))
    }
}
