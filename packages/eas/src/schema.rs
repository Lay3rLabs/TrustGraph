//! Schema parsing and encoding utilities for EAS attestations
//!
//! This module provides functionality to parse EAS schema definitions and
//! encode data according to those schemas using proper ABI encoding.

use alloy_primitives::Bytes;
use alloy_sol_types::SolValue;

/// Represents a field in an EAS schema
#[derive(Debug, Clone, PartialEq)]
pub enum SchemaFieldType {
    /// Boolean value
    Bool,
    /// Unsigned integer (8-256 bits)
    Uint(usize),
    /// Signed integer (8-256 bits)
    Int(usize),
    /// Address (20 bytes)
    Address,
    /// Fixed-size bytes (alternative syntax)
    BytesFixed(usize),
    /// Dynamic bytes
    BytesDynamic,
    /// String
    String,
    /// Array of another type
    Array(Box<SchemaFieldType>, Option<usize>),
}

impl SchemaFieldType {
    /// Parse a type string into a SchemaFieldType
    fn from_str(s: &str) -> Result<Self, String> {
        let s = s.trim();

        // Check for array syntax
        if let Some(bracket_pos) = s.find('[') {
            let base_type = &s[..bracket_pos];
            let array_part = &s[bracket_pos..];

            // Parse array size if specified
            let size = if array_part == "[]" {
                None
            } else {
                let size_str = array_part.trim_start_matches('[').trim_end_matches(']');
                Some(
                    size_str
                        .parse::<usize>()
                        .map_err(|_| format!("Invalid array size: {}", size_str))?,
                )
            };

            let base = Self::from_str(base_type)?;
            return Ok(SchemaFieldType::Array(Box::new(base), size));
        }

        match s {
            "bool" => Ok(SchemaFieldType::Bool),
            "address" => Ok(SchemaFieldType::Address),
            "string" => Ok(SchemaFieldType::String),
            "bytes" => Ok(SchemaFieldType::BytesDynamic),
            _ => {
                // Check for uintN or intN
                if s.starts_with("uint") {
                    let bits = s
                        .get(4..)
                        .ok_or_else(|| format!("Invalid uint type: {}", s))?
                        .parse::<usize>()
                        .map_err(|_| format!("Invalid uint type: {}", s))?;
                    if bits % 8 != 0 || bits > 256 || bits == 0 {
                        return Err(format!("Invalid uint size: {}", bits));
                    }
                    Ok(SchemaFieldType::Uint(bits))
                } else if s.starts_with("int") {
                    let bits = s
                        .get(3..)
                        .ok_or_else(|| format!("Invalid int type: {}", s))?
                        .parse::<usize>()
                        .map_err(|_| format!("Invalid int type: {}", s))?;
                    if bits % 8 != 0 || bits > 256 || bits == 0 {
                        return Err(format!("Invalid int size: {}", bits));
                    }
                    Ok(SchemaFieldType::Int(bits))
                } else if s.starts_with("bytes") {
                    let size = s
                        .get(5..)
                        .ok_or_else(|| format!("Invalid bytes type: {}", s))?
                        .parse::<usize>()
                        .map_err(|_| format!("Invalid bytes type: {}", s))?;
                    if size > 32 || size == 0 {
                        return Err(format!("Invalid bytes size: {}", size));
                    }
                    Ok(SchemaFieldType::BytesFixed(size))
                } else {
                    Err(format!("Unknown type: {}", s))
                }
            }
        }
    }
}

/// Represents a field in an EAS schema
#[derive(Debug, Clone)]
pub struct SchemaField {
    #[allow(dead_code)]
    pub name: String,
    pub field_type: SchemaFieldType,
}

/// Represents a parsed EAS schema
#[derive(Debug, Clone)]
pub struct Schema {
    pub fields: Vec<SchemaField>,
}

impl Schema {
    /// Parse an EAS schema string
    /// Example: "bytes32 triggerId,string data,uint256 timestamp"
    pub fn parse(schema_str: &str) -> Result<Self, String> {
        if schema_str.trim().is_empty() {
            return Err("Empty schema".to_string());
        }

        let mut fields = Vec::new();

        // Split by comma to get individual fields
        for field_str in schema_str.split(',') {
            let field_str = field_str.trim();

            // Split by whitespace to get type and name
            let parts: Vec<&str> = field_str.split_whitespace().collect();

            if parts.len() != 2 {
                return Err(format!("Invalid field definition: {}", field_str));
            }

            let field_type = SchemaFieldType::from_str(parts[0])?;
            let name = parts.get(1).ok_or("Missing field name")?.to_string();

            fields.push(SchemaField { name, field_type });
        }

        Ok(Schema { fields })
    }

    /// Check if schema has a single string field (common case)
    pub fn is_single_string(&self) -> bool {
        self.fields.len() == 1 && matches!(self.fields[0].field_type, SchemaFieldType::String)
    }
}

/// Encodes data according to an EAS schema
pub struct SchemaEncoder;

