mod config;
mod trigger;

use alloy_sol_types::sol_data::String as SolString;
use alloy_sol_types::{SolType, SolValue};
use config::AttesterConfig;
use serde::{Deserialize, Serialize};
use trigger::{
    decode_trigger_event, encode_trigger_output, AttestationPayload, AttestationRequest,
    AttestationRequestData, Destination, OperationType,
};
use wavs_eas::query::{query_attestation, QueryConfig};
use wavs_eas::schema::SchemaEncoder;
use wstd::runtime::block_on;

pub mod bindings;
use crate::bindings::{export, Guest, TriggerAction, WasmResponse};

use wavs_llm::{LLMClient, Message};

/// Structured response from the LLM for approved/dislike evaluation
#[derive(Debug, Serialize, Deserialize, schemars::JsonSchema)]
struct ApprovalResponse {
    approved: bool,
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

        // Decode the trigger event (AttestationAttested from PayableEASIndexerResolver)
        let (event, dest) = decode_trigger_event(action.data)
            .map_err(|e| format!("Failed to decode trigger event: {}", e))?;

        // Extract event data - AttestationAttested only has eas address and uid
        let eas_address = event.eas;
        let attestation_uid = event.uid;

        println!("📋 AttestationAttested event received:");
        println!("  - EAS Address: {}", eas_address);
        println!("  - Attestation UID: {}", attestation_uid);

        // Load configuration
        let config = AttesterConfig::from_env();
        config.log();

        // Create query config from component config (use EAS address from event)
        let query_config = QueryConfig::from_strings(
            &format!("{}", eas_address),
            "0x0000000000000000000000000000000000000000", // indexer not needed for this query
            config.rpc_url.clone(),
        )
        .map_err(|e| format!("Failed to create query config: {}", e))?;

        // Query the full attestation details from chain using the uid
        let attestation =
            block_on(async move { query_attestation(attestation_uid, Some(query_config)).await })
                .map_err(|e| format!("Failed to query attestation {}: {}", attestation_uid, e))?;

        // Extract details from the queried attestation
        let schema_uid = attestation.schema;
        let ref_uid = attestation.uid;
        let recipient = attestation.recipient;

        println!("📋 Processing attestation:");
        println!("  - Schema UID: {}", schema_uid);
        println!("  - Reference UID: {}", ref_uid);
        println!("  - Recipient: {}", recipient);

        println!(
            "✅ Retrieved attestation {} from attester {} to recipient {}",
            attestation.uid, attestation.attester, attestation.recipient
        );

        // Decode the ABI-encoded proposal string from the attestation data
        let user_prompt = <SolString>::abi_decode(&attestation.data)
            .map_err(|e| format!("Failed to decode proposal string: {}", e))?;
        let msgs = vec![Message::system(&config.system_message), Message::user(&user_prompt)];

        println!("System prompt: {}", config.system_message);
        println!("💬 User prompt: {}", user_prompt);

        // Create LLM client with options and get structured response
        let llm_options = config.get_llm_options();
        let llm = LLMClient::with_config(config.model.clone(), llm_options);

        // Get structured response from LLM
        let llm_response = llm
            .chat_structured::<ApprovalResponse>(msgs)
            .send()
            .map_err(|e| format!("Failed to get structured LLM completion: {}", e))?;
        let approved = llm_response.approved;

        println!("👍 Extracted approval value: {}", approved);

        // Do nothing if not approved
        if !approved {
            println!("Not approved. Do nothing.");
            return Ok(None);
        }

        // Use the submit_schema_uid for the approved attestation
        let attestation_schema = config
            .submit_schema_uid
            .as_ref()
            .ok_or("submit_schema_uid not configured")?
            .parse::<alloy_primitives::FixedBytes<32>>()
            .map_err(|e| format!("Invalid submit_schema_uid format: {}", e))?;

        // Encode the attestation data according to the "bool approved" schema
        let encoded_data = SchemaEncoder::encode_by_pattern("bool approved", &approved.to_string())
            .map_err(|e| {
                format!("Failed to encode approved value with 'bool approved' schema: {}", e)
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
