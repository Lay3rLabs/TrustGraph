use crate::bindings::host::{config_var, get_evm_chain_config};
use crate::merkle_sources::pagerank;
use std::path::PathBuf;
use std::str::FromStr;
use wavs_wasi_utils::evm::alloy_primitives::{Address, U256};

pub struct MerklerConfig {
    pub events_dir: PathBuf,
    pub eas_address: String,
    pub indexer_address: String,
    pub chain_name: String,
    pub chain_id: String,
    pub http_endpoint: String,
    pub ipfs_url: String,
    pub ipfs_api_key: Option<String>,
}

impl MerklerConfig {
    pub fn load() -> Result<Self, String> {
        // Events directory configuration
        let events_dir = config_var("events_dir").unwrap_or_else(|| "./events".to_string());
        let events_dir = PathBuf::from(events_dir.trim_end_matches("/"));

        if !events_dir.exists() {
            std::fs::create_dir_all(&events_dir).map_err(|e| {
                format!(
                    "Failed to create events directory at {}: {}",
                    events_dir.display(),
                    e.to_string()
                )
            })?;
        } else if !events_dir.is_dir() {
            return Err(format!("Events directory {} is not a directory", events_dir.display()));
        }

        // EAS-related configuration
        let eas_address = config_var("eas_address").ok_or_else(|| "Failed to get EAS address")?;
        let indexer_address =
            config_var("indexer_address").ok_or_else(|| "Failed to get indexer address")?;
        let chain_name = config_var("chain_name").unwrap_or_else(|| "local".to_string());

        println!("📋 Configuration loaded:");
        println!("  - EAS address: {}", eas_address);
        println!("  - Indexer: {}", indexer_address);
        println!("  - Chain: {}", chain_name);

        // IPFS configuration - try Pinata first, fallback to local IPFS
        let (ipfs_url, ipfs_api_key) = match std::env::var("WAVS_ENV_PINATA_API_KEY") {
            Ok(api_key) => {
                let url = std::env::var("WAVS_ENV_PINATA_API_URL")
                    .unwrap_or_else(|_| "https://uploads.pinata.cloud/v3/files".to_string());
                println!("🌐 Using Pinata IPFS service");
                (url, Some(api_key))
            }
            Err(_) => {
                println!("🏠 Pinata API key not found, using local IPFS node");
                ("http://localhost:5001/api/v0/add".to_string(), None)
            }
        };

        // Chain configuration
        let chain_config = get_evm_chain_config(&chain_name)
            .ok_or_else(|| format!("Failed to get chain config for {chain_name}"))?;
        let chain_id = chain_config.chain_id;
        let http_endpoint = chain_config
            .http_endpoint
            .ok_or_else(|| format!("Failed to get HTTP endpoint for {chain_name}"))?;

        Ok(MerklerConfig {
            events_dir,
            eas_address,
            indexer_address,
            chain_name,
            chain_id,
            http_endpoint,
            ipfs_url,
            ipfs_api_key,
        })
    }
}

pub struct PageRankSourceConfig {
    pub points_pool: U256,
    pub vouching_schema_uid: String,
    pub pagerank_config: pagerank::PageRankConfig,
    pub min_threshold: f64,
}

impl PageRankSourceConfig {
    pub fn load() -> Result<Option<Self>, String> {
        let enabled = config_var("pagerank_enabled") == Some("true".to_string());

        if !enabled {
            println!("ℹ️  PageRank points disabled (pagerank_enabled not set to true)");
            return Ok(None);
        }

        let pagerank_pool_str = config_var("pagerank_points_pool").ok_or_else(|| {
            "PageRank enabled but pagerank_points_pool not configured".to_string()
        })?;

        let vouching_schema_uid = config_var("vouching_schema_uid")
            .ok_or_else(|| "PageRank enabled but vouching_schema_uid not configured".to_string())?;

        let points_pool = U256::from_str(&pagerank_pool_str)
            .map_err(|err| format!("Failed to parse pagerank_points_pool: {err}"))?;

        // Configure Trust Aware PageRank
        let mut pagerank_config = pagerank::PageRankConfig {
            damping_factor: config_var("pagerank_damping_factor")
                .and_then(|s| s.parse().ok())
                .unwrap_or(0.85),
            max_iterations: config_var("pagerank_max_iterations")
                .and_then(|s| s.parse().ok())
                .unwrap_or(100),
            tolerance: config_var("pagerank_tolerance")
                .and_then(|s| s.parse().ok())
                .unwrap_or(1e-6),
            trust_config: pagerank::TrustConfig::default(),
        };

        // Configure trusted seeds if provided
        println!("🔍 Checking for pagerank_trusted_seeds configuration...");
        if let Some(trusted_seeds_str) = config_var("pagerank_trusted_seeds") {
            println!("🔍 Found pagerank_trusted_seeds: '{}'", trusted_seeds_str);
            let seed_addresses: Vec<&str> =
                trusted_seeds_str.split(',').map(|s| s.trim()).collect();
            let mut parsed_seeds = Vec::new();

            for seed_str in seed_addresses {
                if seed_str.is_empty() {
                    continue;
                }
                match Address::from_str(seed_str) {
                    Ok(address) => parsed_seeds.push(address),
                    Err(e) => {
                        println!("⚠️  Invalid trusted seed address '{}': {}", seed_str, e);
                    }
                }
            }

            println!("🔍 Parsed {} trusted seed addresses", parsed_seeds.len());
            if !parsed_seeds.is_empty() {
                let mut trust_config = pagerank::TrustConfig::new(parsed_seeds.clone());

                // Configure trust parameters
                if let Some(multiplier_str) = config_var("pagerank_trust_multiplier") {
                    if let Ok(multiplier) = multiplier_str.parse::<f64>() {
                        trust_config = trust_config.with_trust_multiplier(multiplier);
                    }
                }

                if let Some(boost_str) = config_var("pagerank_trust_boost") {
                    if let Ok(boost) = boost_str.parse::<f64>() {
                        trust_config = trust_config.with_trust_boost(boost);
                    }
                }

                pagerank_config = pagerank_config.with_trust_config(trust_config);
                println!(
                    "✅ Configured Trust Aware PageRank with {} trusted seeds",
                    parsed_seeds.len()
                );
                println!(
                    "   Trust multiplier: {:.1}x",
                    pagerank_config.trust_config.trust_multiplier
                );
                println!(
                    "   Trust boost: {:.1}%",
                    pagerank_config.trust_config.trust_boost * 100.0
                );
            } else {
                println!("⚠️  No valid trusted seed addresses found, using standard PageRank");
            }
        } else {
            println!("ℹ️  No pagerank_trusted_seeds configured, using standard PageRank");
        }

        let min_threshold =
            config_var("pagerank_min_threshold").and_then(|s| s.parse().ok()).unwrap_or(0.0001);

        Ok(Some(PageRankSourceConfig {
            points_pool,
            vouching_schema_uid,
            pagerank_config,
            min_threshold,
        }))
    }
}
