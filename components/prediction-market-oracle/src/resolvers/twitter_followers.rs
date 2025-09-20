use anyhow::Result;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use wavs_wasi_utils::http::{fetch_json, http_request_get};
use wstd::http::HeaderValue;

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
        let twitterapi_token = std::env::var("WAVS_ENV_TWITTERAPI_TOKEN")
            .map_err(|_| "WAVS_ENV_TWITTERAPI_TOKEN not configured".to_string())?;

        let mut req = http_request_get(&format!(
            "https://api.twitterapi.io/twitter/user/info?userName={}",
            self.config.twitter_account
        ))
        .map_err(|e| format!("Failed to construct followers request: {}", e))?;

        req.headers_mut().insert("X-API-Key", HeaderValue::from_str(&twitterapi_token).unwrap());

        let response: serde_json::Value =
            fetch_json(req).await.map_err(|e| format!("Failed to fetch followers: {}", e))?;

        if let Some(error) = response.get("error") {
            let message =
                response.get("message").and_then(|m| m.as_str()).unwrap_or("Unknown error");
            return Err(format!("Failed to fetch followers: {error} ({message})"));
        }

        let followers = response
            .get("data")
            .ok_or_else(|| format!("Failed to get `data` from response: {:?}", response))?
            .get("followers")
            .ok_or_else(|| format!("Failed to get `followers` from `data`: {:?}", response))?
            .as_u64()
            .ok_or_else(|| format!("Failed to parse `data.followers` as u64: {:?}", response))?;

        Ok(followers)
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
