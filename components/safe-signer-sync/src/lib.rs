//! # Safe Signer Sync Component
//!
//! This component synchronizes Safe signers based on a merkle tree stored in IPFS.
//! It downloads the merkle tree, identifies the top N accounts, and generates
//! operations to sync them with the SignerManagerModule contract.
//!

mod solidity;
mod trigger;
use alloy_network::Ethereum;
use alloy_primitives::TxKind;
use alloy_rpc_types::TransactionInput;
use bindings::host::{config_var, get_evm_chain_config};
use trigger::{decode_trigger_event, encode_trigger_output, Destination};
use wavs_wasi_utils::evm::new_evm_provider;
pub mod bindings;
use crate::bindings::{export, Guest, TriggerAction, WasmResponse};
use crate::solidity::{ISignerManagerModule, OperationType, SignerManagerPayload, SignerOperation};
use alloy_provider::{Provider, RootProvider};
use alloy_sol_types::{SolCall, SolValue};
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::str::FromStr;
use wavs_wasi_utils::evm::alloy_primitives::{Address, U256};
use wstd::runtime::block_on;

struct Component;
export!(Component with_types_in bindings);

/// Represents the merkle tree structure from rewards component
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(default)]
struct MerkleTreeIpfsData {
    id: String,
    metadata: serde_json::Value,
    root: String,
    tree: Vec<MerkleTreeEntry>,
}

impl Default for MerkleTreeIpfsData {
    fn default() -> Self {
        Self {
            id: String::new(),
            metadata: serde_json::Value::Null,
            root: String::new(),
            tree: Vec::new(),
        }
    }
}

/// Represents an entry in the merkle tree from rewards component
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(default)]
struct MerkleTreeEntry {
    account: String,
    reward: String,
    claimable: String,
    proof: Vec<String>,
}

impl Default for MerkleTreeEntry {
    fn default() -> Self {
        Self {
            account: String::new(),
            reward: String::new(),
            claimable: String::new(),
            proof: Vec::new(),
        }
    }
}

impl Guest for Component {
    /// Safe Signer Sync Component - Downloads merkle tree and syncs signers
    ///
    /// This component:
    /// 1. Downloads a merkle tree from IPFS using the provided CID
    /// 2. Identifies the top N accounts based on voting power/score
    /// 3. Queries the current signers from the SignerManagerModule
    /// 4. Generates operations to sync the signers
    /// 5. Returns the encoded SignerManagerPayload
    fn run(action: TriggerAction) -> std::result::Result<Option<WasmResponse>, String> {
        let (merkle_event, dest) = decode_trigger_event(action.data).map_err(|e| e.to_string())?;

        // Download merkle tree from IPFS
        let cid = merkle_event.ipfsHashCid;
        println!("📥 Downloading merkle tree from IPFS CID: {}", cid);

        let merkle_tree = download_merkle_tree(&cid)?;
        println!("✅ Downloaded merkle tree with {} accounts", merkle_tree.tree.len());

        // Use config_var for configuration
        let top_n = config_var("top_n_signers")
            .unwrap_or_else(|| "10".to_string())
            .parse::<usize>()
            .unwrap_or(10);

        let min_threshold = config_var("min_threshold")
            .unwrap_or_else(|| "3".to_string())
            .parse::<usize>()
            .unwrap_or(3);

        // Find top N signers from merkle tree
        let top_signers = find_top_signers(&merkle_tree, top_n)?;
        println!("🎯 Identified top {} signers", top_signers.len());

        // Get module address from config
        let module_address = config_var("signer_module_address")
            .ok_or_else(|| "signer_module_address not configured")?;

        let current_signers = block_on(query_current_signers(&module_address))?;
        println!("📋 Current signers: {} addresses", current_signers.len());

        // Calculate the operations needed
        let operations = calculate_signer_operations(
            &current_signers,
            &top_signers,
            min_threshold.min(top_signers.len()),
        )?;

        println!("🔧 Generated {} signer operations", operations.len());

        // Create the payload with the operations
        let signer_payload = SignerManagerPayload { operations };

        // Encode the response
        let encoded_response = signer_payload.abi_encode();

        let output = match dest {
            Destination::Ethereum => Some(encode_trigger_output(&encoded_response)),
            Destination::CliOutput => {
                Some(WasmResponse { payload: encoded_response.into(), ordering: None })
            }
        };

        Ok(output)
    }
}

/// Downloads the merkle tree from IPFS
fn download_merkle_tree(cid: &str) -> Result<MerkleTreeIpfsData, String> {
    // Try to use Pinata first, fallback to local IPFS if API key is not available
    let (ipfs_url, ipfs_api_key) = match std::env::var("WAVS_ENV_PINATA_API_KEY") {
        Ok(api_key) => {
            let gateway_url = std::env::var("WAVS_ENV_PINATA_GATEWAY_URL")
                .unwrap_or_else(|_| "https://gateway.pinata.cloud/ipfs".to_string());
            println!("🌐 Using Pinata IPFS service");
            (gateway_url, Some(api_key))
        }
        Err(_) => {
            println!("🏠 Pinata API key not found, using local IPFS node");
            ("http://localhost:8080/ipfs".to_string(), None)
        }
    };

    // Construct the full URL
    let full_url = format!("{}/{}", ipfs_url, cid);
    println!("🔗 Fetching from: {}", full_url);

    // Make the HTTP request
    let response = block_on(async {
        let mut request = wavs_wasi_utils::http::http_request_get(&full_url)
            .map_err(|e| format!("Failed to create request: {}", e))?;

        // Add headers if API key is present
        if let Some(api_key) = ipfs_api_key {
            let headers = request.headers_mut();
            headers.insert(
                "x-pinata-gateway-token",
                wstd::http::HeaderValue::from_str(&api_key)
                    .map_err(|e| format!("Invalid header value: {}", e))?,
            );
        }

        wavs_wasi_utils::http::fetch_bytes(request)
            .await
            .map_err(|e| format!("Failed to fetch from IPFS: {}", e))
    })?;

    // Parse the JSON response
    let merkle_tree: MerkleTreeIpfsData = serde_json::from_slice(&response)
        .map_err(|e| format!("Failed to parse merkle tree JSON: {}", e))?;

    Ok(merkle_tree)
}

