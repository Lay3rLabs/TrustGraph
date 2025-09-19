// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/// @title IMerkler
/// @notice Types for the merkler AVS.
interface IMerkler {
    /**
     * @notice Struct to store merkler AVS output
     * @param expiresAt Expiration time of the payload.
     * @param prune The number of expired envelopes to prune. If greater than 0, pruning will be done and no merkle root update will be done.
     * @param root Root of the merkle tree.
     * @param ipfsHash IPFS hash of the merkle tree.
     * @param ipfsHashCid IPFS hash CID of the merkle tree.
     */
    struct MerklerAvsOutput {
        uint256 expiresAt;
        uint256 prune;
        bytes32 root;
        bytes32 ipfsHash;
        string ipfsHashCid;
    }

    /**
     * @notice Event emitted when a new trigger is created
     * @param triggerId Unique identifier for the trigger
     */
    event MerklerTrigger(uint64 triggerId);
}
