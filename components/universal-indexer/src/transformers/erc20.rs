use super::{utils, EventTransformer, TransformResult};
use crate::trigger::EventData;
use crate::{register_transformer, solidity::UniversalEvent};
use alloy_primitives::{keccak256, Address, FixedBytes, U256};
use alloy_sol_types::SolValue;
use anyhow::Result;

pub struct ERC20Transformer;
register_transformer!(ERC20Transformer);

impl EventTransformer for ERC20Transformer {
    fn name() -> &'static str {
        "ERC20Transformer"
    }

    fn supports_event(event_signature: &FixedBytes<32>) -> bool {
        *event_signature == keccak256("Transfer(address,address,uint256)")
    }

    async fn transform(event_data: EventData) -> Result<TransformResult> {
        // ERC20 Transfer has 3 topics (event signature + 2 indexed parameters)
        // vs ERC721 which has 4 topics (event signature + 3 indexed parameters)
        if event_data.log.topics.len() == 3 && !event_data.log.data.is_empty() {
            let from = utils::topic_to_address(&event_data.log.topics[1]);
            let to = utils::topic_to_address(&event_data.log.topics[2]);

            // Value is in the data field for ERC20
            let value = U256::abi_decode(&event_data.log.data)
                .map_err(|e| anyhow::anyhow!("Failed to decode ERC20 transfer value: {}", e))?;

            println!("Transforming ERC20 Transfer: from={}, to={}, value={}", from, to, value);

            let mut tags = vec![
                "erc20".to_string(),
                "transfer".to_string(),
                format!("token:{}", event_data.contract_address),
            ];

            // Add special tags for minting/burning
            if from == Address::ZERO {
                tags.push("mint".to_string());
            } else if to == Address::ZERO {
                tags.push("burn".to_string());
            }

            let universal_event = UniversalEvent {
                eventId: FixedBytes::ZERO,
                sourceContract: event_data.contract_address,
                eventType: keccak256("Transfer(address,address,uint256)"),
                eventData: (from, to, value).abi_encode().into(),
                blockNumber: U256::from(event_data.block_number),
                timestamp: utils::get_current_timestamp(),
                tags,
                relevantAddresses: if from == Address::ZERO {
                    vec![to] // Mint: only recipient
                } else if to == Address::ZERO {
                    vec![from] // Burn: only sender
                } else {
                    vec![from, to] // Transfer: both parties
                },
                parentEvent: FixedBytes::ZERO,
                data: format!("value:{}", value).as_bytes().to_vec().into(),
                metadata: Vec::new().into(),
            };

            Ok(TransformResult::Single(universal_event))
        } else {
            Err(anyhow::anyhow!("Invalid ERC20 Transfer event format"))
        }
    }
}
