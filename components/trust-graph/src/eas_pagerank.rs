use alloy_sol_types::sol;
use anyhow::Result;
use async_trait::async_trait;
use std::collections::HashMap;
use wavs_indexer_api::solidity::IndexedEvent;
use wavs_indexer_api::IndexedAttestation;
use wavs_merkle_sources::sources::{Source, SourceEvent};
use wavs_wasi_utils::evm::alloy_primitives::{hex, Address, FixedBytes, U256};

use futures::lock::Mutex;
pub use wavs_merkle_sources::sources;

use crate::{attestation_graph::AttestationGraph, config::PageRankSourceConfig};

/// EAS PageRank points source that calculates points based on PageRank algorithm
pub struct EasPageRankSource {
    /// PageRank points configuration
    pub config: PageRankSourceConfig,
    /// Cached points to avoid recalculation
    cached_points: Mutex<Option<HashMap<Address, U256>>>,
}

impl EasPageRankSource {
    pub fn new(config: PageRankSourceConfig) -> Result<Self> {
        if config.total_pool.is_zero() {
            return Err(anyhow::anyhow!("PageRank points pool cannot be zero"));
        }

        // Validate trust configuration if enabled
        if config.has_trust_enabled() {
            println!(
                "🔒 Trust Aware PageRank enabled with {} trusted seeds",
                config.pagerank_config.trust_config.trusted_seeds.len()
            );

            // Log trusted seeds for transparency
            for (i, seed) in config.pagerank_config.trust_config.trusted_seeds.iter().enumerate() {
                println!("   {}. {}", i + 1, seed);
            }
        } else {
            println!("📊 Standard PageRank (no trust seeds configured)");
        }

        Ok(Self { config, cached_points: Mutex::new(None) })
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

    async fn get_total_schema_attestations(
        &self,
        ctx: &sources::SourceContext,
        schema_uid: &str,
    ) -> Result<u64> {
        let schema = self.parse_schema_uid(schema_uid)?;
        let count = ctx
            .indexer_querier
            .get_attestation_count_by_schema(schema)
            .await
            .map_err(|e| anyhow::anyhow!("Failed to get schema attestation count: {}", e))?;
        Ok(count.to::<u64>())
    }

    async fn get_indexed_attestations(
        &self,
        ctx: &sources::SourceContext,
        schema_uid: &str,
        start: u64,
        length: u64,
    ) -> Result<Vec<IndexedAttestation>> {
        let schema = self.parse_schema_uid(schema_uid)?;
        let attestations = ctx
            .indexer_querier
            .get_indexed_attestations_by_schema(schema, start, length, false)
            .await
            .map_err(|e| anyhow::anyhow!("Failed to get indexed schema attestations: {}", e))?;
        Ok(attestations)
    }

    // async fn get_attestation_details(
    //     &self,
    //     ctx: &sources::SourceContext,
    //     uid: FixedBytes<32>,
    // ) -> Result<(Address, Address, Vec<u8>)> {
    //     let call = IEAS::getAttestationCall { uid };
    //     let tx: alloy_rpc_types::TransactionRequest = alloy_rpc_types::eth::TransactionRequest {
    //         to: Some(TxKind::Call(ctx.eas_address)),
    //         input: TransactionInput { input: Some(call.abi_encode().into()), data: None },
    //         ..Default::default()
    //     };

    //     let result = ctx.provider.call(tx).await?;

    //     let decoded = IEAS::getAttestationCall::abi_decode_returns(&result)
    //         .map_err(|e| anyhow::anyhow!("Failed to decode attestation: {}", e))?;
    //     Ok((decoded.attester, decoded.recipient, decoded.data.to_vec()))
    // }

    /// Build attestation graph from EAS data
    async fn build_attestation_graph(
        &self,
        ctx: &sources::SourceContext,
    ) -> Result<AttestationGraph> {
        let schema_uid = &self.config.schema_uid;
        println!("🏗️  Building attestation graph for schema: {}", schema_uid);

        let total_attestations = self.get_total_schema_attestations(ctx, schema_uid).await?;
        println!("📊 Processing {} total attestations", total_attestations);

        if total_attestations == 0 {
            return Ok(AttestationGraph::new());
        }

        let mut graph = AttestationGraph::new().with_allow_duplicates(false);
        let mut edge_count = 0;
        let mut unique_attesters = std::collections::HashSet::new();
        let mut unique_recipients = std::collections::HashSet::new();
        let batch_size = 100u64;
        let mut start = 0u64;

        while start < total_attestations {
            let length = std::cmp::min(batch_size, total_attestations - start);
            println!("🔄 Processing attestation batch: {} to {}", start, start + length - 1);

            let mut attestations =
                self.get_indexed_attestations(ctx, schema_uid, start, length).await?;
            // Sort ascending so the newest attestations are processed last and override existing edges.
            attestations.sort_by_key(|a| a.event.timestamp);

            for IndexedAttestation {
                uid,
                schema_uid,
                attester,
                recipient,
                event: IndexedEvent { deleted, data, .. },
            } in attestations
            {
                // Debug attestation data
                println!("🔍 Attestation UID: {:?}", uid);
                println!("   Schema UID: {:?}", schema_uid);
                println!("   Attester: {}", attester);
                println!("   Recipient: {}", recipient);
                println!("   Data length: {}", data.len());

                if deleted {
                    println!("❌  Attestation was revoked, skipping...");
                    continue;
                }

                if data.len() > 0 {
                    println!("   Data (hex): 0x{}", hex::encode(&data[..data.len().min(64)]));
                }

                let weight: Option<f64> = match self.config.schema_abi.abi_decode_params(&data) {
                    Err(e) => {
                        println!("⚠️  Failed to decode attestation data: {e}");
                        None
                    }
                    Ok(decoded_data) => match decoded_data.as_tuple() {
                        None => {
                            println!("⚠️  Attestation data is not a tuple");
                            None
                        }
                        Some(decoded_data) => match decoded_data
                            .get(self.config.schema_abi_weight_index)
                            .map(|v| v.as_uint())
                        {
                            None => {
                                println!(
                                    "⚠️  Index {} not found in attestation data",
                                    self.config.schema_abi_weight_index
                                );
                                None
                            }
                            Some(None) => {
                                println!(
                                    "⚠️  Attestation data field at index {} is not a uint",
                                    self.config.schema_abi_weight_index
                                );
                                None
                            }
                            Some(Some((value, _))) => match value.try_into() {
                                Err(e) => {
                                    println!("⚠️  Failed to convert attestation data field at index {} to f64: {e}", self.config.schema_abi_weight_index);
                                    None
                                }
                                Ok(value) => Some(value),
                            },
                        },
                    },
                };

                // Cap weight to min and max values
                let weight = weight
                    .unwrap_or_default()
                    .max(self.config.pagerank_config.min_weight)
                    .min(self.config.pagerank_config.max_weight);

                // Override existing edge if it exists
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

            start += length;
        }

        graph.sort();

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

    /// Calculate PageRank scores and points
    async fn calculate_pagerank_points(
        &self,
        ctx: &sources::SourceContext,
    ) -> Result<HashMap<Address, U256>> {
        // Lock for the entire function to prevent simultaneous calculations
        let mut lock = self.cached_points.lock().await;

        // Check if we already have cached points
        if let Some(ref cached) = *lock {
            println!("✅ Using cached PageRank points");
            return Ok(cached.clone());
        }

        let graph = self.build_attestation_graph(ctx).await?;
        let scores: HashMap<Address, f64> = graph
            .calculate_pagerank(&self.config.pagerank_config)
            .into_iter()
            // Filter out scores with zero points
            .filter(|(_, score)| *score > 0.0)
            .collect();

        println!("\n🎲 Raw PageRank scores:");
        let mut sorted_scores: Vec<_> = scores.iter().collect();
        sorted_scores.sort_by(|a, b| b.1.partial_cmp(a.1).unwrap_or(std::cmp::Ordering::Equal));
        for (i, (addr, score)) in sorted_scores.iter().take(10).enumerate() {
            println!("   {}. {}: {:.6}", i + 1, addr, score);
        }

        let mut points_map = HashMap::new();
        let total_pool = self.config.total_pool;

        println!("\n🎯 Distributing {} total points based on PageRank scores", total_pool);

        if scores.is_empty() {
            println!("⚠️  No accounts to distribute points to");
            return Ok(points_map);
        }

        // Use high precision scale factor to convert f64 scores to U256
        let precision_scale = 1_000_000_u64; // Scale factor for f64 -> u64 conversion

        // Convert f64 scores to scaled u64 integers, then to U256
        let scaled_scores: Vec<(Address, U256)> = scores
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
            println!("⚠️  Total scaled score is zero, no points to assign");
            return Ok(points_map);
        }

        // Sort addresses by score (descending) for deterministic processing
        let mut sorted_scores = scaled_scores;
        sorted_scores.sort_by(|a, b| b.1.cmp(&a.1));

        let mut total_distributed = U256::ZERO;
        let mut remaining_pool = total_pool;

        // Calculate points using pure U256 integer arithmetic with strict pool enforcement
        for (i, (address, scaled_score)) in sorted_scores.iter().enumerate() {
            let points = if i == sorted_scores.len() - 1 {
                // For the last address, give all remaining pool (ensures no over-distribution)
                remaining_pool
            } else {
                // Calculate proportional points: (scaled_score * total_pool) / total_scaled_score
                let proportional_points = (*scaled_score * total_pool) / total_scaled_score;
                // Ensure we don't exceed remaining pool
                if proportional_points > remaining_pool {
                    remaining_pool
                } else {
                    proportional_points
                }
            };

            // Double-check we don't distribute more than available
            let actual_points = if points > remaining_pool { remaining_pool } else { points };

            if !actual_points.is_zero() {
                total_distributed += actual_points;
                remaining_pool -= actual_points;
                points_map.insert(*address, actual_points);
            }

            // Break early if pool is exhausted
            if remaining_pool.is_zero() {
                break;
            }
        }

        println!("\n💰 Calculated points for {} addresses", points_map.len());

        // Debug: Show if all points are the same
        let points_values: std::collections::HashSet<_> = points_map.values().collect();
        if points_values.len() == 1 {
            println!("⚠️  WARNING: All addresses received the same points amount!");
        }

        // Verify total distributed does not exceed pool
        let actual_total: U256 = points_map.values().sum();
        println!("\n🔍 Points pool verification:");
        println!("  Total pool: {}", total_pool);
        println!("  Actual total: {}", actual_total);
        println!("  Remaining in pool: {}", total_pool - actual_total);

        // Critical check: ensure we never over-distribute
        if actual_total > total_pool {
            return Err(anyhow::anyhow!(
                "CRITICAL ERROR: Over-assigned points! Assigned: {}, Pool: {}",
                actual_total,
                total_pool
            ));
        }

        println!("✅ Points assignment completed without over-spending");

        // Print top points for debugging
        let mut sorted_points: Vec<_> = points_map.iter().collect();
        sorted_points.sort_by(|a, b| b.1.cmp(a.1));
        println!("\n🏆 Top 10 points earned:");
        for (i, (addr, points)) in sorted_points.iter().take(10).enumerate() {
            // Find corresponding PageRank score
            let score = scores.get(*addr).unwrap_or(&0.0);
            println!("  {}. {}: {} tokens (PageRank: {:.6})", i + 1, addr, points, score);
        }

        // Cache the calculated points for future calls
        *lock = Some(points_map.clone());

        Ok(points_map)
    }
}

#[async_trait(?Send)]
impl Source for EasPageRankSource {
    fn get_name(&self) -> &str {
        if self.config.has_trust_enabled() {
            "Trust-Aware-EAS-PageRank"
        } else {
            "EAS-PageRank"
        }
    }

    async fn get_accounts(&self, ctx: &sources::SourceContext) -> Result<Vec<String>> {
        let points = self.calculate_pagerank_points(ctx).await?;
        Ok(points.keys().map(|addr| addr.to_string()).collect())
    }

    async fn get_events_and_value(
        &self,
        ctx: &sources::SourceContext,
        account: &Address,
    ) -> Result<(Vec<SourceEvent>, U256)> {
        let points = self.calculate_pagerank_points(ctx).await?;
        let total_value = points.get(account).copied().unwrap_or(U256::ZERO);
        let source_events: Vec<SourceEvent> = if !total_value.is_zero() {
            vec![SourceEvent {
                r#type: self.get_name().to_string(),
                timestamp: 0,
                value: total_value,
                metadata: None,
            }]
        } else {
            vec![]
        };
        Ok((source_events, total_value))
    }

    async fn get_metadata(&self, ctx: &sources::SourceContext) -> Result<serde_json::Value> {
        let trust_info = if self.config.has_trust_enabled() {
            serde_json::json!({
                "enabled": true,
                "trusted_seeds": self.config.pagerank_config.trust_config.trusted_seeds.iter()
                    .map(|addr| addr.to_string())
                    .collect::<Vec<_>>(),
                "trust_multiplier": self.config.pagerank_config.trust_config.trust_multiplier,
                "trust_share": self.config.pagerank_config.trust_config.trust_share,
            })
        } else {
            serde_json::json!({
                "enabled": false
            })
        };

        Ok(serde_json::json!({
            "eas_address": ctx.eas_address.to_string(),
            "indexer_address": ctx.indexer_address.to_string(),
            "chain_name": ctx.chain_name,
            "type": if self.config.pagerank_config.has_trust_enabled() {
                "trust_aware_pagerank_attestations"
            } else {
                "pagerank_attestations"
            },
            "schema_uid": self.config.schema_uid,
            "schema_abi": self.config.schema_abi.to_string(),
            "schema_abi_weight_index": self.config.schema_abi_weight_index,
            "total_pool": self.config.total_pool.to_string(),
            "pagerank_config": {
                "damping_factor": self.config.pagerank_config.damping_factor,
                "max_iterations": self.config.pagerank_config.max_iterations,
                "tolerance": self.config.pagerank_config.tolerance,
                "min_weight": self.config.pagerank_config.min_weight,
                "max_weight": self.config.pagerank_config.max_weight,
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

    interface IEAS {
        function getAttestation(bytes32 uid) external view returns (AttestationStruct memory);
    }
}
