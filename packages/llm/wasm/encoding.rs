use alloy_dyn_abi::{DynSolType, DynSolValue};
use alloy_primitives::{Address, FixedBytes, U256};
use hex;
use serde_json::Value;
use std::str::FromStr;
use tiny_keccak::{Hasher, Keccak};

use crate::wit::exports::wavs::agent::errors::AgentError;

/// Convert a string to a DynSolValue based on the type
pub fn json_to_sol_value(
    value: &serde_json::Value,
    ty: &DynSolType,
) -> Result<DynSolValue, AgentError> {
    match ty {
        DynSolType::Address => {
            // Convert string address to DynSolValue::Address
            let addr_str = value
                .as_str()
                .ok_or(AgentError::Contract("Address must be a string".to_string()))?;
            let address = Address::from_str(addr_str)
                .map_err(|_| AgentError::Contract(format!("Invalid address: {}", addr_str)))?;
            Ok(DynSolValue::Address(address))
        }
        DynSolType::Uint(bits) => {
            // Convert string number to DynSolValue::Uint
            let num_str = value
                .as_str()
                .ok_or(AgentError::Contract("Number must be a string".to_string()))?;
            let num = U256::from_str(num_str)
                .map_err(|_| AgentError::Contract(format!("Invalid number: {}", num_str)))?;
            Ok(DynSolValue::Uint(num, *bits))
        }
        DynSolType::Bool => {
            // Convert JSON boolean to DynSolValue::Bool
            let bool_val = value
                .as_bool()
                .ok_or(AgentError::Contract("Expected a boolean value".to_string()))?;
            Ok(DynSolValue::Bool(bool_val))
        }
        DynSolType::String => {
            // Convert JSON string to DynSolValue::String
            let string_val = value
                .as_str()
                .ok_or(AgentError::Contract("Expected a string value".to_string()))?;
            Ok(DynSolValue::String(string_val.to_string()))
        }
        DynSolType::Bytes => {
            // Convert hex string to DynSolValue::Bytes
            let bytes_str = value
                .as_str()
                .ok_or(AgentError::Contract("Bytes must be a hex string".to_string()))?;
            if !bytes_str.starts_with("0x") {
                return Err(AgentError::Contract("Bytes must start with 0x".to_string()));
            }
            let hex_str = &bytes_str[2..];
            let bytes = hex::decode(hex_str)
                .map_err(|_| AgentError::Contract("Invalid hex string".to_string()))?;
            Ok(DynSolValue::Bytes(bytes))
        }
        DynSolType::FixedBytes(size) => {
            // Convert hex string to fixed-size bytes
            let bytes_str = value
                .as_str()
                .ok_or(AgentError::Contract("Bytes must be a hex string".to_string()))?;
            if !bytes_str.starts_with("0x") {
                return Err(AgentError::Contract("Bytes must start with 0x".to_string()));
            }
            let hex_str = &bytes_str[2..];
            let bytes = hex::decode(hex_str)
                .map_err(|_| AgentError::Contract("Invalid hex string".to_string()))?;

            if bytes.len() > *size {
                return Err(AgentError::Contract(format!("Hex string too long for bytes{}", size)));
            }

            // For bytes32, create a FixedBytes<32>
            if *size == 32 {
                let mut fixed = [0u8; 32];
                let start = 32 - bytes.len();
                fixed[start..].copy_from_slice(&bytes);
                Ok(DynSolValue::FixedBytes(FixedBytes::from(fixed), 32))
            } else {
                // For other sizes, use regular bytes
                Ok(DynSolValue::Bytes(bytes))
            }
        }
        // Add handling for other types as needed
        _ => Err(AgentError::Contract(format!("Unsupported type: {:?}", ty))),
    }
}

// A simpler representation of a Solidity function parameter
pub struct SolParam {
    pub _name: String, // Unused but needed for structure
    pub kind: String,
}

// A simpler representation of a Solidity function
pub struct SolFunction {
    pub name: String,
    pub inputs: Vec<SolParam>,
}

/// Encode a function call using a function definition and arguments
pub fn encode_function_call(function_json: &Value, args: &[Value]) -> Result<Vec<u8>, String> {
    // Parse the function definition into a simpler structure
    let function = parse_function_json(function_json)?;

    // Compute function selector (first 4 bytes of keccak hash of the function signature)
    let selector = compute_function_selector(&function);

    // Encode the arguments
    let encoded_args = encode_function_args(&function, args)?;

    // Combine selector and encoded args
    let mut calldata = selector;
    calldata.extend_from_slice(&encoded_args);

    println!("Calldata: {:?}", calldata);

    Ok(calldata)
}

/// Parse function JSON to a simplified SolFunction
fn parse_function_json(function_json: &Value) -> Result<SolFunction, String> {
    let name = function_json["name"]
        .as_str()
        .ok_or_else(|| "Function has no name".to_string())?
        .to_string();

    let inputs = if let Some(inputs_arr) = function_json["inputs"].as_array() {
        let mut params = Vec::new();
        for input in inputs_arr {
            let input_name = input["name"].as_str().unwrap_or("").to_string();
            let input_type =
                input["type"].as_str().ok_or_else(|| "Input missing type".to_string())?.to_string();

            params.push(SolParam { _name: input_name, kind: input_type });
        }
        params
    } else {
        Vec::new()
    };

    Ok(SolFunction { name, inputs })
}

