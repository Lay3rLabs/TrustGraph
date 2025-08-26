#[allow(warnings)]
mod bindings;
use std::str::FromStr;
mod resolvers;

use bindings::{export, host::config_var, Guest, TriggerAction, WasmResponse};
mod trigger;
use trigger::{decode_trigger_event, encode_trigger_output};
use wavs_wasi_utils::evm::alloy_primitives::Address;
use wstd::runtime::block_on;

use crate::resolvers::ResolverRegistry;

struct Component;
export!(Component with_types_in bindings);

impl Guest for Component {
    fn run(action: TriggerAction) -> std::result::Result<Option<WasmResponse>, String> {
        let market_maker_address =
            config_var("market_maker").ok_or_else(|| "Failed to get market maker address")?;
        let conditional_tokens_address = config_var("conditional_tokens")
            .ok_or_else(|| "Failed to get conditional tokens address")?;

        let trigger_info = decode_trigger_event(action.data)?;

        let resolver = ResolverRegistry::all().create_resolver(
            "price",
            serde_json::json!({
                "coin_market_cap_id": 1,
                "threshold": 1.0,
            }),
        )?;

        let result = block_on(resolver.resolve())?;

        Ok(Some(WasmResponse {
            payload: encode_trigger_output(
                trigger_info.triggerId,
                Address::from_str(&market_maker_address).unwrap(),
                Address::from_str(&conditional_tokens_address).unwrap(),
                result,
            ),
            ordering: None,
        }))
    }
}
