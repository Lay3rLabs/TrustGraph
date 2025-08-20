# Merkle Governance Examples

This document provides examples for interacting with the Merkle-based governance system using the `MerkleGov.s.sol` script.

## Overview

The Merkle governance system consists of two main contracts:
- **MerkleVote**: Manages voting power verification using Merkle proofs
- **MerkleGov**: Handles proposal creation, voting, and execution

Voting power is derived from the rewards Merkle tree, where the `claimable` amount represents voting power.

## Prerequisites

Before using these commands, ensure you have:
1. Deployed the MerkleGov and MerkleVote contracts
2. Set up the rewards system (which provides the Merkle root)
3. Access to contract addresses from `.docker/deployment_summary.json`

## Setting Up Environment Variables

```bash
# Load contract addresses from deployment
export MERKLE_GOV_ADDR=$(jq -r '.merkle_governance_contracts.merkle_gov' .docker/deployment_summary.json)
export MERKLE_VOTE_ADDR=$(jq -r '.merkle_governance_contracts.merkle_vote' .docker/deployment_summary.json)
export REWARD_DISTRIBUTOR_ADDR=$(jq -r '.reward_contracts.reward_distributor' .docker/deployment_summary.json)
export REWARD_TOKEN_ADDR=$(jq -r '.reward_contracts.reward_token' .docker/deployment_summary.json)

# Set RPC URL
export RPC_URL=$(bash ./script/get-rpc-url.sh)

# Set IPFS Gateway URL for merkle data access
export IPFS_GATEWAY_URL="http://127.0.0.1:5001/api/v0/"
```

## Query Functions

### 1. Query Complete Governance State

Get a comprehensive overview of both contracts:

```bash
forge script script/MerkleGov.s.sol:MerkleGovScript \
  --sig "queryAll(string,string)" \
  "$MERKLE_GOV_ADDR" "$MERKLE_VOTE_ADDR" \
  --rpc-url $RPC_URL
```

### 2. Query MerkleVote State

Check the current Merkle root and voting configuration:

```bash
forge script script/MerkleGov.s.sol:MerkleGovScript \
  --sig "queryMerkleVoteState(string)" \
  "$MERKLE_VOTE_ADDR" \
  --rpc-url $RPC_URL
```

### 3. Query MerkleGov Parameters

View governance parameters like voting periods and quorum:

```bash
forge script script/MerkleGov.s.sol:MerkleGovScript \
  --sig "queryMerkleGovState(string)" \
  "$MERKLE_GOV_ADDR" \
  --rpc-url $RPC_URL
```

### 4. Query Active Proposals

List all currently active proposals:

```bash
forge script script/MerkleGov.s.sol:MerkleGovScript \
  --sig "queryActiveProposals(string)" \
  "$MERKLE_GOV_ADDR" \
  --rpc-url $RPC_URL
```

### 5. Query Specific Proposal

Get detailed information about a proposal:

```bash
# Query proposal ID 1
forge script script/MerkleGov.s.sol:MerkleGovScript \
  --sig "queryProposal(string,uint256)" \
  "$MERKLE_GOV_ADDR" 1 \
  --rpc-url $RPC_URL
```

### 6. Check Voting Power

Query verified voting power for an account on a proposal:

```bash
# Check voting power for a specific address
export VOTER_ADDRESS="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"

forge script script/MerkleGov.s.sol:MerkleGovScript \
  --sig "queryVotingPower(string,string,uint256)" \
  "$MERKLE_VOTE_ADDR" "$VOTER_ADDRESS" 1 \
  --rpc-url $RPC_URL
```

### 7. Check Updater Status

Verify if an address can update the Merkle root:

```bash
forge script script/MerkleGov.s.sol:MerkleGovScript \
  --sig "queryUpdaterStatus(string,string)" \
  "$MERKLE_VOTE_ADDR" "$REWARD_DISTRIBUTOR_ADDR" \
  --rpc-url $RPC_URL
```

### 8. Query Voting Snapshot

Get information about a specific voting snapshot:

```bash
# Query snapshot ID 0
forge script script/MerkleGov.s.sol:MerkleGovScript \
  --sig "querySnapshot(string,uint256)" \
  "$MERKLE_VOTE_ADDR" 0 \
  --rpc-url $RPC_URL
```

### 9. Get IPFS URI for Merkle Data

Retrieve the IPFS URI containing the current Merkle tree data:

```bash
forge script script/MerkleGov.s.sol:MerkleGovScript \
  --sig "getIpfsUri(string)" \
  "$MERKLE_VOTE_ADDR" \
  --rpc-url $RPC_URL
```

## Common Workflows

### Checking Governance Readiness

Before creating proposals or voting, verify the system is properly configured:

```bash
# 1. Check that MerkleVote has a root set
forge script script/MerkleGov.s.sol:MerkleGovScript \
  --sig "queryMerkleVoteState(string)" \
  "$MERKLE_VOTE_ADDR" \
  --rpc-url $RPC_URL

# 2. Verify governance parameters
forge script script/MerkleGov.s.sol:MerkleGovScript \
  --sig "queryMerkleGovState(string)" \
  "$MERKLE_GOV_ADDR" \
  --rpc-url $RPC_URL

# 3. Ensure reward distributor is an updater
forge script script/MerkleGov.s.sol:MerkleGovScript \
  --sig "queryUpdaterStatus(string,string)" \
  "$MERKLE_VOTE_ADDR" "$REWARD_DISTRIBUTOR_ADDR" \
  --rpc-url $RPC_URL
```

