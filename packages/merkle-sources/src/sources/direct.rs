use crate::sources::SourceEvent;
use anyhow::Result;
use async_trait::async_trait;
use wavs_wasi_utils::evm::alloy_primitives::U256;

use super::Source;

/// Assign points directly to a list of accounts.
pub struct DirectSource {
    /// Accounts.
    pub accounts: Vec<String>,
    /// Points per account.
    pub points_per_account: U256,
    /// Summary for the source event.
    pub summary: String,
    /// Optional timestamp for the source event.
    pub timestamp: Option<u128>,
}

impl DirectSource {
    pub fn new(
        accounts: Vec<&str>,
        points_per_account: U256,
        summary: &str,
        timestamp: Option<u128>,
    ) -> Self {
        Self {
            accounts: accounts.iter().map(|a| a.to_string()).collect(),
            points_per_account,
            summary: summary.to_string(),
            timestamp,
        }
    }
}

#[async_trait(?Send)]
impl Source for DirectSource {
    fn get_name(&self) -> &str {
        "Direct"
    }

    async fn get_accounts(&self, _ctx: &super::SourceContext) -> Result<Vec<String>> {
        Ok(self.accounts.iter().map(|a| a.to_string()).collect())
    }

    async fn get_events_and_value(
        &self,
        _ctx: &super::SourceContext,
        _account: &str,
    ) -> Result<(Vec<SourceEvent>, U256)> {
        Ok((
            vec![SourceEvent {
                r#type: "Direct".to_string(),
                timestamp: self.timestamp.unwrap_or_default(),
                value: self.points_per_account,
                metadata: Some(serde_json::json!({
                    "summary": self.summary,
                })),
            }],
            self.points_per_account,
        ))
    }

    async fn get_metadata(&self, _ctx: &super::SourceContext) -> Result<serde_json::Value> {
        Ok(serde_json::json!({
            "accounts": self.accounts.len(),
            "points_per_account": self.points_per_account.to_string(),
            "summary": self.summary,
        }))
    }
}
