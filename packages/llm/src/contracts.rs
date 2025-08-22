use crate::encoding;
use crate::wit::exports::wavs::agent::contracts::{self};
use crate::wit::exports::wavs::agent::errors::AgentError;
use crate::wit::exports::wavs::agent::types::{Contract, Transaction};
use serde_json::{self, Value};

// Implementation for ContractManager
pub struct ContractManagerImpl;

impl contracts::GuestContractManager for ContractManagerImpl {
    fn new(&self, name: String, address: String, abi: String) -> Contract {
        Contract { name, address, abi, description: None }
    }

    fn new_with_description(
        &self,
        name: String,
        address: String,
        abi: String,
        description: String,
    ) -> Contract {
        Contract { name, address, abi, description: Some(description) }
    }

    fn parse_abi(&self, contract: Contract) -> Result<String, AgentError> {
        // Parse the ABI to ensure it's valid JSON
        match serde_json::from_str::<Value>(&contract.abi) {
            Ok(json_value) => {
                // Format the ABI for better readability
                serde_json::to_string_pretty(&json_value)
                    .map_err(|e| AgentError::Contract(format!("Failed to format ABI: {}", e)))
            }
            Err(e) => Err(AgentError::Contract(format!("Failed to parse ABI: {}", e))),
        }
    }

    fn encode_function_call(
        &self,
        contract: Contract,
        function_name: String,
        args: Vec<String>,
    ) -> Result<Vec<u8>, AgentError> {
        // Find the function definition in the ABI
        let function = self.find_function(contract.clone(), function_name.clone())?;

        println!("Function: {}", function);

        // Parse the function definition
        let function_json: Value = serde_json::from_str(&function)
            .map_err(|e| AgentError::Contract(format!("Invalid function JSON: {}", e)))?;

        println!("Function JSON: {}", function_json);

        // Parse args to serde_json::Value objects
        let args_values: Result<Vec<Value>, _> =
            args.iter().map(|arg| serde_json::from_str(arg)).collect();

        println!("Args values: {:?}", args_values);

        let args_values = args_values
            .map_err(|e| AgentError::Contract(format!("Invalid argument format: {}", e)))?;

        println!("Args values: {:?}", args_values);

        // Use the encoding module to encode the function call
        encoding::encode_function_call(&function_json, &args_values)
            .map_err(|e| AgentError::Contract(format!("Function encoding error: {}", e)))
    }

    fn find_function(
        &self,
        contract: Contract,
        function_name: String,
    ) -> Result<String, AgentError> {
        // Parse the ABI
        let abi: Value = serde_json::from_str(&contract.abi)
            .map_err(|e| AgentError::Contract(format!("Failed to parse ABI: {}", e)))?;

        // The ABI should be an array of function definitions
        let functions =
            abi.as_array().ok_or_else(|| AgentError::Contract("ABI is not an array".into()))?;

        // Find the function with matching name
        for func in functions {
            if func["type"] == "function" && func["name"] == function_name {
                return Ok(serde_json::to_string(func).map_err(|e| {
                    AgentError::Contract(format!("Failed to serialize function: {}", e))
                })?);
            }
        }

        // Function not found
        Err(AgentError::Contract(format!("Function '{}' not found in ABI", function_name)))
    }

    fn validate_function_call(
        &self,
        contract: Contract,
        function_name: String,
        args: Vec<String>,
    ) -> Result<(), AgentError> {
        // Find the function first
        let function = self.find_function(contract.clone(), function_name.clone())?;

        // Parse the function JSON
        let function_json: Value = serde_json::from_str(&function)
            .map_err(|e| AgentError::Contract(format!("Invalid function JSON: {}", e)))?;

        // Get the function inputs from the definition
        let inputs = function_json["inputs"]
            .as_array()
            .ok_or_else(|| AgentError::Contract("Function has no inputs field".into()))?;

        // Check if argument count matches
        if inputs.len() != args.len() {
            return Err(AgentError::Contract(format!(
                "Function '{}' expects {} arguments, but {} were provided",
                function_name,
                inputs.len(),
                args.len()
            )));
        }

        // Try to encode the arguments to verify they're valid
        self.encode_function_call(contract, function_name, args)?;

        Ok(())
    }
}

// Static helper function for is_valid
pub fn is_valid_transaction(transaction: Transaction) -> bool {
    // Check destination address format
    if transaction.to.len() != 42 || !transaction.to.starts_with("0x") {
        return false;
    }

    // Check if value is a valid number
    if transaction.value.parse::<u128>().is_err() {
        return false;
    }

    // Check if contract call is coherent
    if let Some(call) = &transaction.contract_call {
        if call.function.is_empty() {
            return false;
        }
    }

    true
}

