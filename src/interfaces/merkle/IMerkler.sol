// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/// @title IMerkler
/// @notice Types for the merkler AVS.
interface IMerkler {
    /**
     * @notice Struct to store merkler AVS output
     * @param triggerId Unique identifier for the trigger (if manually triggered)
     * @param cronNanos Cron nanoseconds (if triggered by cron)
     * @param root Root of the merkle tree
     * @param ipfsHash IPFS hash of the merkle tree
     * @param ipfsHashCid IPFS hash CID of the merkle tree
     */
    struct MerklerAvsOutput {
        uint64 triggerId;
        uint64 cronNanos;
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
