pub mod bindings;
mod ipfs;
mod trigger;

use crate::bindings::{export, host::config_var, Guest, TriggerAction};
use bindings::WasmResponse;
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::str::FromStr;
use trigger::{decode_trigger_event, encode_trigger_output};
use wavs_types::{
    Aggregator, EvmContractSubmission, ServiceID, ServiceManager, ServiceStatus, Submit, Timestamp,
    Trigger, WorkflowID,
};
use wavs_wasi_utils::evm::alloy_primitives::{hex, U256};
use wit_bindgen_rt::async_support::futures;
use wstd::runtime::block_on;

struct Component;
export!(Component with_types_in bindings);

// import ServiceJson from wavs::cli::src::service_json.rs, does not look like it is exported?
// #[derive(Serialize, Deserialize, Clone, Debug)]
// #[serde(rename_all = "snake_case")]
// pub struct ServiceJson {
//     pub id: ServiceID,
//     pub name: String,
//     pub workflows: BTreeMap<WorkflowID, WorkflowJson>,
//     pub status: ServiceStatus,
//     pub manager: ServiceManagerJson,
// }

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "snake_case")]
pub struct ServiceJsonExample {
    pub example: String,
}

// #[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
// #[serde(rename_all = "snake_case", untagged)]
// pub enum ServiceManagerJson {
//     Manager(ServiceManager),
//     Json(Json),
// }

// impl Default for ServiceManagerJson {
//     fn default() -> Self {
//         ServiceManagerJson::Json(Json::Unset)
//     }
// }

// #[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
// #[serde(rename_all = "snake_case")]
// pub struct WorkflowJson {
//     pub trigger: TriggerJson,
//     pub component: ComponentJson,
//     pub submit: SubmitJson,
//     /// If submit is `Submit::Aggregator`, this is
//     /// the required data for the aggregator to submit this workflow
//     pub aggregators: Vec<Aggregator>,
// }

// #[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
// #[serde(rename_all = "snake_case", untagged)]
// pub enum TriggerJson {
//     Trigger(Trigger),
//     Json(Json),
// }

// #[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
// #[serde(rename_all = "snake_case", untagged)]
// pub enum SubmitJson {
//     Submit(Submit),
//     Json(Json),
// }

// #[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
// #[serde(rename_all = "snake_case")]
// pub enum Json {
//     Unset,
// }

// #[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
// #[serde(rename_all = "snake_case", untagged)]
// pub enum ComponentJson {
//     Component(Component),
//     Json(Json),
// }

