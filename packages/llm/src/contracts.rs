use crate::config::Config;
use crate::encoding::encode_function_args;
use crate::errors::AgentError;
use alloy_json_abi::{Function, JsonAbi};
use alloy_primitives::{Bytes, U256};
use serde::{Deserialize, Serialize};
use std::str::FromStr;

/// Represents a smart contract that the DAO can interact with
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Contract {
    pub name: String,
    pub address: String,
    pub abi: String,                 // JSON ABI string
    pub description: Option<String>, // Optional description of what the contract does
}

/// Represents a contract function call
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ContractCall {
    pub function: String,
    pub args: Vec<serde_json::Value>,
}

/// Helper methods for working with contracts
impl Contract {
    /// Create a new Contract instance
    pub fn new(name: &str, address: &str, abi: &str) -> Self {
        Self {
            name: name.to_string(),
            address: address.to_string(),
            abi: abi.to_string(),
            description: None,
        }
    }

    /// Create a new Contract instance with description
    pub fn new_with_description(name: &str, address: &str, abi: &str, description: &str) -> Self {
        Self {
            name: name.to_string(),
            address: address.to_string(),
            abi: abi.to_string(),
            description: Some(description.to_string()),
        }
    }

    /// Parse the JSON ABI to JsonAbi struct
    fn parse_abi(&self) -> Result<JsonAbi, AgentError> {
        serde_json::from_str(&self.abi)
            .map_err(|e| AgentError::Contract(format!("Failed to parse ABI: {}", e)))
    }

    /// Encode a function call for this contract using the ABI
    pub fn encode_function_call(
        &self,
        function_name: &str,
        args: &[serde_json::Value],
    ) -> Result<Bytes, AgentError> {
        // Find the function in the parsed ABI
        let function = self.find_function(function_name)?;

        // Get function selector
        let selector = function.selector();

        // Encode the arguments
        let encoded_args = encode_function_args(&function, args)?;

        // Combine selector and encoded args
        let mut calldata = selector.to_vec();
        calldata.extend_from_slice(&encoded_args);

        Ok(Bytes::from(calldata))
    }

    /// Find a function in the ABI
    pub fn find_function(&self, function_name: &str) -> Result<Function, AgentError> {
        let json_abi = self.parse_abi()?;

        json_abi.functions().find(|f| f.name == function_name).cloned().ok_or_else(|| {
            AgentError::Contract(format!("Function '{}' not found in ABI", function_name))
        })
    }

    /// Validate function arguments against the ABI
    pub fn validate_function_call(
        &self,
        function_name: &str,
        args: &[serde_json::Value],
    ) -> Result<(), AgentError> {
        // Find the function in the ABI
        let function = self.find_function(function_name)?;

        // Check argument count
        if function.inputs.len() != args.len() {
            return Err(AgentError::Contract(format!(
                "Function '{}' expects {} arguments, but {} were provided",
                function_name,
                function.inputs.len(),
                args.len()
            )));
        }

        // Try encoding the arguments - if it fails, it's invalid
        encode_function_args(&function, args)?;

        Ok(())
    }
}

/// Represents a transaction to be executed through a wallet
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Transaction {
    pub to: String,
    pub value: String, // Using string to handle large numbers safely
    pub contract_call: Option<ContractCall>, // JSON representation of the call to encode
    pub data: String,  // Will be populated after encoding
    pub description: String, // LLM's explanation of the transaction
}

impl Transaction {
    /// Basic validation of transaction fields
    pub fn is_valid(&self) -> bool {
        // Check destination address format
        if self.to.len() != 42 || !self.to.starts_with("0x") {
            return false;
        }

        // Check if value is a valid number
        if U256::from_str(&self.value).is_err() {
            return false;
        }

        // Check if contract call is coherent
        if let Some(call) = &self.contract_call {
            if call.function.is_empty() {
                return false;
            }
        }

        true
    }

