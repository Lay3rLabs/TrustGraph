use crate::bindings::host::get_evm_chain_config;
use crate::pagerank::{AttestationGraph, PageRankRewardSource};
use alloy_network::Ethereum;
use alloy_provider::{Provider, RootProvider};
use alloy_rpc_types::TransactionInput;
use alloy_sol_types::{sol, SolCall};
use anyhow::Result;
use async_trait::async_trait;
use std::collections::HashMap;
use std::str::FromStr;
use wavs_wasi_utils::evm::{
    alloy_primitives::{hex, Address, FixedBytes, TxKind, U256},
    new_evm_provider,
};

use super::Source;

/// EAS PageRank reward source that calculates rewards based on PageRank algorithm
pub struct EasPageRankSource {
    /// EAS contract address
    pub eas_address: Address,
    /// EAS indexer address (for queries)
    pub indexer_address: Address,
    /// Chain name for configuration
    pub chain_name: String,
    /// PageRank reward configuration
    pub pagerank_config: PageRankRewardSource,
}

impl EasPageRankSource {
    pub fn new(
        eas_address: &str,
        indexer_address: &str,
        chain_name: &str,
        pagerank_config: PageRankRewardSource,
    ) -> Result<Self> {
        let eas_addr = Address::from_str(eas_address)
            .map_err(|e| anyhow::anyhow!("Invalid EAS address: {}", e))?;
        let indexer_addr = Address::from_str(indexer_address)
            .map_err(|e| anyhow::anyhow!("Invalid indexer address: {}", e))?;

        Ok(Self {
            eas_address: eas_addr,
            indexer_address: indexer_addr,
            chain_name: chain_name.to_string(),
            pagerank_config,
        })
    }

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

    fn parse_schema_uid(&self, schema_uid: &str) -> Result<FixedBytes<32>> {
        let schema_bytes = hex::decode(schema_uid.strip_prefix("0x").unwrap_or(schema_uid))?;
        if schema_bytes.len() != 32 {
            return Err(anyhow::anyhow!("Schema UID must be 32 bytes"));
        }
        let mut schema_array = [0u8; 32];
        schema_array.copy_from_slice(&schema_bytes);
        Ok(schema_array.into())
    }

    async fn get_total_schema_attestations(&self, schema_uid: &str) -> Result<u64> {
        let schema = self.parse_schema_uid(schema_uid)?;
        let call = IEASIndexer::getSchemaAttestationUIDCountCall { schemaUID: schema };
        let result = self.execute_call(call.abi_encode()).await?;
        let decoded = IEASIndexer::getSchemaAttestationUIDCountCall::abi_decode_returns(&result)
            .map_err(|e| anyhow::anyhow!("Failed to decode schema attestation count: {}", e))?;
        Ok(decoded.to::<u64>())
    }

    async fn get_attestation_uids(
        &self,
        schema_uid: &str,
        start: u64,
        length: u64,
    ) -> Result<Vec<FixedBytes<32>>> {
        let schema = self.parse_schema_uid(schema_uid)?;
        let call = IEASIndexer::getSchemaAttestationUIDsCall {
            schemaUID: schema,
            start: U256::from(start),
            length: U256::from(length),
            reverseOrder: false,
        };
        let result = self.execute_call(call.abi_encode()).await?;
        let decoded = IEASIndexer::getSchemaAttestationUIDsCall::abi_decode_returns(&result)
            .map_err(|e| anyhow::anyhow!("Failed to decode schema attestation UIDs: {}", e))?;
        Ok(decoded)
    }

    async fn get_attestation_details(&self, uid: FixedBytes<32>) -> Result<(Address, Address)> {
        let provider = self.create_provider().await?;

        let call = IEAS::getAttestationCall { uid };
        let tx = alloy_rpc_types::eth::TransactionRequest {
            to: Some(TxKind::Call(self.eas_address)),
            input: TransactionInput { input: Some(call.abi_encode().into()), data: None },
            ..Default::default()
        };

        let result = provider.call(tx).await?;
        let decoded = IEAS::getAttestationCall::abi_decode_returns(&result)
            .map_err(|e| anyhow::anyhow!("Failed to decode attestation: {}", e))?;
        Ok((decoded.attester, decoded.recipient))
    }

