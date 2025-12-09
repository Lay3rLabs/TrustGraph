use crate::client::Message;
use crate::contracts::Contract;
use crate::errors::AgentError;
use serde::{Deserialize, Serialize};
use std::env;
use wavs_wasi_utils::http::{fetch_json, http_request_get};
use wstd::http::HeaderValue;
use wstd::runtime::block_on;

/// Configuration options for Ollama LLM
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct LlmOptions {
    /// Temperature controls randomness (0.0-2.0)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub temperature: Option<f32>,

    /// Maximum tokens to generate
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_tokens: Option<u32>,

    /// Top_p controls diversity (0.0-1.0)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub top_p: Option<f32>,

    /// Seed for deterministic outputs
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<u32>,

    /// Context window size
    #[serde(skip_serializing_if = "Option::is_none")]
    pub context_window: Option<u32>,
}

impl LlmOptions {
    /// Create a new LlmOptions with default values
    pub fn new() -> Self {
        Self::default()
    }

    /// Set temperature
    pub fn with_temperature(mut self, temperature: f32) -> Self {
        self.temperature = Some(temperature);
        self
    }

    /// Set max tokens
    pub fn with_max_tokens(mut self, max_tokens: u32) -> Self {
        self.max_tokens = Some(max_tokens);
        self
    }

    /// Set top_p
    pub fn with_top_p(mut self, top_p: f32) -> Self {
        self.top_p = Some(top_p);
        self
    }

    /// Set seed
    pub fn with_seed(mut self, seed: u32) -> Self {
        self.seed = Some(seed);
        self
    }

    /// Set context window
    pub fn with_context_window(mut self, context_window: u32) -> Self {
        self.context_window = Some(context_window);
        self
    }
}

/// Builder for LlmOptions
pub struct LlmOptionsBuilder {
    config: LlmOptions,
}

impl Default for LlmOptionsBuilder {
    fn default() -> Self {
        Self::new()
    }
}

impl LlmOptionsBuilder {
    /// Create a new builder
    pub fn new() -> Self {
        Self {
            config: LlmOptions::default(),
        }
    }

    /// Set temperature
    pub fn temperature(mut self, temperature: f32) -> Self {
        self.config.temperature = Some(temperature);
        self
    }

    /// Set max tokens
    pub fn max_tokens(mut self, max_tokens: u32) -> Self {
        self.config.max_tokens = Some(max_tokens);
        self
    }

    /// Set top_p
    pub fn top_p(mut self, top_p: f32) -> Self {
        self.config.top_p = Some(top_p);
        self
    }

    /// Set seed
    pub fn seed(mut self, seed: u32) -> Self {
        self.config.seed = Some(seed);
        self
    }

    /// Set context window
    pub fn context_window(mut self, context_window: u32) -> Self {
        self.config.context_window = Some(context_window);
        self
    }

    /// Build the configuration
    pub fn build(self) -> LlmOptions {
        self.config
    }
}

/// Generic Config for agent's decision making
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub contracts: Vec<Contract>,
    pub llm_config: LlmOptions,
    pub model: String,
    #[serde(default)]
    pub messages: Vec<Message>,
    /// Any global configuration values
    #[serde(default)]
    pub config: std::collections::HashMap<String, String>,
}

impl Config {
    /// Load Config from environment variable CONFIG_URI or use default
    pub fn load() -> Result<Self, String> {
        // Check if CONFIG_URI environment variable is set
        if let Ok(config_uri) = env::var("config_uri") {
            println!("Loading config from URI: {}", config_uri);
            Self::load_from_uri(&config_uri)
        } else {
            println!("No CONFIG_URI found, using default configuration");
            Ok(Self::default())
        }
    }

    /// Load Config from a URI
    pub fn load_from_uri(uri: &str) -> Result<Self, String> {
        let uri = uri.to_string();
        block_on(async move {
            // Strip any quotation marks from the URI
            let clean_uri = uri.trim_matches('"');

            println!("Loading config from URI: {}", clean_uri);

            // Check URI scheme
            if let Some(uri_with_scheme) = clean_uri.strip_prefix("ipfs://") {
                // IPFS URI scheme detected
                Self::load_from_ipfs(uri_with_scheme)
            } else if clean_uri.starts_with("http://") || clean_uri.starts_with("https://") {
                // HTTP URI scheme detected
                Self::fetch_from_uri(clean_uri)
            } else {
                // Only support http/https and ipfs URIs
                Err(format!("Unsupported URI scheme: {}", clean_uri))
            }
        })
    }

