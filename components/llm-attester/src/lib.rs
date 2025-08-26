mod config;
mod trigger;

use alloy_primitives::hex;
use alloy_sol_types::SolValue;
use config::AttesterConfig;
use trigger::{
    decode_trigger_event, encode_trigger_output, AttestationPayload, AttestationRequest,
    AttestationRequestData, Destination, OperationType,
};
use wavs_eas::query::{query_attestation, QueryConfig};
use wavs_eas::schema::SchemaEncoder;
use wstd::runtime::block_on;

pub mod bindings;
use crate::bindings::{export, Guest, TriggerAction, WasmResponse};
use alloy_primitives::Address;
use wavs_llm::client::{self, Message};

struct Component;
export!(Component with_types_in bindings);

impl Guest for Component {
    /// Generic EAS attestation component with LLM integration.
    ///
    /// This component:
    /// 1. Receives attestation event data
    /// 2. Queries the referenced attestation from EAS
    /// 3. Processes the attestation data with an LLM
    /// 4. Creates a new attestation with the LLM's response
    fn run(action: TriggerAction) -> Result<Option<WasmResponse>, String> {
        println!("🚀 Starting LLM attester component execution");

        // Decode the trigger event
        let (payload, dest) = decode_trigger_event(action.data)
            .map_err(|e| format!("Failed to decode trigger event: {}", e))?;

        // Extract event data
        let schema_uid = payload.schemaUID;
        let ref_uid = payload.uid;
        let recipient = payload.recipient;

        // Load configuration
        let config = AttesterConfig::from_env();
        config.log();

        // Check if we should process this schema
        if !config.should_process_schema(&schema_uid.to_string()) {
            println!("Schema filtering active, skipping schema: {}", schema_uid);
            return Ok(None);
        }

        println!("📋 Processing attestation:");
        println!("  - Schema UID: {}", schema_uid);
        println!("  - Reference UID: {}", ref_uid);
        println!("  - Recipient: {}", recipient);

        // Parse the EAS address - error if not configured
        let eas_address = config
            .eas_address
            .parse::<Address>()
            .map_err(|_| format!("Failed to parse EAS address: {}", config.eas_address))?;

        // Create query config from component config
        let query_config = QueryConfig {
            eas_address,
            indexer_address: Address::ZERO,
            chain_name: config.chain_name.clone(),
        };

        // Query the attestation - error if not found
        let attestation =
            block_on(async move { query_attestation(ref_uid, Some(query_config)).await })
                .map_err(|e| format!("Failed to query attestation {}: {}", ref_uid, e))?;

        println!(
            "✅ Retrieved attestation {} from attester {} to recipient {}",
            attestation.uid, attestation.attester, attestation.recipient
        );

        // Format the attestation data for the LLM
        let user_prompt = if attestation.data.is_empty() {
            "No attestation data available".to_string()
        } else {
            // Try to decode as UTF-8 string first
            if let Ok(decoded) = String::from_utf8(attestation.data.to_vec()) {
                // Check if it looks like JSON
                if decoded.trim_start().starts_with('{') || decoded.trim_start().starts_with('[') {
                    format!("JSON attestation data: {}", decoded)
                } else {
                    format!("Text attestation data: {}", decoded)
                }
            } else {
                // Otherwise return hex representation
                format!("Binary attestation data (hex): 0x{}", hex::encode(&attestation.data))
            }
        };

        println!("💬 User prompt: {}", user_prompt);

        // Create LLM options and messages
        let llm_options = config.get_llm_options();
        let messages = vec![
            Message {
                role: "system".into(),
                content: Some(config.system_message.clone()),
                tool_calls: None,
                tool_call_id: None,
                name: None,
            },
            Message {
                role: "user".into(),
                content: Some(user_prompt),
                tool_calls: None,
                tool_call_id: None,
                name: None,
            },
        ];

        // Get completion from LLM
        let llm = client::LLMClient::with_config(config.model.clone(), llm_options);

        let llm_response = llm
            .chat_completion_text(messages)
            .map_err(|e| format!("Failed to get LLM completion: {}", e))?;

        println!("🤖 LLM Response: {}", llm_response);

        // Determine the schema to use
        let attestation_schema =
            config.schema_uid.as_ref().and_then(|s| s.parse().ok()).unwrap_or(schema_uid);

        // Encode the attestation data according to the schema
        // TODO: Parse schema definition to determine proper encoding
        // For now, assume "string statement" schema
        let encoded_data = SchemaEncoder::encode_by_pattern("string statement", &llm_response)
            .or_else(|e| {
                println!("⚠️  Failed to encode with schema 'string statement': {}", e);
                println!("   Defaulting to simple string encoding");
                Ok::<_, String>(SchemaEncoder::encode_string(&llm_response))
            })?;

        // Create the attestation request
        let attestation_request = AttestationRequest {
            schema: attestation_schema,
            data: AttestationRequestData {
                recipient,
                expirationTime: config.expiration_time,
                revocable: config.revocable,
                refUID: ref_uid,
                data: encoded_data,
                value: config.attestation_value,
            },
        };

        // Create the attestation payload
        let attestation_payload = AttestationPayload {
            operationType: OperationType::ATTEST,
            data: attestation_request.abi_encode().into(),
        };

        println!("✅ Attestation payload created successfully");

        // ABI encode the complete payload
        let encoded_response = attestation_payload.abi_encode();

        // Prepare the output based on destination
        let output = match dest {
            Destination::Ethereum => {
                println!("📤 Sending to Ethereum");
                Some(encode_trigger_output(&encoded_response))
            }
            Destination::CliOutput => {
                println!("📤 Outputting to CLI");
                Some(WasmResponse { payload: encoded_response.into(), ordering: None })
            }
        };

        Ok(output)
    }
}
