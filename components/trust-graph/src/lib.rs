#[rustfmt::skip]
pub mod bindings;
mod config;
mod eas_pagerank;
mod trigger;

use crate::bindings::{export, Guest, TriggerAction};

use bindings::WasmResponse;
use config::{MerklerConfig, PageRankSourceConfig};
use eas_pagerank::{sources, EasPageRankSource};
use serde_json::json;
use std::fs::File;
use trigger::encode_trigger_output;
use wavs_merkle_sources::core::build_merkle_ipfs_data;
use wavs_wasi_utils::evm::alloy_primitives::hex;
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
            let has_trust = pagerank_config.has_trust_enabled();
            match EasPageRankSource::new(pagerank_config) {
                Ok(pagerank_source) => {
                    let total_pool = pagerank_source.config.total_pool.to_string();
                    registry.add_source(pagerank_source);
                    if has_trust {
                        println!(
                            "✅ Added Trust Aware EAS PageRank source with {} points pool",
                            total_pool
                        );
                    } else {
                        println!("✅ Added EAS PageRank source with {} points pool", total_pool);
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

            println!("🔍 Fetching accounts and values from all sources...");

            let (results, total_value) =
                registry.get_accounts_events_and_value(&ctx).await.map_err(|e| e.to_string())?;

            println!("👥 Found {} unique accounts", results.len());
            println!("💰 Total value assigned: {}", total_value);

            if results.len() == 0 {
                println!("⚠️  No accounts to distribute to");
                return Ok(None);
            }

            let tree_data = results
                .iter()
                .map(|(account, (_, value))| vec![account.to_string(), value.to_string()])
                .collect::<Vec<_>>();

            let sources_with_metadata =
                registry.get_sources_with_metadata(&ctx).await.map_err(|e| e.to_string())?;

            let metadata = json!({
                "num_accounts": results.len(),
                "total_value": total_value.to_string(),
                "sources": sources_with_metadata,
            });

            let ipfs_data = build_merkle_ipfs_data(tree_data, metadata)?;
            let root = ipfs_data.root.clone();
            let root_bytes = hex::decode(&root).map_err(|e| e.to_string())?;

            println!("🌳 Generated merkle tree with root: {}", root);

            let ipfs_data_json = serde_json::to_string(&ipfs_data).map_err(|e| e.to_string())?;
            let cid = wavs_ipfs::upload_json_to_ipfs(
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
                .map(|(account, (events, _))| {
                    let file_path = config.events_dir.join(format!("{}.json", account));
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
