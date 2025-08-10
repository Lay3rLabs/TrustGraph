pub mod bindings;
mod ipfs;
mod merkle;
mod sources;
mod trigger;

use crate::bindings::{export, host::config_var, Guest, TriggerAction};
use crate::sources::SourceRegistry;
use bindings::WasmResponse;
use merkle::get_merkle_tree;
use merkle_tree_rs::standard::LeafType;
use serde::Serialize;
use serde_json::json;
use trigger::{decode_trigger_event, encode_trigger_output};
use wavs_wasi_utils::evm::alloy_primitives::{hex, U256, U512};
use wit_bindgen_rt::async_support::futures;
use wstd::runtime::block_on;

struct Component;
export!(Component with_types_in bindings);

impl Guest for Component {
    fn run(action: TriggerAction) -> std::result::Result<Option<WasmResponse>, String> {
        let reward_token_address =
            config_var("reward_token").ok_or_else(|| "Failed to get reward token address")?;
        let reward_source_nft_address =
            config_var("reward_source_nft").ok_or_else(|| "Failed to get NFT address")?;

        // EAS-related configuration
        let eas_address = config_var("eas_address").ok_or_else(|| "Failed to get EAS address")?;
        let eas_indexer_address =
            config_var("eas_indexer_address").ok_or_else(|| "Failed to get EAS indexer address")?;
        let chain_name = config_var("chain_name").unwrap_or_else(|| "local".to_string());

        let ipfs_url = std::env::var("WAVS_ENV_PINATA_API_URL")
            .unwrap_or_else(|_| "https://uploads.pinata.cloud/v3/files".to_string());
        let ipfs_api_key = std::env::var("WAVS_ENV_PINATA_API_KEY")
            .map_err(|e| format!("Failed to get API key: {}", e))?;

        let trigger_id = decode_trigger_event(action.data).map_err(|e| e.to_string())?;

        let mut registry = SourceRegistry::new();

        // Add NFT source - 1e18 rewards per NFT held
        registry.add_source(sources::erc721::Erc721Source::new(
            &reward_source_nft_address,
            U256::from(1e18),
        ));

        // Add EAS sources
        // Reward users for received attestations - 5e17 rewards per attestation
        registry.add_source(sources::eas::EasSource::new(
            &eas_address,
            &eas_indexer_address,
            &chain_name,
            sources::eas::EasRewardType::ReceivedAttestations,
            U256::from(5e17),
        ));

        // Reward users for sent attestations - 3e17 rewards per attestation
        registry.add_source(sources::eas::EasSource::new(
            &eas_address,
            &eas_indexer_address,
            &chain_name,
            sources::eas::EasRewardType::SentAttestations,
            U256::from(3e17),
        ));

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
            let accounts = registry.get_accounts().await.map_err(|e| e.to_string())?;

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

            let total_rewards =
                results.iter().map(|v| v[2].parse::<U512>().unwrap()).sum::<U512>().to_string();

            if results.len() == 0 {
                eprintln!("No accounts to distribute rewards to");
                return Ok(None);
            }

            let tree = get_merkle_tree(results.clone())?;
            let root = tree.root();
            let root_bytes = hex::decode(&root).map_err(|e| e.to_string())?;

            let sources_with_metadata =
                registry.get_sources_with_metadata().await.map_err(|e| e.to_string())?;

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

            let cid = ipfs::upload_json_to_ipfs(
                &ipfs_data_json,
                &format!("rewards_{}.json", ipfs_data.root),
                &ipfs_url,
                &ipfs_api_key,
            )
            .await
            .map_err(|e| format!("Failed to upload IPFS: {}", e))?;

            let ipfs_hash = cid.hash().digest();

            let payload = encode_trigger_output(
                trigger_id,
                solidity::AvsOutput {
                    root: serde_json::from_value(root_bytes.into()).unwrap(),
                    ipfsHashData: serde_json::from_value(ipfs_hash.into()).unwrap(),
                    ipfsHash: cid.to_string(),
                },
            );

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
