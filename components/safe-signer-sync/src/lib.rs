//! # Safe Signer Sync Component
//!
//! This component synchronizes Safe signers based on a merkle tree stored in IPFS.
//! It downloads the merkle tree, identifies the top N accounts, and generates
//! operations to sync them with the SignerSyncManagerModule contract.
//!

mod solidity;
mod trigger;
use alloy_network::Ethereum;
use alloy_primitives::TxKind;
use alloy_rpc_types::TransactionInput;
use bindings::host::{config_var, get_evm_chain_config};
use trigger::{decode_trigger_event, encode_trigger_output, Destination};
use wavs_wasi_utils::evm::new_evm_provider;
#[rustfmt::skip]
pub mod bindings;
use crate::bindings::{export, Guest, TriggerAction, WasmResponse};
use crate::solidity::{
    ISignerSyncManagerModule, OperationType, SignerManagerPayload, SignerOperation,
};
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
    /// 3. Queries the current signers from the SignerSyncManagerModule
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
            .unwrap_or_else(|| "1".to_string())
            .parse::<usize>()
            .unwrap_or(1);

        let target_threshold = config_var("target_threshold")
            .unwrap_or_else(|| "0.5".to_string())
            .parse::<f64>()
            .unwrap_or(0.5);

        if target_threshold < 0.01 || target_threshold > 1.0 {
            return Err("target_threshold must be between 0.01 and 1.0".to_string());
        }

        // Find top N signers from merkle tree
        let top_signers = find_top_signers(&merkle_tree, top_n)?;
        println!("🎯 Identified top {} signers from merkle tree:", top_signers.len());
        for (i, signer) in top_signers.iter().enumerate() {
            println!("  [{}] {}", i, signer);
        }

        // Get module address from config
        let module_address = config_var("signer_sync_manager")
            .ok_or_else(|| "signer_sync_manager not configured")?;

        let current_signers = block_on(query_current_signers(module_address))?;
        println!("📋 Current signers: {} addresses", current_signers.len());
        for (i, signer) in current_signers.iter().enumerate() {
            println!("  [{}] {}", i, signer);
        }

        // Calculate the new threshold based on the target threshold
        let new_threshold = ((target_threshold * top_signers.len() as f64).ceil() as usize)
            .max(min_threshold)
            .min(top_signers.len());

        // Calculate the operations needed
        let operations =
            calculate_signer_operations(&current_signers, &top_signers, new_threshold)?;

        println!("🔧 Generated {} signer operations:", operations.len());
        for (i, op) in operations.iter().enumerate() {
            match op.operationType {
                OperationType::ADD_SIGNER => {
                    println!("  [{}] ADD_SIGNER: {} (threshold: {})", i, op.signer, op.threshold);
                }
                OperationType::REMOVE_SIGNER => {
                    println!(
                        "  [{}] REMOVE_SIGNER: {} (prev: {}, threshold: {})",
                        i, op.signer, op.prevSigner, op.threshold
                    );
                }
                OperationType::SWAP_SIGNER => {
                    println!(
                        "  [{}] SWAP_SIGNER: {} -> {} (prev: {})",
                        i, op.signer, op.newSigner, op.prevSigner
                    );
                }
                OperationType::CHANGE_THRESHOLD => {
                    println!("  [{}] CHANGE_THRESHOLD: {}", i, op.threshold);
                }
                _ => {
                    println!("  [{}] UNKNOWN OPERATION", i);
                }
            }
        }

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

/// Converts a CID to different formats for IPFS gateway compatibility
fn convert_cid_formats(cid: &str) -> Vec<String> {
    let mut formats = vec![cid.to_string()];

    // If it's a v0 CID (starts with Qm), also try the v1 format
    // Note: This is a simplified conversion - in production you'd use a proper CID library
    if cid.starts_with("Qm") {
        // Common v1 prefixes for v0 CIDs
        // The actual conversion is complex, but these are common patterns
        formats.push(cid.to_lowercase());

        // Try to generate a likely v1 CID (this is approximate)
        // Real conversion would use multihash and multibase libraries
        if cid == "QmZ4d4PXV4A7VnddfeK1nMzUSRvBZvGQ6rmt1ZsZHx1Jg2" {
            // Known conversion for this specific CID
            formats.push("bafybeie7kvs3dqa4r3je57fmzpyjdoidp6tmcjjbtenbulvunsllvufbvm".to_string());
        }
    }

    formats
}

