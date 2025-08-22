// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Module} from "@gnosis-guild/zodiac-core/core/Module.sol";
import {Operation} from "@gnosis-guild/zodiac-core/core/Operation.sol";
import {IWavsServiceManager} from "@wavs/interfaces/IWavsServiceManager.sol";
import {IWavsServiceHandler} from "@wavs/interfaces/IWavsServiceHandler.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import {ITypes} from "interfaces/ITypes.sol";

/// @title MerkleGovModule - Zodiac module for merkle-based governance
/// @notice Combines merkle voting verification with Zodiac's execution capabilities
/// @dev Implements IWavsServiceHandler for merkle root updates via WAVS
contract MerkleGovModule is Module, IWavsServiceHandler {
    /*///////////////////////////////////////////////////////////////
                                TYPES
    //////////////////////////////////////////////////////////////*/

    enum ProposalState {
        Pending,
        Active,
        Defeated,
        Succeeded,
        Executed,
        Cancelled
    }

    enum VoteType {
        Against,
        For,
        Abstain
    }

    struct ProposalAction {
        address target;
        uint256 value;
        bytes data;
        Operation operation;
    }

    struct Proposal {
        uint256 id;
        address proposer;
        uint256 startBlock;
        uint256 endBlock;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool executed;
        bool cancelled;
        bytes32 merkleRoot; // Snapshot of merkle root at proposal creation
        mapping(address => bool) hasVoted;
        mapping(address => VoteType) votes;
    }

    /*///////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event ProposalCreated(
        uint256 indexed proposalId, address indexed proposer, uint256 startBlock, uint256 endBlock, bytes32 merkleRoot
    );

    event VoteCast(address indexed voter, uint256 indexed proposalId, VoteType voteType, uint256 votingPower);

    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCancelled(uint256 indexed proposalId);
    event MerkleRootUpdated(bytes32 indexed root, bytes32 ipfsHash);
    event QuorumUpdated(uint256 newQuorum);
    event VotingDelayUpdated(uint256 newDelay);
    event VotingPeriodUpdated(uint256 newPeriod);

    /*///////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/

    /// @notice Service manager for WAVS integration
    IWavsServiceManager private _serviceManager;

    /// @notice Current merkle root for voting power verification
    bytes32 public currentMerkleRoot;

    /// @notice IPFS hash for current merkle root metadata
    bytes32 public ipfsHash;

    /// @notice The optional ipfs hash CID containing metadata about the root (e.g. the merkle tree itself).
    string public ipfsHashCid;

    /// @notice Proposal counter
    uint256 public proposalCount;

    /// @notice Proposals mapping
    mapping(uint256 => Proposal) public proposals;

    /// @notice Proposal actions mapping
    mapping(uint256 => ProposalAction[]) public proposalActions;

    /// @notice Governance parameters
    uint256 public votingDelay = 1; // blocks
    uint256 public votingPeriod = 50400; // ~1 week at 12s blocks
    uint256 public quorum = 4e16; // 4%

    /// @notice Whether the module is initialized
    bool private _initialized;

    /*///////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor(address _owner, address _avatar, address _target, IWavsServiceManager serviceManager) {
        _setUp(_owner, _avatar, _target, serviceManager);
    }

    /// @notice Sets up the module for factory deployment
    function setUp(bytes memory initializeParams) public override {
        require(!_initialized, "Already initialized");

        (address _owner, address _avatar, address _target, IWavsServiceManager serviceManager) =
            abi.decode(initializeParams, (address, address, address, IWavsServiceManager));

        _setUp(_owner, _avatar, _target, serviceManager);
    }

    function _setUp(address _owner, address _avatar, address _target, IWavsServiceManager serviceManager) private {
        require(!_initialized, "Already initialized");
        _initialized = true;

        _transferOwnership(_owner);
        avatar = _avatar;
        target = _target;
        _serviceManager = serviceManager;
    }

    /*///////////////////////////////////////////////////////////////
                            PROPOSAL LOGIC
    //////////////////////////////////////////////////////////////*/

    /// @notice Create a new proposal
    /// @param targets Array of target addresses
    /// @param values Array of ETH values
    /// @param calldatas Array of encoded function calls
    /// @param operations Array of operation types
    /// @param description Proposal description
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        Operation[] memory operations,
        string memory description
    ) external returns (uint256 proposalId) {
        require(currentMerkleRoot != bytes32(0), "No merkle root set");
        require(
            targets.length == values.length && targets.length == calldatas.length && targets.length == operations.length,
            "Invalid proposal data"
        );
        require(targets.length > 0, "Empty proposal");

        proposalId = ++proposalCount;
        Proposal storage proposal = proposals[proposalId];

        proposal.id = proposalId;
        proposal.proposer = msg.sender;
        proposal.startBlock = block.number + votingDelay;
        proposal.endBlock = proposal.startBlock + votingPeriod;
        proposal.merkleRoot = currentMerkleRoot;

        // Store actions
        for (uint256 i = 0; i < targets.length; i++) {
            proposalActions[proposalId].push(
                ProposalAction({target: targets[i], value: values[i], data: calldatas[i], operation: operations[i]})
            );
        }

        emit ProposalCreated(proposalId, msg.sender, proposal.startBlock, proposal.endBlock, currentMerkleRoot);
    }

    /// @notice Cast a vote with merkle proof verification
    /// @param proposalId The proposal to vote on
    /// @param voteType The type of vote (Against, For, Abstain)
    /// @param votingPower The claimed voting power
    /// @param rewardToken Token address (part of merkle tree structure)
    /// @param proof Merkle proof for voting power
    function castVote(
        uint256 proposalId,
        VoteType voteType,
        uint256 votingPower,
        address rewardToken,
        bytes32[] calldata proof
    ) external {
        Proposal storage proposal = proposals[proposalId];
        require(state(proposalId) == ProposalState.Active, "Voting closed");
        require(!proposal.hasVoted[msg.sender], "Already voted");

        // Verify voting power with merkle proof
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(msg.sender, rewardToken, votingPower))));
        require(MerkleProof.verifyCalldata(proof, proposal.merkleRoot, leaf), "Invalid voting proof");

        // Record vote
        proposal.hasVoted[msg.sender] = true;
        proposal.votes[msg.sender] = voteType;

        if (voteType == VoteType.For) {
            proposal.forVotes += votingPower;
        } else if (voteType == VoteType.Against) {
            proposal.againstVotes += votingPower;
        } else {
            proposal.abstainVotes += votingPower;
        }

        emit VoteCast(msg.sender, proposalId, voteType, votingPower);
    }

    /// @notice Execute a successful proposal
    /// @param proposalId The proposal to execute
    function execute(uint256 proposalId) external {
        require(state(proposalId) == ProposalState.Succeeded, "Not succeeded");

        Proposal storage proposal = proposals[proposalId];
        proposal.executed = true;

        ProposalAction[] memory actions = proposalActions[proposalId];
        for (uint256 i = 0; i < actions.length; i++) {
            exec(actions[i].target, actions[i].value, actions[i].data, actions[i].operation);
        }

        emit ProposalExecuted(proposalId);
    }

    /// @notice Cancel a proposal
    /// @param proposalId The proposal to cancel
    function cancel(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(msg.sender == proposal.proposer || msg.sender == owner(), "Not authorized");
        require(!proposal.executed, "Already executed");

        proposal.cancelled = true;
        emit ProposalCancelled(proposalId);
    }

    /*///////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Get the state of a proposal
    function state(uint256 proposalId) public view returns (ProposalState) {
        Proposal storage proposal = proposals[proposalId];

        if (proposal.cancelled) return ProposalState.Cancelled;
        if (proposal.executed) return ProposalState.Executed;

        uint256 currentBlock = block.number;

        if (currentBlock < proposal.startBlock) return ProposalState.Pending;
        if (currentBlock <= proposal.endBlock) return ProposalState.Active;

        // Check if proposal succeeded
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
        if (totalVotes >= quorum && proposal.forVotes > proposal.againstVotes) {
            return ProposalState.Succeeded;
        }

        return ProposalState.Defeated;
    }

    /// @notice Get proposal actions
    function getActions(uint256 proposalId) external view returns (ProposalAction[] memory) {
        return proposalActions[proposalId];
    }

    /// @notice Check if an address has voted
    function hasVoted(uint256 proposalId, address account) external view returns (bool) {
        return proposals[proposalId].hasVoted[account];
    }

    /*///////////////////////////////////////////////////////////////
                            ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Update quorum requirement
    function setQuorum(uint256 newQuorum) external onlyOwner {
        require(newQuorum > 0 && newQuorum <= 1e18, "Invalid quorum");
        quorum = newQuorum;
        emit QuorumUpdated(newQuorum);
    }

    /// @notice Update voting delay
    function setVotingDelay(uint256 newDelay) external onlyOwner {
        votingDelay = newDelay;
        emit VotingDelayUpdated(newDelay);
    }

    /// @notice Update voting period
    function setVotingPeriod(uint256 newPeriod) external onlyOwner {
        require(newPeriod > 0, "Invalid period");
        votingPeriod = newPeriod;
        emit VotingPeriodUpdated(newPeriod);
    }

    /*///////////////////////////////////////////////////////////////
                          WAVS INTEGRATION
    //////////////////////////////////////////////////////////////*/

    /// @inheritdoc IWavsServiceHandler
    function handleSignedEnvelope(Envelope calldata envelope, SignatureData calldata signatureData) external {
        _serviceManager.validate(envelope, signatureData);

        // Decode payload
        ITypes.DataWithId memory dataWithId = abi.decode(envelope.payload, (ITypes.DataWithId));
        ITypes.AvsOutput memory avsOutput = abi.decode(dataWithId.data, (ITypes.AvsOutput));

        // Update merkle root
        currentMerkleRoot = avsOutput.root;
        ipfsHash = avsOutput.ipfsHashData;
        ipfsHashCid = avsOutput.ipfsHash;

        emit MerkleRootUpdated(avsOutput.root, avsOutput.ipfsHashData);
    }
}
