mod config;
mod trigger;

use alloy_primitives::{hex, Bytes, FixedBytes};
use alloy_sol_types::SolValue;
use config::AttesterConfig;
use trigger::{
    decode_trigger_event, encode_trigger_output, AttestationPayload, AttestationRequest,
    AttestationRequestData, Destination, OperationType,
};
use wavs_eas::query::{query_attestation, QueryConfig, IEAS};
use wavs_eas::schema::SchemaEncoder;
use wavs_llm::traits::GuestLlmClientManager;
use wstd::runtime::block_on;

pub mod bindings;
use crate::bindings::{export, Guest, TriggerAction, WasmResponse};
use alloy_primitives::Address;
use wavs_llm::client;
use wavs_llm::types::Message;

struct Component;
export!(Component with_types_in bindings);

/// Encode attestation data according to the schema
fn encode_attestation_data(data: &str, schema_type: &str) -> Result<Bytes, String> {
    // Use SchemaEncoder for proper ABI encoding
    SchemaEncoder::encode_by_pattern(schema_type, data).or_else(|e| {
        println!("⚠️  Failed to encode with schema '{}': {}", schema_type, e);
        println!("   Defaulting to simple string encoding");
        Ok(SchemaEncoder::encode_string(data))
    })
}

/// Format attestation data for LLM consumption
fn format_attestation_data(data: &Bytes) -> String {
    if data.is_empty() {
        return "No attestation data available".to_string();
    }

    // Try to decode as UTF-8 string first
    if let Ok(decoded) = String::from_utf8(data.to_vec()) {
        // Check if it looks like JSON
        if decoded.trim_start().starts_with('{') || decoded.trim_start().starts_with('[') {
            return format!("JSON attestation data: {}", decoded);
        }
        return format!("Text attestation data: {}", decoded);
    }

    // Otherwise return hex representation
    format!("Binary attestation data (hex): 0x{}", hex::encode(data))
}

/// Query and process attestation data
fn fetch_attestation_data(
    config: &AttesterConfig,
    ref_uid: FixedBytes<32>,
    schema_uid: FixedBytes<32>,
    recipient: Address,
) -> IEAS::Attestation {
    // Parse the EAS address
    let eas_address = config.eas_address.parse().unwrap_or_else(|_| {
        println!("⚠️  Failed to parse EAS address: {}", config.eas_address);
        Address::ZERO
    });

    // Create query config from component config
    let query_config = QueryConfig {
        eas_address,
        indexer_address: Address::ZERO,
        chain_name: config.chain_name.clone(),
    };

    // Block on the async query since we're in a sync context
    let attestation_result =
        block_on(async move { query_attestation(ref_uid, Some(query_config)).await });

    match attestation_result {
        Ok(attestation) => {
            println!(
                "✅ Retrieved attestation {} from attester {} to recipient {}",
                attestation.uid, attestation.attester, attestation.recipient
            );
            attestation
        }
        Err(e) => {
            println!("⚠️  Failed to query attestation: {}", e);
            println!("   Using default empty attestation data");

            // Create a minimal attestation struct with the request data
            IEAS::Attestation {
                uid: ref_uid,
                schema: schema_uid,
                time: 0,
                expirationTime: 0,
                revocationTime: 0,
                refUID: FixedBytes::ZERO,
                recipient,
                attester: Address::ZERO,
                revocable: true,
                data: Bytes::new(),
            }
        }
    }
}

/// Create LLM configuration and get completion
fn get_llm_response(config: &AttesterConfig, user_prompt: String) -> Result<String, String> {
    // Create LLM options
    let llm_options = config.get_llm_options();

    // Create message configuration
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
            content: Some(user_prompt.clone()),
            tool_calls: None,
            tool_call_id: None,
            name: None,
        },
    ];

    println!("💬 User prompt: {}", user_prompt);

    // Get completion from LLM
    let llm = client::with_config(config.model.clone(), llm_options)
        .map_err(|e| format!("Failed to create LLM client: {}", e))?;

    let result = llm
        .chat_completion_text(messages)
        .map_err(|e| format!("Failed to get LLM completion: {}", e))?;

    println!("🤖 LLM Response: {}", result);

    Ok(result)
}

/// Build the attestation payload
fn build_attestation_payload(
    config: &AttesterConfig,
    schema_uid: FixedBytes<32>,
    ref_uid: FixedBytes<32>,
    recipient: Address,
    llm_response: String,
) -> Result<AttestationPayload, String> {
    // Determine the schema to use
    let attestation_schema =
        config.schema_uid.as_ref().and_then(|s| s.parse().ok()).unwrap_or(schema_uid);

    // Encode the attestation data according to the schema
    // TODO: Parse schema definition to determine proper encoding
    // For now, assume "string statement" schema
    let encoded_data = encode_attestation_data(&llm_response, "string statement")?;

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
    let payload = AttestationPayload {
        operationType: OperationType::ATTEST,
        data: attestation_request.abi_encode().into(),
    };

    Ok(payload)
}

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

        // Fetch the attestation data
        let attestation_data = fetch_attestation_data(&config, ref_uid, schema_uid, recipient);

        // Format the attestation data for the LLM
        let user_prompt = format_attestation_data(&attestation_data.data);

        // Get LLM response
        let llm_response = get_llm_response(&config, user_prompt)?;

        // Build the attestation payload
        let attestation_payload =
            build_attestation_payload(&config, schema_uid, ref_uid, recipient, llm_response)?;

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
