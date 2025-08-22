use crate::bindings::host::get_eth_chain_config;
use alloy_network::Ethereum;
use alloy_primitives::{Address, TxKind, U256};
use alloy_provider::{Provider, RootProvider};
use alloy_rpc_types::{eth::TransactionRequest, TransactionInput};
use alloy_sol_types::{sol, SolCall};
use serde::{Deserialize, Serialize};
use std::env;
use std::str::FromStr;
use wavs_llm::types::{Config, Contract, LlmOptions, Message};
use wavs_wasi_chain::ethereum::new_eth_provider;
use wavs_wasi_chain::http::{fetch_json, http_request_get};
use wstd::{http::HeaderValue, runtime::block_on};

// ERC20 interface definition using alloy-sol-types
sol! {
    interface IERC20 {
        function balanceOf(address owner) external view returns (uint256);
        function decimals() external view returns (uint8);
        function symbol() external view returns (string);
    }
}

/// Context for the DAO agent's decision making
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DaoContext {
    pub account_address: String,
    pub allowlisted_addresses: Vec<String>,
    pub supported_tokens: Vec<SupportedToken>,
    pub llm_context: Config,
}

impl DaoContext {
    /// Load context from environment variable CONFIG_URI or use default
    pub fn load() -> Result<Self, String> {
        block_on(async move {
            // Check if CONFIG_URI environment variable is set
            if let Ok(config_uri) = env::var("config_uri") {
                println!("Loading config from URI: {}", config_uri);

                Self::load_from_uri(&config_uri).await
            } else {
                println!("No CONFIG_URI found, using default configuration");
                Ok(Self::default())
            }
        })
    }

    /// Load context from a URI
    pub async fn load_from_uri(uri: &str) -> Result<Self, String> {
        // Strip any quotation marks from the URI
        let clean_uri = uri.trim_matches('"');

        println!("Loading config from URI: {}", clean_uri);

        // Check URI scheme
        if let Some(uri_with_scheme) = clean_uri.strip_prefix("ipfs://") {
            // IPFS URI scheme detected
            Self::load_from_ipfs(uri_with_scheme).await
        } else if clean_uri.starts_with("http://") || clean_uri.starts_with("https://") {
            // HTTP URI scheme detected
            Self::fetch_from_uri(clean_uri).await
        } else {
            // Only support http/https and ipfs URIs
            Err(format!("Unsupported URI scheme: {}", clean_uri))
        }
    }

    /// Load configuration from IPFS
    async fn load_from_ipfs(cid: &str) -> Result<Self, String> {
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
        Self::fetch_from_uri(&http_url).await
    }

    /// Fetch configuration from a HTTP/HTTPS URI
    async fn fetch_from_uri(uri: &str) -> Result<Self, String> {
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
        req.headers_mut().insert("Accept", HeaderValue::from_static("application/json"));

        println!("Sending HTTP request...");

        // Execute HTTP request and parse response as JSON directly to DaoContext
        let dao_context: DaoContext = fetch_json(req).await.unwrap();

        println!("Successfully loaded configuration");
        Ok(dao_context)
    }

    /// Create a new DaoContext from a JSON string
    pub fn from_json(json_str: &str) -> Result<Self, String> {
        // Directly deserialize the JSON to DaoContext
        serde_json::from_str(json_str)
            .map_err(|e| format!("Failed to parse context from JSON: {}", e))
    }

    /// Serialize the context to a JSON string
    pub fn to_json(&self) -> Result<String, String> {
        serde_json::to_string_pretty(self)
            .map_err(|e| format!("Failed to serialize context to JSON: {}", e))
    }

    /// Check if an address is in the allowed list
    pub fn is_address_allowed(&self, address: &str) -> bool {
        self.allowlisted_addresses.iter().any(|a| a.to_lowercase() == address.to_lowercase())
    }

