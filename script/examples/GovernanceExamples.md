# Governance Script Examples

This document provides examples of how to use the `Governance.s.sol` script for testing governance features.

## Prerequisites

Make sure you have:
- Deployed `VotingPower` contract
- Deployed `AttestationGovernor` contract
- Some voting tokens minted to your account
- Your private key set in environment (or use `--private-key` flag)

## Voting Power Queries

### Query Your Own Voting Power
```bash
forge script script/Governance.s.sol:Governance \
    --sig "queryVotingPower(string,string)" \
    "0x1234...VotingPowerAddress" \
    "0x5678...YourAddress" \
    --rpc-url $RPC_URL
```

### Query Multiple Accounts
```bash
# Note: This requires arrays, so it's easier to call from another script
# Or use the individual query function for each account
```

### Query Historical Voting Power
```bash
forge script script/Governance.s.sol:Governance \
    --sig "queryVotingPowerAt(string,string,uint256)" \
    "0x1234...VotingPowerAddress" \
    "0x5678...YourAddress" \
    "12345678" \
    --rpc-url $RPC_URL
```

### Show Your Complete Governance Status
```bash
forge script script/Governance.s.sol:Governance \
    --sig "showMyGovernanceStatus(string,string)" \
    "0x1234...VotingPowerAddress" \
    "0x5678...GovernorAddress" \
    --rpc-url $RPC_URL
```

## Delegation

### Self-Delegate (Enable Voting)
```bash
forge script script/Governance.s.sol:Governance \
    --sig "selfDelegate(string)" \
    "0x1234...VotingPowerAddress" \
    --rpc-url $RPC_URL \
    --broadcast
```

### Delegate to Another Address
```bash
forge script script/Governance.s.sol:Governance \
    --sig "delegate(string,string)" \
    "0x1234...VotingPowerAddress" \
    "0x9999...DelegateeAddress" \
    --rpc-url $RPC_URL \
    --broadcast
```

## Governance State Queries

### Query Governor Settings
```bash
forge script script/Governance.s.sol:Governance \
    --sig "queryGovernanceState(string)" \
    "0x5678...GovernorAddress" \
    --rpc-url $RPC_URL
```

### Query Specific Proposal
```bash
forge script script/Governance.s.sol:Governance \
    --sig "queryProposal(string,uint256)" \
    "0x5678...GovernorAddress" \
    "123456789" \
    --rpc-url $RPC_URL
```

### Check If Account Voted on Proposal
```bash
forge script script/Governance.s.sol:Governance \
    --sig "checkVote(string,uint256,string)" \
    "0x5678...GovernorAddress" \
    "123456789" \
    "0x1111...VoterAddress" \
    --rpc-url $RPC_URL
```

## Proposal Management

### Create a Simple Proposal
```bash
# This is more complex as it requires arrays - better to create a wrapper script
# See example below for a simple proposal script
```

### Vote on a Proposal
```bash
# Vote FOR (1)
forge script script/Governance.s.sol:Governance \
    --sig "vote(string,uint256,uint8)" \
    "0x5678...GovernorAddress" \
    "123456789" \
    "1" \
    --rpc-url $RPC_URL \
    --broadcast

# Vote AGAINST (0)
forge script script/Governance.s.sol:Governance \
    --sig "vote(string,uint256,uint8)" \
    "0x5678...GovernorAddress" \
    "123456789" \
    "0" \
    --rpc-url $RPC_URL \
    --broadcast

# Vote ABSTAIN (2)
forge script script/Governance.s.sol:Governance \
    --sig "vote(string,uint256,uint8)" \
    "0x5678...GovernorAddress" \
    "123456789" \
    "2" \
    --rpc-url $RPC_URL \
    --broadcast
```

### Vote with Reason
```bash
forge script script/Governance.s.sol:Governance \
    --sig "vote(string,uint256,uint8,string)" \
    "0x5678...GovernorAddress" \
    "123456789" \
    "1" \
    "I support this proposal because it improves the system" \
    --rpc-url $RPC_URL \
    --broadcast
```

## Example Wrapper Scripts

### Simple Proposal Creation Script

Create a file `script/CreateSimpleProposal.s.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {Governance} from "./Governance.s.sol";

contract CreateSimpleProposal is Governance {
    function createTestProposal(string calldata governorAddr) public {
        // Example: Proposal to call a simple function
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        
        targets[0] = address(0); // Target contract
        values[0] = 0; // No ETH transfer
        calldatas[0] = ""; // Empty calldata for simple test
        
        string memory description = "Test Proposal: This is a test proposal for governance";
        
        createProposal(governorAddr, targets, values, calldatas, description);
    }
}
```

Then run:
```bash
forge script script/CreateSimpleProposal.s.sol:CreateSimpleProposal \
    --sig "createTestProposal(string)" \
    "0x5678...GovernorAddress" \
    --rpc-url $RPC_URL \
    --broadcast
```

## Common Workflows

### 1. Setup for Governance Participation
```bash
# 1. Check your voting power
forge script script/Governance.s.sol:Governance \
    --sig "showMyGovernanceStatus(string,string)" \
    "0x...VotingPower" "0x...Governor" --rpc-url $RPC_URL

# 2. Self-delegate to enable voting (if not already done)
forge script script/Governance.s.sol:Governance \
    --sig "selfDelegate(string)" \
    "0x...VotingPower" --rpc-url $RPC_URL --broadcast
```

### 2. Participate in Governance
```bash
# 1. Query current governance state
forge script script/Governance.s.sol:Governance \
    --sig "queryGovernanceState(string)" \
    "0x...Governor" --rpc-url $RPC_URL

# 2. Check specific proposal
forge script script/Governance.s.sol:Governance \
    --sig "queryProposal(string,uint256)" \
    "0x...Governor" "PROPOSAL_ID" --rpc-url $RPC_URL

# 3. Vote on proposal
forge script script/Governance.s.sol:Governance \
    --sig "vote(string,uint256,uint8,string)" \
    "0x...Governor" "PROPOSAL_ID" "1" "My vote reason" \
    --rpc-url $RPC_URL --broadcast
```

### 3. Monitor Proposal Progress
```bash
# Check updated proposal state after voting
forge script script/Governance.s.sol:Governance \
    --sig "queryProposal(string,uint256)" \
    "0x...Governor" "PROPOSAL_ID" --rpc-url $RPC_URL

# Check if you voted
forge script script/Governance.s.sol:Governance \
    --sig "checkVote(string,uint256,string)" \
    "0x...Governor" "PROPOSAL_ID" "0x...YourAddress" \
    --rpc-url $RPC_URL
```

## Tips

1. **Always self-delegate first**: You need to delegate your tokens (even to yourself) before you can vote
2. **Check proposal timing**: Make sure the proposal is in the "Active" state before voting
3. **Monitor quorum**: Check if enough votes have been cast for the proposal to pass
4. **Historical queries**: Use block numbers that are at least 1 block in the past for historical voting power queries
5. **Gas considerations**: Proposal creation and voting require gas, so make sure your account has enough ETH

## Troubleshooting

- **"Governor: proposer votes below proposal threshold"**: You need more voting power to create proposals
- **"Governor: vote not currently active"**: The proposal is not in voting period yet, or has ended
- **"Governor: voter already voted"**: You've already voted on this proposal
- **"VotingPower: burn amount exceeds balance"**: Trying to burn more tokens than the account has