### Monitoring Proposal Lifecycle

Track a proposal from creation through execution:

```bash
# 1. Check active proposals
forge script script/MerkleGov.s.sol:MerkleGovScript \
  --sig "queryActiveProposals(string)" \
  "$MERKLE_GOV_ADDR" \
  --rpc-url $RPC_URL

# 2. Get detailed info on a specific proposal
PROPOSAL_ID=1
forge script script/MerkleGov.s.sol:MerkleGovScript \
  --sig "queryProposal(string,uint256)" \
  "$MERKLE_GOV_ADDR" $PROPOSAL_ID \
  --rpc-url $RPC_URL

# 3. Check if an account has voted
forge script script/MerkleGov.s.sol:MerkleGovScript \
  --sig "queryVotingPower(string,string,uint256)" \
  "$MERKLE_VOTE_ADDR" "$VOTER_ADDRESS" $PROPOSAL_ID \
  --rpc-url $RPC_URL
```

### Verifying Merkle Root Updates

Check if the rewards system has updated the voting power:

```bash
# 1. Check current root in MerkleVote
forge script script/MerkleGov.s.sol:MerkleGovScript \
  --sig "queryMerkleVoteState(string)" \
  "$MERKLE_VOTE_ADDR" \
  --rpc-url $RPC_URL

# 2. Check current root in RewardDistributor
forge script script/Rewards.s.sol:Rewards \
  --sig "queryContractState(string)" \
  "$REWARD_DISTRIBUTOR_ADDR" \
  --rpc-url $RPC_URL

# 3. If roots differ, trigger an update
forge script script/Rewards.s.sol:Rewards \
  --sig "updateRewards(string)" \
  "$REWARD_DISTRIBUTOR_ADDR" \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast
```

## Integration with Rewards System

The MerkleGov system uses the same Merkle tree as the rewards system. To get Merkle proof data for voting:

```bash
# 1. Get the IPFS CID for merkle data
IPFS_CID=$(forge script script/MerkleGov.s.sol:MerkleGovScript \
  --sig "getIpfsUri(string)" \
  "$MERKLE_VOTE_ADDR" \
  --rpc-url $RPC_URL | grep "IPFS URI:" | awk '{print $3}')

# 2. Fetch merkle data for a specific account
ACCOUNT="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
curl -s -X POST "${IPFS_GATEWAY_URL}cat?arg=${IPFS_CID}" | \
  jq ".tree[] | select(.account == \"$ACCOUNT\")"
```

## Troubleshooting

### No Root Set in MerkleVote

If MerkleVote shows a zero root:
1. Ensure the rewards system has been triggered at least once
2. Check that RewardDistributor is set as an updater
3. Verify the WAVS service has processed attestations

### Proposal State Issues

If proposals are stuck in unexpected states:
- **Pending**: Wait for `votingDelay` blocks to pass
- **Active**: Ensure current block is between start and end blocks
- **Defeated**: Check if quorum was met
- **Queued**: Wait for timelock delay before execution

### Voting Power Not Recognized

If voting power verification fails:
1. Ensure the account exists in the current Merkle tree
2. Verify the proof matches the current root (not an old one)
3. Check that the account hasn't already voted with the current root

## Advanced Queries

### Check Proposal Creation Eligibility

Verify if an account meets the threshold to create proposals:

```bash
# Get the proposal threshold
THRESHOLD=$(forge script script/MerkleGov.s.sol:MerkleGovScript \
  --sig "queryMerkleGovState(string)" \
  "$MERKLE_GOV_ADDR" \
  --rpc-url $RPC_URL | grep "Proposal Threshold:" | awk '{print $3}')

echo "Proposal threshold: $THRESHOLD"

# Check account's voting power from merkle tree
ACCOUNT="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
VOTING_POWER=$(curl -s -X POST "${IPFS_GATEWAY_URL}cat?arg=${IPFS_CID}" | \
  jq -r ".tree[] | select(.account == \"$ACCOUNT\") | .claimable")

echo "Account voting power: $VOTING_POWER"
```

### Monitor Pending Root Updates

Check if there's a pending root update in the timelock:

```bash
forge script script/MerkleGov.s.sol:MerkleGovScript \
  --sig "queryMerkleVoteState(string)" \
  "$MERKLE_VOTE_ADDR" \
  --rpc-url $RPC_URL | grep -A 5 "Pending Root"
```

## Best Practices

1. **Always verify the current root** before creating proposals or voting
2. **Monitor gas costs** when creating proposals with multiple actions
3. **Check voting power** before attempting to create proposals
4. **Track proposal states** to ensure timely execution
5. **Keep merkle proofs updated** by triggering rewards updates when needed

## Example Output

When running `queryAll`, you'll see output like:

```
=== MerkleVote State ===
Owner: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Timelock: 3600 seconds
Current Root:
0x1234567890abcdef...
Next Snapshot ID: 1

=== MerkleGov State ===
Name: Symbient DAO
Voting Delay: 1 blocks
Voting Period: 50400 blocks
Quorum: 100000000000000000000
Proposal Threshold: 1000000000000000000
Total Proposals: 0

=== Active Proposals ===
No proposals created yet
```

## Related Documentation

- [Rewards Examples](./RewardsExamples.md) - For updating merkle roots
- [Governance Examples](./GovernanceExamples.md) - For traditional governance
- [Schema Examples](./SchemaExamples.md) - For attestation schemas