impl SchemaEncoder {
    /// Encode a single string value (for "string statement" schema)
    pub fn encode_string(value: &str) -> Bytes {
        Bytes::from(value.to_string().abi_encode())
    }

    /// Encode a boolean value
    pub fn encode_bool(value: bool) -> Bytes {
        Bytes::from(value.abi_encode())
    }

    /// Encode a uint256 value
    pub fn encode_uint256(value: &str) -> Result<Bytes, String> {
        // Parse the string as a U256
        let uint_value = alloy_primitives::U256::from_str_radix(value, 10)
            .map_err(|e| format!("Failed to parse uint256: {}", e))?;
        Ok(Bytes::from(uint_value.abi_encode()))
    }

    /// Encode an address value
    pub fn encode_address(value: &str) -> Result<Bytes, String> {
        // Parse the string as an address
        let addr = value
            .parse::<alloy_primitives::Address>()
            .map_err(|e| format!("Failed to parse address: {}", e))?;
        Ok(Bytes::from(addr.abi_encode()))
    }

    /// Encode bytes32 value
    pub fn encode_bytes32(value: &str) -> Result<Bytes, String> {
        // Handle hex string input
        let hex_str =
            if value.starts_with("0x") || value.starts_with("0X") { &value[2..] } else { value };

        // Parse hex string to bytes
        let bytes =
            hex::decode(hex_str).map_err(|e| format!("Failed to decode hex string: {}", e))?;

        if bytes.len() != 32 {
            return Err(format!("bytes32 requires exactly 32 bytes, got {}", bytes.len()));
        }

        let mut arr = [0u8; 32];
        arr.copy_from_slice(&bytes);
        Ok(Bytes::from(alloy_primitives::FixedBytes::<32>::from(arr).abi_encode()))
    }

    /// Encode multiple values according to a schema
    pub fn encode_values(schema: &Schema, values: Vec<&str>) -> Result<Bytes, String> {
        if schema.fields.len() != values.len() {
            return Err(format!(
                "Schema has {} fields but {} values provided",
                schema.fields.len(),
                values.len()
            ));
        }

        let mut encoded_parts = Vec::new();

        for (field, value) in schema.fields.iter().zip(values.iter()) {
            let encoded = Self::encode_field_value(&field.field_type, value)?;
            encoded_parts.extend_from_slice(&encoded);
        }

        Ok(Bytes::from(encoded_parts))
    }

    /// Encode a single field value based on its type
    fn encode_field_value(field_type: &SchemaFieldType, value: &str) -> Result<Vec<u8>, String> {
        match field_type {
            SchemaFieldType::Bool => {
                let bool_value = match value.to_lowercase().as_str() {
                    "true" | "1" => true,
                    "false" | "0" => false,
                    _ => return Err(format!("Invalid boolean value: {}", value)),
                };
                Ok(bool_value.abi_encode())
            }
            SchemaFieldType::String => Ok(value.to_string().abi_encode()),
            SchemaFieldType::Uint(256) => {
                let uint_value = alloy_primitives::U256::from_str_radix(value, 10)
                    .map_err(|e| format!("Failed to parse uint256: {}", e))?;
                Ok(uint_value.abi_encode())
            }
            SchemaFieldType::Address => {
                let addr = value
                    .parse::<alloy_primitives::Address>()
                    .map_err(|e| format!("Failed to parse address: {}", e))?;
                Ok(addr.abi_encode())
            }
            SchemaFieldType::BytesFixed(32) => {
                let hex_str = if value.starts_with("0x") || value.starts_with("0X") {
                    &value[2..]
                } else {
                    value
                };
                let bytes = hex::decode(hex_str)
                    .map_err(|e| format!("Failed to decode hex string: {}", e))?;
                if bytes.len() != 32 {
                    return Err(format!("bytes32 requires exactly 32 bytes, got {}", bytes.len()));
                }
                let mut arr = [0u8; 32];
                arr.copy_from_slice(&bytes);
                Ok(alloy_primitives::FixedBytes::<32>::from(arr).abi_encode())
            }
            _ => Err(format!("Unsupported field type: {:?}", field_type)),
        }
    }

