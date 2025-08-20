# GOVERNANCE.md

## Merkle-Based Governance System

This document describes the current implementation of the merkle-based governance system for the Symbient protocol, where voting power is derived from reputation scores computed by verifiable off-chain services.

## Overview

The governance system uses merkle proofs to verify voting power, allowing users to participate in governance based on their reputation (computed from EAS attestations). The system consists of two main contracts:

- **MerkleVote.sol**: Manages the merkle root and verifies voting power proofs
- **MerkleGov.sol**: Handles proposal lifecycle (creation, voting, execution)

## Voting Power Source

Voting power is derived from the same merkle tree used for rewards distribution:
- The `claimable` field in the merkle tree represents voting power
- This value is computed off-chain based on attestation activity and trust scores
- The merkle root is updated periodically by the WAVS (WASI AVS) service

### Merkle Tree Structure

Each leaf in the merkle tree contains:
```solidity
leaf = keccak256(abi.encode(account, rewardToken, votingPower))
```

Where:
- `account`: The address with voting power
- `rewardToken`: The reward token address (part of tree structure)
- `votingPower`: The amount of voting power (same as `claimable` in rewards)

## Proposal Lifecycle

### 1. **Proposal Creation**
```solidity
propose(
    actions,        // Array of actions to execute
    description,    // Proposal description
    snapshotId,     // Optional snapshot ID (0 for current)
    rewardToken,    // Reward token address from merkle tree
    votingPower,    // Claimed voting power
    proof           // Merkle proof
)
```

Requirements:
- Proposer must have voting power >= `proposalThreshold`
- Must provide valid merkle proof
- Uses special `proposalCreationId` to prevent proof reuse

### 2. **Voting Period**

**States:**
- `Pending`: Proposal created, waiting for voting delay
- `Active`: Voting is open
- `Succeeded`: Passed (more FOR than AGAINST votes + met quorum)
- `Defeated`: Failed (insufficient support or quorum)
- `Queued`: Waiting for timelock before execution
- `Executed`: Proposal executed
- `Cancelled`: Proposal cancelled by admin

### 3. **Casting Votes**
```solidity
castVote(
    proposalId,     // ID of proposal
    support,        // 0=Against, 1=For, 2=Abstain
    rewardToken,    // Reward token address
    votingPower,    // Claimed voting power
    proof           // Merkle proof
)
```

## Key Features

### Proof Reusability
- **Same Root**: Users can vote on multiple proposals with the same proof
- **Different Roots**: When merkle root updates, old proofs become invalid
- **Per-Proposal Tracking**: Cannot vote twice on same proposal with same root

### Governance Parameters
- `votingDelay`: Time before voting starts (default: 1 day)
- `votingPeriod`: Duration of voting (default: 3 days)
- `timelockDelay`: Time before execution (default: 2 days)
- `proposalThreshold`: Minimum voting power to create proposals
- `quorumBasisPoints`: Required participation (e.g., 1000 = 10%)

## Example Usage

### Creating a Proposal
```javascript
// Account with sufficient voting power creates proposal
const actions = [{
    target: "0x...",           // Contract to call
    value: 0,                   // ETH to send
    data: "0x...",             // Encoded function call
    description: "Action 1"
}];

await merkleGov.propose(
    actions,
    "Upgrade Protocol Fee to 2%",
    0,                          // Use current snapshot
    REWARD_TOKEN_ADDRESS,
    myVotingPower,
    merkleProof
);
```

### Voting on a Proposal
```javascript
// During active voting period
await merkleGov.castVote(
    proposalId,
    1,                          // Vote FOR
    REWARD_TOKEN_ADDRESS,
    myVotingPower,
    merkleProof
);
```

## Security Considerations

1. **Merkle Root Updates**: When the root changes (new reputation calculation), all proofs must be regenerated
2. **Proposal Creation Spam**: Limited by `proposalThreshold` requirement
3. **Vote Buying**: Mitigated by reputation-based (not token-based) voting power
4. **Sybil Resistance**: Inherited from the attestation/reputation system

## Current Limitations (MVP)

1. **Single Merkle Tree**: All proposals use the same merkle root (no per-proposal snapshots)
2. **No Delegation**: Users must vote directly, cannot delegate voting power
3. **Fixed Quorum**: Simple percentage-based quorum (not adaptive)
4. **No Vote Changing**: Once cast, votes cannot be changed
5. **Admin Controls**: Admin can cancel proposals and update parameters

## Integration with WAVS

The merkle root is updated through the WAVS service:
1. Off-chain components compute reputation scores from attestations
2. New merkle tree is generated with updated voting power
3. Root is submitted on-chain via `handleSignedEnvelope`
4. Old voting proofs become invalid, new ones must be obtained

## Testing

Run governance tests:
```bash
forge test --match-path test/merkle-governance/MerkleGovernanceTest.t.sol
```

Key test scenarios:
- Proposal creation with merkle proof verification
- Voting with multiple accounts
- Voting on multiple proposals with same proof
- Prevention of double voting
- Quorum requirements
- Root update behavior

## Future Improvements

Potential enhancements for production:
- [ ] Per-proposal merkle snapshots
- [ ] Vote delegation mechanisms
- [ ] Adaptive quorum based on participation
- [ ] Time-weighted voting
- [ ] Cross-chain governance
- [ ] Emergency pause mechanisms
- [ ] Vote incentives/penalties
- [ ] Governance token integration (hybrid model)