pub mod attestation;
// pub mod custom;
// pub mod erc20;
// pub mod erc721;

use crate::solidity::UniversalEvent;
use crate::trigger::EventData;
use alloy_primitives::{Address, FixedBytes, U256};
use anyhow::Result;

/// Result of event transformation
pub enum TransformResult {
    Single(UniversalEvent),
    Multiple(Vec<UniversalEvent>),
}

/// Static transformer function type
pub type TransformerFn = fn(&FixedBytes<32>) -> bool;
pub type TransformFn =
    fn(
        FixedBytes<32>,
        EventData,
    ) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<TransformResult>>>>;

/// Transformer registration struct
pub struct StaticTransformer {
    pub supports_event: TransformerFn,
    pub transform: TransformFn,
    pub name: &'static str,
}

/// Factory for static transformers
pub struct TransformerFactory(pub fn() -> StaticTransformer);
inventory::collect!(TransformerFactory);

/// Trait for event transformers with static methods
pub trait EventTransformer {
    /// Check if the transformer supports an event signature.
    fn supports_event(event_signature: &FixedBytes<32>) -> bool;

    /// Transform an event into a UniversalEvent.
    async fn transform(
        event_signature: FixedBytes<32>,
        event_data: EventData,
    ) -> Result<TransformResult>;

    /// Get the transformer name for debugging
    fn name() -> &'static str;
}

/// Registry of static transformers
pub struct TransformerRegistry {
    transformers: Vec<StaticTransformer>,
}

impl TransformerRegistry {
    pub fn new() -> Self {
        Self { transformers: Vec::new() }
    }

    fn register(&mut self, transformer: StaticTransformer) {
        self.transformers.push(transformer);
    }

    pub async fn transform_event(
        &self,
        event_signature: &FixedBytes<32>,
        event_data: EventData,
    ) -> Result<Vec<UniversalEvent>> {
        let mut results = Vec::new();

        for transformer in &self.transformers {
            if (transformer.supports_event)(event_signature) {
                match (transformer.transform)(event_signature.clone(), event_data.clone()).await {
                    Ok(TransformResult::Single(event)) => results.push(event),
                    Ok(TransformResult::Multiple(events)) => results.extend(events),
                    Err(e) => println!("Transformer {} failed: {}", transformer.name, e),
                }
            }
        }

        if results.is_empty() {
            Err(anyhow::anyhow!("No transformer found for event signature: {}", event_signature))
        } else {
            Ok(results)
        }
    }

    /// Register all available transformers automatically.
    pub fn all() -> Self {
        let mut registry = Self::new();

        for transformer_factory in inventory::iter::<TransformerFactory> {
            registry.register(transformer_factory.0());
        }

        registry
    }
}

/// Fixed macro to register static transformers
#[macro_export]
macro_rules! register_transformer {
    ($transformer_type:ty) => {
        inventory::submit!($crate::transformers::TransformerFactory(|| {
            $crate::transformers::StaticTransformer {
                supports_event: <$transformer_type>::supports_event,
                transform: |event_signature, event_data| {
                    Box::pin(<$transformer_type>::transform(event_signature, event_data))
                },
                name: <$transformer_type>::name(),
            }
        }));
    };
}

/// Utility functions for transformers
pub mod utils {
    use super::*;

    /// Get current timestamp
    pub fn get_current_timestamp() -> U256 {
        U256::from(
            std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis(),
        )
    }

    /// Convert Vec<u8> to FixedBytes<32> for event signatures/topics
    pub fn vec_to_fixed_bytes32(data: &[u8]) -> FixedBytes<32> {
        let mut bytes = [0u8; 32];
        let len = data.len().min(32);
        bytes[..len].copy_from_slice(&data[..len]);
        FixedBytes::from(bytes)
    }

    /// Convert Vec<u8> topic to Address
    pub fn topic_to_address(topic: &[u8]) -> Address {
        let fixed_bytes = vec_to_fixed_bytes32(topic);
        Address::from_word(fixed_bytes)
    }

    /// Convert Vec<u8> topic to U256
    pub fn topic_to_u256(topic: &[u8]) -> U256 {
        let fixed_bytes = vec_to_fixed_bytes32(topic);
        U256::from_be_bytes(fixed_bytes.0)
    }
}
