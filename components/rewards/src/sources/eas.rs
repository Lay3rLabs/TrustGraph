use crate::bindings::host::get_evm_chain_config;
use alloy_network::Ethereum;
use alloy_provider::{Provider, RootProvider};
use alloy_rpc_types::TransactionInput;
use alloy_sol_types::{sol, SolCall, SolType};
use anyhow::Result;
use async_trait::async_trait;
use std::str::FromStr;
use wavs_wasi_utils::evm::{
    alloy_primitives::{hex, Address, TxKind, U256},
    new_evm_provider,
};

use super::Source;

/// Types of EAS-based rewards.
#[derive(Clone, Debug)]
pub enum EasRewardType {
    /// Rewards based on received attestations count.
    ReceivedAttestations,
    /// Rewards based on sent attestations count.
    SentAttestations,
    /// Rewards based on attestations to a specific schema.
    SchemaAttestations(String),
}

/// Compute rewards from EAS attestations.
pub struct EasSource {
    /// EAS contract address.
    pub eas_address: Address,
    /// EAS indexer address (for queries).
    pub indexer_address: Address,
    /// Chain name for configuration.
    pub chain_name: String,
    /// Type of EAS reward to compute.
    pub reward_type: EasRewardType,
    /// Rewards per attestation.
    pub rewards_per_attestation: U256,
}

impl EasSource {
    pub fn new(
        eas_address: &str,
        indexer_address: &str,
        chain_name: &str,
        reward_type: EasRewardType,
        rewards_per_attestation: U256,
    ) -> Self {
        let eas_addr = Address::from_str(eas_address).unwrap();
        let indexer_addr = Address::from_str(indexer_address).unwrap();

        Self {
            eas_address: eas_addr,
            indexer_address: indexer_addr,
            chain_name: chain_name.to_string(),
            reward_type,
            rewards_per_attestation,
        }
    }
}

#[async_trait(?Send)]
impl Source for EasSource {
    fn get_name(&self) -> &str {
        "EAS"
    }

    async fn get_accounts(&self) -> Result<Vec<String>> {
        match &self.reward_type {
            EasRewardType::ReceivedAttestations => {
                self.get_accounts_with_received_attestations().await
            }
            EasRewardType::SentAttestations => self.get_accounts_with_sent_attestations().await,
            EasRewardType::SchemaAttestations(schema) => {
                self.get_accounts_with_schema_attestations(schema).await
            }
        }
    }

    async fn get_rewards(&self, account: &str) -> Result<U256> {
        let address = Address::from_str(account)?;
        let attestation_count = match &self.reward_type {
            EasRewardType::ReceivedAttestations => {
                self.query_received_attestation_count(address).await?
            }
            EasRewardType::SentAttestations => self.query_sent_attestation_count(address).await?,
            EasRewardType::SchemaAttestations(schema) => {
                self.query_schema_attestation_count(schema, address).await?
            }
        };

        Ok(self.rewards_per_attestation * U256::from(attestation_count))
    }

    async fn get_metadata(&self) -> Result<serde_json::Value> {
        let reward_type_str = match &self.reward_type {
            EasRewardType::ReceivedAttestations => "received_attestations".to_string(),
            EasRewardType::SentAttestations => "sent_attestations".to_string(),
            EasRewardType::SchemaAttestations(schema) => format!("schema_attestations:{}", schema),
        };

        Ok(serde_json::json!({
            "eas_address": self.eas_address.to_string(),
            "indexer_address": self.indexer_address.to_string(),
            "chain_name": self.chain_name,
            "reward_type": reward_type_str,
            "rewards_per_attestation": self.rewards_per_attestation.to_string(),
        }))
    }
}

impl EasSource {
    async fn create_provider(&self) -> Result<RootProvider<Ethereum>> {
        let chain_config = get_evm_chain_config(&self.chain_name)
            .ok_or_else(|| anyhow::anyhow!("Failed to get chain config for {}", self.chain_name))?;
        let provider = new_evm_provider::<Ethereum>(
            chain_config
                .http_endpoint
                .ok_or_else(|| anyhow::anyhow!("No HTTP endpoint configured"))?,
        );
        Ok(provider)
    }

