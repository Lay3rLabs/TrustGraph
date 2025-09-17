mod config;
mod trigger;

use alloy_primitives::hex;
use alloy_sol_types::SolValue;
use config::AttesterConfig;
use serde::{Deserialize, Serialize};
use trigger::{
    decode_trigger_event, encode_trigger_output, AttestationPayload, AttestationRequest,
    AttestationRequestData, Destination, OperationType,
};
use wavs_eas::query::{query_attestation, QueryConfig};
use wavs_eas::schema::SchemaEncoder;
use wstd::runtime::block_on;
#[rustfmt::skip]
pub mod bindings;
use crate::bindings::{export, Guest, TriggerAction, WasmResponse};

use wavs_llm::LLMClient;

/// Structured response from the LLM for like/dislike evaluation
#[derive(Debug, Serialize, Deserialize, schemars::JsonSchema)]
struct LikeResponse {
    like: bool,
    reasoning: String,
}

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

        // Create query config from component config
        let query_config = QueryConfig::from_strings(
            &config.eas_address,
            "0x0000000000000000000000000000000000000000", // indexer not needed for this query
            format!("http://127.0.0.1:8545"),             // TODO: get RPC endpoint from config
        )
        .map_err(|e| format!("Failed to create query config: {}", e))?;

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

        // Create LLM client with options and get structured response
        let llm_options = config.get_llm_options();
        let llm = LLMClient::with_config(config.model.clone(), llm_options);

        // Get structured response from LLM
        let llm_response = llm
            .chat_structured::<LikeResponse>(user_prompt.as_str())
            .send()
            .map_err(|e| format!("Failed to get structured LLM completion: {}", e))?;

        println!(
            "🤖 LLM Response: like={}, reasoning={}",
            llm_response.like, llm_response.reasoning
        );

        let like_value = llm_response.like;

        println!("👍 Extracted like value: {}", like_value);

        // Use the submit_schema_uid for the like attestation
        let attestation_schema = config
            .submit_schema_uid
            .as_ref()
            .ok_or("submit_schema_uid not configured")?
            .parse::<alloy_primitives::FixedBytes<32>>()
            .map_err(|e| format!("Invalid submit_schema_uid format: {}", e))?;

        // Encode the attestation data according to the "bool like" schema
        let encoded_data = SchemaEncoder::encode_by_pattern("bool like", &like_value.to_string())
            .map_err(|e| {
            format!("Failed to encode like value with 'bool like' schema: {}", e)
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
