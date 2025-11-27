# Hats Protocol WAVS Integration

This guide covers testing the Hats Protocol WAVS AVS integration locally using `cast` commands.

## Prerequisites

Ensure you have completed the setup from [README.md](./README.md):

1. Started local services: `task start-all-local`
2. Deployed contracts: `task deploy:full && task deploy:single-operator-poa-local`
3. Have your `.env` file configured with `FUNDED_KEY`

## Contract Addresses

After deployment, contract addresses are stored in `.docker/hats_deploy.json` and `.docker/deployment_summary.json`.

```bash
# Get contract addresses
export HATS_PROTOCOL=$(jq -r '.hats.hats_protocol' .docker/deployment_summary.json)
export HATS_MODULE_FACTORY=$(jq -r '.hats.module_factory' .docker/deployment_summary.json)
export HATS_ELIGIBILITY_MODULE=$(jq -r '.hats.eligibility_module' .docker/deployment_summary.json)
export HATS_TOGGLE_MODULE=$(jq -r '.hats.toggle_module' .docker/deployment_summary.json)
export HATS_HATTER=$(jq -r '.hats.hatter' .docker/deployment_summary.json)
export HATS_MINTER=$(jq -r '.hats.minter' .docker/deployment_summary.json)

# Set RPC URL
export RPC_URL=http://localhost:8545
```

## Deployed Contracts

| Contract | Description |
|----------|-------------|
| `HatsWavsEligibilityModule` | Checks if an address is eligible to wear a hat via WAVS |
| `HatsWavsToggleModule` | Checks if a hat is active/inactive via WAVS |
| `HatsWavsHatter` | Creates new hats based on WAVS-signed data |
| `HatsWavsMinter` | Mints hats to addresses based on WAVS-signed data |

---

## Eligibility Module

The Eligibility Module allows checking whether an address is eligible to wear a specific hat.

### Request Eligibility Check

Triggers a WAVS service to check eligibility for a wearer and hat ID:

```bash
# Set parameters
WEARER=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
HAT_ID=1

# Request eligibility check (emits EligibilityCheckTrigger event)
cast send $HATS_ELIGIBILITY_MODULE \
  "requestEligibilityCheck(address,uint256)" \
  $WEARER $HAT_ID \
  --private-key $FUNDED_KEY \
  --rpc-url $RPC_URL
```

### Query Eligibility Result

After the WAVS service processes the request and submits the result:

```bash
# Get the latest eligibility result (eligible, standing, timestamp)
cast call $HATS_ELIGIBILITY_MODULE \
  "getLatestEligibilityResult(address,uint256)(bool,bool,uint256)" \
  $WEARER $HAT_ID \
  --rpc-url $RPC_URL

# Get wearer status (eligible, standing) - implements IHatsEligibility
cast call $HATS_ELIGIBILITY_MODULE \
  "getWearerStatus(address,uint256)(bool,bool)" \
  $WEARER $HAT_ID \
  --rpc-url $RPC_URL
```

### Using Task Commands

```bash
# Request eligibility check
task hats:request-eligibility-check WEARER=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 HAT_ID=1

# Query result
task hats:get-eligibility-result WEARER=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 HAT_ID=1
```

---

## Toggle Module

The Toggle Module controls whether a hat is active or inactive.

### Request Status Check

Triggers a WAVS service to check the status of a hat:

```bash
HAT_ID=1

# Request status check (emits StatusCheckTrigger event)
cast send $HATS_TOGGLE_MODULE \
  "requestStatusCheck(uint256)" \
  $HAT_ID \
  --private-key $FUNDED_KEY \
  --rpc-url $RPC_URL
```

### Query Status Result

After the WAVS service processes the request:

```bash
# Get the latest status result (active, timestamp)
cast call $HATS_TOGGLE_MODULE \
  "getLatestStatusResult(uint256)(bool,uint256)" \
  $HAT_ID \
  --rpc-url $RPC_URL

# Get hat status (active) - implements IHatsToggle
cast call $HATS_TOGGLE_MODULE \
  "getHatStatus(uint256)(bool)" \
  $HAT_ID \
  --rpc-url $RPC_URL
```

### Using Task Commands

```bash
# Request status check
task hats:request-status-check HAT_ID=1

# Query result
task hats:get-status-result HAT_ID=1
task hats:get-hat-status HAT_ID=1
```

---

## Hatter (Hat Creation)

The Hatter module creates new hats based on WAVS-signed approval.

### Request Hat Creation

Triggers a WAVS service to approve and create a new hat:

```bash
ADMIN_HAT_ID=1
DETAILS="My New Hat"
MAX_SUPPLY=100
ELIGIBILITY=0x0000000000000000000000000000000000000000
TOGGLE=0x0000000000000000000000000000000000000000
MUTABLE=true
IMAGE_URI=""

# Request hat creation (emits HatCreationTrigger event)
cast send $HATS_HATTER \
  "requestHatCreation(uint256,string,uint32,address,address,bool,string)" \
  $ADMIN_HAT_ID "$DETAILS" $MAX_SUPPLY $ELIGIBILITY $TOGGLE $MUTABLE "$IMAGE_URI" \
  --private-key $FUNDED_KEY \
  --rpc-url $RPC_URL
```

