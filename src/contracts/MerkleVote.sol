// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ITypes} from "interfaces/ITypes.sol";
import {IWavsServiceManager} from "@wavs/interfaces/IWavsServiceManager.sol";
import {IWavsServiceHandler} from "@wavs/interfaces/IWavsServiceHandler.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

// TODO rename to weights
/**
 * @title MerkleVote
 * @notice Merkle-based voting power verification contract with WAVS integration
 * @dev Similar to RewardDistributor but for voting power verification instead of token distribution
 */
contract MerkleVote is IWavsServiceHandler {
    /*///////////////////////////////////////////////////////////////
                                TYPES
    //////////////////////////////////////////////////////////////*/

    struct PendingRoot {
        bytes32 root;
        bytes32 ipfsHash;
        uint256 validAt;
    }

    struct VotingSnapshot {
        bytes32 root;
        bytes32 ipfsHash;
        uint256 blockNumber;
        uint256 timestamp;
    }

    /*///////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event VotingPowerVerified(address indexed account, uint256 indexed proposalId, uint256 votingPower);

    event SnapshotCreated(uint256 indexed snapshotId, bytes32 root, bytes32 ipfsHash, uint256 blockNumber);

    event PendingRootSet(address indexed updater, bytes32 newRoot, bytes32 newIpfsHash);

    event PendingRootRevoked(address indexed updater);

    event RootSet(bytes32 root, bytes32 ipfsHash);

    event OwnerSet(address newOwner);

    event TimelockSet(uint256 newTimelock);

    event RootUpdaterSet(address updater, bool active);

    /*///////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/

    /// @notice Service manager instance
    IWavsServiceManager private _serviceManager;

    /// @notice The current merkle root for voting power verification
    bytes32 public root;

    /// @notice The optional ipfs hash containing metadata about the root
    bytes32 public ipfsHash;

    /// @notice The optional ipfs hash CID containing metadata about the root
    string public ipfsHashCid;

    /// @notice The address that can update the distribution parameters
    address public owner;

    /// @notice The addresses that can update the merkle root
    mapping(address => bool) public isUpdater;

    /// @notice The timelock related to root updates
    uint256 public timelock;

    /// @notice The pending root of the distribution
    PendingRoot public pendingRoot;

    /// @notice Counter for snapshot IDs
    uint256 public nextSnapshotId;

    /// @notice Mapping of snapshot ID to voting snapshots
    mapping(uint256 => VotingSnapshot) public snapshots;

    /// @notice Track which merkle root was used when an account voted on a proposal
    mapping(address => mapping(uint256 => bytes32)) public votingRootUsed;

    /// @notice Track verified voting power for account on specific proposals
    mapping(address => mapping(uint256 => uint256)) public verifiedVotingPower;

    /*///////////////////////////////////////////////////////////////
                                MODIFIERS
    //////////////////////////////////////////////////////////////*/

    modifier onlyOwner() {
        require(msg.sender == owner, "NOT_OWNER");
        _;
    }

    modifier onlyUpdaterRole() {
        require(isUpdater[msg.sender] || msg.sender == owner, "NOT_UPDATER_ROLE");
        _;
    }

    /*///////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor(IWavsServiceManager serviceManager, address initialOwner, uint256 initialTimelock) {
        _serviceManager = serviceManager;
        _setOwner(initialOwner);
        _setTimelock(initialTimelock);
    }

    /*///////////////////////////////////////////////////////////////
                          VOTING POWER LOGIC
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Verify voting power for a specific proposal using Merkle proof
     * @param account The address to verify voting power for
     * @param proposalId The proposal ID to vote on
     * @param rewardToken The reward token address (part of merkle tree structure)
     * @param votingPower The claimed voting power (claimable amount in tree)
     * @param proof The merkle proof that validates this claim
     * @return verified Whether the voting power was successfully verified
     */
    function verifyVotingPower(
        address account,
        uint256 proposalId,
        address rewardToken,
        uint256 votingPower,
        bytes32[] calldata proof
    ) external returns (bool verified) {
        require(root != bytes32(0), "ROOT_NOT_SET");
        require(account != address(0), "INVALID_ACCOUNT");

        // Check if already voted on this proposal with current root
        require(votingRootUsed[account][proposalId] != root, "ALREADY_VOTED_WITH_CURRENT_ROOT");

        // Verify merkle proof - matching RewardDistributor leaf structure
        // Leaf: keccak256(abi.encode(account, reward, claimable))
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(account, rewardToken, votingPower))));

        require(MerkleProof.verifyCalldata(proof, root, leaf), "INVALID_PROOF");

        // Track which root was used for this vote and store verified power
        votingRootUsed[account][proposalId] = root;
        verifiedVotingPower[account][proposalId] = votingPower;

        emit VotingPowerVerified(account, proposalId, votingPower);

        return true;
    }

    /**
     * @notice Get verified voting power for an account on a specific proposal
     * @param account The account to check
     * @param proposalId The proposal ID
     * @return power The verified voting power (0 if not verified)
     */
    function getVerifiedVotingPower(address account, uint256 proposalId) external view returns (uint256 power) {
        return verifiedVotingPower[account][proposalId];
    }

    /**
     * @notice Check if an account has voted on a proposal with the current root
     * @param account The account to check
     * @param proposalId The proposal ID
     * @return voted Whether the account has voted with current root
     */
    function hasVoted(address account, uint256 proposalId) external view returns (bool voted) {
        return votingRootUsed[account][proposalId] == root;
    }

    /*///////////////////////////////////////////////////////////////
                          SNAPSHOT MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Create a new voting power snapshot
     * @param snapshotRoot The merkle root for this snapshot
     * @param snapshotIpfsHash The IPFS hash for this snapshot
     * @return snapshotId The ID of the created snapshot
     */
    function createSnapshot(bytes32 snapshotRoot, bytes32 snapshotIpfsHash)
        external
        onlyUpdaterRole
        returns (uint256 snapshotId)
    {
        snapshotId = nextSnapshotId++;

        snapshots[snapshotId] = VotingSnapshot({
            root: snapshotRoot,
            ipfsHash: snapshotIpfsHash,
            blockNumber: block.number,
            timestamp: block.timestamp
        });

        emit SnapshotCreated(snapshotId, snapshotRoot, snapshotIpfsHash, block.number);
    }

    /**
     * @notice Get snapshot details by ID
     * @param snapshotId The snapshot ID
     * @return snapshot The voting snapshot data
     */
    function getSnapshot(uint256 snapshotId) external view returns (VotingSnapshot memory snapshot) {
        return snapshots[snapshotId];
    }

    /*///////////////////////////////////////////////////////////////
                            ROOT MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Submits a new merkle root
     * @param newRoot The new merkle root
     * @param newIpfsHash The optional ipfs hash containing metadata about the root
     */
    function submitRoot(bytes32 newRoot, bytes32 newIpfsHash) external onlyUpdaterRole {
        require(newRoot != pendingRoot.root || newIpfsHash != pendingRoot.ipfsHash, "ALREADY_PENDING");

        pendingRoot = PendingRoot({root: newRoot, ipfsHash: newIpfsHash, validAt: block.timestamp + timelock});

        emit PendingRootSet(msg.sender, newRoot, newIpfsHash);
    }

    /**
     * @notice Accepts and sets the current pending merkle root
     */
    function acceptRoot() external {
        require(pendingRoot.validAt != 0, "NO_PENDING_ROOT");
        require(block.timestamp >= pendingRoot.validAt, "TIMELOCK_NOT_EXPIRED");

        _setRoot(pendingRoot.root, pendingRoot.ipfsHash);
    }

    /**
     * @notice Revokes the pending root
     */
    function revokePendingRoot() external onlyUpdaterRole {
        require(pendingRoot.validAt != 0, "NO_PENDING_ROOT");

        delete pendingRoot;

        emit PendingRootRevoked(msg.sender);
    }

    /**
     * @notice Forces update the root (bypassing the timelock)
     * @param newRoot The new merkle root
     * @param newIpfsHash The optional ipfs hash containing metadata about the root
     */
    function setRoot(bytes32 newRoot, bytes32 newIpfsHash) external onlyUpdaterRole {
        require(newRoot != root || newIpfsHash != ipfsHash, "ALREADY_SET");
        require(timelock == 0 || msg.sender == owner, "UNAUTHORIZED_ROOT_CHANGE");

        _setRoot(newRoot, newIpfsHash);
    }

    /*///////////////////////////////////////////////////////////////
                            ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Sets the timelock
     * @param newTimelock The new timelock
     */
    function setTimelock(uint256 newTimelock) external onlyOwner {
        require(newTimelock != timelock, "ALREADY_SET");
        _setTimelock(newTimelock);
    }

    /**
     * @notice Sets the root updater
     * @param updater The address of the root updater
     * @param active Whether the root updater should be active or not
     */
    function setRootUpdater(address updater, bool active) external onlyOwner {
        require(isUpdater[updater] != active, "ALREADY_SET");

        isUpdater[updater] = active;

        emit RootUpdaterSet(updater, active);
    }

    /**
     * @notice Sets the owner
     * @param newOwner The new owner address
     */
    function setOwner(address newOwner) external onlyOwner {
        require(newOwner != owner, "ALREADY_SET");
        _setOwner(newOwner);
    }

    /*///////////////////////////////////////////////////////////////
                            WAVS INTEGRATION
    //////////////////////////////////////////////////////////////*/

    /// @inheritdoc IWavsServiceHandler
    function handleSignedEnvelope(Envelope calldata envelope, SignatureData calldata signatureData) external {
        _serviceManager.validate(envelope, signatureData);

        // Decode the payload to get the AVS output
        ITypes.AvsOutput memory avsOutput = abi.decode(envelope.payload, (ITypes.AvsOutput));

        _setRoot(avsOutput.root, avsOutput.ipfsHashData);
        ipfsHashCid = avsOutput.ipfsHash;
    }

    /*///////////////////////////////////////////////////////////////
                            INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function _setRoot(bytes32 newRoot, bytes32 newIpfsHash) internal {
        root = newRoot;
        ipfsHash = newIpfsHash;

        delete pendingRoot;

        emit RootSet(newRoot, newIpfsHash);
    }

    function _setOwner(address newOwner) internal {
        owner = newOwner;
        emit OwnerSet(newOwner);
    }

    function _setTimelock(uint256 newTimelock) internal {
        timelock = newTimelock;
        emit TimelockSet(newTimelock);
    }
}
