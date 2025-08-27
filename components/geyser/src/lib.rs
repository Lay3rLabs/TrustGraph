pub mod bindings;
mod ipfs;
pub mod service_parser;
mod trigger;

use crate::bindings::{export, host, Guest, TriggerAction};
use alloy_network::Ethereum;
use alloy_provider::{Provider, RootProvider};
use alloy_rpc_types::{TransactionInput, TransactionRequest};
use alloy_sol_types::SolCall;
use bindings::{host::get_evm_chain_config, WasmResponse};
use serde_json;
use trigger::decode_trigger_event;
use uuid::Uuid;
use wavs_types::WorkflowID;
use wavs_wasi_utils::evm::{alloy_primitives::Address, new_evm_provider};
use wstd::runtime::block_on;

struct Component;
export!(Component with_types_in bindings);

impl Guest for Component {
    fn run(action: TriggerAction) -> std::result::Result<Option<WasmResponse>, String> {
        println!("🚀 Starting geyser component execution");

        let service = host::get_service();

        // Try to use Pinata first, fallback to local IPFS if API key is not available or empty
        let (ipfs_gateway, ipfs_api_key) = match std::env::var("WAVS_ENV_PINATA_API_KEY") {
            Ok(api_key) if !api_key.is_empty() => {
                let url = std::env::var("WAVS_ENV_PINATA_API_URL")
                    .unwrap_or_else(|_| "https://uploads.pinata.cloud/v3/files".to_string());
                println!("🌐 Using Pinata IPFS service");
                (url, Some(api_key))
            }
            _ => {
                println!("🏠 Pinata API key not found or empty, using local IPFS node");
                ("http://localhost:5001/api/v0".to_string(), None)
            }
        };

        let (evm_address, chain_name) = match service.service.manager {
            bindings::wavs::types::service::ServiceManager::Evm(evm_manager) => {
                let address = Address::from_slice(&evm_manager.address.raw_bytes);
                (address, evm_manager.chain_name)
            }
            _ => return Err("Service manager is not of type EVM".to_string()),
        };
        println!("🏛️  Service Manager EVM Address: {:?} (chain: {})", evm_address, chain_name);

        // user_input is a JSON string which is passed in as a workflow
        let (user_input, block_height, dest) =
            decode_trigger_event(action.data).map_err(|e| e.to_string())?;
        println!("🔧 User Input: {:?}", user_input);

        let new_workflow_id: String =
            generate_deterministic_uuid(&user_input, block_height).to_string();
        println!("🆔 Generated new workflow ID: {}", new_workflow_id);

        // Process the workflow based on destination
        block_on(async move {
            process_workflow(
                dest,
                user_input,
                new_workflow_id,
                service.service_id,
                ipfs_gateway,
                ipfs_api_key,
                evm_address,
                chain_name,
            )
            .await
        })
    }
}

