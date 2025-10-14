use crate::sources::SourceEvent;
use anyhow::Result;
use async_trait::async_trait;
use serde_json::json;
use std::collections::HashSet;
use wavs_wasi_utils::evm::alloy_primitives::{Address, U256};

use super::Source;

/// Compute points from indexed interactions.
pub struct InteractionsSource {
    /// Interaction type.
    pub interaction_type: String,
    /// Points per interaction.
    pub points_per_interaction: U256,
    /// Whether or not to count all interactions or just one-per-contract.
    pub one_per_contract: bool,
}

impl InteractionsSource {
    pub fn new(
        interaction_type: &str,
        points_per_interaction: U256,
        one_per_contract: bool,
    ) -> Self {
        Self {
            interaction_type: interaction_type.to_string(),
            points_per_interaction,
            one_per_contract,
        }
    }
}

#[async_trait(?Send)]
impl Source for InteractionsSource {
    fn get_name(&self) -> &str {
        "Interactions"
    }

    async fn get_accounts(&self, ctx: &super::SourceContext) -> Result<Vec<String>> {
        let total_interactions = ctx
            .indexer_querier
            .get_interaction_count_by_type(&self.interaction_type)
            .await
            .map_err(|e| anyhow::anyhow!(e))?;
        println!(
            "📊 Total interactions for type {}: {}",
            self.interaction_type, total_interactions
        );

        if total_interactions == 0 {
            return Ok(vec![]);
        }

        let mut accounts = HashSet::new();
        let batch_size = 100u64;
        let mut start = 0u64;

        while start < total_interactions {
            let length = std::cmp::min(batch_size, total_interactions - start);
            println!(
                "🔄 Fetching interactions batch for type {}: {} to {}",
                self.interaction_type,
                start,
                start + length - 1
            );

            let events = ctx
                .indexer_querier
                .get_interactions_by_type(&self.interaction_type, start, length, false)
                .await
                .map_err(|e| anyhow::anyhow!(e))?;

            for event in events {
                match event.relevantAddresses.first() {
                    Some(addr) => {
                        accounts.insert(addr.to_string());
                    }
                    None => {
                        println!(
                            "⚠️ Failed to get interactor's address for event: {:?}",
                            event.eventId
                        );
                    }
                }
            }

            start += length;
        }

        let result: Vec<String> = accounts.into_iter().collect();
        println!("✅ Found {} unique interactors' addresses", result.len());
        Ok(result)
    }

    async fn get_events_and_value(
        &self,
        ctx: &super::SourceContext,
        account: &Address,
    ) -> Result<(Vec<SourceEvent>, U256)> {
        let interaction_count = ctx
            .indexer_querier
            .get_interaction_count_by_type_and_address(&self.interaction_type, *account)
            .await
            .map_err(|e| anyhow::anyhow!(e))?;

        let mut source_events: Vec<SourceEvent> = Vec::new();
        let mut contracts: HashSet<String> = HashSet::new();
        let batch_size = 100u64;
        let mut start = 0u64;

        while start < interaction_count {
            let length = std::cmp::min(batch_size, interaction_count - start);
            println!(
                "🔄 Fetching interactions batch for type {}: {} to {}",
                self.interaction_type,
                start,
                start + length - 1
            );

            let events = ctx
                .indexer_querier
                .get_interactions_by_type_and_address(
                    &self.interaction_type,
                    *account,
                    start,
                    length,
                    false,
                )
                .await
                .map_err(|e| anyhow::anyhow!(e))?;

            for event in events {
                // If only one interaction per contract, filter out duplicates.
                if self.one_per_contract {
                    if !contracts.contains(&event.relevantContract.to_string()) {
                        contracts.insert(event.relevantContract.to_string());
                        source_events.push(SourceEvent {
                            r#type: self.interaction_type.clone(),
                            timestamp: event.timestamp,
                            value: self.points_per_interaction,
                            metadata: Some(json!({
                                "eventId": event.eventId.to_string(),
                                "chainId": event.chainId,
                                "block": event.blockNumber.to::<u128>(),
                                "contract": event.relevantContract.to_string(),
                                "tags": event.tags,
                                "data": event.data.to_string(),
                            })),
                        });
                    }
                } else {
                    source_events.push(SourceEvent {
                        r#type: self.interaction_type.clone(),
                        timestamp: event.timestamp,
                        value: self.points_per_interaction,
                        metadata: Some(json!({
                            "eventId": event.eventId.to_string(),
                            "chainId": event.chainId,
                            "block": event.blockNumber.to::<u128>(),
                            "contract": event.relevantContract.to_string(),
                            "tags": event.tags,
                            "data": event.data.to_string(),
                        })),
                    });
                }
            }

            start += length;
        }

        let total_value = self.points_per_interaction * U256::from(source_events.len());

        Ok((source_events, total_value))
    }

    async fn get_metadata(&self, ctx: &super::SourceContext) -> Result<serde_json::Value> {
        Ok(serde_json::json!({
            "indexer_address": ctx.indexer_address.to_string(),
            "chain_name": ctx.chain_name,
            "interaction_type": self.interaction_type,
            "points_per_interaction": self.points_per_interaction.to_string(),
            "one_per_contract": self.one_per_contract,
        }))
    }
}
