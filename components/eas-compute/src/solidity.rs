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
    /// @notice A struct representing ECDSA signature data.
    struct Signature {
        uint8 v; // The recovery ID.
        bytes32 r; // The x-coordinate of the nonce R.
        bytes32 s; // The signature data.
    }

    /// @notice A struct representing a single attestation.
    struct Attestation {
        bytes32 uid; // A unique identifier of the attestation.
        bytes32 schema; // The unique identifier of the schema.
        uint64 time; // The time when the attestation was created (Unix timestamp).
        uint64 expirationTime; // The time when the attestation expires (Unix timestamp).
        uint64 revocationTime; // The time when the attestation was revoked (Unix timestamp).
        bytes32 refUID; // The UID of the related attestation.
        address recipient; // The recipient of the attestation.
        address attester; // The attester/sender of the attestation.
        bool revocable; // Whether the attestation is revocable.
        bytes data; // Custom attestation data.
    }

    /// @notice Emitted when an attestation has been made.
    /// @param recipient The recipient of the attestation.
    /// @param attester The attesting account.
    /// @param uid The UID of the new attestation.
    /// @param schemaUID The UID of the schema.
    event Attested(address indexed recipient, address indexed attester, bytes32 uid, bytes32 indexed schemaUID);

    /// @notice Emitted when an attestation has been revoked.
    /// @param recipient The recipient of the attestation.
    /// @param attester The attesting account.
    /// @param schemaUID The UID of the schema.
    /// @param uid The UID the revoked attestation.
    event Revoked(address indexed recipient, address indexed attester, bytes32 uid, bytes32 indexed schemaUID);

    /// @notice Emitted when an attestation has been indexed.
    /// @param uid The UID the attestation.
    event Indexed(bytes32 indexed uid);
}

// VotingPower payload structures matching the Solidity contract
sol! {
    enum OperationType {
        MINT,     // 0
        BURN,     // 1
        TRANSFER, // 2
        DELEGATE  // 3
    }

    struct Operation {
        OperationType operationType;
        address account;
        address target;
        uint256 amount;
    }

    struct VotingPowerPayload {
        Operation[] operations;
    }
}