    /// Validate a transaction
    pub fn validate_transaction(tx: &Transaction) -> Result<(), AgentError> {
        // Basic validation
        if tx.to.len() != 42 || !tx.to.starts_with("0x") {
            return Err(AgentError::Transaction("Invalid destination address".to_string()));
        }

        // Ensure value is a valid number
        if let Err(e) = U256::from_str(&tx.value) {
            return Err(AgentError::Transaction(format!("Invalid value: {}", e)));
        }

        // Get Config to look up contracts
        let config = Config::default();

        // If there's a contract call, validate its arguments
        if let Some(contract_call) = &tx.contract_call {
            // Find the contract
            let contract = config
                .contracts
                .iter()
                .find(|c| c.address.to_lowercase() == tx.to.to_lowercase())
                .ok_or_else(|| {
                    AgentError::Contract(format!("Unknown contract at address: {}", tx.to))
                })?;

            // Validate the function call using the contract
            contract.validate_function_call(&contract_call.function, &contract_call.args)?;
        }

        Ok(())
    }

    // /// Helper function to create a TransactionPayload from a Transaction
    // pub fn create_payload_from_tx(tx: &Transaction) -> Result<TransactionPayload, AgentError> {
    //     // Parse address
    //     let to: Address = tx
    //         .to
    //         .parse()
    //         .map_err(|e| AgentError::Transaction(format!("Invalid address: {}", e)))?;

    //     // Parse value
    //     let value = U256::from_str(&tx.value)
    //         .map_err(|e| AgentError::Transaction(format!("Invalid value: {}", e)))?;

    //     // Handle contract calls
    //     let data = if let Some(contract_call) = &tx.contract_call {
    //         // Get contract details from the Config
    //         let config = Config::default();

    //         // Try to find the contract by address
    //         let contract = config
    //             .contracts
    //             .iter()
    //             .find(|c| c.address.to_lowercase() == tx.to.to_lowercase())
    //             .ok_or_else(|| {
    //                 AgentError::Contract(format!("Cannot find contract at address {}", tx.to))
    //             })?;

    //         // Use the contract to encode the function call
    //         contract.encode_function_call(&contract_call.function, &contract_call.args)?
    //     } else {
    //         Bytes::default()
    //     };

    //     Ok(TransactionPayload { to, value, data })
    // }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_contract_creation() {
        // Test basic constructor
        let contract = Contract::new(
            "TestContract",
            "0x1234567890123456789012345678901234567890",
            "[{\"name\":\"test\",\"type\":\"function\",\"inputs\":[],\"outputs\":[]}]",
        );

        assert_eq!(contract.name, "TestContract");
        assert_eq!(contract.address, "0x1234567890123456789012345678901234567890");
        assert_eq!(
            contract.abi,
            "[{\"name\":\"test\",\"type\":\"function\",\"inputs\":[],\"outputs\":[]}]"
        );
        assert!(contract.description.is_none());

        // Test constructor with description
        let contract_with_desc = Contract::new_with_description(
            "TestContract",
            "0x1234567890123456789012345678901234567890",
            "[{\"name\":\"test\",\"type\":\"function\",\"inputs\":[],\"outputs\":[]}]",
            "Test contract description",
        );

