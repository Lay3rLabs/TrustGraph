// SPDX-License-Identifier: MIT

pragma solidity 0.8.27;

import {
    IEAS,
    AttestationRequest,
    AttestationRequestData,
    RevocationRequest,
    RevocationRequestData,
    MultiAttestationRequest,
    MultiRevocationRequest
} from "@ethereum-attestation-service/eas-contracts/contracts/IEAS.sol";
import {NO_EXPIRATION_TIME, EMPTY_UID} from "@ethereum-attestation-service/eas-contracts/contracts/Common.sol";
import {IWavsServiceManager} from "@wavs/interfaces/IWavsServiceManager.sol";
import {IWavsServiceHandler} from "@wavs/interfaces/IWavsServiceHandler.sol";
import {ITypes} from "../interfaces/ITypes.sol";

/// @title Attester
/// @notice Ethereum Attestation Service - Example that integrates with WAVS
contract Attester is IWavsServiceHandler {
    error InvalidEAS();
    error InvalidInput();
    error InvalidServiceManager();

    // The address of the global EAS contract.
    IEAS private immutable _eas;

    // The WAVS service manager instance
    IWavsServiceManager private immutable _serviceManager;

    /// @notice Creates a new Attester instance.
    /// @param eas The address of the global EAS contract.
    /// @param serviceManager The address of the WAVS service manager.
    constructor(IEAS eas, IWavsServiceManager serviceManager) {
        if (address(eas) == address(0)) {
            revert InvalidEAS();
        }
        if (address(serviceManager) == address(0)) {
            revert InvalidServiceManager();
        }

        _eas = eas;
        _serviceManager = serviceManager;
    }

    /// @inheritdoc IWavsServiceHandler
    /// @notice Handles signed envelope from WAVS and creates an attestation
    /// @param envelope The envelope containing the attestation data
    /// @param signatureData The signature data for validation
    function handleSignedEnvelope(Envelope calldata envelope, SignatureData calldata signatureData) external {
        // Validate the envelope signature through the service manager
        _serviceManager.validate(envelope, signatureData);

        // Decode the payload to get the attestation request
        AttestationRequest memory request = abi.decode(envelope.payload, (AttestationRequest));

        // Make the attestation
        _eas.attest(request);
    }

    /// @notice Attests to a schema with generic data.
    /// @param schema The schema UID to attest to.
    /// @param recipient The recipient of the attestation (use address(0) for no recipient).
    /// @param data The encoded data to include in the attestation.
    /// @return The UID of the new attestation.
    function attest(bytes32 schema, address recipient, bytes calldata data) external returns (bytes32) {
        return _eas.attest(
            AttestationRequest({
                schema: schema,
                data: AttestationRequestData({
                    recipient: recipient,
                    expirationTime: NO_EXPIRATION_TIME, // No expiration time
                    revocable: true,
                    refUID: EMPTY_UID, // No referenced UID
                    data: data, // Use the provided data directly
                    value: 0 // No value/ETH
                })
            })
        );
    }

    /// @notice Revokes an attestation.
    /// @param schema The schema UID of the attestation.
    /// @param uid The UID of the attestation to revoke.
    function revoke(bytes32 schema, bytes32 uid) external {
        _eas.revoke(RevocationRequest({schema: schema, data: RevocationRequestData({uid: uid, value: 0})}));
    }

    /// @notice Multi-attests to schemas with generic data.
    /// @param schemas The schema UIDs to attest to.
    /// @param recipients The recipients for each schema's attestations.
    /// @param schemaData The encoded data for each schema's attestations.
    /// @return The UIDs of new attestations.
    function multiAttest(bytes32[] calldata schemas, address[][] calldata recipients, bytes[][] calldata schemaData)
        external
        returns (bytes32[] memory)
    {
        uint256 schemaLength = schemas.length;
        if (schemaLength == 0 || schemaLength != recipients.length || schemaLength != schemaData.length) {
            revert InvalidInput();
        }

        MultiAttestationRequest[] memory multiRequests = new MultiAttestationRequest[](schemaLength);

        for (uint256 i = 0; i < schemaLength; ++i) {
            multiRequests[i] = _buildMultiAttestationRequest(schemas[i], recipients[i], schemaData[i]);
        }

        return _eas.multiAttest(multiRequests);
    }

    /// @notice Internal helper to build a MultiAttestationRequest
    /// @param schema The schema UID
    /// @param schemaRecipients The recipients for this schema
    /// @param schemaDataItems The data items for this schema
    /// @return The MultiAttestationRequest
    function _buildMultiAttestationRequest(
        bytes32 schema,
        address[] calldata schemaRecipients,
        bytes[] calldata schemaDataItems
    ) internal pure returns (MultiAttestationRequest memory) {
        uint256 dataLength = schemaDataItems.length;
        if (dataLength == 0 || dataLength != schemaRecipients.length) {
            revert InvalidInput();
        }

        AttestationRequestData[] memory data = new AttestationRequestData[](dataLength);

        for (uint256 j = 0; j < dataLength; ++j) {
            data[j] = AttestationRequestData({
                recipient: schemaRecipients[j],
                expirationTime: NO_EXPIRATION_TIME,
                revocable: true,
                refUID: EMPTY_UID,
                data: schemaDataItems[j],
                value: 0
            });
        }

        return MultiAttestationRequest({schema: schema, data: data});
    }

    /// @notice Multi-revokes attestations.
    /// @param schemas The schema UIDs of the attestations to revoke.
    /// @param schemaUids The UIDs of the attestations to revoke for each schema.
    function multiRevoke(bytes32[] calldata schemas, bytes32[][] calldata schemaUids) external {
        uint256 schemaLength = schemas.length;
        if (schemaLength == 0 || schemaLength != schemaUids.length) {
            revert InvalidInput();
        }

        MultiRevocationRequest[] memory multiRequests = new MultiRevocationRequest[](schemaLength);

        for (uint256 i = 0; i < schemaLength; ++i) {
            bytes32[] calldata uids = schemaUids[i];

            uint256 uidLength = uids.length;
            if (uidLength == 0) {
                revert InvalidInput();
            }

            RevocationRequestData[] memory data = new RevocationRequestData[](uidLength);
            for (uint256 j = 0; j < uidLength; ++j) {
                data[j] = RevocationRequestData({uid: uids[j], value: 0});
            }

            multiRequests[i] = MultiRevocationRequest({schema: schemas[i], data: data});
        }

        _eas.multiRevoke(multiRequests);
    }
}
