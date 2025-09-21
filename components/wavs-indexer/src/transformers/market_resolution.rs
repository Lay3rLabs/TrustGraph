use super::EventTransformer;
use crate::register_transformer;
use crate::trigger::EventData;
use crate::{bindings::host::get_evm_chain_config, solidity::IndexingPayload};
use alloy_primitives::{FixedBytes, U256};
use alloy_sol_types::SolEvent;
use anyhow::Result;
use wavs_wasi_utils::decode_event_log_data;

use crate::solidity::{IndexedEvent, MarketResolved};

pub struct MarketResolutionTransformer;
register_transformer!(MarketResolutionTransformer);

impl EventTransformer for MarketResolutionTransformer {
    fn name() -> &'static str {
        "MarketResolutionTransformer"
    }

    fn supports_event(event_signature: &FixedBytes<32>) -> bool {
        *event_signature == MarketResolved::SIGNATURE_HASH
    }

    async fn transform(_: FixedBytes<32>, event_data: EventData) -> Result<IndexingPayload> {
        // Decode the MarketResolved event
        let market_resolved: MarketResolved = decode_event_log_data!(event_data.log)?;

        println!(
            "Transforming MarketResolved event: controller={}, lmsrMarketMaker={}, conditionalTokens={}, result={}, collateralAvailable={}",
            event_data.contract_address,
            market_resolved.lmsrMarketMaker,
            market_resolved.conditionalTokens,
            market_resolved.result,
            market_resolved.collateralAvailable
        );

        let chain = get_evm_chain_config(&event_data.chain).unwrap();

        let mut tags = vec![
            format!("marketMaker:{}", market_resolved.lmsrMarketMaker),
            format!("conditionalTokens:{}", market_resolved.conditionalTokens),
            format!("result:{}", market_resolved.result),
        ];

        if market_resolved.result {
            tags.push(format!("marketMaker:{}/success", market_resolved.lmsrMarketMaker));
        }

        // Create IndexedEvent
        let indexed_event = IndexedEvent {
            eventId: FixedBytes::ZERO,
            chainId: chain.chain_id,
            relevantContract: event_data.contract_address,
            blockNumber: U256::from(event_data.block_number),
            timestamp: event_data.block_timestamp as u128,
            eventType: "market_resolution".to_string(),
            tags,
            relevantAddresses: vec![],
            data: market_resolved.collateralAvailable.to_be_bytes_vec().into(),
            metadata: Vec::new().into(),
            deleted: false,
        };

        Ok(IndexingPayload { toAdd: vec![indexed_event], toDelete: Vec::new() })
    }
}