### Using Task Commands

```bash
# Request hat creation with defaults
task hats:request-hat-creation ADMIN_HAT_ID=1 DETAILS="My New Hat"

# Request hat creation with all parameters
task hats:request-hat-creation \
  ADMIN_HAT_ID=1 \
  DETAILS="My New Hat" \
  MAX_SUPPLY=50 \
  ELIGIBILITY=$HATS_ELIGIBILITY_MODULE \
  TOGGLE=$HATS_TOGGLE_MODULE \
  MUTABLE=true \
  IMAGE_URI="ipfs://..."
```

---

## Minter (Hat Minting)

The Minter module mints existing hats to addresses based on WAVS-signed approval.

### Request Hat Minting

Triggers a WAVS service to approve and mint a hat to an address:

```bash
HAT_ID=1
WEARER=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

# Request hat minting (emits MintingTrigger event)
cast send $HATS_MINTER \
  "requestHatMinting(uint256,address)" \
  $HAT_ID $WEARER \
  --private-key $FUNDED_KEY \
  --rpc-url $RPC_URL
```

### Using Task Commands

```bash
# Request hat minting
task hats:request-hat-minting HAT_ID=1 WEARER=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

---

## Utility Commands

### Get Next Trigger ID

Each contract tracks trigger IDs for correlating requests with responses:

```bash
# Check next trigger ID for any Hats WAVS contract
cast call $HATS_ELIGIBILITY_MODULE "nextTriggerId()(uint64)" --rpc-url $RPC_URL
cast call $HATS_TOGGLE_MODULE "nextTriggerId()(uint64)" --rpc-url $RPC_URL
cast call $HATS_HATTER "nextTriggerId()(uint64)" --rpc-url $RPC_URL
cast call $HATS_MINTER "nextTriggerId()(uint64)" --rpc-url $RPC_URL
```

### Get Service Manager

Verify the WAVS Service Manager address:

```bash
cast call $HATS_ELIGIBILITY_MODULE "getServiceManager()(address)" --rpc-url $RPC_URL
```

### Using Task Commands

```bash
task hats:get-next-trigger-id CONTRACT=$HATS_ELIGIBILITY_MODULE
task hats:get-service-manager CONTRACT=$HATS_ELIGIBILITY_MODULE
```

---

## Events

### Trigger Events (emitted on request)

| Contract | Event |
|----------|-------|
| Eligibility | `EligibilityCheckTrigger(uint64 triggerId, address creator, address wearer, uint256 hatId)` |
| Toggle | `StatusCheckTrigger(uint64 triggerId, address creator, uint256 hatId)` |
| Hatter | `HatCreationTrigger(uint64 triggerId, address creator, uint256 admin, string details, uint32 maxSupply, address eligibility, address toggle, bool mutable_, string imageURI)` |
| Minter | `MintingTrigger(uint64 triggerId, address creator, uint256 hatId, address wearer)` |

### Result Events (emitted when WAVS responds)

| Contract | Event |
|----------|-------|
| Eligibility | `EligibilityResultReceived(uint64 triggerId, bool eligible, bool standing)` |
| Toggle | `StatusResultReceived(uint64 triggerId, bool active)` |
| Hatter | `HatCreationResultReceived(uint64 triggerId, uint256 hatId, bool success)` |
| Minter | `HatMintingResultReceived(uint64 triggerId, uint256 hatId, address wearer, bool success)` |

### Watch Events

```bash
# Watch for eligibility check triggers
cast logs --address $HATS_ELIGIBILITY_MODULE \
  "EligibilityCheckTrigger(uint64,address,address,uint256)" \
  --rpc-url $RPC_URL

# Watch for eligibility results
cast logs --address $HATS_ELIGIBILITY_MODULE \
  "EligibilityResultReceived(uint64,bool,bool)" \
  --rpc-url $RPC_URL
```

---

## Full Example Workflow

```bash
# 1. Set up environment
source .env
export RPC_URL=http://localhost:8545
export HATS_ELIGIBILITY_MODULE=$(jq -r '.hats.eligibility_module' .docker/deployment_summary.json)
export WEARER=$(cast wallet address $FUNDED_KEY)
export HAT_ID=1

# 2. Check initial state
echo "Next trigger ID:"
cast call $HATS_ELIGIBILITY_MODULE "nextTriggerId()(uint64)" --rpc-url $RPC_URL

# 3. Request eligibility check
echo "Requesting eligibility check..."
cast send $HATS_ELIGIBILITY_MODULE \
  "requestEligibilityCheck(address,uint256)" \
  $WEARER $HAT_ID \
  --private-key $FUNDED_KEY \
  --rpc-url $RPC_URL

# 4. Wait for WAVS to process (check logs or wait a few seconds)
sleep 5

# 5. Query the result
echo "Eligibility result:"
cast call $HATS_ELIGIBILITY_MODULE \
  "getLatestEligibilityResult(address,uint256)(bool,bool,uint256)" \
  $WEARER $HAT_ID \
  --rpc-url $RPC_URL
```
