pub mod attestation;

use crate::solidity::IndexingPayload;
use crate::trigger::EventData;
use alloy_primitives::FixedBytes;
use anyhow::Result;

/// Static transformer function type
pub type TransformerFn = fn(&FixedBytes<32>) -> bool;
pub type TransformFn =
    fn(
        FixedBytes<32>,
        EventData,
    ) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<IndexingPayload>>>>;

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

    /// Transform an event into a IndexedEvent.
    async fn transform(
        event_signature: FixedBytes<32>,
        event_data: EventData,
    ) -> Result<IndexingPayload>;

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
    ) -> Result<IndexingPayload> {
        let mut payload = IndexingPayload { toAdd: Vec::new(), toDelete: Vec::new() };

        let mut not_found = true;
        for transformer in &self.transformers {
            if (transformer.supports_event)(event_signature) {
                not_found = false;
                match (transformer.transform)(event_signature.clone(), event_data.clone()).await {
                    Ok(p) => {
                        payload.toAdd.extend(p.toAdd);
                        payload.toDelete.extend(p.toDelete);
                    }
                    Err(e) => println!("Transformer {} failed: {}", transformer.name, e),
                }
            }
        }

        if not_found {
            Err(anyhow::anyhow!("No transformer found for event signature: {}", event_signature))
        } else if payload.toAdd.is_empty() && payload.toDelete.is_empty() {
            Err(anyhow::anyhow!("No index updates were applied for event: {}", event_signature))
        } else {
            Ok(payload)
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
