use thiserror::Error;

/// Error type for LLM operations
#[derive(Error, Debug)]
pub enum LlmError {
    /// Configuration errors
    #[error("Configuration error: {0}")]
    ConfigError(String),

    /// Invalid input errors
    #[error("Invalid input: {0}")]
    InvalidInput(String),

    /// HTTP request errors
    #[error("Request error: {0}")]
    RequestError(String),

    /// API response errors
    #[error("API error: {0}")]
    ApiError(String),

    /// Parsing errors
    #[error("Parse error: {0}")]
    ParseError(String),

    /// Image encoding errors
    #[error("Image encoding error: {0}")]
    ImageError(String),

    /// IO errors
    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),
}

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

// Implement a conversion from AgentError to String
impl From<AgentError> for String {
    fn from(error: AgentError) -> Self {
        match error {
            AgentError::Llm(msg) => format!("LLM error: {}", msg),
            AgentError::Http(msg) => format!("HTTP error: {}", msg),
            AgentError::Config(msg) => format!("Config error: {}", msg),
            AgentError::Contract(msg) => format!("Contract error: {}", msg),
            AgentError::Transaction(msg) => format!("Transaction error: {}", msg),
            AgentError::Io(msg) => format!("IO error: {}", msg),
            AgentError::Json(msg) => format!("JSON error: {}", msg),
            AgentError::Utf8(msg) => format!("UTF8 error: {}", msg),
            AgentError::Other(msg) => format!("Other error: {}", msg),
            AgentError::Api(msg) => format!("API error: {}", msg),
            AgentError::ExternalService(msg) => format!("External service error: {}", msg),
            AgentError::Configuration(msg) => format!("Configuration error: {}", msg),
            AgentError::ContextLoading(msg) => format!("Context loading error: {}", msg),
            AgentError::ContextValidation(msg) => format!("Context validation error: {}", msg),
        }
    }
}
