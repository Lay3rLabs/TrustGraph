#[allow(warnings)]
#[rustfmt::skip]
mod bindings;
use std::{collections::HashMap, str::FromStr};
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

        let resolver_type =
            config_var("resolver_type").ok_or_else(|| "Failed to get resolver type")?;

        // UTC timestamp in nanoseconds since UNIX epoch
        // Cannot execute the service handler before this
        let execute_after: u64 = config_var("execute_after")
            .ok_or_else(|| "Failed to get execute_after time")?
            .parse()
            .map_err(|e| format!("Could not parse execute_after: {e}"))?;

        // Map key1:value1;key2:value2;... to JSON object {key1: value1, key2: value2, ...}
        let resolver_config = serde_json::to_value(
            &config_var("resolver_config")
                .ok_or_else(|| "Failed to get resolver config")?
                .split(';')
                .map(|s| {
                    let parts = s.split(':').collect::<Vec<&str>>();
                    (parts[0], serde_json::from_str(parts[1]).unwrap())
                })
                .collect::<HashMap<&str, serde_json::Value>>(),
        )
        .map_err(|e| format!("Failed to parse resolver config: {}", e))?;

        let trigger_info = decode_trigger_event(action.data)?;

        if trigger_info.execution_time < execute_after {
            return Err(format!(
                "Execution is allowed after {execute_after}. (current execution time is {0})",
                trigger_info.execution_time
            ));
        }

        let resolver = ResolverRegistry::all().create_resolver(&resolver_type, resolver_config)?;

        let result = block_on(resolver.resolve())?;

        Ok(Some(WasmResponse {
            payload: encode_trigger_output(
                Address::from_str(&market_maker_address).unwrap(),
                Address::from_str(&conditional_tokens_address).unwrap(),
                result,
            ),
            ordering: None,
        }))
    }
}