    /// Build attestation graph from EAS data
    async fn build_attestation_graph(&self) -> Result<AttestationGraph> {
        let schema_uid = &self.pagerank_config.schema_uid;
        println!("🏗️  Building attestation graph for schema: {}", schema_uid);

        let total_attestations = self.get_total_schema_attestations(schema_uid).await?;
        println!("📊 Processing {} total attestations", total_attestations);

        if total_attestations == 0 {
            return Ok(AttestationGraph::new());
        }

        let mut graph = AttestationGraph::new();
        let batch_size = 100u64;
        let mut start = 0u64;

        while start < total_attestations {
            let length = std::cmp::min(batch_size, total_attestations - start);
            println!("🔄 Processing attestation batch: {} to {}", start, start + length - 1);

            let uids = self.get_attestation_uids(schema_uid, start, length).await?;

            for uid in uids {
                match self.get_attestation_details(uid).await {
                    Ok((attester, recipient)) => {
                        // Add edge from attester to recipient with weight 1.0
                        // Could be enhanced with time decay, content analysis, etc.
                        graph.add_edge(attester, recipient, 1.0);
                    }
                    Err(e) => {
                        println!("⚠️  Failed to get attestation details for UID {:?}: {}", uid, e);
                    }
                }
            }

            start += length;
        }

        println!("✅ Built attestation graph with {} nodes", graph.nodes().len());
        Ok(graph)
    }

    /// Calculate PageRank scores and rewards
    async fn calculate_pagerank_rewards(&self) -> Result<HashMap<Address, U256>> {
        let graph = self.build_attestation_graph().await?;
        let scores = graph.calculate_pagerank(&self.pagerank_config.config);

        let mut rewards = HashMap::new();
        let total_pool = self.pagerank_config.total_reward_pool;

        println!("🎯 Distributing {} total rewards based on PageRank scores", total_pool);

        // Filter out accounts below minimum threshold and calculate rewards
        let filtered_scores: HashMap<Address, f64> = scores
            .into_iter()
            .filter(|(_, score)| *score >= self.pagerank_config.min_score_threshold)
            .collect();

        if filtered_scores.is_empty() {
            println!("⚠️  No accounts meet minimum PageRank threshold");
            return Ok(rewards);
        }

        // Renormalize filtered scores
        let total_filtered_score: f64 = filtered_scores.values().sum();

        for (address, score) in filtered_scores {
            let normalized_score = score / total_filtered_score;
            let reward = U256::from((total_pool.to::<u128>() as f64 * normalized_score) as u128);
            rewards.insert(address, reward);
        }

        println!("💰 Calculated rewards for {} addresses", rewards.len());

        // Print top rewards for debugging
        let mut sorted_rewards: Vec<_> = rewards.iter().collect();
        sorted_rewards.sort_by(|a, b| b.1.cmp(a.1));
        println!("🏆 Top 10 rewards:");
        for (i, (addr, reward)) in sorted_rewards.iter().take(10).enumerate() {
            println!("  {}. {}: {} tokens", i + 1, addr, reward);
        }

        Ok(rewards)
    }
}

#[async_trait(?Send)]
impl Source for EasPageRankSource {
    fn get_name(&self) -> &str {
        "EAS-PageRank"
    }

    async fn get_accounts(&self) -> Result<Vec<String>> {
        let rewards = self.calculate_pagerank_rewards().await?;
        Ok(rewards.keys().map(|addr| addr.to_string()).collect())
    }

    async fn get_rewards(&self, account: &str) -> Result<U256> {
        let address = Address::from_str(account)?;
        let rewards = self.calculate_pagerank_rewards().await?;
        Ok(rewards.get(&address).copied().unwrap_or(U256::ZERO))
    }

    async fn get_metadata(&self) -> Result<serde_json::Value> {
        Ok(serde_json::json!({
            "eas_address": self.eas_address.to_string(),
            "indexer_address": self.indexer_address.to_string(),
            "chain_name": self.chain_name,
            "reward_type": "pagerank_attestations",
            "schema_uid": self.pagerank_config.schema_uid,
            "total_reward_pool": self.pagerank_config.total_reward_pool.to_string(),
            "pagerank_config": {
                "damping_factor": self.pagerank_config.config.damping_factor,
                "max_iterations": self.pagerank_config.config.max_iterations,
                "tolerance": self.pagerank_config.config.tolerance,
                "min_score_threshold": self.pagerank_config.min_score_threshold,
            }
        }))
    }
}

// Reuse the sol! interfaces from the original EAS source
sol! {
    struct AttestationStruct {
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

    interface IEASIndexer {
        function getReceivedAttestationUIDs(address recipient, bytes32 schemaUID, uint256 start, uint256 length, bool reverseOrder) external view returns (bytes32[] memory);
        function getReceivedAttestationUIDCount(address recipient, bytes32 schemaUID) external view returns (uint256);
        function getSentAttestationUIDs(address attester, bytes32 schemaUID, uint256 start, uint256 length, bool reverseOrder) external view returns (bytes32[] memory);
        function getSentAttestationUIDCount(address attester, bytes32 schemaUID) external view returns (uint256);
        function getSchemaAttestationUIDs(bytes32 schemaUID, uint256 start, uint256 length, bool reverseOrder) external view returns (bytes32[] memory);
        function getSchemaAttestationUIDCount(bytes32 schemaUID) external view returns (uint256);
    }

    interface IEAS {
        function getAttestation(bytes32 uid) external view returns (AttestationStruct memory);
    }
}