    async fn execute_call(&self, call_data: Vec<u8>) -> Result<Vec<u8>> {
        let provider = self.create_provider().await?;

        let tx = alloy_rpc_types::eth::TransactionRequest {
            to: Some(TxKind::Call(self.indexer_address)),
            input: TransactionInput { input: Some(call_data.into()), data: None },
            ..Default::default()
        };

        let result = provider.call(tx).await?;
        Ok(result.to_vec())
    }

    async fn query_received_attestation_count(&self, recipient: Address) -> Result<u64> {
        let call = IEASIndexer::receivedAttestationCountCall { recipient };
        let result = self.execute_call(call.abi_encode()).await?;
        let count: U256 = U256::from_be_slice(&result);
        Ok(count.to::<u64>())
    }

    async fn query_sent_attestation_count(&self, attester: Address) -> Result<u64> {
        let call = IEASIndexer::sentAttestationCountCall { attester };
        let result = self.execute_call(call.abi_encode()).await?;
        let count: U256 = U256::from_be_slice(&result);
        Ok(count.to::<u64>())
    }

    async fn query_schema_attestation_count(
        &self,
        schema_uid: &str,
        account: Address,
    ) -> Result<u64> {
        let schema_bytes = hex::decode(schema_uid.strip_prefix("0x").unwrap_or(schema_uid))?;
        let mut schema_array = [0u8; 32];
        schema_array.copy_from_slice(&schema_bytes[..32]);

        let call = IEASIndexer::schemaAttestationCountCall { schema: schema_array.into(), account };
        let result = self.execute_call(call.abi_encode()).await?;
        let count: U256 = U256::from_be_slice(&result);
        Ok(count.to::<u64>())
    }

    async fn get_accounts_with_received_attestations(&self) -> Result<Vec<String>> {
        // This is a simplified implementation - in practice, you might want to query
        // for accounts that have received attestations in a specific time period
        // or use indexed events to get this information
        let call = IEASIndexer::getAllRecipientsCall {};
        let result = self.execute_call(call.abi_encode()).await?;
        let recipients: Vec<Address> = <sol! { address[] }>::abi_decode(&result)?;
        Ok(recipients.into_iter().map(|addr| addr.to_string()).collect())
    }

    async fn get_accounts_with_sent_attestations(&self) -> Result<Vec<String>> {
        let call = IEASIndexer::getAllAttestersCall {};
        let result = self.execute_call(call.abi_encode()).await?;
        let attesters: Vec<Address> = <sol! { address[] }>::abi_decode(&result)?;
        Ok(attesters.into_iter().map(|addr| addr.to_string()).collect())
    }

    async fn get_accounts_with_schema_attestations(&self, schema_uid: &str) -> Result<Vec<String>> {
        let schema_bytes = hex::decode(schema_uid.strip_prefix("0x").unwrap_or(schema_uid))?;
        let mut schema_array = [0u8; 32];
        schema_array.copy_from_slice(&schema_bytes[..32]);

        let call = IEASIndexer::getSchemaAccountsCall { schema: schema_array.into() };
        let result = self.execute_call(call.abi_encode()).await?;
        let accounts: Vec<Address> = <sol! { address[] }>::abi_decode(&result)?;
        Ok(accounts.into_iter().map(|addr| addr.to_string()).collect())
    }
}

sol! {
    interface IEASIndexer {
        function receivedAttestationCount(address recipient) external view returns (uint256);
        function sentAttestationCount(address attester) external view returns (uint256);
        function schemaAttestationCount(bytes32 schema, address account) external view returns (uint256);
        function getAllRecipients() external view returns (address[] memory);
        function getAllAttesters() external view returns (address[] memory);
        function getSchemaAccounts(bytes32 schema) external view returns (address[] memory);
    }
}