    /// Load configuration from IPFS
    fn load_from_ipfs(cid: &str) -> Result<Self, String> {
        let cid = cid.to_string();
        block_on(async move {
            let gateway_url = std::env::var("WAVS_ENV_IPFS_GATEWAY_URL").unwrap_or_else(|_| {
                println!("WAVS_ENV_IPFS_GATEWAY_URL not set, using default");
                "https://gateway.lighthouse.storage/ipfs".to_string()
            });

            // Strip any quotation marks from the gateway URL
            let clean_gateway_url = gateway_url.trim_matches('"');

            // Construct HTTP URL, avoiding duplicate /ipfs in the path
            let http_url = if clean_gateway_url.ends_with("/ipfs") {
                format!("{}/{}", clean_gateway_url, cid)
            } else if clean_gateway_url.ends_with("/ipfs/") {
                format!("{}{}", clean_gateway_url, cid)
            } else if clean_gateway_url.ends_with("/") {
                format!("{}ipfs/{}", clean_gateway_url, cid)
            } else {
                format!("{}/ipfs/{}", clean_gateway_url, cid)
            };

            println!("Fetching IPFS config from: {}", http_url);
            Self::fetch_from_uri(&http_url)
        })
    }

    /// Fetch configuration from a HTTP/HTTPS URI
    fn fetch_from_uri(uri: &str) -> Result<Self, String> {
        let uri = uri.to_string();
        block_on(async move {
            // Strip any quotation marks from the URI
            let clean_uri = uri.trim_matches('"');

            println!("Creating HTTP request for URI: {}", clean_uri);

            // Create HTTP request
            let mut req = http_request_get(clean_uri).map_err(|e| {
                let error_msg = format!("Failed to create request: {}", e);
                println!("Error: {}", error_msg);
                error_msg
            })?;

            // Add appropriate headers for JSON content
            req.headers_mut()
                .insert("Accept", HeaderValue::from_static("application/json"));

            println!("Sending HTTP request...");

            // Execute HTTP request and parse response as JSON
            let config: Config = fetch_json(req).await.unwrap();

            println!("Successfully loaded configuration");
            Ok(config)
        })
    }

    /// Load Config from JSON
    pub fn from_json(json: &str) -> Result<Self, AgentError> {
        let config: Self = serde_json::from_str(json).map_err(|e| {
            AgentError::Configuration(format!("Failed to parse Config JSON: {}", e))
        })?;

        // Validate the Config
        config.validate()?;

        Ok(config)
    }

    /// Serialize the Config to a JSON string
    pub fn to_json(&self) -> Result<String, String> {
        serde_json::to_string_pretty(self)
            .map_err(|e| format!("Failed to serialize Config to JSON: {}", e))
    }

    /// Format contract descriptions for the system prompt
    pub fn format_contract_descriptions(&self) -> String {
        self.contracts
            .iter()
            .map(|contract| {
                format!(
                    "Contract: {}\nAddress: {}\nABI:\n{}",
                    contract.name, contract.address, contract.abi
                )
            })
            .collect::<Vec<_>>()
            .join("\n\n")
    }

    /// Get a smart contract by name
    pub fn get_contract_by_name(&self, name: &str) -> Option<&Contract> {
        self.contracts
            .iter()
            .find(|c| c.name.to_lowercase() == name.to_lowercase())
    }

    /// Validate the Config for required fields and logical consistency
    pub fn validate(&self) -> Result<(), AgentError> {
        // Check each contract for required fields
        for (i, contract) in self.contracts.iter().enumerate() {
            if contract.address.is_empty() {
                return Err(AgentError::Configuration(format!(
                    "Contract at index {} is missing an address",
                    i
                )));
            }

            if contract.abi.is_empty() {
                return Err(AgentError::Configuration(format!(
                    "Contract at index {} is missing ABI",
                    i
                )));
            }

            // Validate contract address format
            if contract.address.len() != 42 || !contract.address.starts_with("0x") {
                return Err(AgentError::Configuration(format!(
                    "Contract at index {} has invalid address format: {}",
                    i, contract.address
                )));
            }
        }

        Ok(())
    }
}

