use crate::{bindings::host::get_evm_chain_config, sources::SourceEvent};
use alloy_dyn_abi::DynSolType;
use alloy_network::Ethereum;
use alloy_provider::{Provider, RootProvider};
use alloy_rpc_types::TransactionInput;
use alloy_sol_types::{sol, SolCall};
use anyhow::Result;
use async_trait::async_trait;
use serde::Serialize;
use std::collections::HashSet;
use std::str::FromStr;
use wavs_indexer_api::{IndexedAttestation, WavsIndexerQuerier};
use wavs_wasi_utils::evm::{
    alloy_primitives::{hex, Address, FixedBytes, TxKind, U256},
    new_evm_provider,
};

use super::Source;

/// Types of EAS-based points.
#[derive(Clone, Debug)]
pub enum EasSourceType {
    /// Points based on received attestations count for a specific schema.
    ReceivedAttestations(String),
    /// Points based on sent attestations count for a specific schema.
    SentAttestations(String),
}

/// Compute points from EAS attestations.
pub struct EasSource {
    /// EAS contract address.
    pub eas_address: Address,
    /// WAVS indexer address (for queries)
    pub indexer_address: Address,
    /// Chain name for configuration.
    pub chain_name: String,
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
        eas_address: &str,
        indexer_address: &str,
        chain_name: &str,
        source_type: EasSourceType,
        summary_computation: EasSummaryComputation,
        points_computation: EasPointsComputation,
    ) -> Self {
        let eas_addr = Address::from_str(eas_address).unwrap();
        let indexer_addr = Address::from_str(indexer_address).unwrap();

        Self {
            eas_address: eas_addr,
            indexer_address: indexer_addr,
            chain_name: chain_name.to_string(),
            source_type,
            summary_computation,
            points_computation,
        }
    }

    async fn indexer_querier(&self) -> Result<WavsIndexerQuerier> {
        let chain_config = get_evm_chain_config(&self.chain_name)
            .ok_or_else(|| anyhow::anyhow!("Failed to get chain config for {}", self.chain_name))?;
        let indexer_querier =
            WavsIndexerQuerier::new(self.indexer_address, chain_config.http_endpoint.unwrap())
                .await
                .map_err(|e| anyhow::anyhow!("Failed to create indexer querier: {}", e))?;
        Ok(indexer_querier)
    }
}

#[async_trait(?Send)]
impl Source for EasSource {
    fn get_name(&self) -> &str {
        "EAS"
    }

    async fn get_accounts(&self) -> Result<Vec<String>> {
        match &self.source_type {
            EasSourceType::ReceivedAttestations(schema_uid) => {
                self.get_accounts_with_received_attestations(schema_uid).await
            }
            EasSourceType::SentAttestations(schema_uid) => {
                self.get_accounts_with_sent_attestations(schema_uid).await
            }
        }
    }

