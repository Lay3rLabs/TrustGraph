use crate::sources::SourceEvent;
use alloy_dyn_abi::DynSolType;
use alloy_provider::Provider;
use alloy_rpc_types::TransactionInput;
use alloy_sol_types::{sol, SolCall};
use anyhow::Result;
use async_trait::async_trait;
use serde::Serialize;
use std::collections::HashSet;
use wavs_indexer_api::IndexedAttestation;
use wavs_wasi_utils::evm::alloy_primitives::{hex, Address, FixedBytes, TxKind, U256};

use super::Source;

/// Types of EAS-based points.
#[derive(Clone, Debug)]
pub enum EasSourceType {
    /// Points based on received attestations count for a specific schema.
    ReceivedAttestations {
        schema_uid: String,
        allow_self_attestations: bool,
        /// Optionally, only count attestations from trusted attesters.
        trusted_attesters: Option<Vec<Address>>,
    },
    /// Points based on sent attestations count for a specific schema.
    SentAttestations { schema_uid: String, allow_self_attestations: bool },
}

/// Compute points from EAS attestations.
pub struct EasSource {
    /// Type of EAS points to compute.
    pub source_type: EasSourceType,
    /// How to compute the summary for a given attestation.
    pub summary_computation: EasSummaryComputation,
    /// How to compute points for a given attestation.
    pub points_computation: EasPointsComputation,
    // TODO: add a seed field that only counts from certain senders
}

/// How to derive the summary for a given attestation.
#[derive(Serialize)]
pub enum EasSummaryComputation {
    /// A constant string for each attestation.
    Constant(String),
    /// The value of a string field in the attestation ABI-encoded data.
    StringAbiDataField { schema: String, index: usize },
}

/// How to compute points for a given attestation.
#[derive(Serialize)]
pub enum EasPointsComputation {
    /// A constant number of points for each attestation.
    Constant(U256),
    /// The value of a uint field in the attestation ABI-encoded data.
    UintAbiDataField { schema: String, index: usize },
}

impl EasSource {
    pub fn new(
        source_type: EasSourceType,
        summary_computation: EasSummaryComputation,
        points_computation: EasPointsComputation,
    ) -> Self {
        Self { source_type, summary_computation, points_computation }
    }
}

#[async_trait(?Send)]
impl Source for EasSource {
    fn get_name(&self) -> &str {
        "EAS"
    }

    async fn get_accounts(&self, ctx: &super::SourceContext) -> Result<Vec<String>> {
        match &self.source_type {
            EasSourceType::ReceivedAttestations { schema_uid, trusted_attesters, .. } => {
                if let Some(trusted_attesters) = trusted_attesters {
                    self.get_accounts_with_received_attestations_from_trusted_attesters(
                        ctx,
                        schema_uid,
                        trusted_attesters,
                    )
                    .await
                } else {
                    self.get_accounts_with_received_attestations(ctx, schema_uid).await
                }
            }
            EasSourceType::SentAttestations { schema_uid, .. } => {
                self.get_accounts_with_sent_attestations(ctx, schema_uid).await
            }
        }
    }

