use super::EventTransformer;
use crate::bindings::host;
use crate::bindings::wavs::types::service::{AggregatorSubmit, Submit};
use crate::register_transformer;
use crate::trigger::EventData;
use crate::{bindings::host::get_evm_chain_config, solidity::IndexingPayload};
use alloy_network::Ethereum;
use alloy_primitives::{Address, FixedBytes, U256};
use alloy_sol_types::SolEvent;
use anyhow::Result;
use wavs_indexer_api::query::WavsIndexerQuerier;
use wavs_wasi_utils::{decode_event_log_data, evm::new_evm_provider};

use crate::solidity::{AttestationAttested, AttestationRevoked, IndexedEvent};

pub struct AttestationTransformer;
register_transformer!(AttestationTransformer);

impl EventTransformer for AttestationTransformer {
    fn name() -> &'static str {
        "AttestationTransformer"
    }

    fn supports_event(event_signature: &FixedBytes<32>) -> bool {
        *event_signature == AttestationAttested::SIGNATURE_HASH
            || *event_signature == AttestationRevoked::SIGNATURE_HASH
    }

    async fn transform(
        event_signature: FixedBytes<32>,
        event_data: EventData,
    ) -> Result<IndexingPayload> {
        if event_signature == AttestationAttested::SIGNATURE_HASH {
            Self::transform_attestation(event_data).await
        } else if event_signature == AttestationRevoked::SIGNATURE_HASH {
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

        let chain = get_evm_chain_config(&event_data.chain).unwrap();
        let provider = new_evm_provider::<Ethereum>(chain.http_endpoint.unwrap());

        let eas = solidity::EAS::new(attested.eas, &provider);
        let attestation = eas.getAttestation(attested.uid).call().await?;

        // Create IndexedEvent
        let indexed_event = IndexedEvent {
            eventId: FixedBytes::ZERO,
            chainId: chain.chain_id,
            relevantContract: attested.eas,
            blockNumber: U256::from(event_data.block_number),
            timestamp: attestation.time as u128,
            eventType: "attestation".to_string(),
            tags: vec![
                format!("eas:{}", attested.eas),
                format!("uid:{}", attested.uid),
                format!("schema:{}", attestation.schema),
                format!("attester:{}", attestation.attester),
                format!("recipient:{}", attestation.recipient),
                format!("schema:{}/attester:{}", attestation.schema, attestation.attester),
                format!("schema:{}/recipient:{}", attestation.schema, attestation.recipient),
                format!(
                    "schema:{}/attester:{}/recipient:{}",
                    attestation.schema, attestation.attester, attestation.recipient
                ),
            ],
            relevantAddresses: vec![attestation.attester, attestation.recipient],
            data: attestation.data,
            metadata: Vec::new().into(),
            deleted: false,
        };

        Ok(IndexingPayload { toAdd: vec![indexed_event], toDelete: Vec::new() })
    }

    async fn transform_revocation(event_data: EventData) -> Result<IndexingPayload> {
        // Decode the Attested event
        let revoked: AttestationRevoked = decode_event_log_data!(event_data.log)?;

        println!("Transforming AttestationRevoked event: eas={}, uid={}", revoked.eas, revoked.uid);

        let wavs_indexer_address: Address = match host::get_workflow().workflow.submit {
            Submit::Aggregator(AggregatorSubmit { component, .. }) => component
                .config
                .first()
                .ok_or(anyhow::anyhow!("Aggregator config not found"))?
                .1
                .parse()?,
            _ => return Err(anyhow::anyhow!("WavsIndexer address not found")),
        };

        let chain: crate::bindings::wavs::types::chain::EvmChainConfig =
            get_evm_chain_config(&event_data.chain).unwrap();
        let indexer_querier =
            WavsIndexerQuerier::new(wavs_indexer_address, chain.http_endpoint.unwrap())
                .await
                .map_err(|e| anyhow::anyhow!("Failed to create indexer querier: {}", e))?;

        let events = indexer_querier
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
    }
}