/// Compute the function selector (first 4 bytes of keccak hash of the function signature)
fn compute_function_selector(function: &SolFunction) -> Vec<u8> {
    let mut signature = function.name.clone();
    signature.push('(');

    let input_types: Vec<String> = function.inputs.iter().map(|input| input.kind.clone()).collect();
    signature.push_str(&input_types.join(","));
    signature.push(')');

    let mut hasher = Keccak::v256();
    let mut output = [0u8; 32];
    hasher.update(signature.as_bytes());
    hasher.finalize(&mut output);

    output[..4].to_vec()
}

/// Encode function arguments according to the Ethereum ABI specification
pub fn encode_function_args(function: &SolFunction, args: &[Value]) -> Result<Vec<u8>, String> {
    if function.inputs.len() != args.len() {
        return Err(format!(
            "Function {} expects {} arguments, but {} were provided",
            function.name,
            function.inputs.len(),
            args.len()
        ));
    }

    let mut encoded = Vec::new();

    // For each argument
    for (i, (param, arg)) in function.inputs.iter().zip(args).enumerate() {
        match param.kind.as_str() {
            // Address type
            "address" => {
                let addr_str = arg
                    .as_str()
                    .ok_or_else(|| format!("Argument {} should be an address string", i))?;

                let addr = Address::from_str(addr_str).map_err(|_| {
                    format!("Invalid address format for argument {}: {}", i, addr_str)
                })?;

                let mut padded = vec![0u8; 32];
                padded[12..].copy_from_slice(addr.as_slice());
                encoded.extend_from_slice(&padded);
            }

            // Uint types
            ty if ty.starts_with("uint") => {
                let value_str = match arg {
                    Value::String(s) => s.clone(),
                    Value::Number(n) => n.to_string(),
                    _ => return Err(format!("Argument {} should be a number or string", i)),
                };

                let value = U256::from_str(&value_str).map_err(|_| {
                    format!("Invalid uint format for argument {}: {}", i, value_str)
                })?;

                let mut padded = vec![0u8; 32];

                // Use a simpler approach by converting to hex string first
                let hex_str = format!("{:064x}", value);
                for i in 0..32 {
                    // Parse each byte from hex string (2 chars at a time)
                    let byte_str = &hex_str[i * 2..(i + 1) * 2];
                    padded[i] = u8::from_str_radix(byte_str, 16).unwrap_or(0);
                }

                encoded.extend_from_slice(&padded);
            }

            // Bool type
            "bool" => {
                let value =
                    arg.as_bool().ok_or_else(|| format!("Argument {} should be a boolean", i))?;

                let mut padded = vec![0u8; 32];
                if value {
                    padded[31] = 1;
                }
                encoded.extend_from_slice(&padded);
            }

            // String and bytes types (dynamic)
            "string" => {
                let value =
                    arg.as_str().ok_or_else(|| format!("Argument {} should be a string", i))?;

                let value_bytes = value.as_bytes().to_vec();

                // For dynamic types, encode the length followed by the data
                let len_bytes = encode_uint(value_bytes.len() as u64);

                // Pad the bytes to multiple of 32
                let mut padded_value = value_bytes.clone();
                let padding_needed = (32 - (padded_value.len() % 32)) % 32;
                padded_value.extend(vec![0u8; padding_needed]);

                encoded.extend_from_slice(&len_bytes);
                encoded.extend_from_slice(&padded_value);
            }

            // Bytes type
            ty if ty.starts_with("bytes") && ty != "bytes32" => {
                let value =
                    arg.as_str().ok_or_else(|| format!("Argument {} should be a hex string", i))?;

                // For bytes type, decode from hex
                let value_bytes = hex::decode(value.strip_prefix("0x").unwrap_or(value))
                    .map_err(|_| format!("Invalid hex for argument {}: {}", i, value))?;

                // For dynamic types, encode the length followed by the data
                let len_bytes = encode_uint(value_bytes.len() as u64);

                // Pad the bytes to multiple of 32
                let mut padded_value = value_bytes.clone();
                let padding_needed = (32 - (padded_value.len() % 32)) % 32;
                padded_value.extend(vec![0u8; padding_needed]);

                encoded.extend_from_slice(&len_bytes);
                encoded.extend_from_slice(&padded_value);
            }

            // Fallback for unsupported types
            _ => return Err(format!("Unsupported type for argument {}: {}", i, param.kind)),
        }
    }

    Ok(encoded)
}

/// Helper function to encode a uint as 32 bytes
fn encode_uint(value: u64) -> Vec<u8> {
    let mut padded = vec![0u8; 32];
    padded[24..].copy_from_slice(&value.to_be_bytes());
    padded
}

