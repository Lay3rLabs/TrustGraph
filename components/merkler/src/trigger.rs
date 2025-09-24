use crate::{bindings::TriggerAction, solidity};
use alloy_provider::Provider;
use alloy_sol_types::SolValue;
use anyhow::Result;
use wavs_wasi_utils::evm::alloy_primitives::U256;

pub async fn encode_trigger_output(
    action: &TriggerAction,
    root: &[u8],
    ipfs_hash: &[u8],
    ipfs_hash_cid: String,
) -> Result<Vec<u8>, String> {
    let root = serde_json::from_value(root.into()).map_err(|e| e.to_string())?;
    let ipfs_hash = serde_json::from_value(ipfs_hash.into()).map_err(|e| e.to_string())?;

    // Expire in 5 minutes.
    let expires_at = U256::from(action.execution_timestamp_seconds().await? + 5 * 60);

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
    /// Get the timestamp in seconds since Unix epoch that this component is executing at.
    pub async fn execution_timestamp_seconds(&self) -> Result<u64, String> {
        let (chain, block_number) = match &self.data {
            crate::bindings::wavs::types::events::TriggerData::EvmContractEvent(
                crate::bindings::wavs::types::events::TriggerDataEvmContractEvent {
                    chain,
                    log:
                        crate::bindings::wavs::types::events::EvmEventLog {
                            block_number,
                            block_timestamp,
                            ..
                        },
                    ..
                },
            ) => {
                if let Some(block_timestamp) = block_timestamp {
                    return Ok(*block_timestamp);
                }

                (chain, *block_number)
            }
            crate::bindings::wavs::types::events::TriggerData::BlockInterval(
                crate::bindings::wavs::types::events::TriggerDataBlockInterval {
                    chain,
                    block_height,
                },
            ) => (chain, *block_height),
            crate::bindings::wavs::types::events::TriggerData::Cron(
                crate::bindings::wavs::types::events::TriggerDataCron { trigger_time },
            ) => return Ok(trigger_time.nanos / 1_000_000_000),

            // for CLI-based triggers, system time is fine
            crate::bindings::wavs::types::events::TriggerData::Raw(_) => {
                return Ok(std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs())
            }

            _ => return Err("Unsupported trigger type".to_string()),
        };

        let chain_config = crate::bindings::host::get_evm_chain_config(chain)
            .ok_or_else(|| format!("Failed to get chain config for {chain}"))?;
        let provider = wavs_wasi_utils::evm::new_evm_provider::<alloy_network::Ethereum>(
            chain_config
                .http_endpoint
                .ok_or_else(|| format!("Failed to get HTTP endpoint for {chain}"))?,
        );
        let block = provider
            .get_block(alloy_rpc_types::BlockId::Number(alloy_rpc_types::BlockNumberOrTag::Number(
                block_number,
            )))
            .await
            .map_err(|e| format!("Failed to get block {block_number}: {e}"))?
            .ok_or_else(|| format!("Block {block_number} not found"))?;

        Ok(block.header.timestamp)
    }
}
