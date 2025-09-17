// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/// @title IMerkleSnapshot
/// @notice Types for the MerkleSnapshot contract.
interface IMerkleSnapshot {
    error NoMerkleStates();
    error NoMerkleStateAtBlock(uint256 requested, uint256 firstBlock);
    error NoMerkleStateAtIndex(uint256 requested, uint256 total);

    error InvalidCronTimestamp(uint64 given, uint64 last);
    error InvalidTriggerId(uint64 actual, uint64 expected);

    error HookAlreadyAdded();
    error HookNotAdded();

    event MerkleRootUpdated(bytes32 indexed root, bytes32 ipfsHash, string ipfsHashCid);

    struct MerkleState {
        /// @notice The block number the merkle tree was set at
        uint256 blockNumber;
        /// @notice The root of the merkle tree
        bytes32 root;
        /// @notice The IPFS hash of the merkle tree
        bytes32 ipfsHash;
        /// @notice The IPFS hash CID of the merkle tree
        string ipfsHashCid;
    }
}
