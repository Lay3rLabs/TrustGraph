## Testnet

```bash
echo "COMPLETED" > .docker/component-upload-status

# TODO: in v1.0.0 I had to replace time_limit_seconds: null, -> time_limit_seconds: 60, in the service.json. Fixed in latest v1.X patch

# TESTNET
export WAVS_SERVICE_MANAGER_ADDRESS=`task config:service-manager-address`
export RPC_URL=`task get-rpc`

# Update IPFS service
export PINATA_API_KEY=$(grep ^WAVS_ENV_PINATA_API_KEY= .env | cut -d '=' -f2-)
export ipfs_cid=`SERVICE_FILE=.docker/service.json PINATA_API_KEY=${PINATA_API_KEY} make upload-to-ipfs`
cast send `task config:service-manager-address` 'setServiceURI(string)' "ipfs://${ipfs_cid}" -r `task get-rpc` --private-key `task config:funded-key`
cast call ${WAVS_SERVICE_MANAGER_ADDRESS} "getServiceURI()(string)" --rpc-url ${RPC_URL}

# ----
cd infra/wavs-1
sh start.sh
# WAVS_ENDPOINT=http://127.0.0.1:8000 SERVICE_URL=${IPFS_URI} IPFS_GATEWAY=${IPFS_GATEWAY} make deploy-service

export op_priv_key=$(grep ^WAVS_CLI_EVM_CREDENTIAL= infra/wavs-1/.env | cut -d '=' -f2- | tr -d '"')
export op_mnemonic=$(grep ^WAVS_SUBMISSION_MNEMONIC= infra/wavs-1/.env | cut -d '=' -f2- | tr -d '"')
export op_addr=$(cast wallet address --private-key $op_priv_key) && echo $op_addr
export op_signing_key_1=$(cast wallet address --mnemonic "$op_mnemonic" --mnemonic-index 1) && echo $op_signing_key_1
cast send --rpc-url `task get-rpc` $WAVS_SERVICE_MANAGER_ADDRESS "registerOperator(address,uint256)" "${op_addr}" 1000 --private-key `task config:funded-key`
# cast send ${op_addr} --value 0.001ether -r `task get-rpc` --private-key `task config:funded-key` # if you forgot to fund

# the operator must sign they own their signing key to prove they own it
encoded_operator_address=$(cast abi-encode "f(address)" "$op_addr")
signing_message=$(cast keccak "$encoded_operator_address")
signing_signature=$(cast wallet sign --no-hash --mnemonic "$op_mnemonic" --mnemonic-index 1 "$signing_message")
echo "Signing signature: $signing_signature"

# NOTE: if `Out of gas: gas required exceeds allowance: 0`, give funds to op_addr
cast send $WAVS_SERVICE_MANAGER_ADDRESS "updateOperatorSigningKey(address,bytes)" "${op_signing_key_1}" "${signing_signature}" --rpc-url `task get-rpc` --private-key $op_priv_key

# cast call $WAVS_SERVICE_MANAGER_ADDRESS "getOperatorWeight(address)(uint256)" ${op_addr} --rpc-url `task get-rpc`

# ----

WAVS_SERVICE_MANAGER_ADDRESS=`task config:service-manager-address`
AGGREGATOR_URL=http://127.0.0.1:8001
CHAIN_NAME="evm:17000"
curl -s -X POST -H "Content-Type: application/json" -d "{
  \"service_manager\": {
    \"evm\": {
      \"chain\": \"${CHAIN_NAME}\",
      \"address\": \"${WAVS_SERVICE_MANAGER_ADDRESS}\"
    }
  }
}" ${AGGREGATOR_URL}/services
```
