use super::{utils, EventTransformer};
use crate::register_transformer;
use crate::trigger::EventData;
use crate::{bindings::host::get_evm_chain_config, solidity::IndexingPayload};
use alloy_primitives::{FixedBytes, U256};
use alloy_sol_types::SolEvent;
use anyhow::Result;
use wavs_wasi_utils::decode_event_log_data;

use crate::solidity::{IndexedEvent, Interaction};

pub struct InteractionTransformer;
register_transformer!(InteractionTransformer);

impl EventTransformer for InteractionTransformer {
    fn name() -> &'static str {
        "InteractionTransformer"
    }

    fn supports_event(event_signature: &FixedBytes<32>) -> bool {
        *event_signature == Interaction::SIGNATURE_HASH
    }

    async fn transform(_: FixedBytes<32>, event_data: EventData) -> Result<IndexingPayload> {
        // Decode the Interaction event
        let interaction: Interaction = decode_event_log_data!(event_data.log)?;

        println!(
            "Transforming Interaction event: address={}, interactionType={}, tags={:?}, data={}",
            interaction.addr, interaction.interactionType, interaction.tags, interaction.data
        );

        let chain = get_evm_chain_config(&event_data.chain).unwrap();

        let mut tags = vec![format!("type:{}", interaction.interactionType)];
        tags.extend(interaction.tags);

        // Create IndexedEvent
        let indexed_event = IndexedEvent {
            eventId: FixedBytes::ZERO,
            chainId: chain.chain_id,
            relevantContract: event_data.contract_address,
            blockNumber: U256::from(event_data.block_number),
            timestamp: utils::get_current_timestamp(),
            eventType: "interaction".to_string(),
            tags,
            relevantAddresses: vec![interaction.addr],
            data: interaction.data,
            metadata: Vec::new().into(),
            deleted: false,
        };

        Ok(IndexingPayload { toAdd: vec![indexed_event], toDelete: Vec::new() })
    }
}
