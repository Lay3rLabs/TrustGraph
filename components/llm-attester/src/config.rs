//! Configuration module for the LLM Attester component
//!
//! This module handles all configuration loading and validation for the component,
//! including EAS settings, LLM parameters, and attestation options.

use crate::bindings::host::config_var;
use alloy_primitives::ruint::aliases::U256;

/// Configuration for the LLM attester component
#[derive(Debug, Clone)]
pub struct AttesterConfig {
    // EAS configuration
    pub eas_address: String,
    pub chain_name: String,
    pub schema_uid: Option<String>,
    pub submit_schema_uid: Option<String>,
    pub revocable: bool,
    pub expiration_time: u64,
    pub attestation_value: U256,
    pub rpc_url: String,

    // LLM configuration
    pub model: String,
    pub temperature: f32,
    pub top_p: f32,
    pub seed: u32,
    pub max_tokens: Option<u32>,
    pub context_window: Option<u32>,
    pub system_message: String,
}

impl AttesterConfig {
    /// Load configuration from environment variables with sensible defaults
    pub fn from_env() -> Self {
        // EAS configuration
        let eas_address =
            config_var("eas_address").unwrap_or_else(|| defaults::DEFAULT_EAS_ADDRESS.to_string());

        let chain_name =
            config_var("chain_name").unwrap_or_else(|| defaults::DEFAULT_CHAIN.to_string());

        let schema_uid = config_var("attestation_schema_uid");

        let submit_schema_uid = config_var("submit_schema_uid");

        let revocable = config_var("attestation_revocable")
            .and_then(|s| s.parse::<bool>().ok())
            .unwrap_or(defaults::DEFAULT_REVOCABLE);

        let expiration_time = config_var("attestation_expiration")
            .and_then(|s| s.parse::<u64>().ok())
            .unwrap_or(defaults::DEFAULT_EXPIRATION);

        let attestation_value = config_var("attestation_value")
            .and_then(|s| s.parse::<u128>().ok())
            .map(U256::from)
            .unwrap_or(U256::ZERO);

        let rpc_url = config_var("rpc_url").unwrap_or_else(|| "http://127.0.0.1:8545".to_string());

        // LLM configuration
        let model = config_var("llm_model").unwrap_or_else(|| defaults::DEFAULT_MODEL.to_string());

        let temperature = config_var("llm_temperature")
            .and_then(|s| s.parse::<f32>().ok())
            .unwrap_or(defaults::DEFAULT_TEMPERATURE);

        let top_p = config_var("llm_top_p")
            .and_then(|s| s.parse::<f32>().ok())
            .unwrap_or(defaults::DEFAULT_TOP_P);

        let seed = config_var("llm_seed")
            .and_then(|s| s.parse::<u32>().ok())
            .unwrap_or(defaults::DEFAULT_SEED);

        let max_tokens = config_var("llm_max_tokens")
            .and_then(|s| s.parse::<u32>().ok())
            .map(Some)
            .unwrap_or(Some(defaults::DEFAULT_MAX_TOKENS));

        let context_window = config_var("llm_context_window")
            .and_then(|s| s.parse::<u32>().ok())
            .map(Some)
            .unwrap_or(Some(defaults::DEFAULT_CONTEXT_WINDOW));

        let system_message = config_var("llm_system_message")
            .unwrap_or_else(|| defaults::DEFAULT_SYSTEM_MESSAGE.to_string());

        Self {
            eas_address,
            chain_name,
            schema_uid,
            submit_schema_uid,
            revocable,
            expiration_time,
            attestation_value,
            rpc_url,
            model,
            temperature,
            top_p,
            seed,
            max_tokens,
            context_window,
            system_message,
        }
    }

    /// Log the configuration for debugging
    pub fn log(&self) {
        println!("📋 EAS Configuration:");
        println!("  - EAS Address: {}", self.eas_address);
        println!("  - Chain: {}", self.chain_name);
        println!("  - Schema UID: {:?}", self.schema_uid);
        println!("  - Submit Schema UID: {:?}", self.submit_schema_uid);
        println!("  - Revocable: {}", self.revocable);
        println!("  - Expiration: {}", self.expiration_time);
        println!("  - Value: {}", self.attestation_value);
        println!("  - RPC URL: {}", self.rpc_url);

        println!("📋 LLM Configuration:");
        println!("  - Model: {}", self.model);
        println!("  - Temperature: {}", self.temperature);
        println!("  - Top P: {}", self.top_p);
        println!("  - Seed: {}", self.seed);
        println!("  - Max Tokens: {:?}", self.max_tokens);
        println!("  - Context Window: {:?}", self.context_window);
    }