        assert_eq!(contract_with_desc.name, "TestContract");
        assert_eq!(contract_with_desc.address, "0x1234567890123456789012345678901234567890");
        assert_eq!(contract_with_desc.description.unwrap(), "Test contract description");
    }

    #[test]
    fn test_parse_abi() {
        // Valid ABI
        let contract = Contract::new(
            "TestContract",
            "0x1234567890123456789012345678901234567890",
            r#"[{
                "name": "transfer",
                "type": "function",
                "inputs": [
                    {"name": "to", "type": "address"},
                    {"name": "amount", "type": "uint256"}
                ],
                "outputs": [{"name": "", "type": "bool"}]
            }]"#,
        );

        let abi_result = contract.parse_abi();
        assert!(abi_result.is_ok());
        let abi = abi_result.unwrap();

        // Check that the ABI was parsed successfully
        let functions: Vec<_> = abi.functions().collect();
        assert_eq!(functions.len(), 1);
        assert_eq!(functions[0].name, "transfer");

        // Invalid ABI (malformed JSON)
        let invalid_contract = Contract::new(
            "TestContract",
            "0x1234567890123456789012345678901234567890",
            "{invalid-json",
        );

        let invalid_abi = invalid_contract.parse_abi();
        assert!(invalid_abi.is_err());
    }

    #[test]
    fn test_find_function() {
        let contract = Contract::new(
            "TestContract",
            "0x1234567890123456789012345678901234567890",
            r#"[{
                "name": "transfer",
                "type": "function",
                "inputs": [
                    {"name": "to", "type": "address"},
                    {"name": "amount", "type": "uint256"}
                ],
                "outputs": [{"name": "", "type": "bool"}]
            },
            {
                "name": "balanceOf",
                "type": "function",
                "inputs": [
                    {"name": "account", "type": "address"}
                ],
                "outputs": [{"name": "", "type": "uint256"}]
            }]"#,
        );

        // Find existing function
        let transfer_result = contract.find_function("transfer");
        assert!(transfer_result.is_ok());
        let transfer = transfer_result.unwrap();
        assert_eq!(transfer.name, "transfer");
        assert_eq!(transfer.inputs.len(), 2);

        // Find another existing function
        let balance_result = contract.find_function("balanceOf");
        assert!(balance_result.is_ok());
        let balance = balance_result.unwrap();
        assert_eq!(balance.name, "balanceOf");
        assert_eq!(balance.inputs.len(), 1);

        // Function not found
        let missing_result = contract.find_function("nonExistentFunction");
        assert!(missing_result.is_err());
    }

    #[test]
    fn test_validate_function_call() {
        let contract = Contract::new(
            "TestContract",
            "0x1234567890123456789012345678901234567890",
            r#"[{
                "name": "transfer",
                "type": "function",
                "inputs": [
                    {"name": "to", "type": "address"},
                    {"name": "amount", "type": "uint256"}
                ],
                "outputs": [{"name": "", "type": "bool"}]
            }]"#,
        );

        // Valid arguments
        let valid_args = vec![
            json!("0x1234567890123456789012345678901234567890"),
            json!("1000000000000000000"), // 1 ETH in wei
        ];
        let result = contract.validate_function_call("transfer", &valid_args);
        assert!(result.is_ok());

        // Wrong number of arguments
        let too_few_args = vec![json!("0x1234567890123456789012345678901234567890")];
        let result = contract.validate_function_call("transfer", &too_few_args);
        assert!(result.is_err());

        // Wrong argument type (e.g., invalid address)
        let invalid_args = vec![json!("not-an-address"), json!("1000000000000000000")];
        let result = contract.validate_function_call("transfer", &invalid_args);
        assert!(result.is_err());
    }

    #[test]
    fn test_transaction_is_valid() {
        // Valid transaction
        let valid_tx = Transaction {
            to: "0x1234567890123456789012345678901234567890".to_string(),
            value: "1000000000000000000".to_string(), // 1 ETH
            contract_call: Some(ContractCall {
                function: "transfer".to_string(),
                args: vec![
                    json!("0x0987654321098765432109876543210987654321"),
                    json!("500000000000000000"), // 0.5 ETH
                ],
            }),
            data: "0x".to_string(),
            description: "Test transaction".to_string(),
        };
        assert!(valid_tx.is_valid());

        // Invalid address
        let invalid_address_tx = Transaction {
            to: "invalid-address".to_string(),
            value: "1000000000000000000".to_string(),
            contract_call: None,
            data: "0x".to_string(),
            description: "Invalid address transaction".to_string(),
        };
        assert!(!invalid_address_tx.is_valid());

        // Invalid value
        let invalid_value_tx = Transaction {
            to: "0x1234567890123456789012345678901234567890".to_string(),
            value: "not-a-number".to_string(),
            contract_call: None,
            data: "0x".to_string(),
            description: "Invalid value transaction".to_string(),
        };
        assert!(!invalid_value_tx.is_valid());

        // Invalid contract call (empty function name)
        let invalid_call_tx = Transaction {
            to: "0x1234567890123456789012345678901234567890".to_string(),
            value: "0".to_string(),
            contract_call: Some(ContractCall { function: "".to_string(), args: vec![] }),
            data: "0x".to_string(),
            description: "Invalid contract call transaction".to_string(),
        };
        assert!(!invalid_call_tx.is_valid());
    }
}
