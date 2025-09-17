pub mod bindings;
mod ipfs;
mod merkle;
pub mod pagerank;
mod sources;
mod trigger;

use crate::bindings::{export, host::config_var, Guest, TriggerAction};
use crate::sources::{SourceEvent, SourceRegistry};
use bindings::WasmResponse;
use merkle::get_merkle_tree;
use merkle_tree_rs::standard::LeafType;
use serde::Serialize;
use serde_json::json;
use std::fs::File;
use std::path::Path;
use std::str::FromStr;
use trigger::{decode_trigger_event, encode_trigger_output};
use wavs_wasi_utils::evm::alloy_primitives::{hex, U256};
use wit_bindgen_rt::async_support::futures;
use wstd::runtime::block_on;

struct Component;
export!(Component with_types_in bindings);

impl Guest for Component {
    fn run(action: TriggerAction) -> std::result::Result<Option<WasmResponse>, String> {
        println!("🚀 Starting merkler component execution");

        let events_dir = config_var("events_dir").unwrap_or_else(|| "./events".to_string());
        let events_dir = Path::new(events_dir.trim_end_matches("/"));
        if !events_dir.exists() {
            std::fs::create_dir_all(events_dir).map_err(|e| {
                format!(
                    "Failed to create events directory at {}: {}",
                    events_dir.display(),
                    e.to_string()
                )
            })?;
        } else if !events_dir.is_dir() {
            return Err(format!("Events directory {} is not a directory", events_dir.display()));
        }

        // EAS-related configuration
        let eas_address = config_var("eas_address").ok_or_else(|| "Failed to get EAS address")?;
        let indexer_address =
            config_var("indexer_address").ok_or_else(|| "Failed to get indexer address")?;
        let chain_name = config_var("chain_name").unwrap_or_else(|| "local".to_string());

        println!("📋 Configuration loaded:");
        println!("  - EAS address: {}", eas_address);
        println!("  - Indexer: {}", indexer_address);
        println!("  - Chain: {}", chain_name);

        // Try to use Pinata first, fallback to local IPFS if API key is not available
        let (ipfs_url, ipfs_api_key) = match std::env::var("WAVS_ENV_PINATA_API_KEY") {
            Ok(api_key) => {
                let url = std::env::var("WAVS_ENV_PINATA_API_URL")
                    .unwrap_or_else(|_| "https://uploads.pinata.cloud/v3/files".to_string());
                println!("🌐 Using Pinata IPFS service");
                (url, Some(api_key))
            }
            Err(_) => {
                println!("🏠 Pinata API key not found, using local IPFS node");
                ("http://localhost:5001/api/v0/add".to_string(), None)
            }
        };

        let trigger = decode_trigger_event(action.data).map_err(|e| e.to_string())?;
        println!("🔧 Trigger: {:?}", trigger);

        let mut registry = SourceRegistry::new();

        // Reward users for received attestations - 5e17 points per attestation
        // registry.add_source(sources::eas::EasSource::new(
        //     &eas_address,
        //     &indexer_address,
        //     &chain_name,
        //     sources::eas::EasSourceType::ReceivedAttestations(schema_uid.clone()),
        //     U256::from(5e17),
        // ));
        // println!("✅ Added EAS source for received attestations (5e17 points each)");

        // // Reward users for sent attestations - 3e17 points per attestation
        // registry.add_source(sources::eas::EasSource::new(
        //     &eas_address,
        //     &eas_indexer_address,
        //     &chain_name,
        //     sources::eas::EasRewardType::SentAttestations,
        //     U256::from(3e17),
        // ));

        // Reward users for receiving recognition attestations
        let recognition_schema_uid = config_var("recognition_schema_uid").ok_or_else(|| {
            "Failed to get recognition_schema_uid - this is required for EAS points"
        })?;
        println!("📋 Using recognition schema UID: {}", recognition_schema_uid);
        registry.add_source(sources::eas::EasSource::new(
            &eas_address,
            &indexer_address,
            &chain_name,
            sources::eas::EasSourceType::ReceivedAttestations(recognition_schema_uid),
            sources::eas::EasPointsComputation::NumericJsonDataField("value".to_string()),
        ));

        // Reward users for prediction market interactions (1 point per type+contract interacted with, so 2 if user trades and also redeems on same market, and 1 if only trades but no redeem)
        registry.add_source(sources::interactions::InteractionsSource::new(
            &chain_name,
            &indexer_address,
            "prediction_market_trade",
            U256::from(1),
            true,
        ));
        registry.add_source(sources::interactions::InteractionsSource::new(
            &chain_name,
            &indexer_address,
            "prediction_market_redeem",
            U256::from(1),
            true,
        ));

        // Add PageRank-based EAS points if configured
        if let (Some(pagerank_pool_str), Some(vouching_schema_uid)) =
            (config_var("pagerank_points_pool"), config_var("vouching_schema_uid"))
        {
            let pool_amount = U256::from_str(&pagerank_pool_str)
                .map_err(|err| format!("Failed to get pagerank_points_pool: {err}"))?;

            // Configure Trust Aware PageRank
            let mut pagerank_config = pagerank::PageRankConfig {
                damping_factor: config_var("pagerank_damping_factor")
                    .and_then(|s| s.parse().ok())
                    .unwrap_or(0.85),
                max_iterations: config_var("pagerank_max_iterations")
                    .and_then(|s| s.parse().ok())
                    .unwrap_or(100),
                tolerance: config_var("pagerank_tolerance")
                    .and_then(|s| s.parse().ok())
                    .unwrap_or(1e-6),
                trust_config: pagerank::TrustConfig::default(),
            };

            // Configure trusted seeds if provided
            println!("🔍 Checking for pagerank_trusted_seeds configuration...");
            if let Some(trusted_seeds_str) = config_var("pagerank_trusted_seeds") {
                println!("🔍 Found pagerank_trusted_seeds: '{}'", trusted_seeds_str);
                let seed_addresses: Vec<&str> =
                    trusted_seeds_str.split(',').map(|s| s.trim()).collect();
                let mut parsed_seeds = Vec::new();

                for seed_str in seed_addresses {
                    if seed_str.is_empty() {
                        continue;
                    }
                    match wavs_wasi_utils::evm::alloy_primitives::Address::from_str(seed_str) {
                        Ok(address) => parsed_seeds.push(address),
                        Err(e) => {
                            println!("⚠️  Invalid trusted seed address '{}': {}", seed_str, e);
                        }
                    }
                }

                println!("🔍 Parsed {} trusted seed addresses", parsed_seeds.len());
                if !parsed_seeds.is_empty() {
                    let mut trust_config = pagerank::TrustConfig::new(parsed_seeds.clone());

                    // Configure trust parameters
                    if let Some(multiplier_str) = config_var("pagerank_trust_multiplier") {
                        if let Ok(multiplier) = multiplier_str.parse::<f64>() {
                            trust_config = trust_config.with_trust_multiplier(multiplier);
                        }
                    }

                    if let Some(boost_str) = config_var("pagerank_trust_boost") {
                        if let Ok(boost) = boost_str.parse::<f64>() {
                            trust_config = trust_config.with_trust_boost(boost);
                        }
                    }

                    pagerank_config = pagerank_config.with_trust_config(trust_config);
                    println!(
                        "✅ Configured Trust Aware PageRank with {} trusted seeds",
                        parsed_seeds.len()
                    );
                    println!(
                        "   Trust multiplier: {:.1}x",
                        pagerank_config.trust_config.trust_multiplier
                    );
                    println!(
                        "   Trust boost: {:.1}%",
                        pagerank_config.trust_config.trust_boost * 100.0
                    );
                } else {
                    println!("⚠️  No valid trusted seed addresses found, using standard PageRank");
                }
            } else {
                println!("ℹ️  No pagerank_trusted_seeds configured, using standard PageRank");
            }

            let min_threshold =
                config_var("pagerank_min_threshold").and_then(|s| s.parse().ok()).unwrap_or(0.0001);

            let pagerank_source_config = pagerank::PageRankRewardSource::new(
                vouching_schema_uid.clone(),
                pool_amount,
                pagerank_config,
            )
            .with_min_threshold(min_threshold);

            let has_trust = pagerank_source_config.has_trust_enabled();
            match sources::eas_pagerank::EasPageRankSource::new(
                &eas_address,
                &indexer_address,
                &chain_name,
                pagerank_source_config,
            ) {
                Ok(pagerank_source) => {
                    registry.add_source(pagerank_source);
                    if has_trust {
                        println!(
                            "✅ Added Trust Aware EAS PageRank source with {} points pool",
                            pool_amount
                        );
                    } else {
                        println!("✅ Added EAS PageRank source with {} points pool", pool_amount);
                    }
                }
                Err(e) => {
                    println!("⚠️  Failed to create PageRank source: {}", e);
                }
            }
        } else {
            println!("ℹ️  PageRank points disabled (no pagerank_points_pool configured)");
        }

        // Example: Points for specific schema attestations
        // Uncomment and configure to points attestations to a specific schema
        // if let Ok(schema_uid) = config_var("schema_uid") {
        //     registry.add_source(sources::eas::EasSource::new(
        //         &eas_address,
        //         &eas_indexer_address,
        //         &chain_name,
        //         sources::eas::EasRewardType::SchemaAttestations(schema_uid),
        //         U256::from(1e18), // 1e18 points per schema attestation
        //     ));
        // }

        block_on(async move {
            println!("🔍 Fetching accounts from all sources...");
            let accounts = registry.get_accounts().await.map_err(|e| e.to_string())?;
            println!("👥 Found {} unique accounts", accounts.len());

            // each value is [address, amount]
            let events_and_values = accounts
                .into_iter()
                .map(|account| {
                    let registry = &registry;
                    async move {
                        let (events, value) = registry
                            .get_events_and_value(&account)
                            .await
                            .map_err(|e| e.to_string())?;
                        Ok::<(Vec<SourceEvent>, Vec<String>), String>((
                            events,
                            vec![account, value.to_string()],
                        ))
                    }
                })
                .collect::<Vec<_>>();

            let results = futures::future::join_all(events_and_values)
                .await
                .into_iter()
                .collect::<Result<Vec<_>, _>>()?;

            // Calculate total points with safety checks
            let mut total_value = U256::ZERO;
            let max_reasonable_total = U256::from(100000000000000000000000000u128); // 100M points max

            for (_, result) in &results {
                let amount = U256::from_str(&result[1])
                    .map_err(|e| format!("Invalid amount '{}': {}", result[1], e))?;
                total_value = total_value
                    .checked_add(amount)
                    .ok_or_else(|| "Total calculation overflow".to_string())?;
            }

            // Safety check: prevent unreasonably large total distributions
            if total_value > max_reasonable_total {
                return Err(format!(
                    "Total exceeds reasonable limit: {} (max: {})",
                    total_value, max_reasonable_total
                ));
            }

            let total_value_str = total_value.to_string();

            println!("💰 Calculated points for {} accounts", results.len());
            println!("💎 Total points assigned: {}", total_value_str);

            if results.len() == 0 {
                println!("⚠️  No accounts to distribute points to");
                return Ok(None);
            }

            // Additional safety check: verify no individual value is excessive
            for (_, result) in &results {
                let amount = U256::from_str(&result[1]).unwrap();
                let max_individual_value = U256::from(10000000000000000000000u128); // 10K points max per account
                if amount > max_individual_value {
                    return Err(format!(
                        "Individual value for account {} exceeds limit: {} (max: {})",
                        result[0], amount, max_individual_value
                    ));
                }
            }

            let tree = get_merkle_tree(
                results.iter().map(|(_, value)| value.clone()).collect::<Vec<_>>(),
            )?;
            let root = tree.root();
            let root_bytes = hex::decode(&root).map_err(|e| e.to_string())?;

            let sources_with_metadata =
                registry.get_sources_with_metadata().await.map_err(|e| e.to_string())?;

            println!("🌳 Generated merkle tree with root: {}", root);

            let mut ipfs_data = MerkleTreeIpfsData {
                id: root.clone(),
                metadata: json!({
                    "num_accounts": results.len(),
                    "total_value": total_value_str,
                    "sources": sources_with_metadata,
                }),
                root: root.clone(),
                tree: vec![],
            };

            // get proof for each value
            results.iter().for_each(|(_, value)| {
                let proof = tree.get_proof(LeafType::LeafBytes(value.clone()));
                ipfs_data.tree.push(MerkleTreeEntry {
                    account: value[0].clone(),
                    value: value[1].clone(),
                    proof,
                });
            });

            let ipfs_data_json = serde_json::to_string(&ipfs_data).map_err(|e| e.to_string())?;
            println!("📤 Uploading merkle tree to IPFS...");

            let cid = ipfs::upload_json_to_ipfs(
                &ipfs_data_json,
                &format!("merkle_{}.json", ipfs_data.root),
                &ipfs_url,
                ipfs_api_key.as_deref(),
            )
            .await
            .map_err(|e| format!("Failed to upload IPFS: {}", e))?;

            println!("✅ Successfully uploaded to IPFS with CID: {}", cid);

            println!("🗃️ Writing account events to {}...", events_dir.display());
            results
                .into_iter()
                .map(|(events, value)| {
                    let file_path = events_dir.join(format!("{}.json", value[0]));
                    let file = File::create(file_path).unwrap();
                    serde_json::to_writer(file, &events)
                })
                .collect::<Result<Vec<_>, _>>()
                .map_err(|e| format!("Failed to write events to files: {}", e.to_string()))?;
            println!("✅ Successfully wrote account events");

            let ipfs_hash = cid.hash().digest();
            let payload = encode_trigger_output(trigger, &root_bytes, ipfs_hash, cid.to_string())?;

            println!("🎉 Rewards component execution completed successfully");
            println!("📦 Final payload size: {} bytes", payload.len());

            Ok(Some(WasmResponse { payload, ordering: None }))
        })
    }
}

pub mod solidity {
    use alloy_sol_macro::sol;
    pub use ITypes::*;
    sol!("../../src/interfaces/ITypes.sol");
    pub use IMerkler::*;
    sol!("../../src/interfaces/merkle/IMerkler.sol");
}

#[derive(Serialize)]
struct MerkleTreeIpfsData {
    id: String,
    metadata: serde_json::Value,
    root: String,
    tree: Vec<MerkleTreeEntry>,
}

#[derive(Serialize)]
struct MerkleTreeEntry {
    account: String,
    value: String,
    proof: Vec<String>,
}

// {
//     "id": "A string id of the Merkle tree, can be random (you can use the root)",
//     "metadata": {
//       "info": "a key value mapping allowing you to add information"
//     },
//     "root": "The merkle root of the tree",
//     "tree": [
//       {
//         "account": "The address of the account",
//         "value": "The value associated with the account",
//         "proof": ["0x1...", "0x2...", "...", "0xN..."]
//       }
//     ]
//   }
