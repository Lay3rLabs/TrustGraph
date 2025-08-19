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
use std::sync::Mutex;

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
    /// Cached rewards to avoid recalculation
    cached_rewards: Mutex<Option<HashMap<Address, U256>>>,
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

        // Validate reward pool size to prevent excessive distributions
        let max_pool_size = U256::from(10000000000000000000000000u128); // 10M tokens max
        if pagerank_config.total_reward_pool > max_pool_size {
            return Err(anyhow::anyhow!(
                "PageRank reward pool too large: {} (max allowed: {})",
                pagerank_config.total_reward_pool,
                max_pool_size
            ));
        }

        if pagerank_config.total_reward_pool.is_zero() {
            return Err(anyhow::anyhow!("PageRank reward pool cannot be zero"));
        }

        // Validate trust configuration if enabled
        if pagerank_config.config.has_trust_enabled() {
            println!(
                "🔒 Trust Aware PageRank enabled with {} trusted seeds",
                pagerank_config.config.trust_config.trusted_seeds.len()
            );

            // Log trusted seeds for transparency
            for (i, seed) in pagerank_config.config.trust_config.trusted_seeds.iter().enumerate() {
                println!("   {}. {}", i + 1, seed);
            }
        } else {
            println!("📊 Standard PageRank (no trust seeds configured)");
        }

        Ok(Self {
            eas_address: eas_addr,
            indexer_address: indexer_addr,
            chain_name: chain_name.to_string(),
            pagerank_config,
            cached_rewards: Mutex::new(None),
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

    async fn get_attestation_details(
        &self,
        uid: FixedBytes<32>,
    ) -> Result<(Address, Address, Vec<u8>)> {
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
        Ok((decoded.attester, decoded.recipient, decoded.data.to_vec()))
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
        let mut edge_count = 0;
        let mut unique_attesters = std::collections::HashSet::new();
        let mut unique_recipients = std::collections::HashSet::new();
        let batch_size = 100u64;
        let mut start = 0u64;

        while start < total_attestations {
            let length = std::cmp::min(batch_size, total_attestations - start);
            println!("🔄 Processing attestation batch: {} to {}", start, start + length - 1);

            let uids = self.get_attestation_uids(schema_uid, start, length).await?;

            for uid in uids {
                match self.get_attestation_details(uid).await {
                    Ok((attester, recipient, data)) => {
                        // Decode weight from attestation data
                        let weight = if data.len() >= 32 {
                            // Data is ABI encoded uint256
                            let mut weight_bytes = [0u8; 32];
                            weight_bytes.copy_from_slice(&data[..32]);
                            let weight_u256 = U256::from_be_bytes(weight_bytes);
                            // Convert to f64 (weights are typically 0-100)
                            weight_u256.to::<u64>() as f64
                        } else {
                            // Default weight if data is missing or invalid
                            1.0
                        };

                        graph.add_edge(attester, recipient, weight);
                        edge_count += 1;
                        unique_attesters.insert(attester);
                        unique_recipients.insert(recipient);

                        // Log all edges for debugging
                        println!(
                            "  Edge #{}: {} → {} (weight: {})",
                            edge_count, attester, recipient, weight
                        );
                    }
                    Err(e) => {
                        println!("⚠️  Failed to get attestation details for UID {:?}: {}", uid, e);
                    }
                }
            }

            start += length;
        }

        println!("✅ Built attestation graph:");
        println!("   - Total nodes: {}", graph.nodes().len());
        println!("   - Total edges: {}", edge_count);
        println!("   - Unique attesters: {}", unique_attesters.len());
        println!("   - Unique recipients: {}", unique_recipients.len());

        // Log graph structure for debugging
        println!("\n📊 Graph structure:");
        for node in graph.nodes() {
            let out_edges = graph.get_outgoing(&node).map(|edges| edges.len()).unwrap_or(0);
            println!("   Node {}: {} outgoing edges", node, out_edges);
        }

        Ok(graph)
    }

    /// Calculate PageRank scores and rewards
    async fn calculate_pagerank_rewards(&self) -> Result<HashMap<Address, U256>> {
        let graph = self.build_attestation_graph().await?;
        let scores = graph.calculate_pagerank(&self.pagerank_config.config);

        println!("\n🎲 Raw PageRank scores:");
        let mut sorted_scores: Vec<_> = scores.iter().collect();
        sorted_scores.sort_by(|a, b| b.1.partial_cmp(a.1).unwrap_or(std::cmp::Ordering::Equal));
        for (i, (addr, score)) in sorted_scores.iter().take(10).enumerate() {
            println!("   {}. {}: {:.6}", i + 1, addr, score);
        }

        let mut rewards = HashMap::new();
        let total_pool = self.pagerank_config.total_reward_pool;

        println!("\n🎯 Distributing {} total rewards based on PageRank scores", total_pool);

        // Filter out accounts below minimum threshold and calculate rewards
        let total_accounts = scores.len();
        let filtered_scores: HashMap<Address, f64> = scores
            .into_iter()
            .filter(|(_, score)| *score >= self.pagerank_config.min_score_threshold)
            .collect();

        println!(
            "🔍 Filtering scores above threshold: {}",
            self.pagerank_config.min_score_threshold
        );
        println!("   - Before filter: {} accounts", total_accounts);
        println!("   - After filter: {} accounts", filtered_scores.len());

        if filtered_scores.is_empty() {
            println!("⚠️  No accounts meet minimum PageRank threshold");
            return Ok(rewards);
        }

        // Use high precision scale factor to convert f64 scores to U256
        let precision_scale = 1_000_000_u64; // Scale factor for f64 -> u64 conversion

        // Convert f64 scores to scaled u64 integers, then to U256
        let scaled_scores: Vec<(Address, U256)> = filtered_scores
            .iter()
            .map(|(addr, score)| {
                // Convert f64 to scaled u64, avoiding floating-point in U256 operations
                let scaled_score_u64 = (*score * precision_scale as f64) as u64;
                let scaled_score = U256::from(scaled_score_u64);
                (*addr, scaled_score)
            })
            .collect();

        let total_scaled_score: U256 = scaled_scores.iter().map(|(_, score)| *score).sum();

        // Avoid division by zero
        if total_scaled_score.is_zero() {
            println!("⚠️  Total scaled score is zero, no rewards to distribute");
            return Ok(rewards);
        }

        // Sort addresses by score (descending) for deterministic processing
        let mut sorted_scores = scaled_scores;
        sorted_scores.sort_by(|a, b| b.1.cmp(&a.1));

        let mut total_distributed = U256::ZERO;
        let mut remaining_pool = total_pool;

        // Calculate rewards using pure U256 integer arithmetic with strict pool enforcement
        for (i, (address, scaled_score)) in sorted_scores.iter().enumerate() {
            let reward = if i == sorted_scores.len() - 1 {
                // For the last address, give all remaining pool (ensures no over-distribution)
                remaining_pool
            } else {
                // Calculate proportional reward: (scaled_score * total_pool) / total_scaled_score
                let proportional_reward = (*scaled_score * total_pool) / total_scaled_score;
                // Ensure we don't exceed remaining pool
                if proportional_reward > remaining_pool {
                    remaining_pool
                } else {
                    proportional_reward
                }
            };

            // Double-check we don't distribute more than available
            let actual_reward = if reward > remaining_pool { remaining_pool } else { reward };

            if !actual_reward.is_zero() {
                total_distributed += actual_reward;
                remaining_pool -= actual_reward;
                rewards.insert(*address, actual_reward);
            }

            // Break early if pool is exhausted
            if remaining_pool.is_zero() {
                break;
            }
        }

        println!("\n💰 Calculated rewards for {} addresses", rewards.len());

        // Debug: Show if all rewards are the same
        let reward_values: std::collections::HashSet<_> = rewards.values().collect();
        if reward_values.len() == 1 {
            println!("⚠️  WARNING: All addresses received the same reward amount!");
        }

        // Verify total distributed does not exceed pool
        let actual_total_distributed: U256 = rewards.values().sum();
        println!("\n🔍 Reward pool verification:");
        println!("  Total pool: {}", total_pool);
        println!("  Actually distributed: {}", actual_total_distributed);
        println!("  Remaining in pool: {}", total_pool - actual_total_distributed);

        // Critical check: ensure we never over-distribute
        if actual_total_distributed > total_pool {
            return Err(anyhow::anyhow!(
                "CRITICAL ERROR: Over-distributed rewards! Distributed: {}, Pool: {}",
                actual_total_distributed,
                total_pool
            ));
        }

        println!("✅ Reward distribution completed without over-spending");

        // Print top rewards for debugging
        let mut sorted_rewards: Vec<_> = rewards.iter().collect();
        sorted_rewards.sort_by(|a, b| b.1.cmp(a.1));
        println!("\n🏆 Top 10 rewards:");
        for (i, (addr, reward)) in sorted_rewards.iter().take(10).enumerate() {
            // Find corresponding PageRank score
            let score = filtered_scores.get(*addr).unwrap_or(&0.0);
            println!("  {}. {}: {} tokens (PageRank: {:.6})", i + 1, addr, reward, score);
        }

        Ok(rewards)
    }
}

#[async_trait(?Send)]
impl Source for EasPageRankSource {
    fn get_name(&self) -> &str {
        if self.pagerank_config.config.has_trust_enabled() {
            "Trust-Aware-EAS-PageRank"
        } else {
            "EAS-PageRank"
        }
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
        let trust_info = if self.pagerank_config.config.has_trust_enabled() {
            serde_json::json!({
                "enabled": true,
                "trusted_seeds": self.pagerank_config.config.trust_config.trusted_seeds.iter()
                    .map(|addr| addr.to_string())
                    .collect::<Vec<_>>(),
                "trust_multiplier": self.pagerank_config.config.trust_config.trust_multiplier,
                "trust_boost": self.pagerank_config.config.trust_config.trust_boost,
            })
        } else {
            serde_json::json!({
                "enabled": false
            })
        };

        Ok(serde_json::json!({
            "eas_address": self.eas_address.to_string(),
            "indexer_address": self.indexer_address.to_string(),
            "chain_name": self.chain_name,
            "reward_type": if self.pagerank_config.config.has_trust_enabled() {
                "trust_aware_pagerank_attestations"
            } else {
                "pagerank_attestations"
            },
            "schema_uid": self.pagerank_config.schema_uid,
            "total_reward_pool": self.pagerank_config.total_reward_pool.to_string(),
            "pagerank_config": {
                "damping_factor": self.pagerank_config.config.damping_factor,
                "max_iterations": self.pagerank_config.config.max_iterations,
                "tolerance": self.pagerank_config.config.tolerance,
                "min_score_threshold": self.pagerank_config.min_score_threshold,
            },
            "trust_config": trust_info
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
