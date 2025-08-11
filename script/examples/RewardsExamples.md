# Rewards Script Examples

This document provides usage examples for the `Rewards.s.sol` script, which combines reward updating and claiming functionality.

## Overview

The `Rewards.s.sol` script provides three main functions:

- `updateRewards`: Adds a trigger to update the reward distribution
- `claimRewards`: Claims available rewards using a merkle proof
- `updateAndClaimRewards`: Combines both operations in a single transaction

## Prerequisites

Before running any rewards scripts, ensure you have:

1. Set the `IPFS_GATEWAY_URL` environment variable
2. Set the `FUNDED_KEY` environment variable (or use default)
3. Access to `curl` and `jq` commands for IPFS data retrieval
4. Deployed RewardDistributor and ENOVA token contracts

## Environment Variables

```bash
export IPFS_GATEWAY_URL="https://gateway.pinata.cloud/ipfs/"
export FUNDED_KEY="your_private_key_here"
```

## Function Examples

### 1. Update Rewards Only

Updates the reward distribution by adding a trigger:

```bash
forge script script/Rewards.s.sol:Rewards \
    --sig "updateRewards(string)" \
    "0x1234567890123456789012345678901234567890" \
    --rpc-url $RPC_URL \
    --broadcast
```

**Parameters:**
- `rewardDistributorAddr`: Address of the deployed RewardDistributor contract

**Output:**
- Logs the new TriggerId that was created

### 2. Claim Rewards Only

Claims available rewards for the caller using merkle proof:

```bash
forge script script/Rewards.s.sol:Rewards \
    --sig "claimRewards(string,string)" \
    "0x1234567890123456789012345678901234567890" \
    "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" \
    --rpc-url $RPC_URL \
    --broadcast
```

**Parameters:**
- `rewardDistributorAddr`: Address of the deployed RewardDistributor contract
- `rewardTokenAddr`: Address of the ENOVA token contract

**Output:**
- Verification of merkle root and IPFS hash
- Merkle data URL
- Claimable amount
- Balance before and after claiming
- Amount successfully claimed

### 3. Update and Claim Rewards (Combined)

Performs both operations in sequence:

```bash
forge script script/Rewards.s.sol:Rewards \
    --sig "updateAndClaimRewards(string,string)" \
    "0x1234567890123456789012345678901234567890" \
    "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" \
    --rpc-url $RPC_URL \
    --broadcast
```

**Parameters:**
- `rewardDistributorAddr`: Address of the deployed RewardDistributor contract
- `rewardTokenAddr`: Address of the ENOVA token contract

**Output:**
- Combined output from both update and claim operations

## Example Output

### Successful Trigger Match
```
Fetching data for TriggerId 1
Trigger executed successfully, root and ipfsHash match. This means the last rewards update occurred due to a manual trigger.

--------------------------------
root:
0x1234567890123456789012345678901234567890123456789012345678901234
ipfsHash:
0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdef
ipfsHashCid:
QmXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
--------------------------------

Merkle data URL: https://gateway.pinata.cloud/ipfs/QmXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Claiming rewards...
Claimable: 1000000000000000000
Balance before: 0
Balance after: 1000000000000000000
Claimed: 1000000000000000000
```

### Trigger Mismatch (Cron vs Manual)
```
Fetching data for TriggerId 1
Trigger failed, root or ipfsHash mismatch. This will happen if the last rewards update occurred due to a cron schedule and not a manual trigger.

--------------------------------

contract root:
0x1111111111111111111111111111111111111111111111111111111111111111
contract ipfsHash:
0x2222222222222222222222222222222222222222222222222222222222222222
contract ipfsHashCid:
QmYyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy

--------------------------------

avsOutput.root:
0x3333333333333333333333333333333333333333333333333333333333333333
avsOutput.ipfsHashData:
0x4444444444444444444444444444444444444444444444444444444444444444
avsOutput.ipfsHash:
QmZzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz
```

## Common Issues and Troubleshooting

### 1. IPFS Gateway Timeout
If the IPFS gateway is slow or unavailable, try using an alternative gateway:
```bash
export IPFS_GATEWAY_URL="https://ipfs.io/ipfs/"
```

### 2. jq Command Not Found
Install jq on your system:
```bash
# Ubuntu/Debian
sudo apt-get install jq

# macOS
brew install jq
```

### 3. Insufficient Rewards to Claim
If no rewards are available, the claimable amount will be 0. Make sure:
- The reward distributor has been properly funded
- Your address is eligible for rewards in the current distribution
- The merkle proof is valid for your address

### 4. Private Key Issues
Ensure your private key has sufficient ETH for gas fees and is authorized to interact with the contracts.

## Gas Optimization

The combined `updateAndClaimRewards` function performs both operations in a single transaction, which can save on gas compared to calling them separately. However, if either operation fails, both will revert.

For maximum reliability, consider using the individual functions:
1. Call `updateRewards` first
2. Wait for confirmation
3. Call `claimRewards` to claim your rewards

## Security Considerations

- Never hardcode private keys in scripts
- Always verify contract addresses before running scripts
- Test on testnets before mainnet deployment
- Ensure IPFS data integrity by verifying merkle roots match expected values