// Default implementation for testing and development
impl Default for Config {
    fn default() -> Self {
        let default_system_prompt = r#"
            You are an agent responsible for making and executing financial transactions.

            You have several tools available to interact with smart contracts.
            Return nothing if no action is needed.
        "#
        .to_string();

        Self {
            contracts: vec![Contract::new_with_description(
                "USDC",
                "0xb7278a61aa25c888815afc32ad3cc52ff24fe575",
                r#"[{"type":"function","name":"transfer","inputs":[{"name":"to","type":"address","internalType":"address"},{"name":"value","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"bool","internalType":"bool"}],"stateMutability":"nonpayable"}]"#,
                "USDC is a stablecoin pegged to the US Dollar",
            )],
            llm_config: LlmOptions::new()
                .with_temperature(0.0)
                .with_top_p(0.1)
                .with_seed(42)
                .with_max_tokens(500),
            model: "llama3.2".to_string(),
            messages: vec![Message::system(default_system_prompt)],
            config: std::collections::HashMap::new(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_config_from_json() {
        // Valid Config JSON
        let json = r#"{
            "contracts": [
                {
                    "name": "TestContract",
                    "address": "0x1234567890123456789012345678901234567890",
                    "abi": "[{\"name\":\"test\",\"type\":\"function\",\"inputs\":[],\"outputs\":[]}]",
                    "description": "Test contract"
                }
            ],
            "llm_config": {
                "temperature": 0.7,
                "top_p": 0.9,
                "seed": 123,
                "max_tokens": 500
            },
            "model": "test-model",
            "messages": [
                {
                    "role": "system",
                    "content": "Test system message"
                }
            ],
            "config": {
                "test_key": "test_value"
            }
        }"#;

        let config = Config::from_json(json).unwrap();

        // Verify loaded values
        assert_eq!(config.contracts.len(), 1);
        assert_eq!(config.contracts[0].name, "TestContract");
        assert_eq!(
            config.contracts[0].address,
            "0x1234567890123456789012345678901234567890"
        );
        assert_eq!(config.model, "test-model");
        assert_eq!(config.llm_config.temperature, Some(0.7));
        assert_eq!(config.llm_config.top_p, Some(0.9));
        assert_eq!(config.llm_config.seed, Some(123));
        assert_eq!(config.llm_config.max_tokens, Some(500));
        assert_eq!(config.messages.len(), 1);
        assert_eq!(config.messages[0].role, "system");
        assert_eq!(
            config.messages[0].content.as_ref().unwrap(),
            "Test system message"
        );
        assert_eq!(config.config.get("test_key").unwrap(), "test_value");
    }

    #[test]
    fn test_config_validation() {
        // Valid Config
        let valid_config = Config {
            contracts: vec![Contract::new(
                "TestContract",
                "0x1234567890123456789012345678901234567890",
                "[{\"name\":\"test\",\"type\":\"function\",\"inputs\":[],\"outputs\":[]}]",
            )],
            llm_config: LlmOptions::default(),
            model: "test-model".to_string(),
            messages: vec![Message::system("Test system message".to_string())],
            config: std::collections::HashMap::new(),
        };

        assert!(valid_config.validate().is_ok());

        // Invalid contract address
        let invalid_address_config = Config {
            contracts: vec![Contract::new(
                "TestContract",
                "invalid-address",
                "[{\"name\":\"test\",\"type\":\"function\",\"inputs\":[],\"outputs\":[]}]",
            )],
            llm_config: LlmOptions::default(),
            model: "test-model".to_string(),
            messages: vec![],
            config: std::collections::HashMap::new(),
        };

        assert!(invalid_address_config.validate().is_err());

        // Empty ABI
        let empty_abi_config = Config {
            contracts: vec![Contract::new(
                "TestContract",
                "0x1234567890123456789012345678901234567890",
                "",
            )],
            llm_config: LlmOptions::default(),
            model: "test-model".to_string(),
            messages: vec![],
            config: std::collections::HashMap::new(),
        };

        assert!(empty_abi_config.validate().is_err());
    }

    #[test]
    fn test_get_contract_by_name() {
        let config = Config {
            contracts: vec![
                Contract::new(
                    "Contract1",
                    "0x1111111111111111111111111111111111111111",
                    "[{\"name\":\"test\",\"type\":\"function\",\"inputs\":[],\"outputs\":[]}]",
                ),
                Contract::new(
                    "Contract2",
                    "0x2222222222222222222222222222222222222222",
                    "[{\"name\":\"test\",\"type\":\"function\",\"inputs\":[],\"outputs\":[]}]",
                ),
            ],
            llm_config: LlmOptions::default(),
            model: "test-model".to_string(),
            messages: vec![],
            config: std::collections::HashMap::new(),
        };

        // Test exact match
        let contract = config.get_contract_by_name("Contract1");
        assert!(contract.is_some());
        assert_eq!(contract.unwrap().name, "Contract1");

        // Test case insensitive match
        let contract = config.get_contract_by_name("contract2");
        assert!(contract.is_some());
        assert_eq!(contract.unwrap().name, "Contract2");

        // Test non-existent contract
        let contract = config.get_contract_by_name("NonExistentContract");
        assert!(contract.is_none());
    }

    #[test]
    fn test_format_contract_descriptions() {
        let config = Config {
            contracts: vec![
                Contract::new_with_description(
                    "Contract1",
                    "0x1111111111111111111111111111111111111111",
                    "[{\"name\":\"test\",\"type\":\"function\",\"inputs\":[],\"outputs\":[]}]",
                    "First test contract",
                ),
                Contract::new_with_description(
                    "Contract2",
                    "0x2222222222222222222222222222222222222222",
                    "[{\"name\":\"test\",\"type\":\"function\",\"inputs\":[],\"outputs\":[]}]",
                    "Second test contract",
                ),
            ],
            llm_config: LlmOptions::default(),
            model: "test-model".to_string(),
            messages: vec![],
            config: std::collections::HashMap::new(),
        };

        let descriptions = config.format_contract_descriptions();

        // Check that the descriptions contain the contract names, addresses, and ABIs
        assert!(descriptions.contains("Contract1"));
        assert!(descriptions.contains("0x1111111111111111111111111111111111111111"));
        assert!(descriptions.contains("Contract2"));
        assert!(descriptions.contains("0x2222222222222222222222222222222222222222"));

        // Check that descriptions are separated
        assert!(descriptions.contains("\n\n"));
    }

    #[test]
    fn test_default_config() {
        let config = Config::default();

        // Check that default Config has reasonable values
        assert!(!config.contracts.is_empty());
        assert_eq!(config.model, "llama3.2");
        assert!(!config.messages.is_empty());
        assert_eq!(config.messages[0].role, "system");
        assert!(config.messages[0].content.is_some());
    }

    #[test]
    fn test_llm_options_builder() {
        let config = LlmOptionsBuilder::new()
            .temperature(0.5)
            .max_tokens(100)
            .top_p(0.9)
            .seed(42)
            .context_window(4096)
            .build();
        assert_eq!(config.temperature, Some(0.5));
        assert_eq!(config.max_tokens, Some(100));
        assert_eq!(config.top_p, Some(0.9));
        assert_eq!(config.seed, Some(42));
        assert_eq!(config.context_window, Some(4096));
    }

    #[test]
    fn test_llm_options_fluent_api() {
        let config = LlmOptions::new()
            .with_temperature(0.8)
            .with_max_tokens(200)
            .with_top_p(0.95)
            .with_seed(123)
            .with_context_window(8192);
        assert_eq!(config.temperature, Some(0.8));
        assert_eq!(config.max_tokens, Some(200));
        assert_eq!(config.top_p, Some(0.95));
        assert_eq!(config.seed, Some(123));
        assert_eq!(config.context_window, Some(8192));
    }
}
