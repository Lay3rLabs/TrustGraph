## Trigger the Service

Setup environment variables:
```bash
export PREDICTION_MARKET_FACTORY_ADDRESS=$(jq -r '.prediction_market_contracts.factory' .docker/deployment_summary.json)
export MARKET_MAKER_ADDRESS=$(jq -r '.prediction_market_contracts.market_maker' .docker/deployment_summary.json)
export CONDITIONAL_TOKENS_ADDRESS=$(jq -r '.prediction_market_contracts.conditional_tokens' .docker/deployment_summary.json)
export COLLATERAL_TOKEN_ADDRESS=$(jq -r '.prediction_market_contracts.collateral_token' .docker/deployment_summary.json)
export PREDICTION_MARKET_ORACLE_CONTROLLER_ADDRESS=$(jq -r '.prediction_market_contracts.oracle_controller' .docker/deployment_summary.json)
```

### Buy YES outcome tokens

Buy YES outcome tokens in the prediction market governed by the oracle AVS,
which is going to resolve whether or not the price of Bitcoin is over $1.

```bash
forge script ./script/PredictionMarket.s.sol $PREDICTION_MARKET_FACTORY_ADDRESS $MARKET_MAKER_ADDRESS $CONDITIONAL_TOKENS_ADDRESS $COLLATERAL_TOKEN_ADDRESS --sig "buyYes(string,string,string,string)" --rpc-url $RPC_URL --broadcast -v 4
```

> Notice in the logs that you start with 1e18 collateral tokens, and then purchase 1e18 YES shares for 525090975565627651 (~5.25e17) collateral tokens, leaving 474909024434372349 (~4.75e17) collateral tokens remaining.

### Trigger the oracle AVS

Run the AVS service to resolve the market.

```bash
forge script ./script/PredictionMarket.s.sol $PREDICTION_MARKET_ORACLE_CONTROLLER_ADDRESS --sig "trigger(string)" --rpc-url $RPC_URL --broadcast -vvv

# Wait for the component to execute
echo "waiting 3 seconds for the component to execute..."
sleep 3
```

### Redeem the outcome tokens

Redeem the YES outcome tokens for collateral tokens.

```bash
forge script ./script/PredictionMarket.s.sol $PREDICTION_MARKET_FACTORY_ADDRESS $COLLATERAL_TOKEN_ADDRESS $CONDITIONAL_TOKENS_ADDRESS --sig "redeem(string,string,string)" --rpc-url $RPC_URL --broadcast
```
