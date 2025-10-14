use std::collections::{HashMap, HashSet};

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
#[derive(Serialize, Clone)]
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
        account: &Address,
    ) -> Result<(Vec<SourceEvent>, U256)>;

    /// Get metadata about the source.
    async fn get_metadata(&self, ctx: &SourceContext) -> Result<serde_json::Value>;
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

        let account = Address::from_str(account)?;

        for source in &self.sources {
            let (source_events, source_value) = source.get_events_and_value(ctx, &account).await?;

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

    /// Get the accounts, events, and total value from a single source.
    pub async fn get_accounts_events_and_value_for_source(
        &self,
        ctx: &SourceContext,
        source: &Box<dyn Source>,
    ) -> Result<HashMap<String, (Vec<SourceEvent>, U256)>> {
        let mut data: HashMap<String, (Vec<SourceEvent>, U256)> = HashMap::from_iter(
            source
                .get_accounts(ctx)
                .await?
                .iter()
                .map(|a| (a.to_lowercase(), (vec![], U256::ZERO))),
        );

        let events_and_values = futures::future::join_all(
            data.keys()
                .map(|a| async {
                    let account = Address::from_str(a)?;
                    let (events, value) = source.get_events_and_value(ctx, &account).await?;
                    Ok::<(String, (Vec<SourceEvent>, U256)), anyhow::Error>((
                        a.to_string(),
                        (events, value),
                    ))
                })
                .collect::<Vec<_>>(),
        )
        .await
        .into_iter()
        .collect::<Result<Vec<_>, _>>()?;

        for (account, (events, value)) in events_and_values {
            data.insert(account, (events, value));
        }

        Ok(data)
    }

    /// Get the accounts, events, and total value from all sources.
    pub async fn get_accounts_events_and_value(
        &self,
        ctx: &SourceContext,
    ) -> Result<(HashMap<String, (Vec<SourceEvent>, U256)>, U256)> {
        let accounts_events_and_values = futures::future::join_all(
            self.sources
                .iter()
                .map(|source| self.get_accounts_events_and_value_for_source(ctx, source)),
        )
        .await
        .into_iter()
        .collect::<Result<Vec<_>, _>>()?;

        let mut data: HashMap<String, (Vec<SourceEvent>, U256)> = HashMap::new();

        let mut total = U256::ZERO;

        // Combine all the source data into a single map, merging the events and values for each account.
        for (source_index, source_data) in accounts_events_and_values.into_iter().enumerate() {
            let source = &self.sources[source_index].get_name();

            let mut source_total = U256::ZERO;

            for (account, (events, value)) in source_data {
                if !value.is_zero() {
                    println!("💸 Value for {} from {} source: {}", account, source, value);
                }

                match data.entry(account) {
                    std::collections::hash_map::Entry::Occupied(mut e) => {
                        let (existing_events, existing_value) = e.get_mut();
                        existing_events.extend(events);
                        *existing_value += value;
                    }
                    std::collections::hash_map::Entry::Vacant(e) => {
                        e.insert((events, value));
                    }
                }

                source_total += value;
            }

            if !source_total.is_zero() {
                println!("💰 Total value for {} source: {}", source, source_total);
            }

            total += source_total;
        }

        if !total.is_zero() {
            println!("🏦 Total value distributed: {}", total);
        }

        // Sort events descending by timestamp, and compute total.
        for (events, _) in data.values_mut() {
            events.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
        }

        Ok((data, total))
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
