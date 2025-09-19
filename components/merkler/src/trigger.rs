use crate::{
    bindings::{
        host::get_evm_chain_config,
        wavs::types::events::{
            EvmEventLog, TriggerData, TriggerDataBlockInterval, TriggerDataEvmContractEvent,
        },
        TriggerAction,
    },
    solidity,
};
use alloy_network::Ethereum;
use alloy_provider::Provider;
use alloy_rpc_types::{BlockId, BlockNumberOrTag};
use alloy_sol_types::SolValue;
use anyhow::Result;
use wavs_wasi_utils::evm::{alloy_primitives::U256, new_evm_provider};

pub async fn encode_trigger_output(
    action: &TriggerAction,
    root: &[u8],
    ipfs_hash: &[u8],
    ipfs_hash_cid: String,
) -> Result<Vec<u8>, String> {
    let root = serde_json::from_value(root.into()).map_err(|e| e.to_string())?;
    let ipfs_hash = serde_json::from_value(ipfs_hash.into()).map_err(|e| e.to_string())?;

    // Expire in 5 minutes.
    let current_block_timestamp = action.get_block_timestamp().await?;
    let expires_at = U256::from(current_block_timestamp + 5 * 60);

    Ok(solidity::MerklerAvsOutput {
        expiresAt: expires_at,
        prune: U256::ZERO,
        root,
        ipfsHash: ipfs_hash,
        ipfsHashCid: ipfs_hash_cid,
    }
    .abi_encode())
}

impl TriggerAction {
    async fn get_block_timestamp(&self) -> Result<u64, String> {
        match &self.data {
            TriggerData::EvmContractEvent(TriggerDataEvmContractEvent {
                log: EvmEventLog { block_timestamp, .. },
                ..
            }) => Ok(*block_timestamp),
            TriggerData::BlockInterval(TriggerDataBlockInterval { chain, block_height }) => {
                let chain_config = get_evm_chain_config(chain)
                    .ok_or_else(|| format!("Failed to get chain config for {chain}"))?;
                let provider = new_evm_provider::<Ethereum>(
                    chain_config
                        .http_endpoint
                        .ok_or_else(|| format!("Failed to get HTTP endpoint for {chain}"))?,
                );
                let block = provider
                    .get_block(BlockId::Number(BlockNumberOrTag::Number(*block_height)))
                    .await
                    .map_err(|e| format!("Failed to get block {block_height}: {e}"))?
                    .ok_or_else(|| format!("Block {block_height} not found"))?;
                Ok(block.header.timestamp)
            }
            _ => Err("Unsupported trigger type".to_string()),
        }
    }
}
