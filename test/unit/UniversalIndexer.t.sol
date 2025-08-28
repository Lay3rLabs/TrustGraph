// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {Test} from "forge-std/Test.sol";
import {UniversalIndexer} from "../../src/contracts/UniversalIndexer.sol";
import {IUniversalIndexer} from "../../src/interfaces/IUniversalIndexer.sol";

// WAVS interfaces
import {IWavsServiceManager} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceManager.sol";
import {IWavsServiceHandler} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceHandler.sol";

contract UniversalIndexerTest is Test {
    UniversalIndexer public universalIndexer;
    MockWavsServiceManager public mockServiceManager;

    function setUp() public {
        mockServiceManager = new MockWavsServiceManager();
        universalIndexer = new UniversalIndexer(mockServiceManager);
    }

    function testHandleSignedEnvelope_ShouldNotRevertOnAdd() public {
        // Create mock events
        IUniversalIndexer.UniversalEvent[]
            memory events = new IUniversalIndexer.UniversalEvent[](2);
        events[0] = _createMockEvent(0, abi.encode(123), "attestation");
        events[1] = _createMockEvent(0, abi.encode(456), "attestation");

        // Create payload with ADD operation
        IUniversalIndexer.IndexingPayload memory payload = _createPayload(
            IUniversalIndexer.IndexOperation.ADD,
            events
        );

        // Create envelope and signature data
        (
            IWavsServiceHandler.Envelope memory envelope,
            IWavsServiceHandler.SignatureData memory signatureData
        ) = _createEnvelopeAndSignature(payload);

        // Generate expected event IDs
        bytes32 eventId1 = _generateEventId(1, 0);
        bytes32 eventId2 = _generateEventId(1, 1);

        // Expect events to be emitted
        vm.expectEmit(true, true, true, true);
        emit IUniversalIndexer.EventIndexed(
            eventId1,
            events[0].relevantContract,
            events[0].eventType,
            events[0].relevantAddresses,
            events[0].tags
        );
        emit IUniversalIndexer.EventIndexed(
            eventId2,
            events[1].relevantContract,
            events[1].eventType,
            events[1].relevantAddresses,
            events[1].tags
        );

        // Call handleSignedEnvelope
        universalIndexer.handleSignedEnvelope(envelope, signatureData);

        // Verify events exist and are not deleted
        assertEq(universalIndexer.eventExists(eventId1), true);
        assertEq(universalIndexer.eventDeleted(eventId1), false);
        assertEq(universalIndexer.eventExists(eventId2), true);
        assertEq(universalIndexer.eventDeleted(eventId2), false);
    }

    function testHandleSignedEnvelope_ShouldRevertOnAddIfNoEvent() public {
        // Create payload with no events
        IUniversalIndexer.IndexingPayload memory payload = _createPayload(
            IUniversalIndexer.IndexOperation.ADD,
            new IUniversalIndexer.UniversalEvent[](0)
        );

        // Create envelope and signature data
        (
            IWavsServiceHandler.Envelope memory envelope,
            IWavsServiceHandler.SignatureData memory signatureData
        ) = _createEnvelopeAndSignature(payload);

        // Expect revert when no events provided
        vm.expectRevert(IUniversalIndexer.NoEvents.selector);

        // Call handleSignedEnvelope
        universalIndexer.handleSignedEnvelope(envelope, signatureData);
    }

    function testHandleSignedEnvelope_ShouldRevertOnAddIfNonZeroEventId()
        public
    {
        // Create event with non-zero eventId (should be zero for ADD operations)
        IUniversalIndexer.UniversalEvent[]
            memory events = new IUniversalIndexer.UniversalEvent[](1);
        events[0] = _createMockEvent(123, abi.encode(123), "attestation");

        // Create payload with ADD operation
        IUniversalIndexer.IndexingPayload memory payload = _createPayload(
            IUniversalIndexer.IndexOperation.ADD,
            events
        );

        // Create envelope and signature data
        (
            IWavsServiceHandler.Envelope memory envelope,
            IWavsServiceHandler.SignatureData memory signatureData
        ) = _createEnvelopeAndSignature(payload);

        // Expect revert for non-zero eventId in ADD operation
        vm.expectRevert(IUniversalIndexer.ExpectedEventIdZero.selector);

        // Call handleSignedEnvelope
        universalIndexer.handleSignedEnvelope(envelope, signatureData);
    }

    function testHandleSignedEnvelope_ShouldRevertOnAddIfEventExists() public {
        // Create mock event
        IUniversalIndexer.UniversalEvent[]
            memory events = new IUniversalIndexer.UniversalEvent[](1);
        events[0] = _createMockEvent(0, abi.encode(123), "attestation");

        // Create payload with ADD operation
        IUniversalIndexer.IndexingPayload memory payload = _createPayload(
            IUniversalIndexer.IndexOperation.ADD,
            events
        );

        // Create envelope and signature data
        (
            IWavsServiceHandler.Envelope memory envelope,
            IWavsServiceHandler.SignatureData memory signatureData
        ) = _createEnvelopeAndSignature(payload);

        // First call should succeed
        universalIndexer.handleSignedEnvelope(envelope, signatureData);

        // Generate event ID to verify it exists
        bytes32 eventId = _generateEventId(1, 0);

        // Verify event exists and is not deleted
        assertEq(universalIndexer.eventExists(eventId), true);
        assertEq(universalIndexer.eventDeleted(eventId), false);

        // Second call with same event should revert
        vm.expectRevert(IUniversalIndexer.EventAlreadyExists.selector);
        universalIndexer.handleSignedEnvelope(envelope, signatureData);
    }

    function testHandleSignedEnvelope_ShouldNotRevertOnDelete() public {
        // Create mock event and add it first
        IUniversalIndexer.UniversalEvent[]
            memory events = new IUniversalIndexer.UniversalEvent[](1);
        events[0] = _createMockEvent(0, abi.encode(123), "attestation");

        // Create ADD payload and execute
        IUniversalIndexer.IndexingPayload memory addPayload = _createPayload(
            IUniversalIndexer.IndexOperation.ADD,
            events
        );

        (
            IWavsServiceHandler.Envelope memory envelope,
            IWavsServiceHandler.SignatureData memory signatureData
        ) = _createEnvelopeAndSignature(addPayload);

        // Add the event first
        universalIndexer.handleSignedEnvelope(envelope, signatureData);

        // Generate event ID
        bytes32 eventId = _generateEventId(1, 0);

        // Verify event exists and is not deleted
        assertEq(universalIndexer.eventExists(eventId), true);
        assertEq(universalIndexer.eventDeleted(eventId), false);
        assertEq(universalIndexer.eventExistsAndDeleted(eventId), false);

        // Now create DELETE payload with the generated eventId
        events[0].eventId = eventId;
        IUniversalIndexer.IndexingPayload memory deletePayload = _createPayload(
            IUniversalIndexer.IndexOperation.DELETE,
            events
        );

        // Create new envelope for delete operation
        envelope = _createEnvelope(
            bytes20(uint160(0x1)),
            bytes12(uint96(0)),
            deletePayload
        );

        // Expect delete event emission
        vm.expectEmit(true, true, true, true);
        emit IUniversalIndexer.EventDeleted(eventId);

        // Call handleSignedEnvelope for delete
        universalIndexer.handleSignedEnvelope(envelope, signatureData);

        // Verify event exists but is marked as deleted
        assertEq(universalIndexer.eventExists(eventId), true);
        assertEq(universalIndexer.eventDeleted(eventId), true);
        assertEq(universalIndexer.eventExistsAndDeleted(eventId), true);
    }

    function testHandleSignedEnvelope_ShouldRevertOnDeleteIfNoEvent() public {
        // Create DELETE payload with no events
        IUniversalIndexer.IndexingPayload memory payload = _createPayload(
            IUniversalIndexer.IndexOperation.DELETE,
            new IUniversalIndexer.UniversalEvent[](0)
        );

        // Create envelope and signature data
        (
            IWavsServiceHandler.Envelope memory envelope,
            IWavsServiceHandler.SignatureData memory signatureData
        ) = _createEnvelopeAndSignature(payload);

        // Expect revert when no events provided for delete
        vm.expectRevert(IUniversalIndexer.NoEvents.selector);

        // Call handleSignedEnvelope
        universalIndexer.handleSignedEnvelope(envelope, signatureData);
    }

    // ================================
    // Helper functions
    // ================================

    // Helper function to create a mock universal event
    function _createMockEvent(
        uint256 eventId,
        bytes memory dataValue,
        string memory eventType
    ) internal pure returns (IUniversalIndexer.UniversalEvent memory) {
        string[] memory tags = new string[](1);
        tags[0] = "tag";
        address[] memory relevantAddresses = new address[](1);
        relevantAddresses[0] = address(0x1);
        bytes memory metadata = bytes("");

        return
            _createMockEventCustom(
                bytes32(eventId),
                "1",
                address(0x1),
                1000,
                1000,
                eventType,
                dataValue,
                tags,
                relevantAddresses,
                metadata
            );
    }

    // Helper function to create a mock universal event with custom parameters
    function _createMockEventCustom(
        bytes32 eventId,
        string memory chainId,
        address relevantContract,
        uint256 blockNumber,
        uint256 timestamp,
        string memory eventType,
        bytes memory data,
        string[] memory tags,
        address[] memory relevantAddresses,
        bytes memory metadata
    ) internal pure returns (IUniversalIndexer.UniversalEvent memory) {
        return
            IUniversalIndexer.UniversalEvent({
                eventId: eventId,
                chainId: chainId,
                relevantContract: relevantContract,
                blockNumber: blockNumber,
                timestamp: timestamp,
                eventType: eventType,
                data: data,
                tags: tags,
                relevantAddresses: relevantAddresses,
                metadata: metadata
            });
    }

    // Helper function to create an indexing payload
    function _createPayload(
        IUniversalIndexer.IndexOperation operation,
        IUniversalIndexer.UniversalEvent[] memory events
    ) internal pure returns (IUniversalIndexer.IndexingPayload memory) {
        return
            IUniversalIndexer.IndexingPayload({
                operation: operation,
                events: events
            });
    }

    // Helper function to create mock signature data
    function _createMockSignatureData()
        internal
        pure
        returns (IWavsServiceHandler.SignatureData memory)
    {
        address[] memory signers = new address[](1);
        signers[0] = address(0x456);
        bytes[] memory signatures = new bytes[](1);
        signatures[0] = abi.encodePacked("mock_signature");

        return
            IWavsServiceHandler.SignatureData({
                signers: signers,
                signatures: signatures,
                referenceBlock: 1000
            });
    }

    // Helper function to create an envelope with payload
    function _createEnvelope(
        bytes20 eventId,
        bytes12 ordering,
        IUniversalIndexer.IndexingPayload memory payload
    ) internal pure returns (IWavsServiceHandler.Envelope memory) {
        bytes memory encodedPayload = abi.encode(payload);

        return
            IWavsServiceHandler.Envelope({
                eventId: eventId,
                ordering: ordering,
                payload: encodedPayload
            });
    }

    // Helper function to create envelope and signature data from payload
    function _createEnvelopeAndSignature(
        IUniversalIndexer.IndexingPayload memory payload
    )
        internal
        pure
        returns (
            IWavsServiceHandler.Envelope memory envelope,
            IWavsServiceHandler.SignatureData memory signatureData
        )
    {
        envelope = _createEnvelope(
            bytes20(uint160(0x1)),
            bytes12(uint96(0)),
            payload
        );
        signatureData = _createMockSignatureData();
    }

    // Helper function to generate unique event ID from envelope data
    function _generateEventId(
        uint160 envelopeEventId,
        uint96 index
    ) internal pure returns (bytes32) {
        return
            bytes32(abi.encodePacked(bytes20(envelopeEventId), bytes12(index)));
    }
}

// Mock WAVS Service Manager for testing
contract MockWavsServiceManager is IWavsServiceManager {
    function getAllocationManager() external view override returns (address) {}

    function getDelegationManager() external view override returns (address) {}

    function getStakeRegistry() external view override returns (address) {}

    function setServiceURI(string calldata) external {
        // Mock implementation - does nothing in tests
    }

    function validate(
        IWavsServiceHandler.Envelope calldata,
        IWavsServiceHandler.SignatureData calldata
    ) external pure {
        // Mock validation - always passes for testing
        return;
    }

    function getOperatorWeight(address) external pure returns (uint256) {
        // Return a default weight for testing
        return 100;
    }

    function getLatestOperatorForSigningKey(
        address
    ) external pure returns (address) {
        // Return a mock operator address
        return address(0x1234567890123456789012345678901234567890);
    }

    function getServiceURI() external pure returns (string memory) {
        // Return a mock service URI
        return "https://mock-service.example.com";
    }
}
