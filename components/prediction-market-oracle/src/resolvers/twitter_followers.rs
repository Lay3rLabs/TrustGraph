use anyhow::Result;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use wavs_wasi_utils::http::{fetch_json, http_request_get};
use wstd::http::HeaderValue;

use crate::bindings::host::config_var;
use crate::register_resolver;

use super::Resolver;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TwitterFollowersConfig {
    /// Twitter account to resolve.
    pub twitter_account: String,
    /// Required number of followers.
    pub threshold: u64,
}

/// Resolve from Twitter followers.
pub struct TwitterFollowersResolver {
    config: TwitterFollowersConfig,
}

register_resolver!(TwitterFollowersResolver, "twitter_followers");

impl TwitterFollowersResolver {
    pub fn new(config: TwitterFollowersConfig) -> Self {
        Self { config }
    }

    async fn query_followers(&self) -> Result<u64, String> {
        let twitter_api_token = config_var("twitter_api_token")
            .ok_or_else(|| "twitter_api_token not configured".to_string())?;

        let mut req = http_request_get(&format!(
            "https://api.twitter.com/1.1/followers/ids.json?screen_name={}",
            self.config.twitter_account
        ))
        .map_err(|e| format!("Failed to construct followers request: {}", e))?;

        req.headers_mut().insert(
            "Authorization",
            HeaderValue::from_str(&format!("Bearer {}", twitter_api_token)).unwrap(),
        );

        let response: Vec<u64> =
            fetch_json(req).await.map_err(|e| format!("Failed to fetch followers: {}", e))?;
        Ok(response.len() as u64)
    }
}

#[async_trait(?Send)]
impl Resolver for TwitterFollowersResolver {
    /// Create from JSON config
    fn from_config(config: Value) -> Result<Self, String> {
        let config: TwitterFollowersConfig = serde_json::from_value(config)
            .map_err(|e| format!("Failed to parse TwitterFollowersResolver config: {}", e))?;
        Ok(Self::new(config))
    }

    async fn resolve(&self) -> Result<bool, String> {
        let followers = self.query_followers().await?;
        Ok(followers >= self.config.threshold)
    }
}
