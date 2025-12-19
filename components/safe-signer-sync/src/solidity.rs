/// Private module containing Solidity type definitions
///
/// The `sol!` macro from alloy_sol_macro reads a Solidity interface file
/// and generates corresponding Rust types and encoding/decoding functions.
///
/// In this case, it reads "../../src/interfaces/ITypes.sol" which defines:
/// - NewTrigger event
/// - TriggerInfo struct
/// - DataWithId struct
///
/// Documentation:
/// - <https://docs.rs/alloy-sol-macro/latest/alloy_sol_macro/macro.sol.html>
/// (You can also just sol! arbitrary solidity types like `event` or `struct` too)
use alloy_sol_macro::sol;

sol! {
    // Emitted on a MerkleSnapshot contract when a merkle root has been updated
    event MerkleRootUpdated(bytes32 indexed root, bytes32 ipfsHash, string ipfsHashCid, uint256 totalValue);

    /// @dev Operation types for signer management
    enum OperationType {
        ADD_SIGNER, // 0 - Add a new signer with threshold
        REMOVE_SIGNER, // 1 - Remove a signer with threshold
        SWAP_SIGNER, // 2 - Swap an existing signer with a new one
        CHANGE_THRESHOLD // 3 - Change only the threshold
    }

    /// @dev Single signer management operation
    struct SignerOperation {
        OperationType operationType; // The operation to perform
        address prevSigner; // Previous signer in linked list (for remove/swap)
        address signer; // The signer address (to add/remove/swap)
        address newSigner; // New signer address (for swap only)
        uint256 threshold; // New threshold (0 means no change)
    }

    /// @dev Main payload structure for WAVS envelope
    struct SignerManagerPayload {
        SignerOperation[] operations; // Array of operations to execute
    }

    interface ISignerSyncManagerModule {
        function getSigners() public view returns (address[] memory);
    }
}
