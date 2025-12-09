use crate::errors::{AgentError, LlmError};
use alloy_dyn_abi::{DynSolType, DynSolValue};
use alloy_json_abi::Function;
use alloy_primitives::{Address, FixedBytes, U256};
use base64::{engine::general_purpose::STANDARD, Engine};
use hex;
use std::fs;
use std::path::Path;
use std::str::FromStr;

/// Encode an image file to base64 for use with Ollama
pub fn encode_image_to_base64(image_path: &str) -> Result<String, LlmError> {
    // Check if the file exists
    let path = Path::new(image_path);
    if !path.exists() {
        return Err(LlmError::ImageError(format!(
            "Image file not found: {}",
            image_path
        )));
    }

    // Read the file
    let image_data = fs::read(path)
        .map_err(|e| LlmError::ImageError(format!("Failed to read image file: {}", e)))?;

    // Encode to base64
    let encoded = STANDARD.encode(&image_data);

    Ok(encoded)
}

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
            let bytes_str = value.as_str().ok_or(AgentError::Contract(
                "Bytes must be a hex string".to_string(),
            ))?;
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
            let bytes_str = value.as_str().ok_or(AgentError::Contract(
                "Bytes must be a hex string".to_string(),
            ))?;
            if !bytes_str.starts_with("0x") {
                return Err(AgentError::Contract("Bytes must start with 0x".to_string()));
            }
            let hex_str = &bytes_str[2..];
            let bytes = hex::decode(hex_str)
                .map_err(|_| AgentError::Contract("Invalid hex string".to_string()))?;

            if bytes.len() > *size {
                return Err(AgentError::Contract(format!(
                    "Hex string too long for bytes{}",
                    size
                )));
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

/// Encode function arguments using Alloy's built-in functionality
pub fn encode_function_args(
    function: &Function,
    args: &[serde_json::Value],
) -> Result<Vec<u8>, AgentError> {
    // If there are no arguments, return an empty vector
    if args.is_empty() {
        return Ok(Vec::new());
    }

    // Parse each parameter's type
    let param_types: Vec<DynSolType> = function
        .inputs
        .iter()
        .map(|param| {
            DynSolType::parse(&param.ty).map_err(|e| {
                AgentError::Contract(format!("Invalid parameter type '{}': {}", param.ty, e))
            })
        })
        .collect::<Result<Vec<_>, _>>()?;

    // Convert each JSON value to a DynSolValue
    let mut values = Vec::with_capacity(args.len());

    for (i, (arg, ty)) in args.iter().zip(&param_types).enumerate() {
        match json_to_sol_value(arg, ty) {
            Ok(value) => values.push(value),
            Err(e) => {
                return Err(AgentError::Contract(format!(
                    "Error converting argument {}: {}",
                    i, e
                )))
            }
        }
    }

    // Manually encode according to the ABI specification
    // First, encode head and tail parts
    let mut head = Vec::new();
    let mut tail = Vec::new();

    for (i, (value, ty)) in values.iter().zip(&param_types).enumerate() {
        if is_dynamic_type(ty) {
            // For dynamic types, the head contains the offset to the data
            let offset = head.len() + (values.len() - i) * 32; // Calculate offset
            head.extend_from_slice(&U256::from(offset).to_be_bytes::<32>());

            // The tail contains the actual data
            let encoded = value.abi_encode();
            tail.extend_from_slice(&encoded);
        } else {
            // For static types, encode directly in the head
            let encoded = value.abi_encode();
            head.extend_from_slice(&encoded);
        }
    }

    // Combine head and tail
    let mut result = Vec::new();
    result.extend_from_slice(&head);
    result.extend_from_slice(&tail);

    Ok(result)
}

/// Check if a type is dynamic according to ABI spec
pub fn is_dynamic_type(ty: &DynSolType) -> bool {
    matches!(
        ty,
        DynSolType::String | DynSolType::Bytes | DynSolType::Array(_) | DynSolType::Tuple(_)
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use alloy_dyn_abi::DynSolType;
    use serde_json::json;

    #[test]
    fn test_json_to_sol_value() {
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
        // Test dynamic types
        assert!(is_dynamic_type(&DynSolType::String));
        assert!(is_dynamic_type(&DynSolType::Bytes));
        assert!(is_dynamic_type(&DynSolType::Array(Box::new(
            DynSolType::Uint(256)
        ))));
        assert!(is_dynamic_type(&DynSolType::Tuple(vec![
            DynSolType::Uint(256),
            DynSolType::Address
        ])));

        // Test static types
        assert!(!is_dynamic_type(&DynSolType::Address));
        assert!(!is_dynamic_type(&DynSolType::Uint(256)));
        assert!(!is_dynamic_type(&DynSolType::Bool));
        assert!(!is_dynamic_type(&DynSolType::FixedBytes(32)));
    }
}
