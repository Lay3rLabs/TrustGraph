// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {EASAttestTrigger} from "contracts/Trigger.sol";
import {IEAS} from "@ethereum-attestation-service/eas-contracts/contracts/IEAS.sol";
import {Indexer} from "@ethereum-attestation-service/eas-contracts/contracts/Indexer.sol";
import {Attestation} from "@ethereum-attestation-service/eas-contracts/contracts/Common.sol";
import {ITypes} from "interfaces/ITypes.sol";
import {Common} from "script/Common.s.sol";
import {console} from "forge-std/console.sol";

/// @title EasTrigger
/// @notice Comprehensive script for EAS attestation operations via WAVS
/// @dev Consolidates all EAS trigger and query functionality
contract EasTrigger is Common {
    // ============================================================
    // TRIGGER FUNCTIONS
    // ============================================================

    /// @notice Trigger attestation creation with JSON format using new contract method
    /// @param triggerAddr Address of the EAS attest trigger contract
    /// @param schema Schema UID (hex string)
    /// @param recipient Recipient address (hex string, use 0x0 for no specific recipient)
    /// @param data Attestation data string
    function triggerJsonAttestation(
        string calldata triggerAddr,
        string calldata schema,
        string calldata recipient,
        string calldata data
    ) public {
        vm.startBroadcast(_privateKey);

        EASAttestTrigger trigger = EASAttestTrigger(
            vm.parseAddress(triggerAddr)
        );

        bytes32 schemaBytes = bytes32(vm.parseBytes(schema));
        address recipientAddr = vm.parseAddress(recipient);

        console.log("Creating EAS attestation trigger:");
        console.log("Schema:", schema);
        console.log("Recipient:", recipient);
        console.log("Data:", data);

        trigger.triggerRequestAttestation(schemaBytes, recipientAddr, data);

        vm.stopBroadcast();
    }

    /// @notice Trigger attestation creation with raw data
    /// @param triggerAddr Address of the EAS attest trigger contract
    /// @param rawData Raw attestation data (will use component defaults)
    function triggerRawAttestation(
        string calldata triggerAddr,
        string calldata schema,
        string calldata recipient,
        string calldata rawData
    ) public {
        vm.startBroadcast(_privateKey);

        EASAttestTrigger trigger = EASAttestTrigger(
            vm.parseAddress(triggerAddr)
        );

        console.log("Creating raw EAS attestation trigger:");
        console.log("Data:", rawData);

        trigger.triggerRequestRawAttestation(
            vm.parseBytes32(schema),
            vm.parseAddress(recipient),
            bytes(rawData)
        );

        vm.stopBroadcast();
    }

    // ============================================================
    // QUERY FUNCTIONS
    // ============================================================

    /// @notice Query EAS attestations for a specific schema and recipient using Indexer
    /// @param indexerAddr The Indexer contract address
    /// @param easAddr The EAS contract address
    /// @param schemaId The schema UID to query
    /// @param recipient The recipient address (use address(0) for all attestations to schema)
    /// @param maxResults Maximum number of results to return (default 10)
    function queryAttestations(
        string calldata indexerAddr,
        string calldata easAddr,
        string calldata schemaId,
        string calldata recipient,
        uint256 maxResults
    ) public view {
        Indexer indexer = Indexer(vm.parseAddress(indexerAddr));
        IEAS eas = IEAS(vm.parseAddress(easAddr));
        bytes32 schemaUID = vm.parseBytes32(schemaId);
        address recipientAddr = vm.parseAddress(recipient);

        console.log("Querying EAS attestations via Indexer:");
        console.log("  Indexer Address:", indexerAddr);
        console.log("  EAS Address:", easAddr);
        console.log("  Schema ID:", schemaId);
        console.log("  Recipient:", recipient);
        console.log("  Max Results:", maxResults);
        console.log("");

        bytes32[] memory attestationUIDs;
        uint256 totalCount;

        // Query based on whether recipient is specified
        if (recipientAddr == address(0)) {
            // Get all attestations for the schema
            totalCount = indexer.getSchemaAttestationUIDCount(schemaUID);
            console.log("Total attestations for schema:", totalCount);

            if (totalCount > 0) {
                attestationUIDs = indexer.getSchemaAttestationUIDs(
                    schemaUID,
                    0, // start from beginning
                    maxResults > totalCount ? totalCount : maxResults,
                    true // reverse order (newest first)
                );
            }
        } else {
            // Get attestations received by specific recipient
            totalCount = indexer.getReceivedAttestationUIDCount(
                recipientAddr,
                schemaUID
            );
            console.log(
                "Total attestations received by recipient:",
                totalCount
            );

            if (totalCount > 0) {
                attestationUIDs = indexer.getReceivedAttestationUIDs(
                    recipientAddr,
                    schemaUID,
                    0, // start from beginning
                    maxResults > totalCount ? totalCount : maxResults,
                    true // reverse order (newest first)
                );
            }
        }

        // Display attestation details
        if (attestationUIDs.length > 0) {
            console.log("Found", attestationUIDs.length, "attestation(s):");
            console.log("");

            for (uint256 i = 0; i < attestationUIDs.length; i++) {
                _displayAttestation(eas, attestationUIDs[i], i + 1);
            }
        } else {
            console.log("No attestations found for the given criteria.");
        }
    }

    /// @notice Query EAS attestations with default maxResults of 10
    /// @param indexerAddr The Indexer contract address
    /// @param easAddr The EAS contract address
    /// @param schemaId The schema UID to query
    /// @param recipient The recipient address (use address(0) for all attestations to schema)
    function queryAttestations(
        string calldata indexerAddr,
        string calldata easAddr,
        string calldata schemaId,
        string calldata recipient
    ) public view {
        queryAttestations(indexerAddr, easAddr, schemaId, recipient, 10);
    }

    /// @notice Query EAS attestations sent by a specific attester
    /// @param indexerAddr The Indexer contract address
    /// @param easAddr The EAS contract address
    /// @param schemaId The schema UID to query
    /// @param attester The attester address
    /// @param maxResults Maximum number of results to return
    function queryAttestationsByAttester(
        string calldata indexerAddr,
        string calldata easAddr,
        string calldata schemaId,
        string calldata attester,
        uint256 maxResults
    ) public view {
        Indexer indexer = Indexer(vm.parseAddress(indexerAddr));
        IEAS eas = IEAS(vm.parseAddress(easAddr));
        bytes32 schemaUID = vm.parseBytes32(schemaId);
        address attesterAddr = vm.parseAddress(attester);

        console.log("Querying EAS attestations by attester via Indexer:");
        console.log("  Indexer Address:", indexerAddr);
        console.log("  EAS Address:", easAddr);
        console.log("  Schema ID:", schemaId);
        console.log("  Attester:", attester);
        console.log("  Max Results:", maxResults);
        console.log("");

        // Get attestations sent by specific attester
        uint256 totalCount = indexer.getSentAttestationUIDCount(
            attesterAddr,
            schemaUID
        );
        console.log("Total attestations sent by attester:", totalCount);

        bytes32[] memory attestationUIDs;
        if (totalCount > 0) {
            attestationUIDs = indexer.getSentAttestationUIDs(
                attesterAddr,
                schemaUID,
                0, // start from beginning
                maxResults > totalCount ? totalCount : maxResults,
                true // reverse order (newest first)
            );
        }

        // Display attestation details
        if (attestationUIDs.length > 0) {
            console.log("Found", attestationUIDs.length, "attestation(s):");
            console.log("");

            for (uint256 i = 0; i < attestationUIDs.length; i++) {
                _displayAttestation(eas, attestationUIDs[i], i + 1);
            }
        } else {
            console.log("No attestations found for the given criteria.");
        }
    }

    /// @notice Query EAS attestations sent by attester with default maxResults of 10
    /// @param indexerAddr The Indexer contract address
    /// @param easAddr The EAS contract address
    /// @param schemaId The schema UID to query
    /// @param attester The attester address
    function queryAttestationsByAttester(
        string calldata indexerAddr,
        string calldata easAddr,
        string calldata schemaId,
        string calldata attester
    ) public view {
        queryAttestationsByAttester(
            indexerAddr,
            easAddr,
            schemaId,
            attester,
            10
        );
    }

    /// @notice Helper function to display attestation details
    /// @param eas The EAS contract instance
    /// @param attestationUID The attestation UID to display
    /// @param index The display index for numbering
    function _displayAttestation(
        IEAS eas,
        bytes32 attestationUID,
        uint256 index
    ) internal view {
        try eas.getAttestation(attestationUID) returns (
            Attestation memory att
        ) {
            console.log("--- Attestation", index, "---");
            console.log("UID:", vm.toString(attestationUID));
            console.log("Schema:", vm.toString(att.schema));
            console.log("Attester:", vm.toString(att.attester));
            console.log("Recipient:", vm.toString(att.recipient));
            console.log("Time:", att.time);
            console.log(
                "Expiration:",
                att.expirationTime == 0
                    ? "Never"
                    : vm.toString(att.expirationTime)
            );
            console.log("Revocable:", att.revocable ? "Yes" : "No");
            console.log("Revoked:", att.revocationTime > 0 ? "Yes" : "No");
            if (att.refUID != bytes32(0)) {
                console.log("Reference UID:", vm.toString(att.refUID));
            }
            if (att.data.length > 0) {
                console.log("Data (", att.data.length, "bytes):");
                // Try to display as string if it looks like text
                if (_isValidString(att.data)) {
                    console.log("  String:", string(att.data));
                } else {
                    console.log("  Hex:", vm.toString(att.data));
                }
            }
            console.log("");
        } catch {
            console.log("--- Attestation", index, "---");
            console.log("UID:", vm.toString(attestationUID));
            console.log("ERROR: Unable to retrieve attestation details");
            console.log("");
        }
    }

    /// @notice Helper to check if bytes data represents a valid string
    /// @param data The bytes data to check
    /// @return true if data appears to be a valid UTF-8 string
    function _isValidString(bytes memory data) internal pure returns (bool) {
        if (data.length == 0) return true;

        // Simple heuristic: check if all bytes are printable ASCII (32-126) or common whitespace
        for (uint256 i = 0; i < data.length && i < 100; i++) {
            // Check first 100 bytes max
            uint8 b = uint8(data[i]);
            if (!(b >= 32 && b <= 126) && b != 9 && b != 10 && b != 13) {
                // Not printable or tab/newline/CR
                return false;
            }
        }
        return true;
    }

    /// @notice Show attestation details by UID
    /// @param easAddr The EAS contract address
    /// @param attestationUid The attestation UID
    function showAttestation(
        string calldata easAddr,
        string calldata attestationUid
    ) public view {
        IEAS eas = IEAS(vm.parseAddress(easAddr));
        bytes32 uid = vm.parseBytes32(attestationUid);

        try eas.getAttestation(uid) returns (Attestation memory att) {
            console.log("Attestation Details:");
            console.log("  UID:", attestationUid);
            console.log("  Schema:", vm.toString(att.schema));
            console.log("  Recipient:", vm.toString(att.recipient));
            console.log("  Attester:", vm.toString(att.attester));
            console.log("  Time:", att.time);
            console.log("  Expiration:", att.expirationTime);
            console.log("  Revocable:", att.revocable);
            console.log("  Ref UID:", vm.toString(att.refUID));
            console.log("  Data Length:", att.data.length);
            if (att.data.length > 0) {
                console.log("  Data:", string(att.data));
            }
        } catch {
            console.log(
                "Attestation not found or invalid UID:",
                attestationUid
            );
        }
    }
}
