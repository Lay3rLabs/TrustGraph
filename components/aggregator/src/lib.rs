#[allow(warnings)]
#[rustfmt::skip]
mod bindings;

use crate::bindings::{
    export, host,
    wavs::{
        aggregator::aggregator::{EvmAddress, SubmitAction},
        types::service::Submit,
    },
    AggregatorAction, AnyTxHash, Guest, Packet,
};

struct Component;

impl Guest for Component {
    fn process_packet(_pkt: Packet) -> Result<Vec<AggregatorAction>, String> {
        let workflow = host::get_workflow().workflow;

        let submit_config = match workflow.submit {
            Submit::None => unreachable!(),
            Submit::Aggregator(aggregator_submit) => aggregator_submit.component.config,
        };

        if submit_config.is_empty() {
            return Err("Workflow submit component config is empty".to_string());
        }

        let mut actions = Vec::new();

        for (chain_key, service_handler_address) in submit_config {
            if host::get_evm_chain_config(&chain_key).is_some() {
                let address: alloy_primitives::Address = service_handler_address
                    .parse()
                    .map_err(|e| format!("Failed to parse address for '{chain_key}': {e}"))?;

                let submit_action = SubmitAction {
                    chain: chain_key.to_string(),
                    contract_address: EvmAddress {
                        raw_bytes: address.to_vec(),
                    },
                    gas_price: None
                };

                actions.push(AggregatorAction::Submit(submit_action));
            } else if host::get_cosmos_chain_config(&chain_key).is_some() {
                todo!("Cosmos support coming soon...")
            } else {
                return Err(format!("Could not get chain config for chain {chain_key}"));
            }
        }

        Ok(actions)
    }

    fn handle_timer_callback(_packet: Packet) -> Result<Vec<AggregatorAction>, String> {
        Err("No timers used".to_string())
    }

    fn handle_submit_callback(
        _packet: Packet,
        tx_result: Result<AnyTxHash, String>,
    ) -> Result<(), String> {
        match tx_result {
            Ok(_) => Ok(()),
            Err(_) => Ok(()),
        }
    }
}

export!(Component with_types_in bindings);
