use super::{utils, EventTransformer, TransformResult};
use crate::register_transformer;
use crate::solidity::{NewTrigger, UniversalEvent, UpdateService};
use crate::trigger::EventData;
use alloy_primitives::{keccak256, FixedBytes, U256};
use alloy_sol_types::SolValue;
use anyhow::Result;
use wavs_wasi_utils::decode_event_log_data;

pub struct CustomEventTransformer;
register_transformer!(CustomEventTransformer);

impl EventTransformer for CustomEventTransformer {
    fn name() -> &'static str {
        "CustomEventTransformer"
    }

    fn supports_event(event_signature: &FixedBytes<32>) -> bool {
        *event_signature == keccak256("NewTrigger(bytes)")
            || *event_signature == keccak256("UpdateService(string)")
    }

    async fn transform(event_data: EventData) -> Result<TransformResult> {
        if event_data.log.topics.is_empty() {
            return Err(anyhow::anyhow!("No topics in event log"));
        }

        let event_signature = utils::vec_to_fixed_bytes32(&event_data.log.topics[0]);

        if event_signature == keccak256("NewTrigger(bytes)") {
            Self::transform_new_trigger(event_data)
        } else if event_signature == keccak256("UpdateService(string)") {
            Self::transform_update_service(event_data)
        } else {
            Err(anyhow::anyhow!("Unsupported custom event"))
        }
    }
}

impl CustomEventTransformer {
    fn transform_new_trigger(event_data: EventData) -> Result<TransformResult> {
        let new_trigger: NewTrigger = decode_event_log_data!(event_data.log)?;

        println!(
            "Transforming NewTrigger event with data length: {}",
            new_trigger._triggerInfo.len()
        );

        let universal_event = UniversalEvent {
            eventId: FixedBytes::ZERO,
            sourceContract: event_data.contract_address,
            eventType: keccak256("NewTrigger(bytes)"),
            eventData: new_trigger._triggerInfo.abi_encode().into(),
            blockNumber: U256::from(event_data.block_number),
            timestamp: utils::get_current_timestamp(),
            tags: vec!["trigger".to_string(), "wavs".to_string(), "system".to_string()],
            relevantAddresses: vec![], // Could extract from trigger data if needed
            parentEvent: FixedBytes::ZERO,
            data: Vec::new().into(),
            metadata: Vec::new().into(),
        };

        Ok(TransformResult::Single(universal_event))
    }

    fn transform_update_service(event_data: EventData) -> Result<TransformResult> {
        let update_service: UpdateService = decode_event_log_data!(event_data.log)?;

        println!(
            "Transforming UpdateService event with JSON length: {}",
            update_service.json.len()
        );

        let universal_event = UniversalEvent {
            eventId: FixedBytes::ZERO,
            sourceContract: event_data.contract_address,
            eventType: keccak256("UpdateService(string)"),
            eventData: update_service.json.abi_encode().into(),
            blockNumber: U256::from(event_data.block_number),
            timestamp: utils::get_current_timestamp(),
            tags: vec![
                "service".to_string(),
                "update".to_string(),
                "wavs".to_string(),
                "geyser".to_string(),
            ],
            relevantAddresses: vec![], // Could extract from service JSON if needed
            parentEvent: FixedBytes::ZERO,
            data: update_service.json.as_bytes().to_vec().into(),
            metadata: Vec::new().into(),
        };

        Ok(TransformResult::Single(universal_event))
    }
}