impl Guest for Component {
    fn run(action: TriggerAction) -> std::result::Result<Option<WasmResponse>, String> {
        println!("🚀 Starting geyser component execution");
        let chain_name = config_var("chain_name").unwrap_or_else(|| "local".to_string());

        println!("📋 Configuration loaded:");
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

        let user_input = decode_trigger_event(action.data).map_err(|e| e.to_string())?;
        println!("🔧 User Input: {:?}", user_input);

        block_on(async move {
            println!("🔍 Fetching current IPFS JSON...");

            //     // TODO: query current IPFS JSON data from the serviceManager

            //     let mut ipfs_data = MerkleTreeIpfsData {
            //         id: root.clone(),
            //         metadata: json!({
            //             "num_accounts": results.len(),
            //             "reward_token_address": reward_token_address,
            //             "total_rewards": total_rewards,
            //             "sources": sources_with_metadata,
            //         }),
            //         root: root.clone(),
            //         tree: vec![],
            //     };

            //     // let accounts = registry.get_accounts().await.map_err(|e| e.to_string())?;
            //     // println!("👥 Found {} unique accounts", accounts.len());

            //     // // each value is [address, token, amount]
            //     // let values = accounts
            //     //     .into_iter()
            //     //     .map(|account| {
            //     //         let registry = &registry;
            //     //         let reward_token_address = reward_token_address.clone();
            //     //         async move {
            //     //             let amount =
            //     //                 registry.get_rewards(&account).await.map_err(|e| e.to_string())?;
            //     //             Ok::<Vec<String>, String>(vec![
            //     //                 account,
            //     //                 reward_token_address,
            //     //                 amount.to_string(),
            //     //             ])
            //     //         }
            //     //     })
            //     //     .collect::<Vec<_>>();

            //     // let results = futures::future::join_all(values)
            //     //     .await
            //     //     .into_iter()
            //     //     .collect::<Result<Vec<_>, _>>()?;

            //     // // Calculate total rewards with safety checks
            //     // let mut total_rewards_sum = U256::ZERO;
            //     // let max_reasonable_total = U256::from(100000000000000000000000000u128); // 100M tokens max

            //     // for result in &results {
            //     //     let amount = U256::from_str(&result[2])
            //     //         .map_err(|e| format!("Invalid reward amount '{}': {}", result[2], e))?;
            //     //     total_rewards_sum = total_rewards_sum
            //     //         .checked_add(amount)
            //     //         .ok_or_else(|| "Total rewards calculation overflow".to_string())?;
            //     // }

            //     // // Safety check: prevent unreasonably large total distributions
            //     // if total_rewards_sum > max_reasonable_total {
            //     //     return Err(format!(
            //     //         "Total rewards exceed reasonable limit: {} (max: {})",
            //     //         total_rewards_sum, max_reasonable_total
            //     //     ));
            //     // }

            //     // let total_rewards = total_rewards_sum.to_string();

            //     // println!("💰 Calculated rewards for {} accounts", results.len());
            //     // println!("💎 Total rewards to distribute: {}", total_rewards);

            //     // if results.len() == 0 {
            //     //     println!("⚠️  No accounts to distribute rewards to");
            //     //     return Ok(None);
            //     // }

            //     // // Additional safety check: verify no individual reward is excessive
            //     // for result in &results {
            //     //     let amount = U256::from_str(&result[2]).unwrap();
            //     //     let max_individual_reward = U256::from(10000000000000000000000u128); // 10K tokens max per account
            //     //     if amount > max_individual_reward {
            //     //         return Err(format!(
            //     //             "Individual reward for account {} exceeds limit: {} (max: {})",
            //     //             result[0], amount, max_individual_reward
            //     //         ));
            //     //     }
            //     // }

            //     // let tree = get_merkle_tree(results.clone())?;
            //     // let root = tree.root();
            //     // let root_bytes = hex::decode(&root).map_err(|e| e.to_string())?;

            //     // let sources_with_metadata =
            //     //     registry.get_sources_with_metadata().await.map_err(|e| e.to_string())?;

            //     // println!("🌳 Generated merkle tree with root: {}", root);

            //     // get proof for each value
            //     // results.into_iter().for_each(|value| {
            //     //     let proof = tree.get_proof(LeafType::LeafBytes(value.clone()));
            //     //     ipfs_data.tree.push(MerkleTreeEntry {
            //     //         account: value[0].clone(),
            //     //         reward: value[1].clone(),
            //     //         claimable: value[2].clone(),
            //     //         proof,
            //     //     });
            //     // });

            //     let ipfs_data_json = serde_json::to_string(&ipfs_data).map_err(|e| e.to_string())?;
            //     println!("📤 Uploading rewards data to IPFS...");

            //     let cid = ipfs::upload_json_to_ipfs(
            //         &ipfs_data_json,
            //         &format!("rewards_{}.json", ipfs_data.root),
            //         &ipfs_url,
            //         ipfs_api_key.as_deref(),
            //     )
            //     .await
            //     .map_err(|e| format!("Failed to upload IPFS: {}", e))?;

            //     println!("✅ Successfully uploaded to IPFS with CID: {}", cid);

            //     let ipfs_hash = cid.hash().digest();

            //     let payload = encode_trigger_output(
            //         trigger_id,
            //         solidity::AvsOutput {
            //             root: serde_json::from_value(root_bytes.into()).unwrap(),
            //             ipfsHashData: serde_json::from_value(ipfs_hash.into()).unwrap(),
            //             ipfsHash: cid.to_string(),
            //         },
            //     );

            //     println!("🎉 Rewards component execution completed successfully");
            //     println!("📦 Final payload size: {} bytes", payload.len());

            // let payload: Vec<u8> = vec![]; // Placeholder for actual payload generation logic
            // copnvert the ServiceJsonExample to Vec<u8>

            // TODO: use the service.json instead in the future, we will upload to ipfs
            // let service_json_example =
            //     ServiceJsonExample { example: "This is an example".to_string() };
            // let payload = serde_json::to_vec(&service_json_example)
            //     .map_err(|e| format!("Failed to serialize payload: {}", e))?;

            let payload: Vec<u8> = user_input.into_bytes();

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
