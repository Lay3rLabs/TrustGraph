use std::collections::HashSet;

use anyhow::Result;
use async_trait::async_trait;
use wavs_wasi_utils::evm::alloy_primitives::U256;

pub mod eas;
pub mod eas_pagerank;
pub mod erc721;

/// A source of rewards.
#[async_trait(?Send)]
pub trait Source {
    /// Get the name of the source.
    fn get_name(&self) -> &str;

    /// Get all accounts that have rewards from this source.
    async fn get_accounts(&self) -> Result<Vec<String>>;

    /// Get the rewards for an account.
    async fn get_rewards(&self, account: &str) -> Result<U256>;

    /// Get metadata about the source.
    async fn get_metadata(&self) -> Result<serde_json::Value>;
}

/// A registry that manages multiple reward sources.
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

    /// Get rewards for an account across all sources.
    pub async fn get_rewards(&self, account: &str) -> Result<U256> {
        let mut total = U256::ZERO;

        for source in &self.sources {
            let source_rewards = source.get_rewards(account).await?;
            total = total
                .checked_add(source_rewards)
                .ok_or(anyhow::anyhow!("Total rewards overflow"))?;
        }

        Ok(total)
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
