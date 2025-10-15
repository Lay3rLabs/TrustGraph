// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/// @title IMerkleSnapshot
/// @notice Types for the MerkleSnapshot contract.
interface IMerkleSnapshot {
    error NoMerkleStates();
    error NoMerkleStateAtBlock(uint256 requested, uint256 firstBlock);
    error NoMerkleStateAtIndex(uint256 requested, uint256 total);

    error HookAlreadyAdded();
    error HookNotAdded();

    event MerkleRootUpdated(
        bytes32 indexed root,
        bytes32 ipfsHash,
        string ipfsHashCid,
        uint256 totalValue
    );

    struct MerkleState {
        /// @notice The block number the merkle tree was set at
        uint256 blockNumber;
        /// @notice The timestamp the merkle tree was set at
        uint256 timestamp;
        /// @notice The root of the merkle tree
        bytes32 root;
        /// @notice The IPFS hash of the merkle tree
        bytes32 ipfsHash;
        /// @notice The IPFS hash CID of the merkle tree
        string ipfsHashCid;
        /// @notice The total value of the merkle tree
        uint256 totalValue;
    }
}
