# Governance Integration Guide

This document outlines how to integrate the `MerkleVote` contract with various governance frameworks and provides recommendations for the optimal approach.

## Overview

The `MerkleVote` contract provides Merkle-based voting power verification through off-chain computation and on-chain proof validation. This enables:
- Dynamic voting power calculations based on attestation data
- Sybil-resistant voting through WAVS validation
- Efficient on-chain verification with minimal gas costs
- Historical snapshot capabilities

## Integration Options

### 1. OpenZeppelin Governor

**Current Implementation**: `src/contracts/Governor.sol` (AttestationGovernor)

#### Integration Strategy

```solidity
// Custom voting strategy that uses MerkleVote
contract AttestationBasedGovernor is Governor, GovernorSettings, GovernorCountingSimple {
    MerkleVote public immutable merkleVote;

    constructor(MerkleVote _merkleVote) {
        merkleVote = _merkleVote;
    }

    // Override to use Merkle-based voting power
    function _getVotes(address account, uint256 timepoint, bytes memory params)
        internal view override returns (uint256) {
        uint256 proposalId = abi.decode(params, (uint256));
        return merkleVote.getVerifiedVotingPower(account, proposalId);
    }

    // Custom voting mechanism
    function castVoteWithProof(
        uint256 proposalId,
        uint8 support,
        uint256 votingPower,
        bytes32[] calldata proof
    ) external returns (uint256) {
        // Verify and record voting power
        require(merkleVote.verifyVotingPower(
            msg.sender, proposalId, votingPower, proof
        ), "Invalid voting power proof");

        // Cast vote using verified power
        return _castVote(proposalId, msg.sender, support, "", votingPower);
    }
}
```

**Pros**:
- ✅ Well-established, audited framework
- ✅ Rich ecosystem and tooling support
- ✅ Flexible extension system
- ✅ Integration with existing governance UIs

**Cons**:
- ❌ Built around token-based voting (requires significant customization)
- ❌ Complex inheritance hierarchy
- ❌ May not fully leverage Merkle proof efficiency

### 2. Aragon OSx

#### Integration Strategy

```solidity
// Custom Aragon plugin for attestation-based voting
contract AttestationVotingPlugin is Plugin, IMajorityVoting {
    MerkleVote public immutable merkleVote;

    struct Proposal {
        uint256 snapshotId;
        mapping(address => bool) hasVoted;
        uint256 yesVotes;
        uint256 noVotes;
    }

    function vote(
        uint256 proposalId,
        VoteOption voteOption,
        uint256 votingPower,
        bytes32[] calldata proof
    ) external {
        require(merkleVote.verifyVotingPower(
            msg.sender, proposalId, votingPower, proof
        ), "Invalid proof");

        // Record vote with verified power
        _recordVote(proposalId, voteOption, votingPower);
    }
}
```

**Pros**:
- ✅ Modular plugin architecture perfect for custom voting
- ✅ Built-in proposal lifecycle management
- ✅ Native support for different voting strategies
- ✅ Modern governance framework

**Cons**:
- ❌ Less mature ecosystem than OpenZeppelin
- ❌ More complex setup and deployment
- ❌ Learning curve for Aragon-specific patterns

### 3. Gnosis Safe + Snapshot

#### Integration Strategy

```solidity
// Safe module that validates votes through MerkleVote
contract AttestationSafeModule is Enum {
    MerkleVote public immutable merkleVote;

    mapping(bytes32 => ProposalState) public proposals;

    struct ProposalState {
        uint256 yesVotes;
        uint256 noVotes;
        uint256 deadline;
        bool executed;
    }

    function executeProposalWithAttestationVotes(
        address safe,
        bytes32 proposalHash,
        address to,
        uint256 value,
        bytes calldata data,
        AttestationVote[] calldata votes
    ) external {
        // Verify all attestation votes
        uint256 totalPower = 0;
        for (uint256 i = 0; i < votes.length; i++) {
            require(merkleVote.getVerifiedVotingPower(
                votes[i].voter, uint256(proposalHash)
            ) == votes[i].power, "Invalid voting power");
            totalPower += votes[i].power;
        }

        require(totalPower >= getQuorum(), "Insufficient voting power");

        // Execute on Safe
        IGnosisSafe(safe).execTransactionFromModule(
            to, value, data, Enum.Operation.Call
        );
    }
}
```

**Pros**:
- ✅ Leverages battle-tested Safe infrastructure
- ✅ Can combine with off-chain Snapshot voting
- ✅ Flexible execution patterns
- ✅ Multi-signature safety

