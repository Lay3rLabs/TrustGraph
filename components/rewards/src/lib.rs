pub mod bindings;
mod ipfs;
mod merkle;
pub mod pagerank;
mod sources;
mod trigger;

use crate::bindings::{export, host::config_var, Guest, TriggerAction};
use crate::sources::SourceRegistry;
use bindings::WasmResponse;
use merkle::get_merkle_tree;
use merkle_tree_rs::standard::LeafType;
use serde::Serialize;
use serde_json::json;
use std::str::FromStr;
use trigger::{decode_trigger_event, encode_trigger_output};
use wavs_wasi_utils::evm::alloy_primitives::{hex, U256};
use wit_bindgen_rt::async_support::futures;
use wstd::runtime::block_on;

struct Component;
export!(Component with_types_in bindings);

impl Guest for Component {
    fn run(action: TriggerAction) -> std::result::Result<Option<WasmResponse>, String> {
        println!("🚀 Starting rewards component execution");

        let reward_token_address =
            config_var("reward_token").ok_or_else(|| "Failed to get reward token address")?;
        // let reward_source_nft_address =
        //     config_var("reward_source_nft").ok_or_else(|| "Failed to get NFT address")?;

        // EAS-related configuration
        let eas_address = config_var("eas_address").ok_or_else(|| "Failed to get EAS address")?;
        let indexer_address =
            config_var("indexer_address").ok_or_else(|| "Failed to get indexer address")?;
        let chain_name = config_var("chain_name").unwrap_or_else(|| "local".to_string());

        println!("📋 Configuration loaded:");
        println!("  - Reward token: {}", reward_token_address);
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

        let trigger_id = decode_trigger_event(action.data).map_err(|e| e.to_string())?;
        println!("🔧 Trigger ID: {:?}", trigger_id);

        let mut registry = SourceRegistry::new();

        // Add EAS sources - requires schema UID for attestations
        let schema_uid = config_var("reward_schema_uid")
            .ok_or_else(|| "Failed to get reward_schema_uid - this is required for EAS rewards")?;

        println!("📋 Using schema UID: {}", schema_uid);

        // Reward users for received attestations - 5e17 rewards per attestation
        registry.add_source(sources::eas::EasSource::new(
            &eas_address,
            &indexer_address,
            &chain_name,
            sources::eas::EasRewardType::ReceivedAttestations(schema_uid.clone()),
            U256::from(5e17),
        ));
        println!("✅ Added EAS source for received attestations (5e17 rewards each)");

        // // Reward users for sent attestations - 3e17 rewards per attestation
        // registry.add_source(sources::eas::EasSource::new(
        //     &eas_address,
        //     &eas_indexer_address,
        //     &chain_name,
        //     sources::eas::EasRewardType::SentAttestations,
        //     U256::from(3e17),
        // ));

        // Reward users for prediction market interactions (1e18 rewards per type+contract interacted with, so 2e18 if user trades and also redeems on same market, and 1e18 if only trades but no redeem)
        registry.add_source(sources::interactions::InteractionsSource::new(
            &chain_name,
            &indexer_address,
            "prediction_market_trade",
            U256::from(1e18),
            true,
        ));
        registry.add_source(sources::interactions::InteractionsSource::new(
            &chain_name,
            &indexer_address,
            "prediction_market_redeem",
            U256::from(1e18),
            true,
        ));

        // Add PageRank-based EAS rewards if configured
        if let Some(pagerank_pool_str) = config_var("pagerank_reward_pool") {
            let pool_amount = U256::from_str(&pagerank_pool_str)
                .unwrap_or_else(|_| U256::from(1000000000000000000000u128)); // Default 1000 tokens in wei

            // Safety check: prevent excessive reward pools
            let max_pool_size = U256::from(10000000000000000000000000u128); // 10M tokens max
            if pool_amount > max_pool_size {
                return Err(format!(
                    "PageRank reward pool too large: {} (max allowed: {})",
                    pool_amount, max_pool_size
                ));
            }

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
                schema_uid.clone(),
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
                            "✅ Added Trust Aware EAS PageRank source with {} reward pool",
                            pool_amount
                        );
                    } else {
                        println!("✅ Added EAS PageRank source with {} reward pool", pool_amount);
                    }
                }
                Err(e) => {
                    println!("⚠️  Failed to create PageRank source: {}", e);
                }
            }
        } else {
            println!("ℹ️  PageRank rewards disabled (no pagerank_reward_pool configured)");
        }

        // Example: Reward for specific schema attestations
        // Uncomment and configure to reward attestations to a specific schema
        // if let Ok(schema_uid) = config_var("reward_schema_uid") {
        //     registry.add_source(sources::eas::EasSource::new(
        //         &eas_address,
        //         &eas_indexer_address,
        //         &chain_name,
        //         sources::eas::EasRewardType::SchemaAttestations(schema_uid),
        //         U256::from(1e18), // 1e18 rewards per schema attestation
        //     ));
        // }

        block_on(async move {
            println!("🔍 Fetching accounts from all sources...");
            let accounts = registry.get_accounts().await.map_err(|e| e.to_string())?;
            println!("👥 Found {} unique accounts", accounts.len());

            // each value is [address, token, amount]
            let values = accounts
                .into_iter()
                .map(|account| {
                    let registry = &registry;
                    let reward_token_address = reward_token_address.clone();
                    async move {
                        let amount =
                            registry.get_rewards(&account).await.map_err(|e| e.to_string())?;
                        Ok::<Vec<String>, String>(vec![
                            account,
                            reward_token_address,
                            amount.to_string(),
                        ])
                    }
                })
                .collect::<Vec<_>>();

            let results = futures::future::join_all(values)
                .await
                .into_iter()
                .collect::<Result<Vec<_>, _>>()?;

            // Calculate total rewards with safety checks
            let mut total_rewards_sum = U256::ZERO;
            let max_reasonable_total = U256::from(100000000000000000000000000u128); // 100M tokens max

            for result in &results {
                let amount = U256::from_str(&result[2])
                    .map_err(|e| format!("Invalid reward amount '{}': {}", result[2], e))?;
                total_rewards_sum = total_rewards_sum
                    .checked_add(amount)
                    .ok_or_else(|| "Total rewards calculation overflow".to_string())?;
            }

            // Safety check: prevent unreasonably large total distributions
            if total_rewards_sum > max_reasonable_total {
                return Err(format!(
                    "Total rewards exceed reasonable limit: {} (max: {})",
                    total_rewards_sum, max_reasonable_total
                ));
            }

            let total_rewards = total_rewards_sum.to_string();

            println!("💰 Calculated rewards for {} accounts", results.len());
            println!("💎 Total rewards to distribute: {}", total_rewards);

            if results.len() == 0 {
                println!("⚠️  No accounts to distribute rewards to");
                return Ok(None);
            }

            // Additional safety check: verify no individual reward is excessive
            for result in &results {
                let amount = U256::from_str(&result[2]).unwrap();
                let max_individual_reward = U256::from(10000000000000000000000u128); // 10K tokens max per account
                if amount > max_individual_reward {
                    return Err(format!(
                        "Individual reward for account {} exceeds limit: {} (max: {})",
                        result[0], amount, max_individual_reward
                    ));
                }
            }

            let tree = get_merkle_tree(results.clone())?;
            let root = tree.root();
            let root_bytes = hex::decode(&root).map_err(|e| e.to_string())?;

            let sources_with_metadata =
                registry.get_sources_with_metadata().await.map_err(|e| e.to_string())?;

            println!("🌳 Generated merkle tree with root: {}", root);

            let mut ipfs_data = MerkleTreeIpfsData {
                id: root.clone(),
                metadata: json!({
                    "num_accounts": results.len(),
                    "reward_token_address": reward_token_address,
                    "total_rewards": total_rewards,
                    "sources": sources_with_metadata,
                }),
                root: root.clone(),
                tree: vec![],
            };

            // get proof for each value
            results.into_iter().for_each(|value| {
                let proof = tree.get_proof(LeafType::LeafBytes(value.clone()));
                ipfs_data.tree.push(MerkleTreeEntry {
                    account: value[0].clone(),
                    reward: value[1].clone(),
                    claimable: value[2].clone(),
                    proof,
                });
            });

            let ipfs_data_json = serde_json::to_string(&ipfs_data).map_err(|e| e.to_string())?;
            println!("📤 Uploading rewards data to IPFS...");

            let cid = ipfs::upload_json_to_ipfs(
                &ipfs_data_json,
                &format!("rewards_{}.json", ipfs_data.root),
                &ipfs_url,
                ipfs_api_key.as_deref(),
            )
            .await
            .map_err(|e| format!("Failed to upload IPFS: {}", e))?;

            println!("✅ Successfully uploaded to IPFS with CID: {}", cid);

            let ipfs_hash = cid.hash().digest();

            let payload = encode_trigger_output(
                trigger_id,
                solidity::AvsOutput {
                    root: serde_json::from_value(root_bytes.into()).unwrap(),
                    ipfsHashData: serde_json::from_value(ipfs_hash.into()).unwrap(),
                    ipfsHash: cid.to_string(),
                },
            );

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
    reward: String,
    claimable: String,
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
//         "account": "The address of the claimer",
//         "reward": "The address of the reward token",
//         "claimable": "The claimable amount as a big number string",
//         "proof": ["0x1...", "0x2...", "...", "0xN..."]
//       }
//     ]
//   }