    /// Get list of supported token symbols
    pub fn get_supported_token_symbols(&self) -> Vec<String> {
        self.supported_tokens.iter().map(|t| t.symbol.clone()).collect()
    }

    /// Query the ETH balance for this DAO's account
    pub async fn query_eth_balance(&self) -> Result<U256, String> {
        let chain_config = get_eth_chain_config("local").unwrap();
        let provider: RootProvider<Ethereum> =
            new_eth_provider::<Ethereum>(chain_config.http_endpoint.unwrap());

        let address = Address::from_str(&self.account_address)
            .map_err(|_| format!("Invalid address format: {}", self.account_address))?;

        provider
            .get_balance(address)
            .await
            .map_err(|e| format!("Failed to query ETH balance: {}", e))
    }

    /// Query an ERC20 token balance
    pub async fn query_token_balance(&self, token_address: &str) -> Result<TokenBalance, String> {
        let chain_config = get_eth_chain_config("local").unwrap();
        let provider: RootProvider<Ethereum> =
            new_eth_provider::<Ethereum>(chain_config.http_endpoint.unwrap());
        // Parse addresses
        let account = Address::from_str(&self.account_address)
            .map_err(|_| format!("Invalid account address format: {}", self.account_address))?;

        let token = Address::from_str(token_address)
            .map_err(|_| format!("Invalid token address format: {}", token_address))?;

        // Get token balance
        let balance_call = IERC20::balanceOfCall { owner: account };
        let balance_tx = TransactionRequest {
            to: Some(TxKind::Call(token)),
            input: TransactionInput { input: Some(balance_call.abi_encode().into()), data: None },
            ..Default::default()
        };

        let balance_result = provider
            .call(&balance_tx)
            .await
            .map_err(|e| format!("Failed to query token balance: {}", e))?;
        let balance = U256::from_be_slice(&balance_result);

        // Get token decimals
        let decimals_call = IERC20::decimalsCall {};
        let decimals_tx = TransactionRequest {
            to: Some(TxKind::Call(token)),
            input: TransactionInput { input: Some(decimals_call.abi_encode().into()), data: None },
            ..Default::default()
        };

        let decimals_result = provider
            .call(&decimals_tx)
            .await
            .map_err(|e| format!("Failed to query token decimals: {}", e))?;

        // Properly decode the decimals response (uint8)
        // The response should be a 32-byte value with the uint8 value in the last byte
        let decimals = if decimals_result.len() >= 32 {
            // Extract the last byte which contains the uint8 value
            decimals_result[31]
        } else {
            // Default to 18 if response is not as expected
            println!("Warning: Unexpected decimals response format, defaulting to 18");
            18
        };

        // Get token symbol
        let symbol_call = IERC20::symbolCall {};
        let symbol_tx = TransactionRequest {
            to: Some(TxKind::Call(token)),
            input: TransactionInput { input: Some(symbol_call.abi_encode().into()), data: None },
            ..Default::default()
        };

        let symbol_result = provider
            .call(&symbol_tx)
            .await
            .map_err(|e| format!("Failed to query token symbol: {}", e))?;

        // Parse the symbol from the result bytes (ABI-encoded string)
        let symbol = if symbol_result.len() > 64 {
            // The first 32 bytes are the offset, the next 32 bytes are the length
            let length = U256::from_be_slice(&symbol_result[32..64]).as_limbs()[0] as usize;
            if length > 0 && symbol_result.len() >= 64 + length {
                let symbol_bytes = &symbol_result[64..64 + length];
                String::from_utf8_lossy(symbol_bytes).to_string()
            } else {
                "UNKNOWN".to_string()
            }
        } else {
            "UNKNOWN".to_string()
        };

        // Create a TokenBalance
        Ok(TokenBalance {
            token_address: token_address.to_string(),
            symbol,
            balance: balance.to_string(),
            decimals,
        })
    }

