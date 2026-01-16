## Production

### Deploy new network

Add a new network to `config/networks.production.json` with all the correct metadata set, but leave the contracts and schemas blank as they will be filled in by the deployment script.

Then deploy the contracts which will deploy and fill in the missing values:

```bash
pnpm deploy:contracts
```

### Build service.json

```bash
pnpm deploy:build-service
```

### Update service.json

```bash
pnpm deploy:upload-service
```

### Run WAVS

```bash
# ----
cd infra/wavs-1
sh start.sh
```

⚠️ If you get `0x3dda1739` in the aggregator, make sure to run this because there is no operator:

```bash
export op_num=2
export op_priv_key=$(grep ^WAVS_CLI_EVM_CREDENTIAL= infra/wavs-$op_num/.env | cut -d '=' -f2- | tr -d '"')
export op_mnemonic=$(grep ^WAVS_SUBMISSION_MNEMONIC= infra/wavs-$op_num/.env | cut -d '=' -f2- | tr -d '"')
export op_addr=$(cast wallet address --private-key $op_priv_key) && echo $op_addr
export op_signing_key=$(cast wallet address --mnemonic "$op_mnemonic" --mnemonic-index 1) && echo $op_signing_key
cast send --rpc-url `task get-rpc` $WAVS_SERVICE_MANAGER_ADDRESS "registerOperator(address,uint256)" "${op_addr}" 1000 --private-key `task config:funded-key`
# cast send ${op_addr} --value 0.001ether -r `task get-rpc` --private-key `task config:funded-key` # if you forgot to fund

# the operator must sign they own their signing key to prove they own it
encoded_operator_address=$(cast abi-encode "f(address)" "$op_addr")
signing_message=$(cast keccak "$encoded_operator_address")
signing_signature=$(cast wallet sign --no-hash --mnemonic "$op_mnemonic" --mnemonic-index 1 "$signing_message")
echo "Signing signature: $signing_signature"

# NOTE: if `Out of gas: gas required exceeds allowance: 0`, give funds to op_addr
cast send $WAVS_SERVICE_MANAGER_ADDRESS "updateOperatorSigningKey(address,bytes)" "${op_signing_key}" "${signing_signature}" --rpc-url `task get-rpc` --private-key $op_priv_key

# cast call $WAVS_SERVICE_MANAGER_ADDRESS "getOperatorWeight(address)(uint256)" ${op_addr} --rpc-url `task get-rpc`

# ----

WAVS_SERVICE_MANAGER_ADDRESS=`task config:service-manager-address`
AGGREGATOR_URL=http://127.0.0.1:8040
CHAIN_NAME="evm:`task get-chain-id`"
curl -s -X POST -H "Content-Type: application/json" -d "{
  \"service_manager\": {
    \"evm\": {
      \"chain\": \"${CHAIN_NAME}\",
      \"address\": \"${WAVS_SERVICE_MANAGER_ADDRESS}\"
    }
  }
}" ${AGGREGATOR_URL}/services
```