/// Unified workflow processing function for both Ethereum and CliOutput destinations
async fn process_workflow(
    dest: trigger::Destination,
    user_input: String,
    new_workflow_id: String,
    service_id: String,
    ipfs_gateway: String,
    ipfs_api_key: Option<String>,
    evm_address: Address,
    chain_name: String,
) -> Result<Option<WasmResponse>, String> {
    // Get the current service JSON and workflow JSON
    let (current_service_json, workflow_json) = match dest {
        trigger::Destination::Ethereum => {
            println!("🌐 Trigger source: Ethereum event");

            // Fetch current IPFS JSON from contract
            println!("🔍 Fetching current IPFS JSON...");
            let provider = create_provider(&chain_name).await?;
            let service_uri_call = solidity::getServiceURICall {};
            let result =
                execute_call(&provider, evm_address, service_uri_call.abi_encode()).await?;

            let ipfs_uri = solidity::getServiceURICall::abi_decode_returns(&result)
                .map_err(|e| format!("Failed to decode contract call result: {}", e))?;
            println!("✅ Successfully called contract at {:?}", evm_address);

            let ipfs_cid = ipfs_uri.split("ipfs://").last().unwrap();
            println!("📡 Fetched IPFS ipfs_cid from contract: {}", ipfs_cid);

            // Download the service JSON from IPFS
            let service_json: service_parser::ServiceJson =
                ipfs::download_json_from_ipfs(&ipfs_cid, &ipfs_gateway)
                    .await
                    .map_err(|e| format!("❌ Failed to fetch or parse IPFS JSON data: {}", e))?;

            println!("🛠️  Parsed service JSON: {:?}", service_json);

            // Parse the user_input as workflow JSON
            let workflow_json: service_parser::WorkflowJson =
                serde_json::from_str(&user_input).map_err(|e| e.to_string())?;
            println!("🧩 Parsed workflow JSON: {:?}", workflow_json);

            (service_json, workflow_json)
        }
        trigger::Destination::CliOutput => {
            println!("🖥️  Trigger source: CLI output");

            // Clean and parse CLI input
            let user_input = user_input.replace("\0", "");
            let parts: Vec<&str> = user_input.split("___").collect();
            if parts.len() != 2 {
                return Err("Invalid CLI input format, expected 'CID___WORKFLOW_JSON'".to_string());
            }

            let cid_part = parts[0];
            let workflow_json_str = parts[1];

            // Extract IPFS CID
            let i = cid_part.find("Qm").ok_or("Invalid IPFS CID in user input")?;
            let ipfs_cid = &cid_part[i..].trim_end_matches('\0').trim();
            println!("🔍 Extracted IPFS CID from user input: {}", ipfs_cid);

            // Download the service JSON from IPFS
            let service_json = ipfs::download_json_from_ipfs(&ipfs_cid, &ipfs_gateway)
                .await
                .map_err(|e| e.to_string())?;

            println!("{:#}", serde_json::to_string_pretty(&service_json).unwrap());

            // Parse the workflow JSON
            let workflow_json: service_parser::WorkflowJson =
                serde_json::from_str(&workflow_json_str).map_err(|e| e.to_string())?;
            println!("🧩 Parsed workflow JSON: {:?}", workflow_json);

            (service_json, workflow_json)
        }
    };

    // Update service JSON with new workflow
    let mut updated_service_json = current_service_json;
    updated_service_json
        .workflows
        .insert(WorkflowID::new(new_workflow_id.clone()).unwrap(), workflow_json);
    println!("🆕 Updated service JSON with new workflow: {:?}", updated_service_json);

    // Serialize updated service JSON
    let updated_service_json_str =
        serde_json::to_string(&updated_service_json).map_err(|e| e.to_string())?;

    // Upload to IPFS
    println!("📤 Uploading updated service JSON to IPFS...");
    let cid = ipfs::upload_json_to_ipfs(
        &updated_service_json_str,
        &format!("service_{}.json", service_id),
        format!("{}/add", ipfs_gateway).as_str(),
        ipfs_api_key.as_deref(),
    )
    .await
    .map_err(|e| format!("Failed to upload IPFS: {}", e))?;

    println!("✅ Successfully uploaded to IPFS with CID: {}", cid);
    let ipfs_uri = format!("ipfs://{}", cid);
    println!("🔗 IPFS URI: {}", ipfs_uri);

    // Return response based on destination
    match dest {
        trigger::Destination::Ethereum => {
            let ipfs_hash = cid.hash().digest();
            println!("🔗 IPFS Hash (digest): {:?}", ipfs_hash);
            Ok(Some(WasmResponse { payload: ipfs_uri.into_bytes(), ordering: None }))
        }
        trigger::Destination::CliOutput => Ok(None),
    }
}

/// Creates a provider instance for EVM queries
async fn create_provider(chain_name: &str) -> Result<RootProvider<Ethereum>, String> {
    let chain_config = get_evm_chain_config(chain_name)
        .ok_or(format!("Failed to get chain config for {}", chain_name))?;

    let provider = new_evm_provider::<Ethereum>(
        chain_config.http_endpoint.ok_or("No HTTP endpoint configured")?,
    );

    Ok(provider)
}

/// Executes a contract call and returns the result
async fn execute_call(
    provider: &RootProvider<Ethereum>,
    contract_address: Address,
    call_data: Vec<u8>,
) -> Result<Vec<u8>, String> {
    let tx_request = TransactionRequest {
        to: Some(contract_address.into()),
        input: TransactionInput::new(call_data.into()),
        ..Default::default()
    };

    provider
        .call(tx_request)
        .await
        .map(|result| result.to_vec())
        .map_err(|e| format!("Contract call failed: {}", e))
}

pub mod solidity {
    use alloy_sol_macro::sol;
    pub use ITypes::*;

    sol!("../../src/interfaces/ITypes.sol");

    sol! {
        function getServiceURI() external view returns (string memory);
    }
}

// blockheight makes sure that the same config 2 times at different blocks does not break it
pub fn generate_deterministic_uuid(text: &str, block_height: u64) -> Uuid {
    let input = block_height.to_string() + text;
    Uuid::new_v5(&Uuid::NAMESPACE_X500, input.as_bytes())
}