    /// Query all supported token balances
    pub async fn query_all_token_balances(&self) -> Result<Vec<TokenBalance>, String> {
        let mut balances = Vec::new();

        // Query ETH balance
        let eth_balance = self.query_eth_balance().await?;
        balances.push(TokenBalance {
            token_address: "0x0000000000000000000000000000000000000000".to_string(),
            symbol: "ETH".to_string(),
            balance: eth_balance.to_string(),
            decimals: 18,
        });

        // Query each supported token
        for token in &self.supported_tokens {
            if token.symbol.to_uppercase() != "ETH" {
                match self.query_token_balance(&token.address).await {
                    Ok(balance) => balances.push(balance),
                    Err(e) => println!("Failed to query balance for {}: {}", token.symbol, e),
                }
            }
        }

        Ok(balances)
    }

    /// Format balances for display in the prompt with dynamic balance fetching
    pub async fn format_balances_dynamic(&self) -> String {
        match self.query_all_token_balances().await {
            Ok(balances) => {
                let mut result = Vec::new();
                for balance in balances {
                    result.push(format!(
                        "{} ({}): {} raw units = {} formatted (decimals: {})",
                        balance.symbol,
                        balance.token_address,
                        balance.balance,
                        balance.formatted_balance(),
                        balance.decimals
                    ));
                }
                result.join("\n")
            }
            Err(e) => {
                format!("Error fetching balances: {}", e)
            }
        }
    }

    /// Get the context with dynamically fetched balances
    pub fn get_context_with_balances(&self) -> String {
        block_on(async move {
            let supported_tokens = self.get_supported_token_symbols().join(", ");
            let balances = self.format_balances_dynamic().await;

            format!(
                r#"
Current DAO Context:
- Account Address: {}
- Current Balances:
{}
- Allowlisted Addresses: {}
- Supported Tokens: {} are supported. All other token requests should be rejected.
    "#,
                self.account_address,
                balances.lines().map(|line| format!("  {}", line)).collect::<Vec<_>>().join("\n"),
                self.allowlisted_addresses.join(", "),
                supported_tokens
            )
        })
    }
}

// Default implementation for testing and development
impl Default for DaoContext {
    fn default() -> Self {
        // Create a default LlmOptions
        let llm_options = LlmOptions {
            temperature: 0.0,
            top_p: 1.0,
            seed: 42,
            max_tokens: Some(500),
            context_window: Some(4096),
        };

        // System prompt for DAO operations
        let system_prompt = r#"
            You an agent responsible for helping the user execute smart contract transactions.

            You have several tools available:
            - Use the send_eth tool to send ETH to addresses
            - Use the contract_* tools to interact with smart contracts (including ERC20 tokens like USDC)
            
            TOKEN DECIMALS - CRITICAL INSTRUCTIONS:
            When a user requests to transfer tokens, you MUST convert the human-readable amount to the correct base units:
            
            - ETH has 18 decimals: 
              * 1 ETH = 1000000000000000000 wei (10^18)
              * 0.5 ETH = 500000000000000000 wei (5 * 10^17)
              * 0.1 ETH = 100000000000000000 wei (10^17)
              
            - USDC has 6 decimals:
              * 1 USDC = 1000000 base units (10^6)
              * 100 USDC = 100000000 base units (10^8)
              * 0.5 USDC = 500000 base units (5 * 10^5)
              
            Always multiply the human-readable amount by 10^(decimals) to get the correct token amount.
            For example:
            - If a user asks to "send 1 USDC," you must use "1000000" (one million) as the value
            - If a user asks to "donate 0.5 ETH," you must use "500000000000000000" as the value

            EXAMPLES:
            User: "Send 1 USDC to 0xDf3679681B87fAE75CE185e4f01d98b64Ddb64a3"
            Action: Use contract_usdc_transfer with value="1000000" (NOT "1")
            
            User: "Send 0.1 ETH to 0xDf3679681B87fAE75CE185e4f01d98b64Ddb64a3"
            Action: Use send_eth with value="100000000000000000"
            
            Security Guidelines:
            - Handle decimals correctly for the user's request
            - Never approve transactions that would spend more than the current balance
            - Reject unclear requests
            - If no action is needed or the request should be rejected, do not use any tools
            "#;

        // Create basic Config
        let llm_context = Config {
            model: "llama3.2".to_string(),
            llm_config: llm_options,
            messages: vec![Message {
                role: "system".into(),
                content: Some(system_prompt.into()),
                tool_calls: None,
                tool_call_id: None,
                name: None,
            }],
            contracts: vec![Contract {
                name: "USDC".into(),
                address: "0xb7278a61aa25c888815afc32ad3cc52ff24fe575".into(),
                abi: r#"[{"type":"function","name":"transfer","inputs":[{"name":"to","type":"address","internalType":"address"},{"name":"value","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"bool","internalType":"bool"}],"stateMutability":"nonpayable"}]"#.into(),
                description: Some("USDC is a stablecoin pegged to the US Dollar".into()),
            }],
            config: vec![],
        };

        Self {
            account_address: "0x47937d0d01b7d71201ca10138ebc14d22618ebce".to_string(),
            allowlisted_addresses: vec!["0xDf3679681B87fAE75CE185e4f01d98b64Ddb64a3.".to_string()],
            supported_tokens: vec![
                SupportedToken::new_with_description(
                    "0x0000000000000000000000000000000000000000",
                    "ETH",
                    18,
                    "Native Ethereum token",
                ),
                SupportedToken::new_with_description(
                    "0xb7278a61aa25c888815afc32ad3cc52ff24fe575",
                    "USDC",
                    6,
                    "USD Coin - a stablecoin pegged to the US Dollar",
                ),
            ],
            llm_context,
        }
    }
}

