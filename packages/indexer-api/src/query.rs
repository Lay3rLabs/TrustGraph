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
// Indexer Queries
// =============================================================================

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

    pub async fn get_attestation_uids_by_schema(
        &self,
        schema_uid: FixedBytes<32>,
        start: U256,
        length: U256,
        reverse_order: bool,
    ) -> Result<Vec<FixedBytes<32>>, String> {
        self.getEventsByTypeAndTag(
            "attestation".to_string(),
            format!("schema:{}", schema_uid),
            start,
            length,
            reverse_order,
        )
        .call()
        .await
        .map_err(|e| format!("Failed to get schema attestation UIDs: {}", e))?
        .iter()
        .map(|event| self.get_attestation_uid(event))
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

    pub async fn get_attestation_uids_by_recipient(
        &self,
        recipient: Address,
        start: U256,
        length: U256,
        reverse_order: bool,
    ) -> Result<Vec<FixedBytes<32>>, String> {
        self.getEventsByTypeAndTag(
            "attestation".to_string(),
            format!("recipient:{}", recipient),
            start,
            length,
            reverse_order,
        )
        .call()
        .await
        .map_err(|e| format!("Failed to get recipient attestation UIDs: {}", e))?
        .iter()
        .map(|event| self.get_attestation_uid(event))
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

    pub async fn get_attestation_uids_by_attester(
        &self,
        attester: Address,
        start: U256,
        length: U256,
        reverse_order: bool,
    ) -> Result<Vec<FixedBytes<32>>, String> {
        self.getEventsByTypeAndTag(
            "attestation".to_string(),
            format!("attester:{}", attester),
            start,
            length,
            reverse_order,
        )
        .call()
        .await
        .map_err(|e| format!("Failed to get attester attestation UIDs: {}", e))?
        .iter()
        .map(|event| self.get_attestation_uid(event))
        .collect::<Result<Vec<_>, _>>()
    }

    pub async fn get_attestation_count_by_schema_and_attester(
        &self,
        schema_uid: FixedBytes<32>,
        attester: Address,
    ) -> Result<U256, String> {
        self.getEventCountByTypeAndTag(
            "attestation".to_string(),
            format!("schema:{}/attester:{}", schema_uid, attester),
        )
        .call()
        .await
        .map_err(|e| format!("Failed to get schema/attester attestation count: {}", e))
    }

    pub async fn get_attestation_uids_by_schema_and_attester(
        &self,
        schema_uid: FixedBytes<32>,
        attester: Address,
        start: U256,
        length: U256,
        reverse_order: bool,
    ) -> Result<Vec<FixedBytes<32>>, String> {
        self.getEventsByTypeAndTag(
            "attestation".to_string(),
            format!("schema:{}/attester:{}", schema_uid, attester),
            start,
            length,
            reverse_order,
        )
        .call()
        .await
        .map_err(|e| format!("Failed to get schema/attester attestation UIDs: {}", e))?
        .iter()
        .map(|event| self.get_attestation_uid(event))
        .collect::<Result<Vec<_>, _>>()
    }

    pub async fn get_attestation_count_by_schema_and_recipient(
        &self,
        schema_uid: FixedBytes<32>,
        recipient: Address,
    ) -> Result<U256, String> {
        self.getEventCountByTypeAndTag(
            "attestation".to_string(),
            format!("schema:{}/recipient:{}", schema_uid, recipient),
        )
        .call()
        .await
        .map_err(|e| format!("Failed to get schema/recipient attestation count: {}", e))
    }

    pub async fn get_attestation_uids_by_schema_and_recipient(
        &self,
        schema_uid: FixedBytes<32>,
        recipient: Address,
        start: U256,
        length: U256,
        reverse_order: bool,
    ) -> Result<Vec<FixedBytes<32>>, String> {
        self.getEventsByTypeAndTag(
            "attestation".to_string(),
            format!("schema:{}/recipient:{}", schema_uid, recipient),
            start,
            length,
            reverse_order,
        )
        .call()
        .await
        .map_err(|e| format!("Failed to get schema/recipient attestation UIDs: {}", e))?
        .iter()
        .map(|event| self.get_attestation_uid(event))
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

    pub async fn get_attestation_uids_by_schema_and_attester_and_recipient(
        &self,
        schema_uid: FixedBytes<32>,
        attester: Address,
        recipient: Address,
        start: U256,
        length: U256,
        reverse_order: bool,
    ) -> Result<Vec<FixedBytes<32>>, String> {
        self.getEventsByTypeAndTag(
            "attestation".to_string(),
            format!("schema:{}/attester:{}/recipient:{}", schema_uid, attester, recipient),
            start,
            length,
            reverse_order,
        )
        .call()
        .await
        .map_err(|e| format!("Failed to get schema/attester/recipient attestation UIDs: {}", e))?
        .iter()
        .map(|event| self.get_attestation_uid(event))
        .collect::<Result<Vec<_>, _>>()
    }
}

// =============================================================================
// Helpers
// =============================================================================

impl WavsIndexerQuerier {
    fn get_attestation_uid(&self, event: &IndexedEvent) -> Result<FixedBytes<32>, String> {
        event
            .tags
            .iter()
            .find(|tag| tag.starts_with("uid:"))
            .ok_or(format!("No `uid` tag found in event with ID {:?}", event.eventId))?
            .split(":")
            .nth(1)
            .ok_or(format!("No `uid` found in tags for event with ID {:?}", event.eventId))?
            .parse::<FixedBytes<32>>()
            .map_err(|e| format!("Failed to parse uid: {}", e))
    }
}