    async fn get_events_and_value(
        &self,
        ctx: &super::SourceContext,
        account: &Address,
    ) -> Result<(Vec<SourceEvent>, U256)> {
        let (schema_uid, attestation_count) = match &self.source_type {
            EasSourceType::ReceivedAttestations { schema_uid, .. } => (
                self.parse_schema_uid(schema_uid)?,
                self.query_received_attestation_count(ctx, account, schema_uid).await?,
            ),
            EasSourceType::SentAttestations { schema_uid, .. } => (
                self.parse_schema_uid(schema_uid)?,
                self.query_sent_attestation_count(ctx, account, schema_uid).await?,
            ),
        };

        let mut source_events: Vec<SourceEvent> = Vec::new();
        let batch_size = 100u64;
        let mut start = 0u64;

        let value_for_attestation: Box<dyn Fn(&IndexedAttestation) -> Result<U256>> = match &self
            .points_computation
        {
            EasPointsComputation::Constant(value) => Box::new(move |_| Ok(value.clone())),
            EasPointsComputation::UintAbiDataField { schema, index } => {
                let parsed_schema = DynSolType::parse(schema)
                    .map_err(|e| anyhow::anyhow!("Failed to parse schema: {e}"))?;
                Box::new(move |attestation| -> Result<U256> {
                    parsed_schema
                        .abi_decode_params(&attestation.event.data)
                        .map_err(|e| anyhow::anyhow!("Failed to decode attestation data: {e}"))?
                        .as_tuple()
                        .ok_or_else(|| anyhow::anyhow!("Attestation data is not a tuple"))?
                        .get(*index)
                        .ok_or_else(|| {
                            anyhow::anyhow!("Index {index} not found in attestation data")
                        })?
                        .as_uint()
                        .ok_or_else(|| {
                            anyhow::anyhow!("Attestation data field at index {index} is not a uint")
                        })
                        .map(|(value, _)| value)
                })
            }
        };

        let summary_for_attestation: Box<dyn Fn(&IndexedAttestation) -> Result<String>> =
            match &self.summary_computation {
                EasSummaryComputation::Constant(summary) => Box::new(move |_| Ok(summary.clone())),
                EasSummaryComputation::StringAbiDataField { schema, index } => {
                    let parsed_schema = DynSolType::parse(schema)
                        .map_err(|e| anyhow::anyhow!("Failed to parse schema: {e}"))?;
                    Box::new(move |attestation| -> Result<String> {
                        parsed_schema
                            .abi_decode_params(&attestation.event.data)
                            .map_err(|e| anyhow::anyhow!("Failed to decode attestation data: {e}"))?
                            .as_tuple()
                            .ok_or_else(|| anyhow::anyhow!("Attestation data is not a tuple"))?
                            .get(*index)
                            .ok_or_else(|| {
                                anyhow::anyhow!("Index {index} not found in attestation data")
                            })?
                            .as_str()
                            .map(|s| s.to_string())
                            .ok_or_else(|| {
                                anyhow::anyhow!(
                                    "Attestation data field at index {index} is not a string"
                                )
                            })
                    })
                }
            };

        while start < attestation_count {
            let length = std::cmp::min(batch_size, attestation_count - start);

            let (attestations, allow_self_attestations, trusted_attesters) = match &self.source_type
            {
                EasSourceType::ReceivedAttestations {
                    allow_self_attestations,
                    trusted_attesters,
                    ..
                } => (
                    ctx.indexer_querier
                        .get_indexed_attestations_by_schema_and_recipient(
                            schema_uid,
                            account,
                            U256::from(start),
                            U256::from(length),
                            false,
                        )
                        .await
                        .map_err(|e| anyhow::anyhow!(e))?,
                    *allow_self_attestations,
                    trusted_attesters.clone(),
                ),
                EasSourceType::SentAttestations { allow_self_attestations, .. } => (
                    ctx.indexer_querier
                        .get_indexed_attestations_by_schema_and_attester(
                            schema_uid,
                            account,
                            U256::from(start),
                            U256::from(length),
                            false,
                        )
                        .await
                        .map_err(|e| anyhow::anyhow!(e))?,
                    *allow_self_attestations,
                    None,
                ),
            };

            for attestation in attestations {
                // Skip self-attestations if not allowed.
                if !allow_self_attestations && attestation.attester == attestation.recipient {
                    continue;
                }

                // Skip if the attester is not a trusted attester.
                if let Some(trusted_attesters) = &trusted_attesters {
                    if !trusted_attesters.contains(&attestation.attester) {
                        continue;
                    }
                }

                let value = match value_for_attestation(&attestation) {
                    Ok(value) => value,
                    // Log the error and continue if the value is not found, so that formatting errors don't interrupt the flow.
                    Err(e) => {
                        println!(
                            "⚠️  Failed to get value for attestation {}: {}",
                            attestation.uid, e
                        );
                        continue;
                    }
                };

                let summary = match summary_for_attestation(&attestation) {
                    Ok(summary) => summary,
                    // Log the error and continue if the summary is not found, so that formatting errors don't interrupt the flow.
                    Err(e) => {
                        println!(
                            "⚠️  Failed to get summary for attestation {}: {}",
                            attestation.uid, e
                        );
                        continue;
                    }
                };

                source_events.push(SourceEvent {
                    r#type: "attestation".to_string(),
                    timestamp: attestation.event.timestamp,
                    value,
                    metadata: Some(serde_json::json!({
                        "uid": attestation.uid,
                        "schema": schema_uid.to_string(),
                        "attester": attestation.attester,
                        "recipient": attestation.recipient,
                        "summary": summary,
                    })),
                });
            }

            start += length;
        }

        let total_value = source_events.iter().map(|event| event.value).sum();

        Ok((source_events, total_value))
    }

