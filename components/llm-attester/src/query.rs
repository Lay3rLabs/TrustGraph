use crate::bindings::host::get_evm_chain_config;
use alloy_network::Ethereum;
use alloy_primitives::{Address, FixedBytes};
use alloy_provider::Provider;
use alloy_rpc_types::TransactionInput;
use alloy_sol_types::{sol, SolCall};
use std::str::FromStr;
use wavs_wasi_utils::evm::{alloy_primitives::TxKind, new_evm_provider};

// Solidity interface definitions for EAS
sol! {
    /// EAS Attestation structure
    struct AttestationStruct {
        bytes32 uid;
        bytes32 schema;
        uint64 time;
        uint64 expirationTime;
        uint64 revocationTime;
        bytes32 refUID;
        address recipient;
        address attester;
        bool revocable;
        bytes data;
    }

    /// EAS contract interface
    interface IEAS {
        function getAttestation(bytes32 uid) external view returns (AttestationStruct memory);
    }
}

/// Query an attestation from the EAS contract
///
/// # Arguments
/// * `eas_address` - The address of the EAS contract
/// * `attestation_uid` - The UID of the attestation to query
/// * `chain_name` - The name of the chain to query on
///
/// # Returns
/// The attestation data if found, or an error message
pub async fn query_attestation(
    eas_address: &str,
    attestation_uid: FixedBytes<32>,
    chain_name: &str,
) -> Result<AttestationStruct, String> {
    // Get chain configuration
    let chain_config = get_evm_chain_config(chain_name)
        .ok_or_else(|| format!("Failed to get chain config for {}", chain_name))?;

    // Create provider for the chain
    let provider = new_evm_provider::<Ethereum>(
        chain_config.http_endpoint.ok_or_else(|| "No HTTP endpoint configured".to_string())?,
    );

    // Parse EAS contract address
    let eas_addr =
        Address::from_str(eas_address).map_err(|e| format!("Invalid EAS address: {}", e))?;

    // Prepare the getAttestation call
    let call = IEAS::getAttestationCall { uid: attestation_uid };

    // Create transaction request
    let tx = alloy_rpc_types::eth::TransactionRequest {
        to: Some(TxKind::Call(eas_addr)),
        input: TransactionInput { input: Some(call.abi_encode().into()), data: None },
        ..Default::default()
    };

    // Execute the call
    let result =
        provider.call(tx).await.map_err(|e| format!("Failed to call EAS contract: {}", e))?;

    // Decode the result
    let decoded = IEAS::getAttestationCall::abi_decode_returns(&result)
        .map_err(|e| format!("Failed to decode attestation: {}", e))?;

    Ok(decoded)
}

/// Check if an attestation UID is valid (non-zero)
pub fn is_valid_uid(uid: &FixedBytes<32>) -> bool {
    *uid != FixedBytes::ZERO
}

/// Format attestation data for display
pub fn format_attestation_data(data: &[u8]) -> String {
    // Try to decode as UTF-8 string, otherwise return hex
    String::from_utf8(data.to_vec())
        .unwrap_or_else(|_| format!("0x{}", alloy_primitives::hex::encode(data)))
}

/// Log attestation details for debugging
pub fn log_attestation(attestation: &AttestationStruct) {
    println!("✅ Retrieved attestation:");
    println!("  - UID: {}", attestation.uid);
    println!("  - Schema: {}", attestation.schema);
    println!("  - Attester: {}", attestation.attester);
    println!("  - Recipient: {}", attestation.recipient);
    println!("  - Time: {}", attestation.time);
    println!("  - Expiration Time: {}", attestation.expirationTime);
    println!("  - Revocation Time: {}", attestation.revocationTime);
    println!("  - Ref UID: {}", attestation.refUID);
    println!("  - Revocable: {}", attestation.revocable);
    println!("  - Data length: {} bytes", attestation.data.len());
    println!("  - Data: {}", format_attestation_data(&attestation.data));
}

/// Default EAS addresses for common chains
pub mod defaults {
    /// EAS contract address on Base Sepolia
    pub const BASE_SEPOLIA_EAS: &str = "0x4200000000000000000000000000000000000021";

    /// EAS contract address on Base Mainnet
    pub const BASE_MAINNET_EAS: &str = "0x4200000000000000000000000000000000000021";

    /// EAS contract address on Ethereum Sepolia
    pub const ETHEREUM_SEPOLIA_EAS: &str = "0xC2679fBD37d54388Ce493F1DB75320D236e1815e";

    /// EAS contract address on Ethereum Mainnet
    pub const ETHEREUM_MAINNET_EAS: &str = "0xA1207F3BBa224E2c9c3c6D5aF63D0eb1582Ce587";

    /// EAS contract address on Optimism
    pub const OPTIMISM_EAS: &str = "0x4200000000000000000000000000000000000021";

    /// EAS contract address on Arbitrum One
    pub const ARBITRUM_ONE_EAS: &str = "0xbD75f629A22Dc1ceD33dDA0b68c546A1c035c458";

    /// Get default EAS address for a chain
    pub fn get_default_eas_address(chain_name: &str) -> Option<&'static str> {
        match chain_name.to_lowercase().as_str() {
            "base-sepolia" | "base_sepolia" => Some(BASE_SEPOLIA_EAS),
            "base" | "base-mainnet" | "base_mainnet" => Some(BASE_MAINNET_EAS),
            "sepolia" | "ethereum-sepolia" | "ethereum_sepolia" => Some(ETHEREUM_SEPOLIA_EAS),
            "mainnet" | "ethereum" | "ethereum-mainnet" => Some(ETHEREUM_MAINNET_EAS),
            "optimism" | "op" => Some(OPTIMISM_EAS),
            "arbitrum" | "arbitrum-one" | "arbitrum_one" => Some(ARBITRUM_ONE_EAS),
            _ => None,
        }
    }
}
