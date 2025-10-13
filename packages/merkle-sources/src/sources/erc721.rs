use crate::sources::SourceEvent;
use alloy_provider::Provider;
use alloy_rpc_types::TransactionInput;
use alloy_sol_types::{sol, SolCall, SolType};
use anyhow::Result;
use async_trait::async_trait;
use serde_json::json;
use std::str::FromStr;
use wavs_wasi_utils::evm::alloy_primitives::{Address, TxKind, U256};

use super::Source;

/// Compute points from an ERC721 token.
pub struct Erc721Source {
    /// Contract address.
    pub address: Address,
    /// Points per token.
    pub points_per_token: U256,
}

impl Erc721Source {
    pub fn new(address: &str, points_per_token: U256) -> Self {
        let nft_contract = Address::from_str(address).unwrap();
        Self { address: nft_contract, points_per_token }
    }
}

#[async_trait(?Send)]
impl Source for Erc721Source {
    fn get_name(&self) -> &str {
        "ERC721"
    }

    async fn get_accounts(&self, ctx: &super::SourceContext) -> Result<Vec<String>> {
        let holders = self.query_holders(ctx).await?;
        Ok(holders)
    }

    async fn get_events_and_value(
        &self,
        ctx: &super::SourceContext,
        account: &Address,
    ) -> Result<(Vec<SourceEvent>, U256)> {
        let nft_balance = self.query_nft_ownership(ctx, *account).await?;
        let source_events: Vec<SourceEvent> = (0..nft_balance.to::<u64>())
            .map(|_| SourceEvent {
                r#type: "ERC721".to_string(),
                timestamp: 0,
                value: self.points_per_token,
                metadata: Some(json!({
                    "address": account.to_string(),
                })),
            })
            .collect();
        let total_value = self.points_per_token * U256::from(source_events.len());
        Ok((source_events, total_value))
    }

    async fn get_metadata(&self, _ctx: &super::SourceContext) -> Result<serde_json::Value> {
        Ok(serde_json::json!({
            "address": self.address.to_string(),
            "points_per_token": self.points_per_token.to_string(),
        }))
    }
}

impl Erc721Source {
    async fn query_nft_ownership(
        &self,
        ctx: &super::SourceContext,
        owner: Address,
    ) -> Result<U256> {
        let balance_call = IERC721::balanceOfCall { owner };
        let tx = alloy_rpc_types::eth::TransactionRequest {
            to: Some(TxKind::Call(self.address)),
            input: TransactionInput { input: Some(balance_call.abi_encode().into()), data: None },
            ..Default::default()
        };

        let result = ctx.provider.call(tx).await?;

        Ok(U256::from_be_slice(&result))
    }

    async fn query_holders(&self, ctx: &super::SourceContext) -> Result<Vec<String>> {
        let holders_call = IRewardSourceNft::getAllHoldersCall {};
        let tx = alloy_rpc_types::eth::TransactionRequest {
            to: Some(TxKind::Call(self.address)),
            input: TransactionInput { input: Some(holders_call.abi_encode().into()), data: None },
            ..Default::default()
        };

        let result = ctx.provider.call(tx).await?.to_vec();

        let holders: Vec<Address> = <sol! { address[] }>::abi_decode(&result)?;
        Ok(holders.into_iter().map(|h| h.to_string()).collect())
    }
}

sol! {
    interface IERC721 {
        function balanceOf(address owner) external view returns (uint256);
    }
    interface IRewardSourceNft {
        function getAllHolders() external view returns (address[] memory);
    }
}
