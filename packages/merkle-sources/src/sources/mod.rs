use std::collections::HashSet;

use alloy_network::Ethereum;
use alloy_provider::RootProvider;
use anyhow::Result;
use async_trait::async_trait;
use serde::Serialize;
use std::str::FromStr;
use wavs_indexer_api::WavsIndexerQuerier;
use wavs_wasi_utils::evm::{
    alloy_primitives::{Address, U256},
    new_evm_provider,
};

pub mod direct;
pub mod eas;
pub mod eas_pagerank;
pub mod erc721;
pub mod hyperstition;
pub mod interactions;

/// Shared context for all sources providing common chain access.
pub struct SourceContext {
    /// Chain name (e.g., "ethereum", "local")
    pub chain_name: String,
    /// Chain ID
    pub chain_id: String,
    /// HTTP endpoint for the chain
    pub http_endpoint: String,
    /// EVM provider for making blockchain calls
    pub provider: RootProvider<Ethereum>,
    /// EAS contract address
    pub eas_address: Address,
    /// WAVS indexer address
    pub indexer_address: Address,
    /// Pre-initialized indexer querier
    pub indexer_querier: WavsIndexerQuerier,
}

impl SourceContext {
    /// Create a new SourceContext from configuration
    pub async fn new(
        chain_name: &str,
        chain_id: &str,
        http_endpoint: &str,
        eas_address: &str,
        indexer_address: &str,
    ) -> Result<Self> {
        let eas_addr = Address::from_str(eas_address)
            .map_err(|e| anyhow::anyhow!("Invalid EAS address '{}': {}", eas_address, e))?;
        let indexer_addr = Address::from_str(indexer_address)
            .map_err(|e| anyhow::anyhow!("Invalid indexer address '{}': {}", indexer_address, e))?;

        let provider = new_evm_provider::<Ethereum>(http_endpoint.to_string());
        let indexer_querier = WavsIndexerQuerier::new(indexer_addr, http_endpoint.to_string())
            .await
            .map_err(|e| anyhow::anyhow!("Failed to create indexer querier: {}", e))?;

        Ok(Self {
            chain_name: chain_name.to_string(),
            chain_id: chain_id.to_string(),
            http_endpoint: http_endpoint.to_string(),
            provider,
            eas_address: eas_addr,
            indexer_address: indexer_addr,
            indexer_querier,
        })
    }
}

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
    async fn get_accounts(&self, ctx: &SourceContext) -> Result<Vec<String>>;

    /// Get the events and total value for an account.
    async fn get_events_and_value(
        &self,
        ctx: &SourceContext,
        account: &str,
    ) -> Result<(Vec<SourceEvent>, U256)>;

    /// Get metadata about the source.
    async fn get_metadata(&self, ctx: &SourceContext) -> Result<serde_json::Value>;
}

// TODO: only pass accounts into a source that were returned by that source

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
    pub async fn get_accounts(&self, ctx: &SourceContext) -> Result<Vec<String>> {
        let mut accounts = HashSet::new();
        for source in &self.sources {
            accounts.extend(source.get_accounts(ctx).await?);
        }
        Ok(accounts.into_iter().collect())
    }

    /// Get the events and total value for an account across all sources.
    pub async fn get_events_and_value(
        &self,
        ctx: &SourceContext,
        account: &str,
    ) -> Result<(Vec<SourceEvent>, U256)> {
        let mut all_source_events = Vec::new();
        let mut total = U256::ZERO;
        let max_single_source_value = U256::from(1000000000000000000000000u128); // 1M points max per source

        for source in &self.sources {
            let (source_events, source_value) = source.get_events_and_value(ctx, account).await?;

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
    pub async fn get_sources_with_metadata(
        &self,
        ctx: &SourceContext,
    ) -> Result<Vec<serde_json::Value>> {
        let mut metadata = Vec::new();
        for source in &self.sources {
            let name = source.get_name();
            let source_metadata = source.get_metadata(ctx).await?;
            metadata.push(serde_json::json!({
                "name": name,
                "metadata": source_metadata,
            }));
        }
        Ok(metadata)
    }
}
