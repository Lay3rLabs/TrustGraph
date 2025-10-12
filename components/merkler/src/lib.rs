#[rustfmt::skip]
pub mod bindings;
mod config;
mod ipfs;
mod merkle;
mod trigger;

use crate::bindings::{export, Guest, TriggerAction};

use bindings::WasmResponse;
use config::{MerklerConfig, PageRankSourceConfig};
use merkle::get_merkle_tree;
use merkle_tree_rs::standard::LeafType;
use serde::Serialize;
use serde_json::json;
use std::fs::File;
use std::str::FromStr;
use trigger::encode_trigger_output;
use wavs_merkle_sources::{pagerank, sources};
use wavs_wasi_utils::evm::alloy_primitives::{hex, U256};
use wstd::runtime::block_on;

struct Component;
export!(Component with_types_in bindings);

impl Guest for Component {
    fn run(action: TriggerAction) -> std::result::Result<Option<WasmResponse>, String> {
        println!("🚀 Starting merkler component execution");

        // Load all configuration
        let config = MerklerConfig::load()?;
        let mut registry = sources::SourceRegistry::new();

        // Add PageRank-based EAS points if configured
        if let Some(pagerank_config) = PageRankSourceConfig::load()? {
            let pagerank_source_config = pagerank::PageRankRewardSource::new(
                pagerank_config.vouching_schema_uid.clone(),
                pagerank_config.points_pool,
                pagerank_config.pagerank_config.clone(),
            )
            .with_min_threshold(pagerank_config.min_threshold);

            let has_trust = pagerank_source_config.has_trust_enabled();
            match sources::eas_pagerank::EasPageRankSource::new(pagerank_source_config) {
                Ok(pagerank_source) => {
                    registry.add_source(pagerank_source);
                    if has_trust {
                        println!(
                            "✅ Added Trust Aware EAS PageRank source with {} points pool",
                            pagerank_config.points_pool
                        );
                    } else {
                        println!(
                            "✅ Added EAS PageRank source with {} points pool",
                            pagerank_config.points_pool
                        );
                    }
                }
                Err(e) => {
                    println!("⚠️  Failed to create PageRank source: {}", e);
                }
            }
        }

        block_on(async move {
            let ctx = sources::SourceContext::new(
                &config.chain_name,
                &config.chain_id,
                &config.http_endpoint,
                &config.eas_address,
                &config.indexer_address,
            )
            .await
            .map_err(|e| e.to_string())?;

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
            for (_, result) in &results {
                let amount = U256::from_str(&result[1])
                    .map_err(|e| format!("Invalid amount '{}': {}", result[1], e))?;
                total_value = total_value
                    .checked_add(amount)
                    .ok_or_else(|| "Total calculation overflow".to_string())?;
            }

            let total_value_str = total_value.to_string();

            println!("💰 Calculated points for {} accounts", results.len());
            println!("💎 Total points assigned: {}", total_value_str);

            if results.len() == 0 {
                println!("⚠️  No accounts to distribute points to");
                return Ok(None);
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
            let cid = ipfs::upload_json_to_ipfs(
                &ipfs_data_json,
                &format!("merkle_{}.json", ipfs_data.root),
                &config.ipfs_url,
                config.ipfs_api_key.as_deref(),
            )
            .await
            .map_err(|e| format!("Failed to upload IPFS: {}", e))?;

            println!("✅ Successfully uploaded to IPFS with CID: {}", cid);

            println!("🗃️ Writing account events to {}...", config.events_dir.display());
            results
                .into_iter()
                .map(|(events, value)| {
                    let file_path = config.events_dir.join(format!("{}.json", value[0]));
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