    async fn get_metadata(&self, ctx: &super::SourceContext) -> Result<serde_json::Value> {
        let (source_type_str, schema_uid) = match &self.source_type {
            EasSourceType::ReceivedAttestations { schema_uid, .. } => {
                ("received_attestations".to_string(), schema_uid.clone())
            }
            EasSourceType::SentAttestations { schema_uid, .. } => {
                ("sent_attestations".to_string(), schema_uid.clone())
            }
        };

        Ok(serde_json::json!({
            "eas_address": ctx.eas_address.to_string(),
            "indexer_address": ctx.indexer_address.to_string(),
            "chain_name": ctx.chain_name,
            "source_type": source_type_str,
            "schema_uid": schema_uid,
            "summary_computation": serde_json::to_value(&self.summary_computation)?.to_string(),
            "points_computation": serde_json::to_value(&self.points_computation)?.to_string(),
        }))
    }
}

impl EasSource {
    fn parse_schema_uid(&self, schema_uid: &str) -> Result<FixedBytes<32>> {
        let schema_bytes = hex::decode(schema_uid.strip_prefix("0x").unwrap_or(schema_uid))?;
        if schema_bytes.len() != 32 {
            return Err(anyhow::anyhow!("Schema UID must be 32 bytes"));
        }
        let mut schema_array = [0u8; 32];
        schema_array.copy_from_slice(&schema_bytes);
        Ok(schema_array.into())
    }

    async fn query_received_attestation_count(
        &self,
        ctx: &super::SourceContext,
        recipient: &Address,
        schema_uid: &str,
    ) -> Result<u64> {
        let schema = self.parse_schema_uid(schema_uid)?;
        let count = ctx
            .indexer_querier
            .get_attestation_count_by_schema_and_recipient(schema, recipient)
            .await
            .map_err(|e| anyhow::anyhow!("Failed to get received attestation count: {}", e))?;
        Ok(count.to::<u64>())
    }

    async fn query_sent_attestation_count(
        &self,
        ctx: &super::SourceContext,
        attester: &Address,
        schema_uid: &str,
    ) -> Result<u64> {
        let schema = self.parse_schema_uid(schema_uid)?;
        let count = ctx
            .indexer_querier
            .get_attestation_count_by_schema_and_attester(schema, attester)
            .await
            .map_err(|e| anyhow::anyhow!("Failed to get sent attestation count: {}", e))?;
        Ok(count.to::<u64>())
    }

    async fn get_indexed_attestations(
        &self,
        ctx: &super::SourceContext,
        schema_uid: &str,
        start: u64,
        length: u64,
    ) -> Result<Vec<IndexedAttestation>> {
        let schema = self.parse_schema_uid(schema_uid)?;
        let attestations = ctx
            .indexer_querier
            .get_indexed_attestations_by_schema(schema, start, length, false)
            .await
            .map_err(|e| anyhow::anyhow!("Failed to get indexed schema attestations: {}", e))?;
        Ok(attestations)
    }

    async fn get_indexed_attestations_by_schema_and_attester(
        &self,
        ctx: &super::SourceContext,
        attester: &Address,
        schema_uid: &str,
        start: u64,
        length: u64,
    ) -> Result<Vec<IndexedAttestation>> {
        let schema = self.parse_schema_uid(schema_uid)?;
        let attestations = ctx
            .indexer_querier
            .get_indexed_attestations_by_schema_and_attester(
                schema,
                attester,
                U256::from(start),
                U256::from(length),
                false,
            )
            .await
            .map_err(|e| anyhow::anyhow!("Failed to get indexed schema attestations: {}", e))?;
        Ok(attestations)
    }

    async fn get_total_schema_attestations(
        &self,
        ctx: &super::SourceContext,
        schema_uid: &str,
    ) -> Result<u64> {
        let schema = self.parse_schema_uid(schema_uid)?;
        let count = ctx
            .indexer_querier
            .get_attestation_count_by_schema(schema)
            .await
            .map_err(|e| anyhow::anyhow!("Failed to get schema attestation count: {}", e))?;
        Ok(count.to::<u64>())
    }

    async fn get_attestation_details(
        &self,
        ctx: &super::SourceContext,
        uid: FixedBytes<32>,
    ) -> Result<(Address, Address)> {
        // Query the EAS contract directly to get attestation details
        let call = IEAS::getAttestationCall { uid };
        let tx = alloy_rpc_types::eth::TransactionRequest {
            to: Some(TxKind::Call(ctx.eas_address)),
            input: TransactionInput { input: Some(call.abi_encode().into()), data: None },
            ..Default::default()
        };

        let result = ctx.provider.call(tx).await?;

        // The attestation struct is returned, we need the attester and recipient
        // For now, let's decode the basic fields we need
        let decoded = IEAS::getAttestationCall::abi_decode_returns(&result)
            .map_err(|e| anyhow::anyhow!("Failed to decode attestation: {}", e))?;
        Ok((decoded.attester, decoded.recipient))
    }

