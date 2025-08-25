use crate::wit::exports::wavs::agent::errors::AgentError;

// Add additional error type for NotImplemented
impl AgentError {
    pub fn not_implemented(message: impl Into<String>) -> Self {
        AgentError::Other(message.into())
    }
}

// Convenience method for creating NotImplemented errors
pub fn not_implemented(message: impl Into<String>) -> AgentError {
    AgentError::not_implemented(message)
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