// Static helper function for validate_transaction
pub fn validate_transaction_standalone(transaction: Transaction) -> Result<(), AgentError> {
    // Basic validation
    if !is_valid_transaction(transaction.clone()) {
        return Err(AgentError::Transaction("Invalid transaction".into()));
    }

    // More thorough validation
    if transaction.to.len() != 42 || !transaction.to.starts_with("0x") {
        return Err(AgentError::Transaction("Invalid destination address".into()));
    }

    if transaction.value.parse::<u128>().is_err() {
        return Err(AgentError::Transaction("Invalid value".into()));
    }

    // If there's a contract call, validate it
    if let Some(contract_call) = &transaction.contract_call {
        if contract_call.function.is_empty() {
            return Err(AgentError::Transaction("Empty function name".into()));
        }

        // In a complete implementation, we would validate args against the ABI
        // But we'd need to look up the contract ABI from somewhere
    }

    Ok(())
}

// Static helper function for create_payload_from_tx
pub fn create_payload_from_tx(transaction: Transaction) -> Result<String, AgentError> {
    // Validate the transaction
    validate_transaction_standalone(transaction.clone())?;

    // Prepare the payload structure
    let mut payload = serde_json::json!({
        "to": transaction.to,
        "value": transaction.value,
        "data": transaction.data,
    });

    // If there's a contract call, we would encode it here
    if let Some(contract_call) = transaction.contract_call {
        // Generate a description of the call
        payload["description"] = serde_json::json!(format!(
            "Calling {} with args: {}",
            contract_call.function,
            contract_call.args.join(", ")
        ));
    } else {
        payload["description"] = serde_json::json!(transaction.description);
    }

    // Serialize the payload to a JSON string
    serde_json::to_string(&payload).map_err(|e| {
        AgentError::Transaction(format!("Failed to serialize transaction payload: {}", e))
    })
}

// A minimal struct just to provide WIT interface compatibility.
// This is only needed because the WIT defines these functions as methods on a resource.
// For actual usage, prefer the standalone functions above.
#[derive(Default)]
pub struct TransactionManagerImpl;

// Implementation that delegates to the standalone functions
impl contracts::GuestTransactionManager for TransactionManagerImpl {
    fn is_valid(&self, transaction: Transaction) -> bool {
        // Delegate to static helper function that doesn't need self
        is_valid_transaction(transaction)
    }

    fn validate_transaction(&self, transaction: Transaction) -> Result<(), AgentError> {
        // Delegate to static helper function that doesn't need self
        validate_transaction_standalone(transaction)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::wit::exports::wavs::agent::contracts::{
        GuestContractManager, GuestTransactionManager,
    };
    use crate::wit::exports::wavs::agent::types::{ContractCall, Transaction};

    fn get_sample_contract() -> Contract {
        Contract {
            name: "TestToken".into(),
            address: "0x1234567890123456789012345678901234567890".into(),
            abi: r#"[
                {
                    "constant": false,
                    "inputs": [
                        {
                            "name": "to",
                            "type": "address"
                        },
                        {
                            "name": "value",
                            "type": "uint256"
                        }
                    ],
                    "name": "transfer",
                    "outputs": [
                        {
                            "name": "",
                            "type": "bool"
                        }
                    ],
                    "payable": false,
                    "stateMutability": "nonpayable",
                    "type": "function"
                }
            ]"#
            .into(),
            description: Some("A test ERC20 token".into()),
        }
    }

    #[test]
    fn test_contract_creation() {
        let manager = ContractManagerImpl;
        let contract = manager.new(
            "TestToken".into(),
            "0x1234567890123456789012345678901234567890".into(),
            "[]".into(),
        );

        assert_eq!(contract.name, "TestToken");
        assert_eq!(contract.address, "0x1234567890123456789012345678901234567890");
        assert_eq!(contract.abi, "[]");
        assert_eq!(contract.description, None);

        let contract_with_desc = manager.new_with_description(
            "TestToken".into(),
            "0x1234567890123456789012345678901234567890".into(),
            "[]".into(),
            "A test token".into(),
        );

        assert_eq!(contract_with_desc.description, Some("A test token".into()));
    }

    #[test]
    fn test_parse_abi() {
        let manager = ContractManagerImpl;
        let contract = get_sample_contract();

        let result = manager.parse_abi(contract);
        assert!(result.is_ok());

        // Should be valid JSON
        let parsed: Result<serde_json::Value, _> = serde_json::from_str(&result.unwrap());
        assert!(parsed.is_ok());
    }