**Cons**:
- ❌ Requires off-chain coordination (Snapshot)
- ❌ Less integrated voting experience
- ❌ Complex multi-step execution process

### 4. Moloch-style DAO

#### Integration Strategy

```solidity
// Moloch DAO with attestation-based proposal system
contract AttestationMoloch {
    MerkleVote public immutable merkleVote;

    struct Proposal {
        address applicant;
        address proposer;
        uint256 sharesRequested;
        uint256 tributeOffered;
        string details;
        uint256 yesVotes;
        uint256 noVotes;
        mapping(address => Vote) votesByMember;
    }

    function submitVote(
        uint256 proposalIndex,
        uint8 uintVote,
        uint256 votingPower,
        bytes32[] calldata proof
    ) external {
        require(merkleVote.verifyVotingPower(
            msg.sender, proposalIndex, votingPower, proof
        ), "Invalid voting power proof");

        // Submit vote with verified power
        _submitVote(proposalIndex, uintVote, votingPower);
    }
}
```

**Pros**:
- ✅ Simple, proven governance model
- ✅ Clear proposal lifecycle
- ✅ Easy to understand and implement
- ✅ Gas-efficient operations

**Cons**:
- ❌ Less flexible than modern frameworks
- ❌ Limited voting strategies
- ❌ Lacks advanced governance features

## Custom Proposal System (Recommended)

### Why Build Custom?

Given the unique nature of attestation-based governance and WAVS integration, a **custom proposal system** is recommended:

#### Architecture Overview

```solidity
// Custom governance system optimized for attestation-based voting
contract AttestationGovernance {
    MerkleVote public immutable merkleVote;

    enum ProposalState { Pending, Active, Succeeded, Defeated, Executed, Cancelled }

    struct Proposal {
        uint256 id;
        address proposer;
        uint256 snapshotId;
        uint256 startTime;
        uint256 endTime;
        uint256 yesVotes;
        uint256 noVotes;
        uint256 abstainVotes;
        ProposalState state;
        ProposalAction[] actions;
    }

    struct ProposalAction {
        address target;
        uint256 value;
        bytes data;
        string description;
    }

    // Core governance functions
    function propose(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata calldatas,
        string calldata description
    ) external returns (uint256 proposalId);

    function castVoteWithProof(
        uint256 proposalId,
        uint8 support,
        uint256 votingPower,
        bytes32[] calldata proof
    ) external;

    function execute(uint256 proposalId) external;

    // WAVS-specific features
    function proposeWithAttestation(
        bytes32 attestationUID,
        ProposalAction[] calldata actions
    ) external returns (uint256 proposalId);

    function batchVoteWithMultipleProofs(
        uint256[] calldata proposalIds,
        uint8[] calldata supports,
        uint256[] calldata votingPowers,
        bytes32[][] calldata proofs
    ) external;
}
```

### Key Features

#### 1. Native Attestation Integration
```solidity
// Proposals can be created from attestations
function proposeFromAttestation(
    bytes32 attestationUID,
    ProposalAction[] calldata actions
) external returns (uint256 proposalId) {
    // Verify attestation exists and is valid
    Attestation memory attestation = eas.getAttestation(attestationUID);
    require(attestation.attester != address(0), "Invalid attestation");

    // Create proposal linked to attestation
    return _createProposal(actions, attestationUID);
}
```

#### 2. Optimized Voting Flow
```solidity
// Single transaction voting with proof verification
function castVoteWithProof(
    uint256 proposalId,
    uint8 support,
    uint256 votingPower,
    bytes32[] calldata proof,
    string calldata reason
) external {
    // Verify voting power and prevent double voting
    require(merkleVote.verifyVotingPower(
        msg.sender, proposalId, votingPower, proof
    ), "Invalid voting power");

    // Record vote
    _recordVote(proposalId, msg.sender, support, votingPower, reason);

    emit VoteCast(msg.sender, proposalId, support, votingPower, reason);
}
```

#### 3. Flexible Quorum Strategies
```solidity
// Dynamic quorum based on attestation activity
function getQuorum(uint256 proposalId) public view returns (uint256) {
    Proposal storage proposal = proposals[proposalId];

    // Base quorum from snapshot
    VotingSnapshot memory snapshot = merkleVote.getSnapshot(proposal.snapshotId);
    uint256 totalPower = _calculateTotalPowerFromSnapshot(snapshot);

    // Dynamic adjustment based on proposal type
    if (proposal.proposalType == ProposalType.CRITICAL) {
        return (totalPower * 60) / 100; // 60% for critical changes
    } else {
        return (totalPower * 30) / 100; // 30% for regular proposals
    }
}
```

