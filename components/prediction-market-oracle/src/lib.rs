#[allow(warnings)]
#[rustfmt::skip]
mod bindings;
use std::{collections::HashMap, str::FromStr};
mod resolvers;

use bindings::{export, host::config_var, Guest, TriggerAction, WasmResponse};
mod trigger;
use trigger::encode_trigger_output;
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

        let resolver_type =
            config_var("resolver_type").ok_or_else(|| "Failed to get resolver type")?;

        // UTC timestamp in seconds since UNIX epoch
        // Cannot resolve the market before this
        let resolve_after: u64 = config_var("resolve_after")
            .ok_or_else(|| "Failed to get resolve_after time")?
            .parse()
            .map_err(|e| format!("Could not parse resolve_after: {e}"))?;

        // Map key1:value1;key2:value2;... to JSON object {key1: value1, key2: value2, ...}
        let resolver_config = serde_json::to_value(
            &config_var("resolver_config")
                .ok_or_else(|| "Failed to get resolver config")?
                .split(';')
                .map(|s| {
                    let parts = s.split(':').collect::<Vec<&str>>();
                    let value = serde_json::from_str(parts[1]).map_err(|e| {
                        format!("Failed to parse resolver config value {}: {e}", parts[1])
                    })?;
                    Ok((parts[0], value))
                })
                .collect::<Result<HashMap<&str, serde_json::Value>, String>>()?,
        )
        .map_err(|e| format!("Failed to parse resolver config: {}", e))?;

        block_on(async move {
            let execution_time_seconds = action.execution_timestamp_seconds().await?;

            if execution_time_seconds < resolve_after {
                return Err(format!(
                    "Market resolution is allowed after {resolve_after}. (current time is {})",
                    execution_time_seconds
                ));
            }

            let resolver =
                ResolverRegistry::all().create_resolver(&resolver_type, resolver_config)?;

            let result = resolver.resolve().await?;

            Ok(Some(WasmResponse {
                payload: encode_trigger_output(
                    Address::from_str(&market_maker_address).unwrap(),
                    Address::from_str(&conditional_tokens_address).unwrap(),
                    result,
                ),
                ordering: None,
            }))
        })
    }
}
