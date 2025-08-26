//! Type definitions for the wavs_llm package
//!
//! This module provides convenient access to common types used throughout the library.

// Re-export LlmOptions from config module for cleaner API access
pub use crate::config::LlmOptions;

// Re-export the builder for convenience
pub use crate::config::LlmOptionsBuilder;