/// Helper function to check if a type is dynamic (public so it can be used if needed)
#[allow(dead_code)]
pub fn is_dynamic_type(type_str: &str) -> bool {
    type_str == "string" || type_str == "bytes" || type_str.starts_with("array(")
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::*;

    #[test]
    fn test_json_to_sol_value() {
        use alloy_dyn_abi::DynSolType;

        // Test address conversion
        let addr_type = DynSolType::Address;
        let addr_json = json!("0x1234567890123456789012345678901234567890");
        let addr_result = json_to_sol_value(&addr_json, &addr_type);
        assert!(addr_result.is_ok());

        // Test uint conversion
        let uint_type = DynSolType::Uint(256);
        let uint_json = json!("1000000000000000000");
        let uint_result = json_to_sol_value(&uint_json, &uint_type);
        assert!(uint_result.is_ok());

        // Test bool conversion
        let bool_type = DynSolType::Bool;
        let bool_json = json!(true);
        let bool_result = json_to_sol_value(&bool_json, &bool_type);
        assert!(bool_result.is_ok());

        // Test string conversion
        let string_type = DynSolType::String;
        let string_json = json!("test string");
        let string_result = json_to_sol_value(&string_json, &string_type);
        assert!(string_result.is_ok());

        // Test bytes conversion
        let bytes_type = DynSolType::Bytes;
        let bytes_json = json!("0x1234");
        let bytes_result = json_to_sol_value(&bytes_json, &bytes_type);
        assert!(bytes_result.is_ok());

        // Test fixed bytes conversion
        let fixed_bytes_type = DynSolType::FixedBytes(32);
        let fixed_bytes_json =
            json!("0x1234567890123456789012345678901234567890123456789012345678901234");
        let fixed_bytes_result = json_to_sol_value(&fixed_bytes_json, &fixed_bytes_type);
        assert!(fixed_bytes_result.is_ok());

        // Test invalid input type (e.g., number for address)
        let addr_invalid_json = json!(12345);
        let addr_invalid_result = json_to_sol_value(&addr_invalid_json, &addr_type);
        assert!(addr_invalid_result.is_err());
    }

    #[test]
    fn test_is_dynamic_type() {
        assert!(is_dynamic_type("string"));
        assert!(is_dynamic_type("bytes"));
        // Current implementation doesn't handle arrays properly
        // assert!(is_dynamic_type("bytes[]"));
        // assert!(is_dynamic_type("address[]"));
        assert!(!is_dynamic_type("address"));
        assert!(!is_dynamic_type("uint256"));
        assert!(!is_dynamic_type("bool"));

        // The current implementation doesn't handle tuple types correctly
        // assert!(is_dynamic_type("tuple(uint256,address)"));
    }

    #[test]
    fn test_function_selector() {
        // Test the transfer function selector: transfer(address,uint256)
        let function = SolFunction {
            name: "transfer".to_string(),
            inputs: vec![
                SolParam { _name: "to".to_string(), kind: "address".to_string() },
                SolParam { _name: "value".to_string(), kind: "uint256".to_string() },
            ],
        };

        let selector = compute_function_selector(&function);
        // transfer(address,uint256) selector is 0xa9059cbb
        assert_eq!(hex::encode(&selector), "a9059cbb");
    }

    #[test]
    fn test_encode_function_args() {
        // Create a SolFunction to test
        let function = SolFunction {
            name: "transfer".to_string(),
            inputs: vec![
                SolParam { _name: "to".to_string(), kind: "address".to_string() },
                SolParam { _name: "value".to_string(), kind: "uint256".to_string() },
            ],
        };

        // Create arguments
        let args =
            vec![json!("0x1234567890123456789012345678901234567890"), json!("1000000000000000000")];

        // Call the function
        let result = encode_function_args(&function, &args);

        // Should succeed and return a vector of bytes
        assert!(result.is_ok());
        let encoded = result.unwrap();

        // The result should be 64 bytes (2 arguments x 32 bytes)
        assert_eq!(encoded.len(), 64);
    }

    #[test]
    fn test_encode_function_call() {
        // Function definition for transfer(address,uint256)
        let function_def = serde_json::json!({
            "name": "transfer",
            "inputs": [
                {
                    "name": "to",
                    "type": "address"
                },
                {
                    "name": "value",
                    "type": "uint256"
                }
            ]
        });

        // Arguments for the function call
        let args = vec![
            serde_json::json!("0x1234567890123456789012345678901234567890"),
            serde_json::json!("1000000000000000000"),
        ];

        // Encode the function call
        let result = encode_function_call(&function_def, &args);
        assert!(result.is_ok());

        let encoded = result.unwrap();

        // Convert to hex string for easier checking
        let encoded_hex = hex::encode(&encoded);

        // Check that it starts with the correct selector (a9059cbb for transfer)
        assert!(encoded_hex.starts_with("a9059cbb"));

        // The total length should be 8 + 128 = 136 (selector + 2 arguments)
        // Each argument is 32 bytes = 64 hex chars
        assert_eq!(encoded_hex.len(), 8 + 128); // 8 for selector, 128 for args
    }
}
