use crate::sources::{hyperstition::IMarketMaker::IMarketMakerInstance, SourceEvent};
use alloy_sol_macro::sol;
use anyhow::Result;
use async_trait::async_trait;
use serde_json::json;
use std::{collections::HashSet, str::FromStr};
use wavs_wasi_utils::evm::alloy_primitives::{Address, U256};

use super::Source;

/// Award points to those who predicted yes in a successful Hyperstition market.
pub struct HyperstitionSource {
    /// Market maker.
    pub market_maker: Address,
    /// Total points to be distributed.
    pub points_pool: U256,
}

impl HyperstitionSource {
    pub fn new(market_maker: &str, points_pool: U256) -> Result<Self, String> {
        let market_maker = Address::from_str(market_maker)
            .map_err(|e| format!("Failed to parse market maker address: {e}"))?;
        Ok(Self { market_maker, points_pool })
    }
}

#[async_trait(?Send)]
impl Source for HyperstitionSource {
    fn get_name(&self) -> &str {
        "Hyperstition"
    }

    async fn get_accounts(&self, ctx: &super::SourceContext) -> Result<Vec<String>> {
        // Check if the market resolved to true (if an event has been indexed with the tag "marketMaker:{}/success")
        let hyperstition_succeeded = !ctx
            .indexer_querier
            .getEventCountByTypeAndTag(
                "market_resolution".to_string(),
                format!("marketMaker:{}/success", self.market_maker),
            )
            .call()
            .await
            .map_err(|e| anyhow::anyhow!(e))?
            .is_zero();

        if !hyperstition_succeeded {
            return Ok(vec![]);
        }

        let market_maker = IMarketMakerInstance::new(self.market_maker, &ctx.provider);
        let conditional_tokens = market_maker.pmSystem().call().await?;

        let total_redeems = ctx
            .indexer_querier
            .get_interaction_count_by_contract_and_type(
                &ctx.chain_id,
                &conditional_tokens,
                "prediction_market_redeem",
            )
            .await
            .map_err(|e| anyhow::anyhow!(e))?;
        println!("📊 Total successful hyperstition redemptions: {}", total_redeems);

        if total_redeems == 0 {
            return Ok(vec![]);
        }

        let mut accounts = HashSet::new();
        let batch_size = 100u64;
        let mut start = 0u64;

        while start < total_redeems {
            let length = std::cmp::min(batch_size, total_redeems - start);
            println!("🔄 Fetching redemptions batch: {} to {}", start, start + length - 1);

            let events = ctx
                .indexer_querier
                .get_interactions_by_contract_and_type(
                    "prediction_market_redeem",
                    &ctx.chain_id,
                    &conditional_tokens,
                    start,
                    length,
                    false,
                )
                .await
                .map_err(|e| anyhow::anyhow!(e))?;

            for event in events {
                match event.relevantAddresses.first() {
                    Some(addr) => {
                        accounts.insert(addr.to_string());
                    }
                    None => {
                        println!(
                            "⚠️ Failed to get redeemer's address for event: {:?}",
                            event.eventId
                        );
                    }
                }
            }

            start += length;
        }

        let result: Vec<String> = accounts.into_iter().collect();
        println!("✅ Found {} unique redeemers' addresses", result.len());
        Ok(result)
    }

    async fn get_events_and_value(
        &self,
        ctx: &super::SourceContext,
        account: &Address,
    ) -> Result<(Vec<SourceEvent>, U256)> {
        let potential_events = ctx
            .indexer_querier
            .getEventsByTypeAndTag(
                "market_resolution".to_string(),
                format!("marketMaker:{}/success", self.market_maker),
                U256::ZERO,
                U256::ONE,
                false,
            )
            .call()
            .await
            .map_err(|e| anyhow::anyhow!(e))?;

        // If market not resolved, return 0.
        let hyperstition_resolution_event = match potential_events.first() {
            Some(event) => event,
            None => return Ok((vec![], U256::ZERO)),
        };

        let redeemable_collateral = U256::try_from_be_slice(&hyperstition_resolution_event.data)
            .ok_or_else(|| anyhow::anyhow!("Failed to parse data as u256 redeemable collateral"))?;

        let market_maker = IMarketMakerInstance::new(self.market_maker, &ctx.provider);
        let conditional_tokens = market_maker.pmSystem().call().await?;

        let redemption_count = ctx
            .indexer_querier
            .get_interaction_count_by_type_and_address("prediction_market_redeem", *account)
            .await
            .map_err(|e| anyhow::anyhow!(e))?;

        let batch_size = 10u64;
        let mut start = 0u64;

        while start < redemption_count {
            let length = std::cmp::min(batch_size, redemption_count - start);
            println!(
                "🔄 Finding interaction redemption batch for address {}: {} to {}",
                *account,
                start,
                start + length - 1
            );

            let events = ctx
                .indexer_querier
                .get_interactions_by_type_and_address(
                    "prediction_market_redeem",
                    *account,
                    start,
                    length,
                    false,
                )
                .await
                .map_err(|e| anyhow::anyhow!(e))?;

            for redemption_event in events {
                if redemption_event.relevantContract == conditional_tokens {
                    let payout =
                        U256::try_from_be_slice(&redemption_event.data).ok_or_else(|| {
                            anyhow::anyhow!(
                                "Failed to parse redemption interaction event data as u256 payout"
                            )
                        })?;

                    let value = self.points_pool * payout / redeemable_collateral;

                    let source_events = vec![SourceEvent {
                        r#type: "hyperstition_realized".to_string(),
                        timestamp: redemption_event.timestamp,
                        value,
                        metadata: Some(json!({
                            "eventId": redemption_event.eventId.to_string(),
                            "chainId": redemption_event.chainId,
                            "marketMaker": self.market_maker,
                            "conditionalTokens": conditional_tokens.to_string(),
                            "payout": payout.to_string(),
                        })),
                    }];

                    return Ok((source_events, value));
                }
            }

            start += length;
        }

        Ok((vec![], U256::ZERO))
    }

    async fn get_metadata(&self, ctx: &super::SourceContext) -> Result<serde_json::Value> {
        Ok(serde_json::json!({
            "indexer_address": ctx.indexer_address.to_string(),
            "chain_name": ctx.chain_name,
            "market_maker": self.market_maker,
            "points_pool": self.points_pool.to_string(),
        }))
    }
}

sol! {
    #![sol(rpc)]
    interface IMarketMaker {
        address public pmSystem;
    }
}
