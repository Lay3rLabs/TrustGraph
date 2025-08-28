use super::{utils, EventTransformer};
use crate::bindings::host;
use crate::bindings::wavs::types::service::{AggregatorSubmit, Submit};
use crate::register_transformer;
use crate::trigger::EventData;
use crate::{bindings::host::get_evm_chain_config, solidity::IndexingPayload};
use alloy_network::Ethereum;
use alloy_primitives::{keccak256, FixedBytes, U256};
use anyhow::Result;
use wavs_wasi_utils::decode_event_log_data;
use wavs_wasi_utils::evm::new_evm_provider;

use crate::solidity::{AttestationAttested, AttestationRevoked, UniversalEvent};

pub struct AttestationTransformer;
register_transformer!(AttestationTransformer);

const ATTESTATION_EVENT_SIGNATURE: &str = "AttestationAttested(address,bytes32)";
const REVOCATION_EVENT_SIGNATURE: &str = "AttestationRevoked(address,bytes32)";

impl EventTransformer for AttestationTransformer {
    fn name() -> &'static str {
        "AttestationTransformer"
    }

    fn supports_event(event_signature: &FixedBytes<32>) -> bool {
        *event_signature == keccak256(ATTESTATION_EVENT_SIGNATURE)
            || *event_signature == keccak256(REVOCATION_EVENT_SIGNATURE)
    }

    async fn transform(
        event_signature: FixedBytes<32>,
        event_data: EventData,
    ) -> Result<IndexingPayload> {
        if event_signature == keccak256(ATTESTATION_EVENT_SIGNATURE) {
            Self::transform_attestation(event_data).await
        } else if event_signature == keccak256(REVOCATION_EVENT_SIGNATURE) {
            Self::transform_revocation(event_data).await
        } else {
            Err(anyhow::anyhow!("Unsupported attestation event"))
        }
    }
}

impl AttestationTransformer {
    async fn transform_attestation(event_data: EventData) -> Result<IndexingPayload> {
        // Decode the Attested event
        let attested: AttestationAttested = decode_event_log_data!(event_data.log)?;

        println!(
            "Transforming AttestationAttested event: eas={}, uid={}",
            attested.eas, attested.uid
        );

        let chain = get_evm_chain_config(&event_data.chain_name).unwrap();
        let provider = new_evm_provider::<Ethereum>(chain.http_endpoint.unwrap());

        let eas = solidity::EAS::new(attested.eas, &provider);
        let attestation = eas.getAttestation(attested.uid).call().await?;

        // Create UniversalEvent
        let universal_event = UniversalEvent {
            eventId: FixedBytes::ZERO,
            chainId: chain.chain_id,
            relevantContract: attested.eas,
            blockNumber: U256::from(event_data.block_number),
            timestamp: utils::get_current_timestamp(),
            eventType: "attestation".to_string(),
            tags: vec![
                format!("eas:{}", attested.eas),
                format!("uid:{}", attested.uid),
                format!("attester:{}", attestation.attester),
                format!("recipient:{}", attestation.recipient),
                format!("schema:{}", attestation.schema),
            ],
            relevantAddresses: vec![attestation.attester, attestation.recipient],
            data: attestation.data,
            metadata: Vec::new().into(),
            deleted: false,
        };

        Ok(IndexingPayload { toAdd: vec![universal_event], toDelete: Vec::new() })
    }

    async fn transform_revocation(event_data: EventData) -> Result<IndexingPayload> {
        // Decode the Attested event
        let revoked: AttestationRevoked = decode_event_log_data!(event_data.log)?;

        println!("Transforming AttestationRevoked event: eas={}, uid={}", revoked.eas, revoked.uid);

        let chain = get_evm_chain_config(&event_data.chain_name).unwrap();
        let provider = new_evm_provider::<Ethereum>(chain.http_endpoint.unwrap());

        let universal_indexer_address = match host::get_workflow().workflow.submit {
            Submit::Aggregator(AggregatorSubmit { evm_contracts, .. }) => utils::from_evm_address(
                &evm_contracts
                    .ok_or(anyhow::anyhow!("EVM submission contracts not found"))?
                    .first()
                    .ok_or(anyhow::anyhow!("EVM submission contract not found"))?
                    .address,
            ),
            _ => return Err(anyhow::anyhow!("UniversalIndexer address not found")),
        };
        let universal_indexer =
            solidity::UniversalIndexer::new(universal_indexer_address, &provider);

        let events = universal_indexer
            .getEventsByTypeAndTag(
                "attestation".to_string(),
                format!("uid:{}", revoked.uid),
                U256::ZERO,
                U256::ONE,
                false,
            )
            .call()
            .await?;
        let event = events.first().ok_or(anyhow::anyhow!("Indexed attestation event not found"))?;

        if event.deleted {
            return Err(anyhow::anyhow!("Indexed attestation already deleted"));
        }

        Ok(IndexingPayload { toAdd: Vec::new(), toDelete: vec![event.eventId] })
    }
}

mod solidity {
    use alloy_sol_macro::sol;

    sol! {
        /// @notice A struct representing a single attestation.
        #[derive(serde::Serialize)]
        struct Attestation {
            bytes32 uid; // A unique identifier of the attestation.
            bytes32 schema; // The unique identifier of the schema.
            uint64 time; // The time when the attestation was created (Unix timestamp).
            uint64 expirationTime; // The time when the attestation expires (Unix timestamp).
            uint64 revocationTime; // The time when the attestation was revoked (Unix timestamp).
            bytes32 refUID; // The UID of the related attestation.
            address recipient; // The recipient of the attestation.
            address attester; // The attester/sender of the attestation.
            bool revocable; // Whether the attestation is revocable.
            bytes data; // Custom attestation data.
        }

        #[sol(rpc)]
        contract EAS {
            function getAttestation(bytes32 uid) external view returns (Attestation memory);
        }

        struct UniversalEvent {
            bytes32 eventId; // Unique identifier for this event
            string chainId; // Chain ID of the event
            address relevantContract; // Relevant contract for the event
            uint256 blockNumber; // Block number when event was emitted
            uint256 timestamp; // Timestamp when event was processed
            string eventType; // Type of the event (e.g., "attestation")
            bytes data; // Data for the event
            string[] tags; // Searchable tags (e.g., "sender:ADDRESS", "recipient:ADDRESS", "schema:SCHEMA_ID")
            address[] relevantAddresses; // Addresses relevant to this event (users, contracts, etc.)
            bytes metadata; // Optional: additional metadata
            bool deleted; // Whether the event has been deleted
        }

        #[sol(rpc)]
        contract UniversalIndexer {
            /// @notice Gets events by type and tag combination
            /// @param eventType The event type to filter by
            /// @param tag The tag to filter by
            /// @param start The offset to start from
            /// @param length The number of events to retrieve
            /// @param reverseOrder Whether to return in reverse chronological order
            /// @return Array of UniversalEvent structs
            function getEventsByTypeAndTag(
                string calldata eventType,
                string calldata tag,
                uint256 start,
                uint256 length,
                bool reverseOrder
            ) external view returns (UniversalEvent[] memory);
        }
    }
}
