use std::env;

use crate::wit::exports::wavs::agent::config::{self, GuestLlmOptionsFuncs};
use crate::wit::exports::wavs::agent::errors::AgentError;
use crate::wit::exports::wavs::agent::types::{Config, Contract, LlmOptions, Message};

// Constants for default values
const DEFAULT_MODEL: &str = "gpt-4";
const DEFAULT_API_BASE_URL: &str = "https://api.openai.com/v1";
const DEFAULT_MAX_TOKENS: u32 = 2048;

// Implementation for LlmOptionsFuncs
pub struct LlmOptionsFuncsImpl;

impl config::GuestLlmOptionsFuncs for LlmOptionsFuncsImpl {
    fn new(&self) -> LlmOptions {
        LlmOptions {
            temperature: 0.0,
            top_p: 1.0,
            seed: 42,
            max_tokens: None,
            context_window: Some(4096),
        }
    }

    fn temperature(&self, temp: f32) -> LlmOptions {
        LlmOptions { temperature: temp, ..self.new() }
    }

    fn top_p(&self, top_p: f32) -> LlmOptions {
        LlmOptions { top_p, ..self.new() }
    }

    fn seed(&self, seed: u32) -> LlmOptions {
        LlmOptions { seed, ..self.new() }
    }

    fn max_tokens(&self, max_tokens: Option<u32>) -> LlmOptions {
        LlmOptions { max_tokens, ..self.new() }
    }

    fn context_window(&self, context_window: Option<u32>) -> LlmOptions {
        LlmOptions { context_window, ..self.new() }
    }
}

// Implementation for ConfigManager
pub struct ConfigManagerImpl {
    config: Option<Config>,
    _api_key: Option<String>, // Unused but kept for structure
    api_base_url: String,
}

impl ConfigManagerImpl {
    pub fn new() -> Self {
        Self { config: None, _api_key: None, api_base_url: DEFAULT_API_BASE_URL.to_string() }
    }

    // Create a default config for testing and development
    pub fn default_config(&self) -> Config {
        let default_system_prompt = r#"
            You are an agent responsible for making and executing financial transactions.
            
            You have several tools available to interact with smart contracts.
            Return nothing if no action is needed.
        "#;

        let options_funcs = LlmOptionsFuncsImpl {};

        Config {
            contracts: vec![create_default_contract()],
            llm_config: options_funcs.new(),
            model: DEFAULT_MODEL.into(),
            messages: vec![Message {
                role: "system".into(),
                content: Some(default_system_prompt.into()),
                tool_calls: None,
                tool_call_id: None,
                name: None,
            }],
            config: vec![],
        }
    }

    // Methods for API key handling
    pub fn api_base_url(&self) -> &str {
        &self.api_base_url
    }

    pub fn set_api_key(&self, _key: String) -> Result<(), String> {
        // For tests, we'd need interior mutability
        // In a real implementation this would store the key
        Ok(())
    }

    pub fn get_api_key(&self) -> Option<String> {
        // Try to get from environment variable first
        match std::env::var("WAVS_ENV_OPENAI_API_KEY") {
            Ok(key) => Some(key),
            Err(_) => None, // Just return None if not found
        }
    }

    pub fn set_api_base_url(&self, _url: String) -> Result<(), String> {
        // For tests, we'd need interior mutability
        // In a real implementation this would store the URL
        Ok(())
    }

    pub fn default_options(&self) -> LlmOptions {
        LlmOptions {
            temperature: 0.7,
            top_p: 0.9,
            seed: 42,
            max_tokens: Some(DEFAULT_MAX_TOKENS),
            context_window: Some(4096),
        }
    }

    pub fn options(
        &self,
        temp: f32,
        top_p: f32,
        seed: u32,
        max_tokens: Option<u32>,
        context_window: Option<u32>,
    ) -> LlmOptions {
        LlmOptions { temperature: temp, top_p, seed, max_tokens, context_window }
    }

    pub fn parse_config(&self, json: String) -> Result<Config, String> {
        // Now that Config implements Deserialize, we can directly deserialize from the JSON string
        match serde_json::from_str::<Config>(&json) {
            Ok(config) => Ok(config),
            Err(e) => Err(format!("Failed to parse Config JSON: {}", e)),
        }
    }
}

impl config::GuestConfigManager for ConfigManagerImpl {
    fn load(&self) -> Result<Config, String> {
        // Check if CONFIG_URI environment variable is set
        if let Ok(config_uri) = env::var("config_uri") {
            println!("Loading config from URI: {}", config_uri);

            self.load_from_uri(config_uri)
        } else {
            println!("No CONFIG_URI found, using default configuration");
            Ok(self.default_config())
        }
    }

    fn load_from_uri(&self, uri: String) -> Result<Config, String> {
        // Strip any quotation marks from the URI
        let clean_uri = uri.trim_matches('"');

        println!("Loading config from URI: {}", clean_uri);

        // Check URI scheme
        if let Some(uri_with_scheme) = clean_uri.strip_prefix("ipfs://") {
            // IPFS URI scheme detected
            Err(format!("IPFS loading not implemented yet: {}", uri_with_scheme))
        } else if clean_uri.starts_with("http://") || clean_uri.starts_with("https://") {
            // HTTP URI scheme detected
            Err(format!("HTTP loading not implemented yet: {}", clean_uri))
        } else {
            // Only support http/https and ipfs URIs
            Err(format!("Unsupported URI scheme: {}", clean_uri))
        }
    }

