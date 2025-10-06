#[rustfmt::skip]
pub mod bindings;
mod ipfs;
mod merkle;
mod trigger;

use crate::bindings::{
    export,
    host::{config_var, get_evm_chain_config},
    Guest, TriggerAction,
};

use bindings::WasmResponse;
use merkle::get_merkle_tree;
use merkle_tree_rs::standard::LeafType;
use serde::Serialize;
use serde_json::json;
use std::fs::File;
use std::path::Path;
use std::str::FromStr;
use trigger::encode_trigger_output;
use wavs_merkle_sources::{pagerank, sources};
use wavs_wasi_utils::evm::alloy_primitives::{hex, Address, U256};
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
                // TODO: this is different from gateway. Need to rechange this
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

        let mut registry = sources::SourceRegistry::new();

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

        let chain_config = get_evm_chain_config(&chain_name)
            .ok_or_else(|| format!("Failed to get chain config for {chain_name}"))?;
        let chain_id = chain_config.chain_id;
        let http_endpoint = chain_config
            .http_endpoint
            .ok_or_else(|| format!("Failed to get HTTP endpoint for {chain_name}"))?;

        // Reward users for receiving recognition attestations
        let recognition_schema_uid = config_var("recognition_schema_uid").ok_or_else(|| {
            "Failed to get recognition_schema_uid - this is required for EAS points"
        })?;
        let trusted_recognizers = config_var("trusted_recognizers")
            .unwrap_or_default()
            .split(",")
            .map(|s| {
                Address::from_str(s).map_err(|e| {
                    format!("Failed to parse trusted recognizer address ({}): {}", s, e)
                })
            })
            .collect::<Result<Vec<Address>, _>>()?;
        if trusted_recognizers.is_empty() {
            return Err("No trusted recognizers configured. UNSAFE!!".to_string());
        }

        println!("📋 Using recognition schema UID: {}", recognition_schema_uid);
        registry.add_source(sources::eas::EasSource::new(
            sources::eas::EasSourceType::ReceivedAttestations {
                schema_uid: recognition_schema_uid,
                allow_self_attestations: false,
                trusted_attesters: Some(trusted_recognizers),
            },
            sources::eas::EasSummaryComputation::StringAbiDataField {
                schema: "(string,uint256)".to_string(),
                index: 0,
            },
            sources::eas::EasPointsComputation::UintAbiDataField {
                schema: "(string,uint256)".to_string(),
                index: 1,
            },
        ));

        // Reward users for hyperstition market interactions

        let hyperstition_trade_points: U256 = config_var("hyperstition_trade_points")
            .ok_or_else(|| "Failed to get hyperstition_trade_points")?
            .parse()
            .map_err(|e| format!("Failed to parse hyperstition_trade_points as u256: {e}"))?;
        registry.add_source(sources::interactions::InteractionsSource::new(
            "prediction_market_trade",
            hyperstition_trade_points,
            true,
        ));

        let hyperstition_redeem_points: U256 = config_var("hyperstition_redeem_points")
            .ok_or_else(|| "Failed to get hyperstition_redeem_points")?
            .parse()
            .map_err(|e| format!("Failed to parse hyperstition_redeem_points as u256: {e}"))?;
        registry.add_source(sources::interactions::InteractionsSource::new(
            "prediction_market_redeem",
            hyperstition_redeem_points,
            true,
        ));

        let hyperstition_market_makers = config_var("hyperstition_market_makers")
            .ok_or_else(|| "Failed to get hyperstition_market_makers")?;
        let hyperstition_points_pool: U256 = config_var("hyperstition_points_pool")
            .ok_or_else(|| "Failed to get hyperstition_points_pool")?
            .parse()
            .map_err(|e| format!("Failed to parse hyperstition_points_pool as u256: {e}"))?;
        for market in hyperstition_market_makers.split(",") {
            registry.add_source(sources::hyperstition::HyperstitionSource::new(
                market,
                hyperstition_points_pool,
            )?);
        }

        // Add PageRank-based EAS points if configured
        if let (true, Some(pagerank_pool_str), Some(vouching_schema_uid)) = (
            config_var("pagerank_enabled") == Some("true".to_string()),
            config_var("pagerank_points_pool"),
            config_var("vouching_schema_uid"),
        ) {
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
            match sources::eas_pagerank::EasPageRankSource::new(pagerank_source_config) {
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

        // Add 1k points for participating in the test Hyperstition
        registry.add_source(sources::direct::DirectSource::new(
            vec![
                "0x016fbc13eac82a67cbea77eb282cc347a758c361",
                "0xf9555236dea7940a21c0f271fa2b004af06b0fca",
                "0x2cb2411005e4b369b1c456a38f64c5a9436dc7a4",
                "0x3ea778e1e062261ff9b1770ae79a93de6c61401e",
                "0xfdb6c3d6a28a0235b8b158891f412393dcf0cd42",
                "0x7329ba91034357bfa6582df5f2b0e0d2969e5f63",
                "0x2ced06a690d9cc293800d824f31b0972d0d2440e",
                "0xd2c392084761cb6e44c544b6f39dcc001fde9775",
                "0xe458a906b91fb4be7976810bbe2ad72d0d909539",
                "0x7f62dc4c9ca18d4cd6dbd7599f4624a4d1b50b28",
                "0x1626c59bd14b3a065242cad5059141bb2dec347d",
                "0xea8bc703924637438313abf086d952011eb568f5",
                "0x97b59c2ec4ac59b5a581d028bf495fd47c96892d",
                "0x72e1638bd8cd371bfb04cf665b749a0e4ae38324",
                "0x852d634983ab455c9c60ee1de3ae8c979eb72617",
                "0x28499c2115299beff0c07fe7574ce7222d891c76",
                "0xaedc56434676028849627f0b20a32de1a631c840",
                "0x1503f75597355232f2553c55c90eefd5d60f216d",
                "0xb9d53cc752d3d1888fe8e340a65027c1a2d86f94",
                "0x9b8afd891a5d51f34f699bcb536109b77306b003",
            ],
            U256::from(1_000),
            "Participated in the test Hyperstition",
            // When the Hyperstition closed @ 10/3/25, 2:00:00 PM EDT
            Some(1758841200),
        ));

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
            let ctx = sources::SourceContext::new(
                &chain_name,
                &chain_id,
                &http_endpoint,
                &eas_address,
                &indexer_address,
            )
            .await
            .map_err(|e| e.to_string())?;

            println!("🔍 Fetching accounts from all sources...");
            let accounts = registry.get_accounts(&ctx).await.map_err(|e| e.to_string())?;
            println!("👥 Found {} unique accounts", accounts.len());

            // each value is [address, amount]
            let events_and_values = accounts
                .into_iter()
                .map(|account| {
                    let registry = &registry;
                    async {
                        let (events, value) = registry
                            .get_events_and_value(&ctx, &account)
                            .await
                            .map_err(|e| e.to_string())?;
                        Ok::<(Vec<sources::SourceEvent>, Vec<String>), String>((
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
                registry.get_sources_with_metadata(&ctx).await.map_err(|e| e.to_string())?;

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
            let payload = encode_trigger_output(
                &action,
                &root_bytes,
                ipfs_hash,
                cid.to_string(),
                total_value,
            )
            .await?;

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