    async fn get_accounts_with_received_attestations(
        &self,
        ctx: &super::SourceContext,
        schema_uid: &str,
    ) -> Result<Vec<String>> {
        println!("🔍 Querying accounts with received attestations for schema: {}", schema_uid);

        let total_attestations = self.get_total_schema_attestations(ctx, schema_uid).await?;
        println!("📊 Total attestations for schema: {}", total_attestations);

        if total_attestations == 0 {
            return Ok(vec![]);
        }

        let mut recipients = HashSet::new();
        let batch_size = 100u64;
        let mut start = 0u64;

        while start < total_attestations {
            let length = std::cmp::min(batch_size, total_attestations - start);
            println!("🔄 Fetching attestation batch: {} to {}", start, start + length - 1);

            let attestations =
                self.get_indexed_attestations(ctx, schema_uid, start, length).await?;

            for attestation in attestations {
                recipients.insert(attestation.recipient.to_string());
            }

            start += length;
        }

        let result: Vec<String> = recipients.into_iter().collect();
        println!("✅ Found {} unique recipients", result.len());
        Ok(result)
    }

    async fn get_accounts_with_sent_attestations(
        &self,
        ctx: &super::SourceContext,
        schema_uid: &str,
    ) -> Result<Vec<String>> {
        println!("🔍 Querying accounts with sent attestations for schema: {}", schema_uid);

        let total_attestations = self.get_total_schema_attestations(ctx, schema_uid).await?;
        println!("📊 Total attestations for schema: {}", total_attestations);

        if total_attestations == 0 {
            return Ok(vec![]);
        }

        let mut attesters = HashSet::new();
        let batch_size = 100u64;
        let mut start = 0u64;

        while start < total_attestations {
            let length = std::cmp::min(batch_size, total_attestations - start);
            println!("🔄 Fetching attestation batch: {} to {}", start, start + length - 1);

            let attestations =
                self.get_indexed_attestations(ctx, schema_uid, start, length).await?;

            for attestation in attestations {
                attesters.insert(attestation.attester.to_string());
            }

            start += length;
        }

        let result: Vec<String> = attesters.into_iter().collect();
        println!("✅ Found {} unique attesters", result.len());
        Ok(result)
    }

    async fn get_accounts_with_received_attestations_from_trusted_attesters(
        &self,
        ctx: &super::SourceContext,
        schema_uid: &str,
        trusted_attesters: &Vec<Address>,
    ) -> Result<Vec<String>> {
        println!(
            "🔍 Querying accounts with received attestations from {} trusted attesters for schema: {}",
            trusted_attesters.len(),
            schema_uid
        );

        let mut recipients: HashSet<String> = HashSet::new();

        for attester in trusted_attesters {
            let total_sent_by_attester =
                self.query_sent_attestation_count(ctx, attester, schema_uid).await?;

            println!(
                "📊 Total attestations for schema from attester {}: {}",
                attester, total_sent_by_attester
            );

            if total_sent_by_attester == 0 {
                continue;
            }

            let batch_size = 100u64;
            let mut start = 0u64;

            while start < total_sent_by_attester {
                let length = std::cmp::min(batch_size, total_sent_by_attester - start);
                println!(
                    "🔄 Fetching attestations from attester {} attestation batch: {} to {}",
                    attester,
                    start,
                    start + length - 1
                );

                let attestations = self
                    .get_indexed_attestations_by_schema_and_attester(
                        ctx, attester, schema_uid, start, length,
                    )
                    .await?;

                for attestation in attestations {
                    recipients.insert(attestation.recipient.to_string());
                }

                start += length;
            }
        }

        let result: Vec<String> = recipients.into_iter().collect();
        println!("✅ Found {} unique recipients from trusted attesters", result.len());
        Ok(result)
    }
}

sol! {
    struct AttestationStruct {
        bytes32 uid;
        bytes32 schema;
        uint64 time;
        uint64 expirationTime;
        uint64 revocationTime;
        bytes32 refUID;
        address recipient;
        address attester;
        bool revocable;
        bytes data;
    }

    interface IEAS {
        function getAttestation(bytes32 uid) external view returns (AttestationStruct memory);
    }
}
