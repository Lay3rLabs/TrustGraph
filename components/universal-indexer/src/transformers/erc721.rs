use super::{utils, EventTransformer, TransformResult};
use crate::trigger::EventData;
use crate::{register_transformer, solidity::UniversalEvent};
use alloy_primitives::{keccak256, Address, FixedBytes, U256};
use alloy_sol_types::SolValue;
use anyhow::Result;

pub struct ERC721Transformer;
register_transformer!(ERC721Transformer);

impl EventTransformer for ERC721Transformer {
    fn supports_event(event_signature: &FixedBytes<32>) -> bool {
        *event_signature == keccak256("Transfer(address,address,uint256)")
    }

    async fn transform(
        event_signature: &FixedBytes<32>,
        event_data: EventData,
    ) -> Result<TransformResult> {
        // Check if this is an NFT transfer (3 indexed topics + event signature = 4 topics total)
        if event_data.log.topics.len() == 4 {
            let from = utils::topic_to_address(&event_data.log.topics[1]);
            let to = utils::topic_to_address(&event_data.log.topics[2]);
            let token_id = utils::topic_to_u256(&event_data.log.topics[3]);

            println!("Transforming NFT Transfer: from={}, to={}, tokenId={}", from, to, token_id);

            let mut tags = vec![
                "nft".to_string(),
                "transfer".to_string(),
                format!("collection:{}", event_data.contract_address),
            ];

            // Add special tags for minting/burning
            if from == Address::ZERO {
                tags.push("mint".to_string());
            } else if to == Address::ZERO {
                tags.push("burn".to_string());
            }

            let chain = get_evm_chain_config(&event_data.chain_name).unwrap();

            let universal_event = UniversalEvent {
                eventId: FixedBytes::ZERO,
                chainId: chain.chain_id,
                sourceContract: event_data.contract_address,
                eventType: keccak256("Transfer(address,address,uint256)"),
                eventData: (from, to, token_id).abi_encode().into(),
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
                data: format!("tokenId:{}", token_id).as_bytes().to_vec().into(),
                metadata: Vec::new().into(),
            };

            Ok(TransformResult::Single(universal_event))
        } else if event_data.log.topics.len() == 3 && !event_data.log.data.is_empty() {
            Err(anyhow::anyhow!("This appears to be an ERC20 transfer, not ERC721"))
        } else {
            Err(anyhow::anyhow!("Invalid Transfer event format"))
        }
    }

    fn name() -> &'static str {
        "ERC721Transformer"
    }
}
