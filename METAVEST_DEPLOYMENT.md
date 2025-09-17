# MetaVest Deployment Guide

This guide walks through deploying the MetaVest vesting framework locally using Anvil for testing.

## Prerequisites

- Foundry installed (`curl -L https://foundry.paradigm.xyz | bash`)
- Node.js installed
- Project dependencies installed (`npm install && forge install`)

## Step 1: Start Anvil

Start a local Ethereum node with a known test account:

```bash
# Start anvil with a deterministic account
anvil --accounts 10 --balance 10000 --mnemonic "test test test test test test test test test test test junk"
```

Keep this terminal open. Anvil will display test accounts and private keys.

## Step 3: Deploy Test Token

First, deploy a test ERC20 token that will be used for vesting:

```bash
# funded from the anvil instance, else use the .env for production
export FUNDED_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Deploy the test token
# forge build
forge script script/DeployTestToken.s.sol:DeployTestToken --rpc-url http://localhost:8545 --broadcast

# Extract deployed token address from broadcast logs
export TOKEN_ADDRESS=$(jq -r '.transactions[] | select(.contractName == "TestToken") | .contractAddress' broadcast/DeployTestToken.s.sol/31337/run-latest.json)
echo "Deployed Test Token at: $TOKEN_ADDRESS"
```

## Step 4: Ensure Token Balance

Before deploying MetaVest, transfer tokens to the deployer account:

```bash
# Check deployer balance
DEPLOYER_ADDRESS=$(cast wallet address --private-key $FUNDED_KEY)
DEPLOYER_BALANCE=$(cast call $TOKEN_ADDRESS "balanceOf(address)" $DEPLOYER_ADDRESS --rpc-url http://localhost:8545)
echo "Deployer balance: $DEPLOYER_BALANCE"

# Transfer tokens from original deployer (anvil account 0) if needed
if [ "$DEPLOYER_BALANCE" = "0x0000000000000000000000000000000000000000000000000000000000000000" ]; then
    cast send $TOKEN_ADDRESS "transfer(address,uint256)" \
      $DEPLOYER_ADDRESS 5000000000000000000000000 \
      --private-key $FUNDED_KEY --rpc-url http://localhost:8545
fi
```

## Step 5: Deploy MetaVest Framework

Deploy the complete MetaVest framework with controller:

```bash
# Deploy MetaVest contracts - this will create ALL 8 vesting allocations from JSON file
FOUNDRY_PROFILE=metavest forge script script-metavest/MetaVestDeployment.s.sol:MetaVestDeployment --rpc-url http://localhost:8545 --broadcast --json -vvv
```

## Step 6: Verify Deployment

Verify that all contracts were deployed successfully:

```bash
# Extract contract addresses dynamically from broadcast logs
export CONTROLLER=$(jq -r '.transactions[] | select(.function and (.function | contains("deployMetavestAndController"))) | .additionalContracts[0].address' broadcast/MetaVestDeployment.s.sol/31337/run-latest.json)
# vesting contract 0 (8 auto created on deploy)
export VESTING_CONTRACT=$(jq -r '[.transactions[] | select(.function and (.function | contains("createMetavest"))) | .additionalContracts[0].address][0]' broadcast/MetaVestDeployment.s.sol/31337/run-latest.json)

echo "=== Deployment Verification ==="
echo "Token Address: $TOKEN_ADDRESS"
echo "MetaVest Controller: $CONTROLLER"
echo "Vesting Contract: $VESTING_CONTRACT"
echo ""

# Verify vesting contract has tokens
echo "1. Vesting Contract Token Balance:"
cast call $TOKEN_ADDRESS "balanceOf(address)" $VESTING_CONTRACT --rpc-url http://localhost:8545 | cast --to-dec | cast --from-wei
echo " tokens"
echo ""

# Verify grantee
echo "2. Grantee:"
cast call $VESTING_CONTRACT "grantee()" --rpc-url http://localhost:8545
echo ""

# Verify controller
echo "3. Controller (should match deployed controller):"
cast call $VESTING_CONTRACT "controller()" --rpc-url http://localhost:8545
echo ""

echo "✅ Deployment successful! Created vesting allocations"
```

### Creating Additional Vesting Allocations

To create additional vesting allocations beyond the test allocation:

```bash
# IMPORTANT: Use a DIFFERENT grantee address than the test allocation
# The test allocation already uses the deployer address (0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266)
export NEW_GRANTEE=0x70997970C51812dc3A010C7d01b50e0d17dc79C8  # Different address from Anvil

# Approve tokens for the controller (500K tokens for this allocation)
cast send $TOKEN_ADDRESS "approve(address,uint256)" $CONTROLLER 500000000000000000000000 --rpc-url http://localhost:8545 --private-key $FUNDED_KEY

# Get current timestamp (use date command, not block number)
CURRENT_TIME=$(date +%s) && echo "Using timestamp: $CURRENT_TIME"

# Calculate rates for 500K tokens with 100K cliff over 1 year:
# Rate: (500K - 100K) / 31536000 = 12676059318551 tokens/second

# Create new vesting allocation with correct struct order and rates
# Note: Increased gas limit to 3000000 for contract deployment
TX_OUTPUT=$(cast send $CONTROLLER \
  "createMetavest(uint8,address,(uint256,uint128,uint128,uint160,uint48,uint160,uint48,address),(uint256,bool,bool,address[])[],uint256,address,uint256,uint256)" 0 $NEW_GRANTEE \
  "(500000000000000000000000,100000000000000000000000,100000000000000000000000,12676059318551,$CURRENT_TIME,12676059318551,$CURRENT_TIME,$TOKEN_ADDRESS)" \
  "[]" 0 "0x0000000000000000000000000000000000000000" 0 0 \
  --rpc-url http://localhost:8545 --json --private-key $FUNDED_KEY --gas-limit 3000000) && echo "${TX_OUTPUT}"

# if status is 0x0, the above tx failed. make sure either 1) it's not a vesting account already or 2) you are approved to spend the erc20
NEW_VESTING_CONTRACT=$(echo "$TX_OUTPUT" | jq -r '.logs[0].topics[2]' | cast parse-bytes32-address)

# query the allocation form the vesting contract (src/BaseAllocation.sol `struct Allocation`)
cast abi-decode "allocation()(uint256,uint128,uint128,uint160,uint48,uint160,uint48,address)" "$(cast call ${NEW_VESTING_CONTRACT} 'allocation()')"

echo "✅ Created vesting allocation:"
echo "  Grantee: $NEW_GRANTEE"
echo "  Total: 500K tokens"
echo "  Cliff: 100K tokens (immediate)"
echo "  Vesting: 400K tokens over 1 year"
```

