use std::collections::HashSet;

use anyhow::Result;
use async_trait::async_trait;
use serde::Serialize;
use wavs_wasi_utils::evm::alloy_primitives::U256;

pub mod eas;
pub mod eas_pagerank;
pub mod erc721;
pub mod interactions;

/// An event that earns points.
#[derive(Serialize)]
pub struct SourceEvent {
    /// The type of the event.
    pub r#type: String,
    /// The timestamp (unix epoch milliseconds) of the event.
    pub timestamp: u128,
    /// The value earned from the event.
    pub value: U256,
    /// Optional metadata for the event.
    pub metadata: Option<serde_json::Value>,
}

/// A source of value.
#[async_trait(?Send)]
pub trait Source {
    /// Get the name of the source.
    fn get_name(&self) -> &str;

    /// Get all accounts that have values from this source.
    async fn get_accounts(&self) -> Result<Vec<String>>;

    /// Get the events and total value for an account.
    async fn get_events_and_value(&self, account: &str) -> Result<(Vec<SourceEvent>, U256)>;

    /// Get metadata about the source.
    async fn get_metadata(&self) -> Result<serde_json::Value>;
}

/// A registry that manages multiple value sources.
pub struct SourceRegistry {
    sources: Vec<Box<dyn Source>>,
}

impl SourceRegistry {
    /// Create a new empty registry.
    pub fn new() -> Self {
        Self { sources: Vec::new() }
    }

    /// Add a new source to the registry.
    pub fn add_source<S: Source + 'static>(&mut self, source: S) {
        self.sources.push(Box::new(source));
    }

    /// Get aggregated accounts from all sources (deduplicated).
    pub async fn get_accounts(&self) -> Result<Vec<String>> {
        let mut accounts = HashSet::new();
        for source in &self.sources {
            accounts.extend(source.get_accounts().await?);
        }
        Ok(accounts.into_iter().collect())
    }

    /// Get the events and total value for an account across all sources.
    pub async fn get_events_and_value(&self, account: &str) -> Result<(Vec<SourceEvent>, U256)> {
        let mut all_source_events = Vec::new();
        let mut total = U256::ZERO;
        let max_single_source_value = U256::from(1000000000000000000000000u128); // 1M points max per source

        for source in &self.sources {
            let (source_events, source_value) = source.get_events_and_value(account).await?;

            // Safety check: prevent any single source from returning unreasonably large value
            if source_value > max_single_source_value {
                return Err(anyhow::anyhow!(
                    "Source '{}' returned excessive value: {} (max allowed: {})",
                    source.get_name(),
                    source_value,
                    max_single_source_value
                ));
            }

            all_source_events.extend(source_events);

            // Use checked addition to prevent overflow
            total = total.checked_add(source_value).ok_or_else(|| {
                anyhow::anyhow!(
                    "Total value overflow when adding {} from source '{}' to existing total {}",
                    source_value,
                    source.get_name(),
                    total
                )
            })?;

            if !source_value.is_zero() {
                println!("💰 {} from '{}': {}", account, source.get_name(), source_value);
            }
        }

        if !total.is_zero() {
            println!("💎 Total value for {}: {}", account, total);
        }

        // Sort descending by timestamp, which also puts empty (0) timestamps last.
        all_source_events.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));

        Ok((all_source_events, total))
    }

    /// Get metadata about all sources.
    pub async fn get_sources_with_metadata(&self) -> Result<Vec<serde_json::Value>> {
        let mut metadata = Vec::new();
        for source in &self.sources {
            let name = source.get_name();
            let source_metadata = source.get_metadata().await?;
            metadata.push(serde_json::json!({
                "name": name,
                "metadata": source_metadata,
            }));
        }
        Ok(metadata)
    }
}
