use thiserror::Error;

/// Error type for Agent operations
#[derive(Error, Debug)]
pub enum AgentError {
    /// Contract-related errors
    #[error("Contract error: {0}")]
    Contract(String),

    /// Transaction-related errors
    #[error("Transaction error: {0}")]
    Transaction(String),

    /// Configuration-related errors
    #[error("Configuration error: {0}")]
    Configuration(String),

    /// LLM-related errors
    #[error("LLM error: {0}")]
    Llm(String),

    /// Context loading-related errors
    #[error("Context loading error: {0}")]
    ContextLoading(String),

    /// Context validation errors
    #[error("Context validation error: {0}")]
    ContextValidation(String),

    /// Configuration errors
    #[error("Config error: {0}")]
    Config(String),

    /// API request errors
    #[error("API error: {0}")]
    Api(String),

    /// HTTP request errors
    #[error("HTTP error: {0}")]
    Http(String),

    /// External service errors
    #[error("External service error: {0}")]
    ExternalService(String),

    /// Generic errors
    #[error("{0}")]
    Other(String),

    /// IO errors from std::io
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    /// JSON serialization/deserialization errors
    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),

    /// UTF-8 decoding errors
    #[error("UTF-8 error: {0}")]
    Utf8(#[from] std::str::Utf8Error),
}

// Implement conversion from string errors to AgentError
impl From<String> for AgentError {
    fn from(error: String) -> Self {
        AgentError::Other(error)
    }
}

// Implement conversion from &str to AgentError
impl From<&str> for AgentError {
    fn from(error: &str) -> Self {
        AgentError::Other(error.to_string())
    }
}