    #[test]
    fn test_find_function() {
        let manager = ContractManagerImpl;
        let contract = get_sample_contract();

        // Test finding an existing function
        let result = manager.find_function(contract.clone(), "transfer".into());
        assert!(result.is_ok());

        // Test finding a non-existing function
        let error_result = manager.find_function(contract, "nonExistentFunction".into());
        assert!(error_result.is_err());
    }

    #[test]
    fn test_transaction_validation() {
        let manager = TransactionManagerImpl;

        // Valid transaction
        let valid_tx = Transaction {
            to: "0x1234567890123456789012345678901234567890".into(),
            value: "1000000000000000000".into(), // 1 ETH
            data: "0x".into(),
            description: "Test transaction".into(),
            contract_call: None,
        };

        // Test both instance method and static helper function
        assert!(manager.is_valid(valid_tx.clone()));
        assert!(is_valid_transaction(valid_tx.clone()));
        assert!(manager.validate_transaction(valid_tx.clone()).is_ok());
        assert!(validate_transaction_standalone(valid_tx).is_ok());

        // Invalid address
        let invalid_addr_tx = Transaction {
            to: "invalid-address".into(),
            value: "1000000000000000000".into(),
            data: "0x".into(),
            description: "Test transaction".into(),
            contract_call: None,
        };

        // Test both instance method and static helper function
        assert!(!manager.is_valid(invalid_addr_tx.clone()));
        assert!(!is_valid_transaction(invalid_addr_tx.clone()));
        assert!(manager.validate_transaction(invalid_addr_tx.clone()).is_err());
        assert!(validate_transaction_standalone(invalid_addr_tx).is_err());

        // Invalid value
        let invalid_value_tx = Transaction {
            to: "0x1234567890123456789012345678901234567890".into(),
            value: "not-a-number".into(),
            data: "0x".into(),
            description: "Test transaction".into(),
            contract_call: None,
        };

        // Test both instance method and static helper function
        assert!(!manager.is_valid(invalid_value_tx.clone()));
        assert!(!is_valid_transaction(invalid_value_tx.clone()));
        assert!(manager.validate_transaction(invalid_value_tx.clone()).is_err());
        assert!(validate_transaction_standalone(invalid_value_tx).is_err());

        // With contract call
        let contract_tx = Transaction {
            to: "0x1234567890123456789012345678901234567890".into(),
            value: "0".into(),
            data: "0x".into(),
            description: "Contract call".into(),
            contract_call: Some(ContractCall {
                function: "transfer".into(),
                args: vec!["0xabcdef1234567890abcdef1234567890abcdef12".into(), "1000".into()],
            }),
        };

        // Test both instance method and static helper function
        assert!(manager.is_valid(contract_tx.clone()));
        assert!(is_valid_transaction(contract_tx.clone()));
        assert!(manager.validate_transaction(contract_tx.clone()).is_ok());
        assert!(validate_transaction_standalone(contract_tx).is_ok());
    }

    #[test]
    fn test_create_payload_from_tx() {
        // Simple ETH transfer
        let eth_tx = Transaction {
            to: "0x1234567890123456789012345678901234567890".into(),
            value: "1000000000000000000".into(), // 1 ETH
            data: "0x".into(),
            description: "Test ETH transfer".into(),
            contract_call: None,
        };

        // Test the standalone function
        let payload_result = create_payload_from_tx(eth_tx);

        assert!(payload_result.is_ok());

        let payload = payload_result.unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&payload).unwrap();

        assert_eq!(parsed["to"], "0x1234567890123456789012345678901234567890");
        assert_eq!(parsed["value"], "1000000000000000000");
        assert_eq!(parsed["description"], "Test ETH transfer");

        // Contract call
        let contract_tx = Transaction {
            to: "0x1234567890123456789012345678901234567890".into(),
            value: "0".into(),
            data: "0x".into(),
            description: "Contract call".into(),
            contract_call: Some(ContractCall {
                function: "transfer".into(),
                args: vec!["0xabcdef1234567890abcdef1234567890abcdef12".into(), "1000".into()],
            }),
        };

        // Test the standalone function
        let contract_payload_result = create_payload_from_tx(contract_tx);

        assert!(contract_payload_result.is_ok());

        let contract_payload = contract_payload_result.unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&contract_payload).unwrap();

        assert_eq!(parsed["to"], "0x1234567890123456789012345678901234567890");
        assert_eq!(parsed["value"], "0");
        assert!(parsed["description"].as_str().unwrap().contains("transfer"));
    }
}
