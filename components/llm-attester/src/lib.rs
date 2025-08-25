mod query;
mod trigger;
use alloy_primitives::ruint::aliases::U256;
use alloy_primitives::{Bytes, FixedBytes};
use alloy_sol_types::SolValue;
use query::{format_attestation_data, log_attestation, query_attestation, AttestationStruct};
use trigger::{
    decode_trigger_event, encode_trigger_output, AttestationPayload, AttestationRequest,
    AttestationRequestData, Destination, OperationType,
};
use wavs_llm::traits::GuestLlmClientManager;
pub mod bindings;
use crate::bindings::{export, host::config_var, Guest, TriggerAction, WasmResponse};
use alloy_primitives::Address;
use wavs_llm::client;
use wavs_llm::types::{Config, LlmOptions, Message};

struct Component;
export!(Component with_types_in bindings);

impl Guest for Component {
    /// Generic EAS attestation component with LLM integration.
    ///
    /// A component that receives attestation input data, processes it with an LLM,
    /// and creates a new EAS attestation based on the LLM response.
    fn run(action: TriggerAction) -> std::result::Result<Option<WasmResponse>, String> {
        println!("🚀 Starting LLM attester component execution");

        let (payload, dest) = decode_trigger_event(action.data).map_err(|e| e.to_string())?;

        // block_on(async move {
        // Use the Attested event data directly
        let schema_uid = payload.schemaUID;
        let ref_uid = payload.uid;
        let recipient = payload.recipient;

        // Get attestation schema UID from config or use the one from the request
        let attestation_schema =
            config_var("attestation_schema_uid").unwrap_or_else(|| schema_uid.to_string());

        println!("Attestation Schema: {}", attestation_schema);

        // Only run if the schema matches
        if attestation_schema != schema_uid.to_string() {
            println!("Schema mismatch, returning no response");
            return Ok(None);
        }

        // Get EAS configuration
        let eas_address = config_var("eas_address").unwrap_or_else(|| {
            query::defaults::get_default_eas_address("base-sepolia")
                .unwrap_or(query::defaults::BASE_SEPOLIA_EAS)
                .to_string()
        });
        let chain_name = config_var("chain_name").unwrap_or_else(|| "base-sepolia".to_string());

        println!("📋 EAS Configuration:");
        println!("  - EAS Address: {}", eas_address);
        println!("  - Chain: {}", chain_name);
        println!("  - Schema UID: {}", schema_uid);
        println!("  - Reference UID: {}", ref_uid);

        // Query the attestation data from EAS using the refUID
        let attestation_data = match query_attestation(&eas_address, ref_uid, &chain_name) {
            Ok(attestation) => {
                log_attestation(&attestation);
                attestation
            }
            Err(e) => {
                println!("⚠️  Failed to query attestation: {}", e);
                println!("   Using default empty attestation data");
                // Create a minimal attestation struct with the request data
                AttestationStruct {
                    uid: ref_uid,
                    schema: schema_uid,
                    time: 0,
                    expirationTime: 0,
                    revocationTime: 0,
                    refUID: FixedBytes::ZERO,
                    recipient,
                    attester: Address::ZERO,
                    revocable: true, // Default to true since we don't have this from the event
                    data: Bytes::new(), // Empty data since we don't have this from the event
                }
            }
        };

        // Get LLM configuration from config variables with defaults
        let model = config_var("llm_model").unwrap_or_else(|| "llama3.2".to_string());

        let temperature =
            config_var("llm_temperature").and_then(|s| s.parse::<f32>().ok()).unwrap_or(0.0);

        let top_p = config_var("llm_top_p").and_then(|s| s.parse::<f32>().ok()).unwrap_or(1.0);

        let seed = config_var("llm_seed").and_then(|s| s.parse::<u32>().ok()).unwrap_or(42);

        let max_tokens = config_var("llm_max_tokens")
            .and_then(|s| s.parse::<u32>().ok())
            .map(Some)
            .unwrap_or(Some(100));

        let context_window = config_var("llm_context_window")
            .and_then(|s| s.parse::<u32>().ok())
            .map(Some)
            .unwrap_or(Some(250));

        // Get system message from config or use default
        let system_message = config_var("llm_system_message").unwrap_or_else(|| {
                "You are analyzing blockchain attestation data. The user will provide you with the raw attestation data content. \
                 Analyze what this data represents, its purpose, and provide relevant insights. \
                 If the data appears to be structured (JSON, encoded values, etc.), interpret its meaning. \
                 Respond concisely with your analysis.".to_string()
            });

        // Use the attestation data directly as the user prompt
        let user_prompt = format_attestation_data(&attestation_data.data);

        // Get attestation schema UID from config or use the one from the request
        let attestation_schema =
            config_var("attestation_schema_uid").unwrap_or_else(|| schema_uid.to_string());

        // Check if attestation should be revocable (default: true)
        let revocable = config_var("attestation_revocable")
            .and_then(|s| s.parse::<bool>().ok())
            .unwrap_or(true);

        // Get attestation expiration time (default: 0 for no expiration)
        let expiration_time =
            config_var("attestation_expiration").and_then(|s| s.parse::<u64>().ok()).unwrap_or(0);

        println!("📋 LLM Configuration:");
        println!("  - Model: {}", model);
        println!("  - Temperature: {}", temperature);
        println!("  - Top P: {}", top_p);
        println!("  - Seed: {}", seed);
        println!("  - Max Tokens: {:?}", max_tokens);
        println!("  - Context Window: {:?}", context_window);
        println!("  - Schema UID: {}", attestation_schema);
        println!("  - Revocable: {}", revocable);
        println!("  - Expiration: {}", expiration_time);

        // Create LLM configuration
        let llm_options = LlmOptions { temperature, top_p, seed, max_tokens, context_window };

        // Create configuration
        let mut config = Config {
            model: model.clone(),
            llm_config: llm_options,
            messages: vec![Message {
                role: "system".into(),
                content: Some(system_message),
                tool_calls: None,
                tool_call_id: None,
                name: None,
            }],
            contracts: vec![],
            config: vec![],
        };

        // Add user message to config
        config.messages.push(Message {
            role: "user".into(),
            content: Some(user_prompt.clone()),
            tool_calls: None,
            tool_call_id: None,
            name: None,
        });

        println!("💬 User prompt: {}", user_prompt);

        // Get completion from LLM
        let llm = client::with_config(model, config.llm_config)
            .map_err(|e| format!("Failed to create LLM client: {}", e))?;

        // TODO: upload to IPFS?

        let result = llm
            .chat_completion_text(config.messages)
            .map_err(|e| format!("Failed to get LLM completion: {}", e))?;

        println!("🤖 LLM Response: {}", result);

        // Create attestation data from LLM response
        // In a real implementation, you might want to structure this data more carefully
        let result_bytes = Bytes::from(result.as_bytes().to_vec());

        // Check if we should include a value transfer (default: 0)
        let attestation_value = config_var("attestation_value")
            .and_then(|s| s.parse::<u128>().ok())
            .map(U256::from)
            .unwrap_or(U256::ZERO);

        // Create the attestation payload
        let attestation = AttestationPayload {
            operationType: OperationType::ATTEST,
            data: AttestationRequest {
                schema: attestation_schema.parse().unwrap_or(schema_uid),
                data: AttestationRequestData {
                    recipient,                       // The recipient of the attestation
                    expirationTime: expiration_time, // When the attestation expires
                    revocable,                       // Whether the attestation is revocable
                    refUID: ref_uid,                 // The UID of the related attestation
                    data: result_bytes,              // Custom attestation data with LLM response
                    value: attestation_value,        // Value of funds transferred
                },
            }
            .abi_encode()
            .into(),
        };

        println!("✅ Attestation payload created successfully");

        // ABI encode the attestation payload
        let encoded_response = attestation.abi_encode();

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