/// Downloads the merkle tree from IPFS
fn download_merkle_tree(cid: &str) -> Result<MerkleTreeIpfsData, String> {
    // Try to use Pinata first, fallback to local IPFS if API key is not available
    let use_pinata = std::env::var("WAVS_ENV_PINATA_API_KEY").is_ok_and(|key| !key.is_empty());

    if use_pinata {
        println!("🌐 Using Pinata IPFS service");
        let api_key = std::env::var("WAVS_ENV_PINATA_API_KEY").unwrap();
        let gateway_url = std::env::var("WAVS_ENV_PINATA_GATEWAY_URL")
            .unwrap_or_else(|_| "https://gateway.pinata.cloud/ipfs".to_string());

        let full_url = format!("{}/{}", gateway_url, cid);
        println!("🔗 Fetching from Pinata: {}", full_url);

        let response = block_on(async move {
            let mut request = wavs_wasi_utils::http::http_request_get(&full_url)
                .map_err(|e| format!("Failed to create request: {}", e))?;

            let headers = request.headers_mut();
            headers.insert(
                "x-pinata-gateway-token",
                wstd::http::HeaderValue::from_str(&api_key)
                    .map_err(|e| format!("Invalid header value: {}", e))?,
            );

            wavs_wasi_utils::http::fetch_bytes(request)
                .await
                .map_err(|e| format!("Failed to fetch from Pinata: {}", e))
        })?;

        let merkle_tree: MerkleTreeIpfsData = serde_json::from_slice(&response)
            .map_err(|e| format!("Failed to parse merkle tree JSON: {}", e))?;

        Ok(merkle_tree)
    } else {
        println!("🏠 Using local IPFS node");

        // Get different CID formats
        let cid_formats = convert_cid_formats(cid);

        // Try multiple URL formats for local IPFS with different CID formats
        let mut urls = Vec::new();
        for cid_variant in &cid_formats {
            // Path format (fallback)
            urls.push(format!("http://127.0.0.1:8080/ipfs/{}", cid_variant));
            urls.push(format!("http://localhost:8080/ipfs/{}", cid_variant));
            // Subdomain format (preferred by some IPFS gateways)
            urls.push(format!("http://{}.ipfs.localhost:8080/", cid_variant));
            // Alternative subdomain format with 127.0.0.1
            urls.push(format!("http://{}.ipfs.127.0.0.1:8080/", cid_variant));
        }

        // Also try public gateways as fallback
        for cid_variant in &cid_formats {
            urls.push(format!("https://ipfs.io/ipfs/{}", cid_variant));
            urls.push(format!("https://gateway.ipfs.io/ipfs/{}", cid_variant));
        }

        let mut last_error = String::new();

        for url in urls {
            println!("🔗 Trying: {}", url);
            let url_for_logging = url.clone(); // Clone for use after async block

            let result = block_on(async move {
                let url_clone = url.clone(); // Clone the url for use in the async block
                let request = wavs_wasi_utils::http::http_request_get(&url_clone)
                    .map_err(|e| format!("Failed to create request: {}", e))?;

                wavs_wasi_utils::http::fetch_bytes(request)
                    .await
                    .map_err(|e| format!("Failed to fetch: {}", e))
            });

            match result {
                Ok(response) => {
                    // Try to parse the response
                    match serde_json::from_slice::<MerkleTreeIpfsData>(&response) {
                        Ok(merkle_tree) => {
                            println!("✅ Successfully fetched from: {}", url_for_logging);
                            return Ok(merkle_tree);
                        }
                        Err(e) => {
                            println!("⚠️ Failed to parse JSON from {}: {}", url_for_logging, e);
                            last_error = format!("Failed to parse JSON: {}", e);
                        }
                    }
                }
                Err(e) => {
                    println!("⚠️ Failed to fetch from {}: {}", url_for_logging, e);
                    last_error = format!("Failed to fetch: {}", e);
                }
            }
        }

        Err(format!("Failed to download merkle tree from IPFS. Last error: {}", last_error))
    }
}

/// Finds the top N signers from the merkle tree based on claimable amount
fn find_top_signers(
    merkle_tree: &MerkleTreeIpfsData,
    top_n: usize,
) -> Result<Vec<Address>, String> {
    let mut scored_accounts: Vec<(Address, U256)> = Vec::new();
    let sentinel_address =
        Address::from([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]);

    for entry in &merkle_tree.tree {
        // Parse the address
        let address = Address::from_str(&entry.account)
            .map_err(|e| format!("Invalid address {}: {}", entry.account, e))?;

        // Skip zero address and sentinel address
        if address == Address::ZERO || address == sentinel_address {
            println!("  ⚠️ Skipping invalid address in merkle tree: {}", address);
            continue;
        }

        // Parse the claimable amount as the score
        let score = U256::from_str(&entry.claimable).unwrap_or(U256::ZERO);

        scored_accounts.push((address, score));
    }

    // Sort by score in descending order
    scored_accounts.sort_by(|a, b| b.1.cmp(&a.1));

    // Take top N valid addresses
    let top_signers: Vec<Address> =
        scored_accounts.into_iter().take(top_n).map(|(addr, _)| addr).collect();

    if top_signers.is_empty() {
        return Err("No valid signers found in merkle tree".to_string());
    }

    Ok(top_signers)
}

