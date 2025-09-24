pub mod bindings;

use crate::bindings::{export, Guest, TriggerAction, WasmResponse};
use alloy_primitives::{FixedBytes, U256};
use alloy_provider::Provider;
use alloy_sol_types::SolValue;
use wstd::runtime::block_on;

struct Component;
export!(Component with_types_in bindings);

impl Guest for Component {
    fn run(action: TriggerAction) -> std::result::Result<Option<WasmResponse>, String> {
        let current_time = block_on(async move { action.execution_timestamp_seconds().await })?;
        let payload = solidity::MerklerAvsOutput {
            // Expire in 5 minutes.
            expiresAt: U256::from(current_time + 5 * 60),
            prune: U256::from(100),
            root: FixedBytes::<32>::ZERO,
            ipfsHash: FixedBytes::<32>::ZERO,
            ipfsHashCid: String::new(),
        };
        Ok(Some(WasmResponse { payload: payload.abi_encode().into(), ordering: None }))
    }
}

pub mod solidity {
    use alloy_sol_macro::sol;
    pub use IMerkler::*;
    sol!("../../src/interfaces/merkle/IMerkler.sol");
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