    /// Validate configuration values
    #[allow(dead_code)]
    pub fn validate(&self) -> Result<(), String> {
        // Validate temperature is in valid range
        if self.temperature < 0.0 || self.temperature > 2.0 {
            return Err(format!(
                "Temperature must be between 0.0 and 2.0, got: {}",
                self.temperature
            ));
        }

        // Validate top_p is in valid range
        if self.top_p < 0.0 || self.top_p > 1.0 {
            return Err(format!("Top-p must be between 0.0 and 1.0, got: {}", self.top_p));
        }

        // Validate schema UID format if provided
        if let Some(ref schema) = self.schema_uid {
            if !schema.starts_with("0x") || schema.len() != 66 {
                return Err(format!("Invalid schema UID format: {}", schema));
            }
        }

        // Validate submit schema UID format if provided
        if let Some(ref schema) = self.submit_schema_uid {
            if !schema.starts_with("0x") || schema.len() != 66 {
                return Err(format!("Invalid submit schema UID format: {}", schema));
            }
        }

        // Validate EAS address format
        if !self.eas_address.starts_with("0x") || self.eas_address.len() != 42 {
            return Err(format!("Invalid EAS address format: {}", self.eas_address));
        }

        Ok(())
    }

    /// Get LLM options for the wavs_llm client
    pub fn get_llm_options(&self) -> wavs_llm::types::LlmOptions {
        wavs_llm::types::LlmOptions {
            temperature: Some(self.temperature),
            top_p: Some(self.top_p),
            seed: Some(self.seed),
            max_tokens: self.max_tokens,
            context_window: self.context_window,
        }
    }
}

/// Default configuration values
pub mod defaults {
    pub const DEFAULT_MODEL: &str = "llama3.2";
    pub const DEFAULT_TEMPERATURE: f32 = 0.0;
    pub const DEFAULT_TOP_P: f32 = 1.0;
    pub const DEFAULT_SEED: u32 = 42;
    pub const DEFAULT_MAX_TOKENS: u32 = 100;
    pub const DEFAULT_CONTEXT_WINDOW: u32 = 250;
    pub const DEFAULT_REVOCABLE: bool = true;
    pub const DEFAULT_EXPIRATION: u64 = 0;
    pub const DEFAULT_CHAIN: &str = "base-sepolia";
    pub const DEFAULT_EAS_ADDRESS: &str = "0x4200000000000000000000000000000000000021";

    pub const DEFAULT_SYSTEM_MESSAGE: &str =
        "You are evaluating blockchain attestation statements to determine if you like them. \
         Consider the content quality, truthfulness, relevance, and overall value of the statement. \
         You will be asked to provide a like/dislike evaluation in structured JSON format.";
}

#[cfg(test)]
mod tests {
    use super::AttesterConfig;

    #[test]
    fn test_config_validation() {
        let mut config = AttesterConfig::from_env();

        // Valid config should pass
        assert!(config.validate().is_ok());

        // Invalid temperature
        config.temperature = 3.0;
        assert!(config.validate().is_err());
        config.temperature = 0.5;

        // Invalid top_p
        config.top_p = 1.5;
        assert!(config.validate().is_err());
        config.top_p = 0.9;

        // Invalid schema UID
        config.schema_uid = Some("invalid".to_string());
        assert!(config.validate().is_err());
        config.schema_uid = Some("0x".to_string() + &"a".repeat(64));
        assert!(config.validate().is_ok());

        // Invalid submit schema UID
        config.submit_schema_uid = Some("invalid".to_string());
        assert!(config.validate().is_err());
        config.submit_schema_uid = Some("0x".to_string() + &"a".repeat(64));
        assert!(config.validate().is_ok());
    }
}