#### 4. WAVS-Optimized Features
```solidity
// Batch operations for efficiency
function batchExecute(uint256[] calldata proposalIds) external {
    for (uint256 i = 0; i < proposalIds.length; i++) {
        if (state(proposalIds[i]) == ProposalState.Succeeded) {
            _execute(proposalIds[i]);
        }
    }
}

// Integration with off-chain computation
function updateVotingPowerSnapshot(
    uint256 proposalId,
    bytes32 newRoot,
    bytes32 ipfsHash
) external onlyUpdater {
    Proposal storage proposal = proposals[proposalId];
    require(proposal.state == ProposalState.Active, "Proposal not active");

    // Update voting power for active proposal
    proposal.snapshotId = merkleVote.createSnapshot(newRoot, ipfsHash);

    emit SnapshotUpdated(proposalId, proposal.snapshotId);
}
```

### Implementation Phases

#### Phase 1: Core Governance
- ✅ Basic proposal creation and voting
- ✅ Merkle proof verification integration
- ✅ Simple quorum and timing mechanisms

#### Phase 2: Advanced Features
- 🔄 Dynamic quorum strategies
- 🔄 Proposal categories and types
- 🔄 Batch operations and gas optimization

#### Phase 3: WAVS-Specific Features
- ⏳ Real-time voting power updates
- ⏳ Cross-chain proposal coordination
- ⏳ Advanced attestation-based triggers

## Integration Examples

### Frontend Integration
```typescript
// React hook for voting with proofs
function useAttestationVoting(proposalId: number) {
  const [votingPower, setVotingPower] = useState<bigint>(0n);
  const [proof, setProof] = useState<string[]>([]);

  const generateProof = async (account: string) => {
    // Call WAVS service to generate Merkle proof
    const response = await fetch('/api/voting-proof', {
      method: 'POST',
      body: JSON.stringify({ account, proposalId })
    });

    const { power, proof: merkleProof } = await response.json();
    setVotingPower(BigInt(power));
    setProof(merkleProof);
  };

  const castVote = async (support: number) => {
    const tx = await governanceContract.castVoteWithProof(
      proposalId, support, votingPower, proof
    );
    return await tx.wait();
  };

  return { votingPower, proof, generateProof, castVote };
}
```

### WAVS Component Integration
```rust
// WAVS component for generating voting proofs
#[derive(ComponentInput)]
pub struct VotingProofInput {
    pub proposal_id: u64,
    pub account: String,
    pub attestation_data: Vec<AttestationData>,
}

#[derive(ComponentOutput)]
pub struct VotingProofOutput {
    pub voting_power: u64,
    pub merkle_proof: Vec<String>,
    pub root: String,
}

pub fn generate_voting_proof(input: VotingProofInput) -> VotingProofOutput {
    // Calculate voting power from attestations
    let voting_power = calculate_attestation_voting_power(&input.attestation_data);

    // Generate Merkle tree and proof
    let (root, proof) = generate_merkle_proof(&input.account, input.proposal_id, voting_power);

    VotingProofOutput {
        voting_power,
        merkle_proof: proof,
        root,
    }
}
```

## Recommendation: Custom System

### Why Custom is Best

1. **Perfect Fit**: Designed specifically for attestation-based voting patterns
2. **WAVS Optimization**: Native integration with off-chain computation workflows
3. **Gas Efficiency**: Optimized for Merkle proof verification patterns
4. **Flexibility**: Can evolve with specific governance needs
5. **Simplicity**: Avoids complexity of adapting existing frameworks

### Migration Path

1. **Start Simple**: Build core proposal + voting system
2. **Iterate**: Add features based on community needs
3. **Integrate**: Connect with existing tools (Snapshot, Tally, etc.)
4. **Scale**: Expand to multi-chain and advanced features

### Estimated Development Timeline

- **Core System**: 2-3 weeks
- **Testing & Audits**: 3-4 weeks
- **Frontend Integration**: 2-3 weeks
- **Advanced Features**: 4-6 weeks

**Total**: ~12-16 weeks for full implementation

The custom approach provides the most value for the unique attestation-based governance model while maintaining compatibility with existing governance tooling where needed.
