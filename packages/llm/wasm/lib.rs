// TODO figure out how to not generate bindings
// #[allow(warnings)]
// mod bindings;
pub mod client;
pub mod config;
pub mod contracts;
pub mod encoding;
pub mod errors;
pub mod tools;
mod wit;

// Re-export commonly used types for easier access
pub use config::{ConfigManagerImpl, LlmOptionsFuncsImpl};
pub use tools::ToolsBuilderImpl;

// Re-export the AgentError type for error handling
pub use wit::exports::wavs::agent::errors::AgentError;

// Re-export types from bindings that are needed by clients
pub mod types {
    pub use crate::wit::exports::wavs::agent::client::LlmClient;
    pub use crate::wit::exports::wavs::agent::types::{
        Config, Contract, CustomToolHandler, Function, LlmOptions, LlmResponse, Message, Tool,
        ToolCall, Transaction,
    };
}

// Re-export the traits from the bindings
pub mod traits {
    pub use crate::wit::exports::wavs::agent::client::GuestLlmClientManager;
    pub use crate::wit::exports::wavs::agent::config::GuestConfigManager;
    pub use crate::wit::exports::wavs::agent::contracts::GuestContractManager;
    pub use crate::wit::exports::wavs::agent::tools::GuestToolsBuilder;
}

// Main component for all exports
pub struct Component;

// Implementing each of the interfaces for our Component
impl wit::exports::wavs::agent::client::Guest for Component {
    type LlmClientManager = client::LlmClient;

    // Implement standalone constructor functions from the updated WIT
    fn new_client(
        model: String,
    ) -> Result<client::LlmClient, wit::exports::wavs::agent::errors::AgentError> {
        client::new_client(model)
    }

    fn from_json(
        model: String,
        json_config: String,
    ) -> Result<client::LlmClient, wit::exports::wavs::agent::errors::AgentError> {
        client::from_json(model, json_config)
    }

    fn with_config(
        model: String,
        config: wit::exports::wavs::agent::types::LlmOptions,
    ) -> Result<client::LlmClient, wit::exports::wavs::agent::errors::AgentError> {
        client::with_config(model, config)
    }
}

impl wit::exports::wavs::agent::config::Guest for Component {
    type LlmOptionsFuncs = config::LlmOptionsFuncsImpl;
    type ConfigManager = config::ConfigManagerImpl;
}

impl wit::exports::wavs::agent::contracts::Guest for Component {
    type ContractManager = contracts::ContractManagerImpl;
    type TransactionManager = contracts::TransactionManagerImpl;

    fn create_payload_from_tx(
        transaction: wit::exports::wavs::agent::types::Transaction,
    ) -> Result<String, wit::exports::wavs::agent::errors::AgentError> {
        // Delegate to our static implementation
        contracts::create_payload_from_tx(transaction)
    }
}

impl wit::exports::wavs::agent::tools::Guest for Component {
    type ToolsBuilder = tools::ToolsBuilderImpl;
}

// Add the missing types::Guest implementation
impl wit::exports::wavs::agent::types::Guest for Component {
    type CustomToolHandler = CustomToolHandlerImpl;
}

// A simple implementation of CustomToolHandler
pub struct CustomToolHandlerImpl;

impl wit::exports::wavs::agent::types::GuestCustomToolHandler for CustomToolHandlerImpl {
    fn can_handle(&self, _tool_name: String) -> bool {
        // Placeholder implementation - doesn't handle any tools
        false
    }

    fn execute(
        &self,
        _tool_call: wit::exports::wavs::agent::types::ToolCall,
    ) -> Result<String, String> {
        // Placeholder implementation
        Err("Custom tool handling not implemented".into())
    }
}

// Export the component
wit::export!(Component with_types_in wit);
