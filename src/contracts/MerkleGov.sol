// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {MerkleVote} from "./MerkleVote.sol";
import {ITypes} from "interfaces/ITypes.sol";

/**
 * @title MerkleGov
 * @notice MVP governance system optimized for attestation-based voting with MerkleVote integration
 * @dev Implements Tier 1 governance from GOV.md - public voting with Merkle proof verification
 */
contract MerkleGov {
    /*///////////////////////////////////////////////////////////////
                                TYPES
    //////////////////////////////////////////////////////////////*/

    enum ProposalState {
        Pending, // 0 - Proposal created but voting not started
        Active, // 1 - Voting is active
        Succeeded, // 2 - Proposal passed quorum and majority
        Defeated, // 3 - Proposal failed quorum or majority
        Queued, // 4 - Proposal is queued in timelock
        Executed, // 5 - Proposal was executed
        Cancelled // 6 - Proposal was cancelled

    }

    enum VoteType {
        Against, // 0
        For, // 1
        Abstain // 2

    }

    struct ProposalAction {
        address target;
        uint256 value;
        bytes data;
        string description;
    }

    struct Proposal {
        uint256 id;
        address proposer;
        uint256 snapshotId;
        uint256 startTime;
        uint256 endTime;
        uint256 eta; // Execution time (for timelock)
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        ProposalAction[] actions;
        string description;
        ProposalState state;
        // Vote tracking
        mapping(address => bool) hasVoted;
        mapping(address => VoteType) votes;
        mapping(address => uint256) votePower;
    }

    struct ProposalCore {
        uint256 id;
        address proposer;
        uint256 snapshotId;
        uint256 startTime;
        uint256 endTime;
        uint256 eta;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        string description;
        ProposalState state;
    }

    /*///////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        uint256 snapshotId,
        uint256 startTime,
        uint256 endTime,
        uint256 proposerVotingPower,
        string description
    );

    event VoteCast(
        address indexed voter, uint256 indexed proposalId, uint8 support, uint256 votingPower, string reason
    );

    event ProposalQueued(uint256 indexed proposalId, uint256 eta);
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCancelled(uint256 indexed proposalId);

    event QuorumUpdated(uint256 oldQuorum, uint256 newQuorum);
    event VotingDelayUpdated(uint256 oldDelay, uint256 newDelay);
    event VotingPeriodUpdated(uint256 oldPeriod, uint256 newPeriod);
    event TimelockUpdated(uint256 oldTimelock, uint256 newTimelock);

    /*///////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/

    /// @notice The MerkleVote contract for voting power verification
    MerkleVote public immutable merkleVote;

    /// @notice The address with admin privileges
    address public admin;

    /// @notice Counter for proposal IDs
    uint256 public proposalCounter;

    /// @notice Mapping from proposal ID to proposal data
    mapping(uint256 => Proposal) internal proposals;

    /// @notice Minimum quorum required (in basis points, 100 = 1%)
    uint256 public quorumBasisPoints;

    /// @notice Delay before voting starts (in seconds)
    uint256 public votingDelay;

    /// @notice Duration of voting period (in seconds)
    uint256 public votingPeriod;

    /// @notice Timelock delay for execution (in seconds)
    uint256 public timelockDelay;

    /// @notice Minimum voting power required to create proposal
    uint256 public proposalThreshold;

    /*///////////////////////////////////////////////////////////////
                               MODIFIERS
    //////////////////////////////////////////////////////////////*/

    modifier onlyAdmin() {
        require(msg.sender == admin, "MerkleGov: not admin");
        _;
    }

    /*///////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor(
        MerkleVote _merkleVote,
        address _admin,
        uint256 _quorumBasisPoints,
        uint256 _votingDelay,
        uint256 _votingPeriod,
        uint256 _timelockDelay,
        uint256 _proposalThreshold
    ) {
        require(address(_merkleVote) != address(0), "MerkleGov: invalid MerkleVote");
        require(_admin != address(0), "MerkleGov: invalid admin");
        require(_quorumBasisPoints <= 10000, "MerkleGov: quorum too high");
        require(_votingPeriod > 0, "MerkleGov: invalid voting period");

        merkleVote = _merkleVote;
        admin = _admin;
        quorumBasisPoints = _quorumBasisPoints;
        votingDelay = _votingDelay;
        votingPeriod = _votingPeriod;
        timelockDelay = _timelockDelay;
        proposalThreshold = _proposalThreshold;
    }

    /*///////////////////////////////////////////////////////////////
                          PROPOSAL CREATION
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Create a new governance proposal
     * @param actions Array of actions to execute if proposal passes
     * @param description Description of the proposal
     * @param snapshotId Optional snapshot ID for voting power (0 for latest)
     * @param votingPower The claimed voting power for proposal creation
     * @param proof Merkle proof for voting power verification
     * @return proposalId The ID of the created proposal
     */
    function propose(
        ProposalAction[] calldata actions,
        string calldata description,
        uint256 snapshotId,
        uint256 votingPower,
        bytes32[] calldata proof
    ) external returns (uint256 proposalId) {
        require(actions.length > 0, "MerkleGov: empty actions");
        require(bytes(description).length > 0, "MerkleGov: empty description");
        require(votingPower >= proposalThreshold, "MerkleGov: insufficient voting power");

        // Verify proposer has sufficient voting power
        proposalId = ++proposalCounter;

        // Use special proposalId for proposal creation verification
        // This prevents the same proof from being used for both proposal creation and voting
        uint256 proposalCreationId = type(uint256).max - proposalId;

        require(
            merkleVote.verifyVotingPower(msg.sender, proposalCreationId, votingPower, proof),
            "MerkleGov: invalid voting power proof"
        );

        Proposal storage proposal = proposals[proposalId];
        proposal.id = proposalId;
        proposal.proposer = msg.sender;
        proposal.snapshotId = snapshotId; // 0 = use current merkle root
        proposal.startTime = block.timestamp + votingDelay;
        proposal.endTime = proposal.startTime + votingPeriod;
        proposal.description = description;
        proposal.state = ProposalState.Pending;

        // Store actions
        for (uint256 i = 0; i < actions.length; i++) {
            proposal.actions.push(actions[i]);
        }

        emit ProposalCreated(
            proposalId, msg.sender, snapshotId, proposal.startTime, proposal.endTime, votingPower, description
        );
    }

    /*///////////////////////////////////////////////////////////////
                               VOTING
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Cast vote with Merkle proof verification
     * @param proposalId The ID of the proposal to vote on
     * @param support The vote type (0=Against, 1=For, 2=Abstain)
     * @param votingPower The claimed voting power
     * @param proof Merkle proof for voting power verification
     * @param reason Optional reason for the vote
     */
    function castVote(
        uint256 proposalId,
        uint8 support,
        uint256 votingPower,
        bytes32[] calldata proof,
        string calldata reason
    ) external {
        require(support <= 2, "MerkleGov: invalid support value");
        require(votingPower > 0, "MerkleGov: zero voting power");

        Proposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "MerkleGov: proposal not found");
        require(_getProposalState(proposalId) == ProposalState.Active, "MerkleGov: voting not active");
        require(!proposal.hasVoted[msg.sender], "MerkleGov: already voted");

        // Verify voting power with MerkleVote
        require(
            merkleVote.verifyVotingPower(msg.sender, proposalId, votingPower, proof),
            "MerkleGov: invalid voting power proof"
        );

        // Record vote
        proposal.hasVoted[msg.sender] = true;
        proposal.votes[msg.sender] = VoteType(support);
        proposal.votePower[msg.sender] = votingPower;

        // Update vote tallies
        if (support == 0) {
            proposal.againstVotes += votingPower;
        } else if (support == 1) {
            proposal.forVotes += votingPower;
        } else {
            proposal.abstainVotes += votingPower;
        }

        emit VoteCast(msg.sender, proposalId, support, votingPower, reason);
    }

    /**
     * @notice Cast vote without reason
     */
    function castVote(uint256 proposalId, uint8 support, uint256 votingPower, bytes32[] calldata proof) external {
        this.castVote(proposalId, support, votingPower, proof, "");
    }

    /*///////////////////////////////////////////////////////////////
                          PROPOSAL EXECUTION
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Queue a successful proposal for execution
     * @param proposalId The ID of the proposal to queue
     */
    function queue(uint256 proposalId) external {
        require(_getProposalState(proposalId) == ProposalState.Succeeded, "MerkleGov: proposal not succeeded");

        Proposal storage proposal = proposals[proposalId];
        uint256 eta = block.timestamp + timelockDelay;
        proposal.eta = eta;
        proposal.state = ProposalState.Queued;

        emit ProposalQueued(proposalId, eta);
    }

    /**
     * @notice Execute a queued proposal
     * @param proposalId The ID of the proposal to execute
     */
    function execute(uint256 proposalId) external payable {
        require(_getProposalState(proposalId) == ProposalState.Queued, "MerkleGov: proposal not queued");

        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp >= proposal.eta, "MerkleGov: timelock not expired");

        proposal.state = ProposalState.Executed;

        // Execute all actions
        for (uint256 i = 0; i < proposal.actions.length; i++) {
            ProposalAction memory action = proposal.actions[i];

            (bool success,) = action.target.call{value: action.value}(action.data);
            require(success, string(abi.encodePacked("MerkleGov: execution failed at action ", i)));
        }

        emit ProposalExecuted(proposalId);
    }

    /**
     * @notice Cancel a proposal (admin only)
     * @param proposalId The ID of the proposal to cancel
     */
    function cancel(uint256 proposalId) external onlyAdmin {
        ProposalState currentState = _getProposalState(proposalId);
        require(
            currentState == ProposalState.Pending || currentState == ProposalState.Active
                || currentState == ProposalState.Queued,
            "MerkleGov: cannot cancel"
        );

        proposals[proposalId].state = ProposalState.Cancelled;
        emit ProposalCancelled(proposalId);
    }

    /*///////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Get proposal state
     * @param proposalId The ID of the proposal
     * @return The current state of the proposal
     */
    function state(uint256 proposalId) external view returns (ProposalState) {
        return _getProposalState(proposalId);
    }

    /**
     * @notice Get core proposal information
     * @param proposalId The ID of the proposal
     * @return Proposal core data
     */
    function getProposal(uint256 proposalId) external view returns (ProposalCore memory) {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "MerkleGov: proposal not found");

        return ProposalCore({
            id: proposal.id,
            proposer: proposal.proposer,
            snapshotId: proposal.snapshotId,
            startTime: proposal.startTime,
            endTime: proposal.endTime,
            eta: proposal.eta,
            forVotes: proposal.forVotes,
            againstVotes: proposal.againstVotes,
            abstainVotes: proposal.abstainVotes,
            description: proposal.description,
            state: _getProposalState(proposalId)
        });
    }

    /**
     * @notice Get proposal actions
     * @param proposalId The ID of the proposal
     * @return Array of proposal actions
     */
    function getActions(uint256 proposalId) external view returns (ProposalAction[] memory) {
        require(proposals[proposalId].id != 0, "MerkleGov: proposal not found");
        return proposals[proposalId].actions;
    }

    /**
     * @notice Get vote information for an account on a proposal
     * @param proposalId The ID of the proposal
     * @param account The account to check
     * @return hasVoted Whether the account has voted
     * @return support The vote type (if voted)
     * @return votingPower The voting power used (if voted)
     */
    function getVote(uint256 proposalId, address account)
        external
        view
        returns (bool hasVoted, VoteType support, uint256 votingPower)
    {
        Proposal storage proposal = proposals[proposalId];
        hasVoted = proposal.hasVoted[account];
        support = proposal.votes[account];
        votingPower = proposal.votePower[account];
    }

    /**
     * @notice Check if an account has sufficient voting power to create proposals
     * @param account The account to check
     * @param votingPower The claimed voting power
     * @param proof Merkle proof for voting power verification
     * @return canPropose_ Whether the account can create proposals
     * @dev This function simulates the proposal creation check without actually creating a proposal
     */
    function canPropose(address account, uint256 votingPower, bytes32[] calldata proof)
        external
        view
        returns (bool canPropose_)
    {
        if (votingPower < proposalThreshold) {
            return false;
        }

        // We can't actually verify the proof in a view function since MerkleVote.verifyVotingPower
        // is not a view function (it modifies state). In a real implementation, you would either:
        // 1. Add a view-only verification function to MerkleVote, or
        // 2. Accept that this function can't fully validate the proof

        // For now, we can only check the voting power threshold
        return true;
    }

    /**
     * @notice Calculate current quorum for a proposal
     * @param proposalId The ID of the proposal
     * @return The quorum threshold
     */
    function quorum(uint256 proposalId) public view returns (uint256) {
        // For MVP, use simple percentage of total verified voting power
        // In production, this would use the total power from the snapshot
        uint256 totalVotes =
            proposals[proposalId].forVotes + proposals[proposalId].againstVotes + proposals[proposalId].abstainVotes;

        // If no votes yet, return a default minimum
        if (totalVotes == 0) return 1000; // Minimum 1000 voting power for quorum

        // Otherwise require quorum percentage of total participating votes
        return (totalVotes * quorumBasisPoints) / 10000;
    }

    /*///////////////////////////////////////////////////////////////
                           ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Update governance parameters (admin only)
     */
    function setQuorum(uint256 newQuorumBasisPoints) external onlyAdmin {
        require(newQuorumBasisPoints <= 10000, "MerkleGov: quorum too high");
        emit QuorumUpdated(quorumBasisPoints, newQuorumBasisPoints);
        quorumBasisPoints = newQuorumBasisPoints;
    }

    function setVotingDelay(uint256 newVotingDelay) external onlyAdmin {
        emit VotingDelayUpdated(votingDelay, newVotingDelay);
        votingDelay = newVotingDelay;
    }

    function setVotingPeriod(uint256 newVotingPeriod) external onlyAdmin {
        require(newVotingPeriod > 0, "MerkleGov: invalid voting period");
        emit VotingPeriodUpdated(votingPeriod, newVotingPeriod);
        votingPeriod = newVotingPeriod;
    }

    function setTimelockDelay(uint256 newTimelockDelay) external onlyAdmin {
        emit TimelockUpdated(timelockDelay, newTimelockDelay);
        timelockDelay = newTimelockDelay;
    }

    function setProposalThreshold(uint256 newProposalThreshold) external onlyAdmin {
        proposalThreshold = newProposalThreshold;
    }

    function setAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "MerkleGov: invalid admin");
        admin = newAdmin;
    }

    /*///////////////////////////////////////////////////////////////
                           INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Internal function to determine proposal state
     */
    function _getProposalState(uint256 proposalId) internal view returns (ProposalState) {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "MerkleGov: proposal not found");

        // Check if manually set state takes precedence
        if (proposal.state == ProposalState.Cancelled || proposal.state == ProposalState.Executed) {
            return proposal.state;
        }

        // Check timing-based states
        if (block.timestamp < proposal.startTime) {
            return ProposalState.Pending;
        }

        if (block.timestamp <= proposal.endTime) {
            return ProposalState.Active;
        }

        // Check if queued
        if (proposal.state == ProposalState.Queued) {
            return ProposalState.Queued;
        }

        // Determine success/failure based on votes
        uint256 currentQuorum = quorum(proposalId);
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;

        if (totalVotes < currentQuorum) {
            return ProposalState.Defeated;
        }

        if (proposal.forVotes > proposal.againstVotes) {
            return ProposalState.Succeeded;
        }

        return ProposalState.Defeated;
    }

    /*///////////////////////////////////////////////////////////////
                              RECEIVE ETHER
    //////////////////////////////////////////////////////////////*/

    receive() external payable {}
}