**⚠️ Important Notes:**
- Each grantee address can only have ONE vesting allocation
- If you try to create multiple allocations for the same address, the transaction will revert
- Use different addresses (like other Anvil accounts) for additional allocations
- Always approve tokens before creating allocations

### Next Steps

1. **Monitor Vesting**: Check vesting progress using the vesting contract
2. **Create More Allocations**: Use different grantee addresses for additional vesting schedules
3. **Integration**: Integrate with your frontend or other systems using these addresses


## Configuration Reference

### Extract Addresses Dynamically

Instead of hardcoding addresses, extract them from deployment logs:

```bash
# Extract all contract addresses from latest deployment
export TOKEN_ADDRESS=$(jq -r '.transactions[] | select(.contractName == "TestToken") | .contractAddress' broadcast/DeployTestToken.s.sol/31337/run-latest.json)
export CONTROLLER=$(jq -r '.transactions[] | select(.function and (.function | contains("deployMetavestAndController"))) | .additionalContracts[0].address' broadcast/MetaVestDeployment.s.sol/31337/run-latest.json)
export VESTING_CONTRACT=$(jq -r '.transactions[] | select(.function and (.function | contains("createMetavest"))) | .additionalContracts[0].address' broadcast/MetaVestDeployment.s.sol/31337/run-latest.json)

# Extract factory addresses
export VESTING_FACTORY=$(jq -r '.transactions[] | select(.contractName == "VestingAllocationFactory") | .contractAddress' broadcast/MetaVestDeployment.s.sol/31337/run-latest.json)
export TOKEN_OPTION_FACTORY=$(jq -r '.transactions[] | select(.contractName == "TokenOptionFactory") | .contractAddress' broadcast/MetaVestDeployment.s.sol/31337/run-latest.json)
export RESTRICTED_TOKEN_FACTORY=$(jq -r '.transactions[] | select(.contractName == "RestrictedTokenFactory") | .contractAddress' broadcast/MetaVestDeployment.s.sol/31337/run-latest.json)
export METAVEST_FACTORY=$(jq -r '.transactions[] | select(.contractName == "MetaVesTFactory") | .contractAddress' broadcast/MetaVestDeployment.s.sol/31337/run-latest.json)

# Display all extracted addresses
echo "📋 Extracted Contract Addresses:"
echo "  Token: $TOKEN_ADDRESS"
echo "  Controller: $CONTROLLER"
echo "  Vesting Contract: $VESTING_CONTRACT"
echo "  Vesting Factory: $VESTING_FACTORY"
echo "  Token Option Factory: $TOKEN_OPTION_FACTORY"
echo "  Restricted Token Factory: $RESTRICTED_TOKEN_FACTORY"
echo "  MetaVest Factory: $METAVEST_FACTORY"
```

### Allocation Parameters Reference

When creating custom allocations via `script/data/vesting_allocations.json`:

- `grantee`: Ethereum address receiving tokens
- `totalAmount`: Total tokens to vest (in wei, 18 decimals)
- `vestingCliff`: Tokens available immediately after cliff
- `unlockCliff`: Tokens unlocked immediately
- `vestingDuration`: Vesting period in seconds (31536000 = 1 year)
- `unlockDuration`: Unlock period in seconds
- `startTime`: Unix timestamp for vesting start (0 = current time)
- `category`: Classification (team/investor/advisor)

### Deployment Details

The deployment creates 8 vesting allocations from `script-metavest/data/vesting_allocations.json`:

**Team Allocations:**
- **0x1111...**: 1,000,000 tokens (250K cliff, 1 year)
- **0x2222...**: 750,000 tokens (187.5K cliff, 1 year)

**Investor Allocations:**
- **0x3333...**: 500,000 tokens (50K cliff, 6 months)
- **0x4444...**: 500,000 tokens (50K cliff, 6 months)
- **0x5555...**: 300,000 tokens (0 cliff, 9 months)

**Advisor Allocations:**
- **0x6666...**: 200,000 tokens (50K cliff, 1 year)
- **0x7777...**: 150,000 tokens (37.5K cliff, 1 year)
- **0x8888...**: 100,000 tokens (25K cliff, 1 year)

**Total**: 3.5M tokens allocated across all categories

### Key Changes Made

1. **Fixed TOKEN_ADDRESS requirement**: Deployment now requires TOKEN_ADDRESS in .env
2. **Automated token balance**: Script checks and ensures sufficient tokens
3. **All allocations created**: Processes all 8 allocations from JSON file
4. **Improved error handling**: Better validation and error messages
5. **Correct function signatures**: Fixed struct order for manual calls