    /// Convenience method for encoding common schema patterns
    pub fn encode_by_pattern(schema_str: &str, data: &str) -> Result<Bytes, String> {
        // Handle common single-field patterns by checking both the schema string
        // and the parsed schema to determine the field type

        // Try to parse the schema first
        let schema = Schema::parse(schema_str)?;

        // Handle single-field schemas
        if schema.fields.len() == 1 {
            let field = &schema.fields[0];

            // Encode based on the field type
            match &field.field_type {
                SchemaFieldType::String => Ok(Self::encode_string(data)),
                SchemaFieldType::Bool => {
                    let bool_value = match data.to_lowercase().as_str() {
                        "true" | "1" => true,
                        "false" | "0" => false,
                        _ => return Err(format!("Invalid boolean value: {}", data)),
                    };
                    Ok(Self::encode_bool(bool_value))
                }
                SchemaFieldType::Uint(256) => Self::encode_uint256(data),
                SchemaFieldType::Address => Self::encode_address(data),
                SchemaFieldType::BytesFixed(32) => Self::encode_bytes32(data),
                _ => {
                    // Try generic encoding for other single-field types
                    Self::encode_field_value(&field.field_type, data).map(|v| Bytes::from(v))
                }
            }
        } else {
            // For complex schemas with multiple fields, we need structured input
            // This could be enhanced to parse JSON or other structured formats
            Err(format!(
                "Complex schema '{}' with {} fields requires structured data input",
                schema_str,
                schema.fields.len()
            ))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_simple_schema() {
        let schema = Schema::parse("string statement").unwrap();
        assert_eq!(schema.fields.len(), 1);
        assert_eq!(schema.fields.get(0).unwrap().name, "statement");
        assert!(matches!(schema.fields.get(0).unwrap().field_type, SchemaFieldType::String));
    }

    #[test]
    fn test_parse_bool_schema() {
        let schema = Schema::parse("bool like").unwrap();
        assert_eq!(schema.fields.len(), 1);
        assert_eq!(schema.fields.get(0).unwrap().name, "like");
        assert!(matches!(schema.fields.get(0).unwrap().field_type, SchemaFieldType::Bool));
    }

    #[test]
    fn test_parse_complex_schema() {
        let schema = Schema::parse("bytes32 triggerId,string data,uint256 timestamp").unwrap();
        assert_eq!(schema.fields.len(), 3);

        let field0 = schema.fields.get(0).unwrap();
        assert_eq!(field0.name, "triggerId");
        assert!(matches!(field0.field_type, SchemaFieldType::BytesFixed(32)));

        let field1 = schema.fields.get(1).unwrap();
        assert_eq!(field1.name, "data");
        assert!(matches!(field1.field_type, SchemaFieldType::String));

        let field2 = schema.fields.get(2).unwrap();
        assert_eq!(field2.name, "timestamp");
        assert!(matches!(field2.field_type, SchemaFieldType::Uint(256)));
    }

    #[test]
    fn test_encode_string() {
        let encoded = SchemaEncoder::encode_string("hello world");
        assert!(!encoded.is_empty());

        // The encoded data should be ABI encoded (with length prefix etc)
        let decoded = String::abi_decode(&encoded).unwrap();
        assert_eq!(decoded, "hello world");
    }

    #[test]
    fn test_encode_bool() {
        let encoded_true = SchemaEncoder::encode_bool(true);
        assert!(!encoded_true.is_empty());
        let decoded_true = bool::abi_decode(&encoded_true).unwrap();
        assert_eq!(decoded_true, true);

        let encoded_false = SchemaEncoder::encode_bool(false);
        let decoded_false = bool::abi_decode(&encoded_false).unwrap();
        assert_eq!(decoded_false, false);
    }

    #[test]
    fn test_encode_by_pattern_bool() {
        // Test boolean encoding
        let encoded = SchemaEncoder::encode_by_pattern("bool like", "true").unwrap();
        assert!(!encoded.is_empty());
        let decoded = bool::abi_decode(&encoded).unwrap();
        assert_eq!(decoded, true);

        let encoded = SchemaEncoder::encode_by_pattern("bool vote", "false").unwrap();
        let decoded = bool::abi_decode(&encoded).unwrap();
        assert_eq!(decoded, false);

        let encoded = SchemaEncoder::encode_by_pattern("bool active", "1").unwrap();
        let decoded = bool::abi_decode(&encoded).unwrap();
        assert_eq!(decoded, true);

        let encoded = SchemaEncoder::encode_by_pattern("bool enabled", "0").unwrap();
        let decoded = bool::abi_decode(&encoded).unwrap();
        assert_eq!(decoded, false);
    }

    #[test]
    fn test_encode_uint256() {
        let encoded = SchemaEncoder::encode_uint256("12345").unwrap();
        assert!(!encoded.is_empty());
        let decoded = alloy_primitives::U256::abi_decode(&encoded).unwrap();
        assert_eq!(decoded, alloy_primitives::U256::from(12345u64));
    }

    #[test]
    fn test_encode_by_pattern_uint256() {
        let encoded = SchemaEncoder::encode_by_pattern("uint256 amount", "999").unwrap();
        assert!(!encoded.is_empty());
        let decoded = alloy_primitives::U256::abi_decode(&encoded).unwrap();
        assert_eq!(decoded, alloy_primitives::U256::from(999u64));
    }

    #[test]
    fn test_is_single_string() {
        let schema1 = Schema::parse("string message").unwrap();
        assert!(schema1.is_single_string());

        let schema2 = Schema::parse("string data,uint256 value").unwrap();
        assert!(!schema2.is_single_string());

        let schema3 = Schema::parse("uint256 value").unwrap();
        assert!(!schema3.is_single_string());
    }
}
