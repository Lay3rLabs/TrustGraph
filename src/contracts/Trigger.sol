// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

/// @title EASAttestTrigger
/// @notice Simplified trigger contract for WAVS EAS testing
/// @dev This contract allows direct attestation data submission to WAVS for testing
contract EASAttestTrigger {
    /// @notice EAS Attested event that WAVS component expects
    event AttestedEvent(address indexed recipient, address indexed attester, bytes32 uid, bytes32 indexed schema_uid);

    /// @notice Event for direct attestation requests (no wrapper events)
    /// @param creator Address requesting the attestation
    /// @param schema Schema UID for the attestation
    /// @param recipient Recipient of the attestation
    /// @param data Attestation data
    event AttestationRequested(address indexed creator, bytes32 indexed schema, address indexed recipient, bytes data);

    /// @notice Creates an attestation trigger with JSON data
    /// @param schema The schema UID for the attestation
    /// @param recipient The recipient address (use zero address for no specific recipient)
    /// @param data The attestation data as string
    function triggerRequestAttestation(bytes32 schema, address recipient, string calldata data) external {
        // Just emit the event with the string data as bytes
        emit AttestationRequested(msg.sender, schema, recipient, bytes(data));
    }

    /// @notice Creates an attestation trigger with raw bytes data
    /// @param data Raw attestation data (will use component defaults)
    function triggerRequestRawAttestation(bytes32 schema, address recipient, bytes calldata data) external {
        // Emit AttestedEvent with default values for raw data
        emit AttestationRequested(msg.sender, schema, recipient, data);
    }
}
