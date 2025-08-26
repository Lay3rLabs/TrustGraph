use anyhow::Result;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use wavs_wasi_utils::http::{fetch_json, http_request_get};
use wstd::http::HeaderValue;

use crate::register_resolver;

use super::Resolver;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PriceResolverConfig {
    /// Coin Market Cap ID.
    pub coin_market_cap_id: u64,
    /// Price threshold.
    pub threshold: f64,
}

/// Resolve from a price feed.
pub struct PriceResolver {
    config: PriceResolverConfig,
}

register_resolver!(PriceResolver, "price");

impl PriceResolver {
    pub fn new(config: PriceResolverConfig) -> Self {
        Self { config }
    }

    async fn query_price(&self) -> Result<f64, String> {
        let url = format!(
            "https://api.coinmarketcap.com/data-api/v3/cryptocurrency/detail?id={}&range=1h",
            self.config.coin_market_cap_id
        );

        let mut req = http_request_get(&url)
            .map_err(|e| format!("Failed to construct price request: {}", e))?;
        req.headers_mut().insert("Accept", HeaderValue::from_static("application/json"));
        req.headers_mut().insert("Content-Type", HeaderValue::from_static("application/json"));
        req.headers_mut().insert(
            "User-Agent",
            HeaderValue::from_static("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36"),
        );

        let json: Root =
            fetch_json(req).await.map_err(|e| format!("Failed to fetch price: {}", e))?;

        Ok(json.data.statistics.price)
    }
}

#[async_trait(?Send)]
impl Resolver for PriceResolver {
    /// Create from JSON config
    fn from_config(config: Value) -> Result<Self, String> {
        let config: PriceResolverConfig = serde_json::from_value(config)
            .map_err(|e| format!("Failed to parse PriceResolver config: {}", e))?;
        Ok(Self::new(config))
    }

    async fn resolve(&self) -> Result<bool, String> {
        let price = self.query_price().await?;
        Ok(price > self.config.threshold)
    }
}

/// -----
/// https://transform.tools/json-to-rust-serde
/// Generated from https://api.coinmarketcap.com/data-api/v3/cryptocurrency/detail?id=1&range=1h
/// -----
///
#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Root {
    pub data: Data,
    pub status: Status,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Data {
    pub id: f64,
    pub name: String,
    pub symbol: String,
    pub statistics: Statistics,
    pub description: String,
    pub category: String,
    pub slug: String,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Statistics {
    pub price: f64,
    #[serde(rename = "totalSupply")]
    pub total_supply: f64,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct CoinBitesVideo {
    pub id: String,
    pub category: String,
    #[serde(rename = "videoUrl")]
    pub video_url: String,
    pub title: String,
    pub description: String,
    #[serde(rename = "previewImage")]
    pub preview_image: String,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Status {
    pub timestamp: String,
    pub error_code: String,
    pub error_message: String,
    pub elapsed: String,
    pub credit_count: f64,
}