/// Represents a supported token in the DAO
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SupportedToken {
    pub address: String,
    pub symbol: String,
    pub decimals: u8,
    pub description: Option<String>,
}

impl SupportedToken {
    /// Create a new SupportedToken instance
    pub fn new(address: &str, symbol: &str, decimals: u8) -> Self {
        Self {
            address: address.to_string(),
            symbol: symbol.to_string(),
            decimals,
            description: None,
        }
    }

    /// Create a new SupportedToken instance with description
    pub fn new_with_description(
        address: &str,
        symbol: &str,
        decimals: u8,
        description: &str,
    ) -> Self {
        Self {
            address: address.to_string(),
            symbol: symbol.to_string(),
            decimals,
            description: Some(description.to_string()),
        }
    }
}

/// Represents a token balance
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenBalance {
    pub token_address: String,
    pub symbol: String,
    pub balance: String,
    pub decimals: u8,
}

/// Helper methods for token balances
impl TokenBalance {
    /// Create a new TokenBalance instance
    pub fn new(token_address: &str, symbol: &str, balance: &str, decimals: u8) -> Self {
        Self {
            token_address: token_address.to_string(),
            symbol: symbol.to_string(),
            balance: balance.to_string(),
            decimals,
        }
    }

    /// Format the balance for display with proper decimal places
    pub fn formatted_balance(&self) -> String {
        let raw_balance = self.balance.parse::<u128>().unwrap_or(0);
        let divisor = 10u128.pow(self.decimals as u32);

        if divisor == 0 {
            return format!("{}", raw_balance);
        }

        let whole_part = raw_balance / divisor;
        let decimal_part = raw_balance % divisor;

        // Format with proper decimal places
        if decimal_part == 0 {
            format!("{}", whole_part)
        } else {
            // Pad decimal part with leading zeros if needed
            let decimal_str = format!("{:0width$}", decimal_part, width = self.decimals as usize);
            // Trim trailing zeros
            let trimmed = decimal_str.trim_end_matches('0');
            if trimmed.is_empty() {
                format!("{}", whole_part)
            } else {
                format!("{}.{}", whole_part, trimmed)
            }
        }
    }
}
