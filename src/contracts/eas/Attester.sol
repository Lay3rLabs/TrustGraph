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
import {IWavsServiceManager} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceManager.sol";
import {IWavsServiceHandler} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceHandler.sol";
import {ITypes} from "../../interfaces/ITypes.sol";

/// @title Attester
/// @notice Ethereum Attestation Service - Example that integrates with WAVS
contract Attester is IWavsServiceHandler {
    error InvalidEAS();
    error InvalidInput();
    error InvalidServiceManager();
    error InvalidOperationType();
    error PayloadDecodingFailed();
    error DataDecodingFailed();

    event DebuggingEnvelopeReceived(bytes payload, uint256 payloadLength);
    event DebuggingPayloadDecoded(uint8 operationType, uint256 dataLength);
    event DebuggingAttestCalled(bytes32 schema, address recipient, uint256 dataLength);

    enum OperationType {
        ATTEST,
        REVOKE,
        MULTI_ATTEST,
        MULTI_REVOKE
    }

    struct AttestationPayload {
        OperationType operationType;
        bytes data;
    }

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
    /// @notice Handles signed envelope from WAVS and routes to appropriate attestation operation
    /// @param envelope The envelope containing the attestation payload
    /// @param signatureData The signature data for validation
    function handleSignedEnvelope(Envelope calldata envelope, SignatureData calldata signatureData) external {
        emit DebuggingEnvelopeReceived(envelope.payload, envelope.payload.length);

        // Validate the envelope signature through the service manager
        _serviceManager.validate(envelope, signatureData);

        // Decode the payload to get the attestation payload
        AttestationPayload memory payload;
        try this.decodeAttestationPayload(envelope.payload) returns (AttestationPayload memory decodedPayload) {
            payload = decodedPayload;
        } catch {
            revert PayloadDecodingFailed();
        }

        emit DebuggingPayloadDecoded(uint8(payload.operationType), payload.data.length);

        // Route to appropriate operation based on operation type
        if (payload.operationType == OperationType.ATTEST) {
            try this.decodeAttestData(payload.data) returns (AttestationRequest memory request) {
                emit DebuggingAttestCalled(request.schema, request.data.recipient, request.data.data.length);
                _attest(request);
            } catch {
                revert DataDecodingFailed();
            }
        } else if (payload.operationType == OperationType.REVOKE) {
            (bytes32 schema, bytes32 uid) = abi.decode(payload.data, (bytes32, bytes32));
            _revoke(schema, uid);
        } else if (payload.operationType == OperationType.MULTI_ATTEST) {
            (bytes32[] memory schemas, address[][] memory recipients, bytes[][] memory schemaData) =
                abi.decode(payload.data, (bytes32[], address[][], bytes[][]));
            _multiAttest(schemas, recipients, schemaData);
        } else if (payload.operationType == OperationType.MULTI_REVOKE) {
            (bytes32[] memory schemas, bytes32[][] memory schemaUids) =
                abi.decode(payload.data, (bytes32[], bytes32[][]));
            _multiRevoke(schemas, schemaUids);
        } else {
            revert InvalidOperationType();
        }
    }

    /// @notice Helper function for decoding AttestationPayload
    function decodeAttestationPayload(bytes calldata payload) external pure returns (AttestationPayload memory) {
        return abi.decode(payload, (AttestationPayload));
    }

    /// @notice Helper function for decoding attest data
    function decodeAttestData(bytes memory data) external pure returns (AttestationRequest memory) {
        return abi.decode(data, (AttestationRequest));
    }

    /// @notice Internal function to attest using an AttestationRequest.
    /// @param request The AttestationRequest containing all attestation details.
    /// @return The UID of the new attestation.
    function _attest(AttestationRequest memory request) internal returns (bytes32) {
        return _eas.attest(request);
    }

    /// @notice Internal function to revoke an attestation.
    /// @param schema The schema UID of the attestation.
    /// @param uid The UID of the attestation to revoke.
    function _revoke(bytes32 schema, bytes32 uid) internal {
        _eas.revoke(RevocationRequest({schema: schema, data: RevocationRequestData({uid: uid, value: 0})}));
    }

    /// @notice Internal function to multi-attest to schemas with generic data.
    /// @param schemas The schema UIDs to attest to.
    /// @param recipients The recipients for each schema's attestations.
    /// @param schemaData The encoded data for each schema's attestations.
    /// @return The UIDs of new attestations.
    function _multiAttest(bytes32[] memory schemas, address[][] memory recipients, bytes[][] memory schemaData)
        internal
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
        address[] memory schemaRecipients,
        bytes[] memory schemaDataItems
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

    /// @notice Internal function to multi-revoke attestations.
    /// @param schemas The schema UIDs of the attestations to revoke.
    /// @param schemaUids The UIDs of the attestations to revoke for each schema.
    function _multiRevoke(bytes32[] memory schemas, bytes32[][] memory schemaUids) internal {
        uint256 schemaLength = schemas.length;
        if (schemaLength == 0 || schemaLength != schemaUids.length) {
            revert InvalidInput();
        }

        MultiRevocationRequest[] memory multiRequests = new MultiRevocationRequest[](schemaLength);

        for (uint256 i = 0; i < schemaLength; ++i) {
            bytes32[] memory uids = schemaUids[i];

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

    /**
     * @notice Get the service manager address
     * @return address The address of the service manager
     */
    function getServiceManager() external view returns (address) {
        return address(_serviceManager);
    }
}