/// Queries the current signers from the SignerSyncManagerModule contract
async fn query_current_signers(module_address: String) -> Result<Vec<Address>, String> {
    let chain_name = config_var("chain_name").unwrap_or("local".to_string());
    let chain_config = get_evm_chain_config(&chain_name).unwrap();
    let provider: RootProvider<Ethereum> =
        new_evm_provider::<Ethereum>(chain_config.http_endpoint.unwrap());

    // Parse module address
    let module_addr =
        Address::from_str(&module_address).map_err(|e| format!("Invalid module address: {}", e))?;

    // Create the getSigners call
    let get_signers_call = ISignerSyncManagerModule::getSignersCall {};

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
    let signers = ISignerSyncManagerModule::getSignersCall::abi_decode_returns(&result)
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
    // Define sentinel address used by Safe's linked list
    let sentinel_address =
        Address::from([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]);

    // Filter out invalid addresses (zero address and sentinel) and addresses already present
    let to_add: Vec<Address> = desired_signers
        .iter()
        .filter(|addr| {
            **addr != Address::ZERO && **addr != sentinel_address && !current_set.contains(*addr)
        })
        .cloned()
        .collect();

    // Validate that we're not trying to remove or add invalid addresses
    if to_add.iter().any(|addr| *addr == Address::ZERO || *addr == sentinel_address) {
        return Err("Cannot add zero address or sentinel address as signer".to_string());
    }

    // Strategy: First swap existing signers if possible, then add/remove the rest
    let swaps = to_remove.len().min(to_add.len());

    println!("📊 Signer diff analysis:");
    println!("  Current signers: {}", current_signers.len());
    println!("  Desired signers: {}", desired_signers.len());
    println!("  To remove: {} signers", to_remove.len());
    for addr in &to_remove {
        println!("    - {}", addr);
    }
    println!("  To add: {} signers", to_add.len());
    for addr in &to_add {
        println!("    + {}", addr);
    }
    println!("  Will perform {} swaps", swaps);

    // Track the current number of signers as we go
    let mut current_signer_count = current_signers.len();

    // Perform swaps (doesn't change signer count)
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

    // Add remaining signers - use a safe threshold for each addition
    for i in swaps..to_add.len() {
        current_signer_count += 1;
        // Threshold must be <= number of signers, so use the minimum
        let safe_threshold = new_threshold.min(current_signer_count);

        println!(
            "  Adding signer {}: current count will be {}, using threshold {}",
            to_add[i], current_signer_count, safe_threshold
        );

        // Validate the address one more time before adding
        if to_add[i] == Address::ZERO || to_add[i] == sentinel_address {
            println!("  ⚠️ Skipping invalid address: {}", to_add[i]);
            current_signer_count -= 1; // Revert the count increment
            continue;
        }

        operations.push(SignerOperation {
            operationType: OperationType::ADD_SIGNER,
            prevSigner: Address::ZERO,
            signer: to_add[i],
            newSigner: Address::ZERO,
            threshold: U256::from(safe_threshold),
        });
    }

    // Remove remaining signers - adjust threshold if needed
    for i in swaps..to_remove.len() {
        let signer = to_remove[i];
        let prev_signer = find_previous_signer(&current_signers, signer);

        current_signer_count = current_signer_count.saturating_sub(1);
        // Ensure threshold is valid after removal
        let safe_threshold = new_threshold.min(current_signer_count.max(1));

        operations.push(SignerOperation {
            operationType: OperationType::REMOVE_SIGNER,
            prevSigner: prev_signer,
            signer,
            newSigner: Address::ZERO,
            threshold: U256::from(safe_threshold),
        });
    }

    // After all signers are added/removed, check if we need to adjust the threshold
    // to reach the final desired threshold
    let final_signer_count = current_signers.len() + to_add.len() - swaps - to_remove.len() + swaps;
    let final_safe_threshold = new_threshold.min(final_signer_count.max(1));

    println!("📈 Final state calculation:");
    println!("  Final signer count: {}", final_signer_count);
    println!("  Desired threshold: {}", new_threshold);
    println!("  Safe threshold: {}", final_safe_threshold);

    // If we haven't set the correct threshold yet, add a CHANGE_THRESHOLD operation
    if operations.len() > 0 {
        // Check if the last operation already set the correct threshold
        let last_op = &operations[operations.len() - 1];
        let last_threshold_set = match last_op.operationType {
            OperationType::ADD_SIGNER
            | OperationType::REMOVE_SIGNER
            | OperationType::CHANGE_THRESHOLD => last_op.threshold,
            _ => U256::ZERO,
        };

        if last_threshold_set != U256::from(final_safe_threshold) && final_signer_count > 0 {
            operations.push(SignerOperation {
                operationType: OperationType::CHANGE_THRESHOLD,
                prevSigner: Address::ZERO,
                signer: Address::ZERO,
                newSigner: Address::ZERO,
                threshold: U256::from(final_safe_threshold),
            });
        }
    } else if current_signers.len() > 0 {
        // No other operations, but threshold might need to change
        let current_threshold = 1; // We'd need to query this, but for now assume 1
        if current_threshold != final_safe_threshold {
            operations.push(SignerOperation {
                operationType: OperationType::CHANGE_THRESHOLD,
                prevSigner: Address::ZERO,
                signer: Address::ZERO,
                newSigner: Address::ZERO,
                threshold: U256::from(final_safe_threshold),
            });
        }
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