    fn from_json(&self, json: String) -> Result<Config, AgentError> {
        let config = serde_json::from_str(&json).map_err(|e| {
            AgentError::Configuration(format!("Failed to parse Config JSON: {}", e))
        })?;

        // Validate the config
        self.validate()?;

        Ok(config)
    }

    fn to_json(&self) -> Result<String, String> {
        let config = match &self.config {
            Some(c) => c,
            None => &self.default_config(),
        };

        serde_json::to_string_pretty(config)
            .map_err(|e| format!("Failed to serialize Config to JSON: {}", e))
    }

    fn format_contract_descriptions(&self) -> String {
        let config = match &self.config {
            Some(c) => c,
            None => &self.default_config(),
        };

        config
            .contracts
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

    fn get_contract_by_name(&self, name: String) -> Option<Contract> {
        let config = match &self.config {
            Some(c) => c,
            None => &self.default_config(),
        };

        config.contracts.iter().find(|c| c.name.to_lowercase() == name.to_lowercase()).cloned()
    }

    fn validate(&self) -> Result<(), AgentError> {
        let config = match &self.config {
            Some(c) => c,
            None => &self.default_config(),
        };

        // Check each contract for required fields
        for (i, contract) in config.contracts.iter().enumerate() {
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

        // Check for any required config items (none yet, but can be added)

        Ok(())
    }
}

// Helper function to create a default contract for testing
fn create_default_contract() -> Contract {
    Contract {
        name: "USDC".into(),
        address: "0xb7278a61aa25c888815afc32ad3cc52ff24fe575".into(),
        abi: r#"[{"type":"function","name":"transfer","inputs":[{"name":"to","type":"address","internalType":"address"},{"name":"value","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"bool","internalType":"bool"}],"stateMutability":"nonpayable"}]"#.into(),
        description: Some("USDC is a stablecoin pegged to the US Dollar".into()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_config_manager_new() {
        let manager = ConfigManagerImpl::new();
        assert_eq!(manager.api_base_url(), DEFAULT_API_BASE_URL);
    }

    #[test]
    fn test_config_manager_get_set() {
        let manager = ConfigManagerImpl::new();

        // Test set_api_key and set_api_base_url - these just return Ok
        assert!(manager.set_api_key("test-api-key".to_string()).is_ok());
        assert!(manager.set_api_base_url("https://test-api.example.com".to_string()).is_ok());

        // We don't test get_api_key as it depends on the environment variable
        // We don't test api_base_url since our mock doesn't actually store changes
    }

    #[test]
    fn test_create_llm_options() {
        let manager = ConfigManagerImpl::new();

        // Test default options
        let default_options = manager.default_options();
        assert_eq!(default_options.temperature, 0.7);
        assert_eq!(default_options.top_p, 0.9);
        assert!(default_options.max_tokens.is_some());

        // Test with custom values
        let custom_options = manager.options(0.5, 0.8, 42, Some(2000), Some(4096));
        assert_eq!(custom_options.temperature, 0.5);
        assert_eq!(custom_options.top_p, 0.8);
        assert_eq!(custom_options.seed, 42);
        assert_eq!(custom_options.max_tokens, Some(2000));
        assert_eq!(custom_options.context_window, Some(4096));
    }

    #[test]
    fn test_create_default_config() {
        let manager = ConfigManagerImpl::new();

        // Create a default config
        let config = manager.default_config();

        // Check basic config properties
        assert!(!config.contracts.is_empty());
        assert_eq!(config.model, DEFAULT_MODEL);
        assert!(!config.messages.is_empty());

        // Check options
        assert_eq!(config.llm_config.temperature, 0.0);
        assert_eq!(config.llm_config.top_p, 1.0);
    }

    #[test]
    fn test_parse_config_from_json() {
        let manager = ConfigManagerImpl::new();

        // Valid JSON config
        let json_config = r#"{
            "model": "gpt-4",
            "temperature": 0.8,
            "top_p": 0.95,
            "seed": 123,
            "max_tokens": 2048,
            "context_window": 8192,
            "messages": [
                {
                    "role": "system",
                    "content": "You are a helpful assistant."
                }
            ]
        }"#;

        let config_result = manager.parse_config(json_config.to_string());
        assert!(config_result.is_ok());

        let config = config_result.unwrap();
        assert_eq!(config.model, "gpt-4");
        assert_eq!(config.llm_config.temperature, 0.8);
        assert_eq!(config.llm_config.top_p, 0.95);
        assert_eq!(config.llm_config.seed, 123);
        assert_eq!(config.llm_config.max_tokens, Some(2048));
        assert_eq!(config.llm_config.context_window, Some(8192));

        assert_eq!(config.messages.len(), 1);
        assert_eq!(config.messages[0].role, "system");
        assert_eq!(config.messages[0].content, Some("You are a helpful assistant.".to_string()));

        // Invalid JSON config
        let invalid_json = "{invalid: json}";
        let invalid_result = manager.parse_config(invalid_json.to_string());
        assert!(invalid_result.is_err());
    }
}