/// Finds the top N signers from the merkle tree based on claimable amount
fn find_top_signers(
    merkle_tree: &MerkleTreeIpfsData,
    top_n: usize,
) -> Result<Vec<Address>, String> {
    let mut scored_accounts: Vec<(Address, U256)> = Vec::new();

    for entry in &merkle_tree.tree {
        // Parse the address
        let address = Address::from_str(&entry.account)
            .map_err(|e| format!("Invalid address {}: {}", entry.account, e))?;

        // Parse the claimable amount as the score
        let score = U256::from_str(&entry.claimable).unwrap_or(U256::ZERO);

        scored_accounts.push((address, score));
    }

    // Sort by score in descending order
    scored_accounts.sort_by(|a, b| b.1.cmp(&a.1));

    // Take top N
    let top_signers: Vec<Address> =
        scored_accounts.into_iter().take(top_n).map(|(addr, _)| addr).collect();

    Ok(top_signers)
}

/// Queries the current signers from the SignerManagerModule contract
async fn query_current_signers(module_address: &str) -> Result<Vec<Address>, String> {
    let chain_name = config_var("chain_name").unwrap_or("local".to_string());
    let chain_config = get_evm_chain_config(&chain_name).unwrap();
    let provider: RootProvider<Ethereum> =
        new_evm_provider::<Ethereum>(chain_config.http_endpoint.unwrap());

    // Parse module address
    let module_addr =
        Address::from_str(module_address).map_err(|e| format!("Invalid module address: {}", e))?;

    // Create the getSigners call
    let get_signers_call = ISignerManagerModule::getSignersCall {};

    // Create transaction request
    let tx = alloy_rpc_types::eth::TransactionRequest {
        to: Some(TxKind::Call(module_addr)),
        input: TransactionInput { input: Some(get_signers_call.abi_encode().into()), data: None },
        ..Default::default()
    };

    // Make the call
    let result =
        provider.call(tx).await.map_err(|e| format!("Failed to call getSigners: {}", e))?;

    // Decode the result as address[]
    let signers = ISignerManagerModule::getSignersCall::abi_decode_returns(&result)
        .map_err(|e| format!("Failed to decode getSigners result: {}", e))?;

    Ok(signers)
}

/// Calculates the operations needed to sync signers
fn calculate_signer_operations(
    current_signers: &[Address],
    desired_signers: &[Address],
    new_threshold: usize,
) -> Result<Vec<SignerOperation>, String> {
    let mut operations = Vec::new();

    let current_set: HashSet<Address> = current_signers.iter().cloned().collect();
    let desired_set: HashSet<Address> = desired_signers.iter().cloned().collect();

    // Find signers to remove
    let to_remove: Vec<Address> =
        current_signers.iter().filter(|addr| !desired_set.contains(*addr)).cloned().collect();

    // Find signers to add
    let to_add: Vec<Address> =
        desired_signers.iter().filter(|addr| !current_set.contains(*addr)).cloned().collect();

    // Strategy: First swap existing signers if possible, then add/remove the rest
    let swaps = to_remove.len().min(to_add.len());

    // Perform swaps
    for i in 0..swaps {
        let old_signer = to_remove[i];
        let new_signer = to_add[i];

        // Find the previous signer in the linked list
        let prev_signer = find_previous_signer(&current_signers, old_signer);

        operations.push(SignerOperation {
            operationType: OperationType::SWAP_SIGNER,
            prevSigner: prev_signer,
            signer: old_signer,
            newSigner: new_signer,
            threshold: U256::ZERO, // No threshold change in swap
        });
    }

    // Add remaining signers
    for i in swaps..to_add.len() {
        operations.push(SignerOperation {
            operationType: OperationType::ADD_SIGNER,
            prevSigner: Address::ZERO,
            signer: to_add[i],
            newSigner: Address::ZERO,
            threshold: U256::from(new_threshold),
        });
    }

    // Remove remaining signers
    for i in swaps..to_remove.len() {
        let signer = to_remove[i];
        let prev_signer = find_previous_signer(&current_signers, signer);

        operations.push(SignerOperation {
            operationType: OperationType::REMOVE_SIGNER,
            prevSigner: prev_signer,
            signer,
            newSigner: Address::ZERO,
            threshold: U256::from(new_threshold),
        });
    }

    // If only threshold needs to change
    if operations.is_empty() && current_signers.len() > 0 {
        operations.push(SignerOperation {
            operationType: OperationType::CHANGE_THRESHOLD,
            prevSigner: Address::ZERO,
            signer: Address::ZERO,
            newSigner: Address::ZERO,
            threshold: U256::from(new_threshold),
        });
    }

    Ok(operations)
}

/// Finds the previous signer in the linked list for a given signer
fn find_previous_signer(signers: &[Address], target: Address) -> Address {
    // In a Safe, signers are stored in a linked list
    // For simplicity, we assume they're ordered and use the previous one
    // In production, you'd need to query the actual linked list structure

    for i in 0..signers.len() {
        if signers[i] == target {
            if i > 0 {
                return signers[i - 1];
            } else {
                // First signer, use sentinel address (0x1)
                return Address::from([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]);
            }
        }
    }

    // Default to sentinel if not found
    Address::from([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1])
}
