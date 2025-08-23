mod trigger;
use alloy_primitives::ruint::aliases::U256;
use alloy_primitives::Bytes;
use alloy_sol_types::SolValue;
use trigger::{
    decode_trigger_event, encode_trigger_output, AttestationPayload, AttestationRequest,
    AttestationRequestData, Destination, OperationType,
};
use wavs_llm::traits::GuestLlmClientManager;
use wstd::runtime::block_on;
pub mod bindings;
use crate::bindings::{export, Guest, TriggerAction, WasmResponse};
use wavs_llm::client;
use wavs_llm::types::{Config, LlmOptions, Message};

struct Component;
export!(Component with_types_in bindings);

impl Guest for Component {
    /// Generic EAS attestation component.
    ///
    /// A generic component that receives attestation input data and creates a new EAS attestation.
    fn run(action: TriggerAction) -> std::result::Result<Option<WasmResponse>, String> {
        let (payload, dest) = decode_trigger_event(action.data).map_err(|e| e.to_string())?;

        block_on(async move {
            // Create LLM configuration
            let llm_options = LlmOptions {
                temperature: 0.0,
                top_p: 1.0,
                seed: 42,
                max_tokens: Some(500),
                context_window: Some(4096),
            };

            // Define system message
            let system_message =
                "You are an AI assistant that helps users interact with blockchain applications.";

            // Create configuration
            let mut config = Config {
                model: "llama3.2".to_string(),
                llm_config: llm_options,
                messages: vec![Message {
                    role: "system".into(),
                    content: Some(system_message.into()),
                    tool_calls: None,
                    tool_call_id: None,
                    name: None,
                }],
                contracts: vec![],
                config: vec![],
            };

            // User prompt
            let user_prompt = "How can I transfer USDC tokens?";

            // Add user message to config
            config.messages.push(Message {
                role: "user".into(),
                content: Some(user_prompt.into()),
                tool_calls: None,
                tool_call_id: None,
                name: None,
            });

            // Get completion
            let llm = client::with_config("llama3.2".to_string(), config.llm_config).unwrap();
            let result = llm.chat_completion_text(config.messages).unwrap();
            println!("LLM Response: {}", result);
        });

        // TODO make an attestation about the attestation.

        let attestation = AttestationPayload {
            operationType: OperationType::ATTEST,
            data: AttestationRequest {
                // TODO this will be a different schemaUID that we get from the config
                schema: payload.schemaUID,
                data: AttestationRequestData {
                    recipient: payload.recipient, // The recipient of the attestation.
                    expirationTime: 0, // The time when the attestation expires (Unix timestamp).
                    revocable: true,   // Whether the attestation is revocable.
                    refUID: payload.uid, // The UID of the related attestation.
                    data: Bytes::new(), // Custom attestation data.
                    value: U256::ZERO, // Value of funds transferred
                },
            }
            .abi_encode()
            .into(),
        };

        // ABI encode the attestation payload
        let encoded_response = attestation.abi_encode();

        let output = match dest {
            Destination::Ethereum => Some(encode_trigger_output(&encoded_response)),
            Destination::CliOutput => {
                Some(WasmResponse { payload: encoded_response.into(), ordering: None })
            }
        };

        Ok(output)
    }
}
