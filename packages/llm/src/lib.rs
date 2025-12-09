pub mod client;
pub mod config;
pub mod contracts;
pub mod encoding;
pub mod errors;
pub mod tools;
pub mod types;

// Re-export the main client and message types for easy access
pub use client::{ChatRequest, LLMClient, LlmResponse, Message, StructuredChatRequest};

// Re-export configuration types
pub use config::{Config, LlmOptions, LlmOptionsBuilder};

// Re-export contract types for tool integration
pub use contracts::{Contract, ContractCall, Transaction};

// Re-export error types
pub use errors::{AgentError, LlmError};

// Re-export tool types
pub use tools::{CustomToolHandler, Function, Tool, ToolCall, ToolCallFunction, Tools};