    async fn get_events_and_value(&self, account: &str) -> Result<(Vec<SourceEvent>, U256)> {
        let address = Address::from_str(account)?;
        let indexer_querier = self.indexer_querier().await?;
        let (schema_uid, attestation_count) = match &self.source_type {
            EasSourceType::ReceivedAttestations(schema_uid) => (
                self.parse_schema_uid(schema_uid)?,
                self.query_received_attestation_count(address, schema_uid).await?,
            ),
            EasSourceType::SentAttestations(schema_uid) => (
                self.parse_schema_uid(schema_uid)?,
                self.query_sent_attestation_count(address, schema_uid).await?,
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

            let attestations = match &self.source_type {
                EasSourceType::ReceivedAttestations(_) => {
                    indexer_querier
                        .get_indexed_attestations_by_schema_and_recipient(
                            schema_uid,
                            address,
                            U256::from(start),
                            U256::from(length),
                            false,
                        )
                        .await
                }
                EasSourceType::SentAttestations(_) => {
                    indexer_querier
                        .get_indexed_attestations_by_schema_and_attester(
                            schema_uid,
                            address,
                            U256::from(start),
                            U256::from(length),
                            false,
                        )
                        .await
                }
            }
            .map_err(|e| anyhow::anyhow!(e))?;

            for attestation in attestations {
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

    async fn get_metadata(&self) -> Result<serde_json::Value> {
        let (source_type_str, schema_uid) = match &self.source_type {
            EasSourceType::ReceivedAttestations(schema) => {
                ("received_attestations".to_string(), schema.clone())
            }
            EasSourceType::SentAttestations(schema) => {
                ("sent_attestations".to_string(), schema.clone())
            }
        };

        Ok(serde_json::json!({
            "eas_address": self.eas_address.to_string(),
            "indexer_address": self.indexer_address.to_string(),
            "chain_name": self.chain_name,
            "source_type": source_type_str,
            "schema_uid": schema_uid,
            "summary_computation": serde_json::to_value(&self.summary_computation)?.to_string(),
            "points_computation": serde_json::to_value(&self.points_computation)?.to_string(),
        }))
    }
}

impl EasSource {
    async fn create_provider(&self) -> Result<RootProvider<Ethereum>> {
        let chain_config = get_evm_chain_config(&self.chain_name)
            .ok_or_else(|| anyhow::anyhow!("Failed to get chain config for {}", self.chain_name))?;
        let provider = new_evm_provider::<Ethereum>(
            chain_config
                .http_endpoint
                .ok_or_else(|| anyhow::anyhow!("No HTTP endpoint configured"))?,
        );
        Ok(provider)
    }

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
        recipient: Address,
        schema_uid: &str,
    ) -> Result<u64> {
        let schema = self.parse_schema_uid(schema_uid)?;
        let indexer_querier = self.indexer_querier().await?;
        let count = indexer_querier
            .get_attestation_count_by_schema_and_recipient(schema, recipient)
            .await
            .map_err(|e| anyhow::anyhow!("Failed to get received attestation count: {}", e))?;
        Ok(count.to::<u64>())
    }

    async fn query_sent_attestation_count(
        &self,
        attester: Address,
        schema_uid: &str,
    ) -> Result<u64> {
        let schema = self.parse_schema_uid(schema_uid)?;
        let indexer_querier = self.indexer_querier().await?;
        let count = indexer_querier
            .get_attestation_count_by_schema_and_attester(schema, attester)
            .await
            .map_err(|e| anyhow::anyhow!("Failed to get sent attestation count: {}", e))?;
        Ok(count.to::<u64>())
    }

    async fn get_indexed_attestations(
        &self,
        schema_uid: &str,
        start: u64,
        length: u64,
    ) -> Result<Vec<IndexedAttestation>> {
        let schema = self.parse_schema_uid(schema_uid)?;
        let indexer_querier = self.indexer_querier().await?;
        let attestations = indexer_querier
            .get_indexed_attestations_by_schema(schema, start, length, false)
            .await
            .map_err(|e| anyhow::anyhow!("Failed to get indexed schema attestations: {}", e))?;
        Ok(attestations)
    }

    async fn get_total_schema_attestations(&self, schema_uid: &str) -> Result<u64> {
        let schema = self.parse_schema_uid(schema_uid)?;
        let indexer_querier = self.indexer_querier().await?;
        let count = indexer_querier
            .get_attestation_count_by_schema(schema)
            .await
            .map_err(|e| anyhow::anyhow!("Failed to get schema attestation count: {}", e))?;
        Ok(count.to::<u64>())
    }

    async fn get_attestation_details(&self, uid: FixedBytes<32>) -> Result<(Address, Address)> {
        // Query the EAS contract directly to get attestation details
        let provider = self.create_provider().await?;

        let call = IEAS::getAttestationCall { uid };
        let tx = alloy_rpc_types::eth::TransactionRequest {
            to: Some(TxKind::Call(self.eas_address)),
            input: TransactionInput { input: Some(call.abi_encode().into()), data: None },
            ..Default::default()
        };

        let result = provider.call(tx).await?;

        // The attestation struct is returned, we need the attester and recipient
        // For now, let's decode the basic fields we need
        let decoded = IEAS::getAttestationCall::abi_decode_returns(&result)
            .map_err(|e| anyhow::anyhow!("Failed to decode attestation: {}", e))?;
        Ok((decoded.attester, decoded.recipient))
    }

    async fn get_accounts_with_received_attestations(
        &self,
        schema_uid: &str,
    ) -> Result<Vec<String>> {
        println!("🔍 Querying accounts with received attestations for schema: {}", schema_uid);

        let total_attestations = self.get_total_schema_attestations(schema_uid).await?;
        println!("📊 Total attestations for schema: {}", total_attestations);

        if total_attestations == 0 {
            return Ok(vec![]);
        }

        let mut recipients = HashSet::new();
        let batch_size = 100u64;
        let mut start = 0u64;

        while start < total_attestations {
            let length = std::cmp::min(batch_size, total_attestations - start);
            println!("🔄 Fetching attestation UIDs batch: {} to {}", start, start + length - 1);

            let attestations = self.get_indexed_attestations(schema_uid, start, length).await?;

            for attestation in attestations {
                recipients.insert(attestation.recipient.to_string());
            }

            start += length;
        }

        let result: Vec<String> = recipients.into_iter().collect();
        println!("✅ Found {} unique recipients", result.len());
        Ok(result)
    }

    async fn get_accounts_with_sent_attestations(&self, schema_uid: &str) -> Result<Vec<String>> {
        println!("🔍 Querying accounts with sent attestations for schema: {}", schema_uid);

        let total_attestations = self.get_total_schema_attestations(schema_uid).await?;
        println!("📊 Total attestations for schema: {}", total_attestations);

        if total_attestations == 0 {
            return Ok(vec![]);
        }

        let mut attesters = HashSet::new();
        let batch_size = 100u64;
        let mut start = 0u64;

        while start < total_attestations {
            let length = std::cmp::min(batch_size, total_attestations - start);
            println!("🔄 Fetching attestation UIDs batch: {} to {}", start, start + length - 1);

            let attestations = self.get_indexed_attestations(schema_uid, start, length).await?;

            for attestation in attestations {
                attesters.insert(attestation.attester.to_string());
            }

            start += length;
        }

        let result: Vec<String> = attesters.into_iter().collect();
        println!("✅ Found {} unique attesters", result.len());
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
