#[allow(warnings)]
mod bindings;
mod solidity;
mod transformers;
mod trigger;

use crate::bindings::{export, Guest, TriggerAction, WasmResponse};
use crate::solidity::{IndexOperation, IndexingPayload};
use crate::transformers::TransformerRegistry;
use crate::trigger::{decode_trigger_event, encode_indexing_output, Destination};

use anyhow::Result;
use serde_json;
use wstd::runtime::block_on;

struct Component;
export!(Component with_types_in bindings);

impl Guest for Component {
    fn run(action: TriggerAction) -> std::result::Result<Option<WasmResponse>, String> {
        println!("Universal Indexer: Processing trigger action");

        // Decode the trigger event
        let (event_data, dest) = decode_trigger_event(action.data)
            .map_err(|e| format!("Failed to decode trigger event: {}", e))?;

        println!(
            "Universal Indexer: Event from contract {}: {:?}",
            event_data.contract_address, event_data
        );

        // Transform the event using appropriate transformer
        let transformed_events = block_on(async move { process_event(event_data).await })
            .map_err(|e| format!("Failed to process event: {}", e))?;

        println!("Universal Indexer: Transformed {} events", transformed_events.len());

        // Create indexing payload
        let payload =
            IndexingPayload { operation: IndexOperation::ADD, events: transformed_events };

        // Encode output based on destination
        let output = match dest {
            Destination::Ethereum => Some(encode_indexing_output(payload)),
            Destination::CliOutput => {
                let serialized = serde_json::to_vec(&payload)
                    .map_err(|e| format!("Failed to serialize payload: {}", e))?;
                Some(WasmResponse { payload: serialized.into(), ordering: None })
            }
        };

        println!("Universal Indexer: Successfully processed and encoded output");
        Ok(output)
    }
}

/// Process a single event by routing to the appropriate transformer
async fn process_event(
    event_data: crate::trigger::EventData,
) -> Result<Vec<crate::solidity::UniversalEvent>, String> {
    // Get the appropriate transformer for this event
    // Convert Vec<u8> to FixedBytes<32> for event signature
    let event_signature = if event_data.log.topics.is_empty() {
        return Err("No topics in event log".to_string());
    } else {
        let mut signature = [0u8; 32];
        let topic_len = event_data.log.topics[0].len().min(32);
        signature[..topic_len].copy_from_slice(&event_data.log.topics[0][..topic_len]);
        alloy_primitives::FixedBytes::from(signature)
    };

    TransformerRegistry::all()
        .transform_event(&event_signature, event_data)
        .await
        .map_err(|e| format!("Failed to transform event: {}", e))
}
