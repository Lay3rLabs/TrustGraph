// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {Test} from "forge-std/Test.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {WavsIndexer} from "../../src/contracts/wavs/WavsIndexer.sol";
import {IWavsIndexer} from "../../src/interfaces/IWavsIndexer.sol";

// WAVS interfaces
import {IWavsServiceManager} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceManager.sol";
import {IWavsServiceHandler} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceHandler.sol";

contract WavsIndexerTest is Test {
    WavsIndexer public wavsIndexer;
    MockWavsServiceManager public mockServiceManager;

    function setUp() public {
        mockServiceManager = new MockWavsServiceManager();
        wavsIndexer = new WavsIndexer(mockServiceManager);
    }

    function testHandleSignedEnvelope_ShouldNotRevertOnAdd() public {
        // Create mock events
        IWavsIndexer.IndexedEvent[] memory events = new IWavsIndexer.IndexedEvent[](2);
        events[0] = _createMockEvent(0, abi.encode(123), "attestation");
        events[1] = _createMockEvent(0, abi.encode(456), "attestation");

        // Create payload
        IWavsIndexer.IndexingPayload memory payload = _createPayload(events, new bytes32[](0));

        // Create envelope and signature data
        (IWavsServiceHandler.Envelope memory envelope, IWavsServiceHandler.SignatureData memory signatureData) =
            _createEnvelopeAndSignature(payload);

        // Generate expected event IDs
        bytes32 eventId1 = _generateEventId(1, 0);
        bytes32 eventId2 = _generateEventId(1, 1);

        assertEq(wavsIndexer.eventExists(eventId1), false);
        assertEq(wavsIndexer.eventExists(eventId2), false);

        // Expect events to be emitted
        vm.expectEmit(true, true, true, true);
        emit IWavsIndexer.EventIndexed(
            eventId1, events[0].relevantContract, events[0].eventType, events[0].relevantAddresses, events[0].tags
        );
        emit IWavsIndexer.EventIndexed(
            eventId2, events[1].relevantContract, events[1].eventType, events[1].relevantAddresses, events[1].tags
        );

        // Call handleSignedEnvelope
        wavsIndexer.handleSignedEnvelope(envelope, signatureData);

        // Verify events exist and are not deleted
        assertEq(wavsIndexer.eventExists(eventId1), true);
        assertEq(wavsIndexer.eventExistsAndDeleted(eventId1), false);
        assertEq(wavsIndexer.eventExists(eventId2), true);
        assertEq(wavsIndexer.eventExistsAndDeleted(eventId2), false);
    }

    function testHandleSignedEnvelope_ShouldRevertIfNoEvents() public {
        // Create payload with no events
        IWavsIndexer.IndexingPayload memory payload =
            _createPayload(new IWavsIndexer.IndexedEvent[](0), new bytes32[](0));

        // Create envelope and signature data
        (IWavsServiceHandler.Envelope memory envelope, IWavsServiceHandler.SignatureData memory signatureData) =
            _createEnvelopeAndSignature(payload);

        // Expect revert when no events provided
        vm.expectRevert(IWavsIndexer.NoEvents.selector);

        // Call handleSignedEnvelope
        wavsIndexer.handleSignedEnvelope(envelope, signatureData);
    }

    function testHandleSignedEnvelope_ShouldRevertOnAddIfNonZeroEventId() public {
        // Create event with non-zero eventId (should be zero for ADD operations)
        IWavsIndexer.IndexedEvent[] memory events = new IWavsIndexer.IndexedEvent[](1);
        events[0] = _createMockEvent(123, abi.encode(123), "attestation");

        // Create payload
        IWavsIndexer.IndexingPayload memory payload = _createPayload(events, new bytes32[](0));

        // Create envelope and signature data
        (IWavsServiceHandler.Envelope memory envelope, IWavsServiceHandler.SignatureData memory signatureData) =
            _createEnvelopeAndSignature(payload);

        // Expect revert for non-zero eventId in ADD operation
        vm.expectRevert(IWavsIndexer.ExpectedEventIdZero.selector);

        // Call handleSignedEnvelope
        wavsIndexer.handleSignedEnvelope(envelope, signatureData);
    }

    function testHandleSignedEnvelope_ShouldRevertOnAddIfEventExists() public {
        // Create mock event
        IWavsIndexer.IndexedEvent[] memory events = new IWavsIndexer.IndexedEvent[](1);
        events[0] = _createMockEvent(0, abi.encode(123), "attestation");

        // Create payload
        IWavsIndexer.IndexingPayload memory payload = _createPayload(events, new bytes32[](0));

        // Create envelope and signature data
        (IWavsServiceHandler.Envelope memory envelope, IWavsServiceHandler.SignatureData memory signatureData) =
            _createEnvelopeAndSignature(payload);

        // First call should succeed
        wavsIndexer.handleSignedEnvelope(envelope, signatureData);

        // Generate event ID to verify it exists
        bytes32 eventId = _generateEventId(1, 0);

        // Verify event exists and is not deleted
        assertEq(wavsIndexer.eventExists(eventId), true);
        assertEq(wavsIndexer.eventExistsAndDeleted(eventId), false);

        // Second call with same event should revert
        vm.expectRevert(IWavsIndexer.EventAlreadyExists.selector);
        wavsIndexer.handleSignedEnvelope(envelope, signatureData);
    }

    function testHandleSignedEnvelope_ShouldRevertOnAddIfEventSetsDeleted() public {
        // Create mock event
        IWavsIndexer.IndexedEvent[] memory events = new IWavsIndexer.IndexedEvent[](1);
        events[0] = _createMockEvent(0, abi.encode(123), "attestation");
        events[0].deleted = true;

        // Create payload
        IWavsIndexer.IndexingPayload memory payload = _createPayload(events, new bytes32[](0));

        // Create envelope and signature data
        (IWavsServiceHandler.Envelope memory envelope, IWavsServiceHandler.SignatureData memory signatureData) =
            _createEnvelopeAndSignature(payload);

        // Expect revert for deleted event
        vm.expectRevert(IWavsIndexer.CannotCreateDeletedEvent.selector);

        wavsIndexer.handleSignedEnvelope(envelope, signatureData);
    }

    function testHandleSignedEnvelope_ShouldNotRevertOnDelete() public {
        // Create mock event and add it first
        IWavsIndexer.IndexedEvent[] memory events = new IWavsIndexer.IndexedEvent[](1);
        events[0] = _createMockEvent(0, abi.encode(123), "attestation");

        // Create ADD payload and execute
        IWavsIndexer.IndexingPayload memory addPayload = _createPayload(events, new bytes32[](0));

        (IWavsServiceHandler.Envelope memory envelope, IWavsServiceHandler.SignatureData memory signatureData) =
            _createEnvelopeAndSignature(addPayload);

        // Generate event ID
        bytes32 eventId = _generateEventId(1, 0);

        assertEq(wavsIndexer.eventExists(eventId), false);
        assertEq(wavsIndexer.eventExistsAndDeleted(eventId), false);

        // Add the event first
        wavsIndexer.handleSignedEnvelope(envelope, signatureData);

        // Verify event exists and is not deleted
        assertEq(wavsIndexer.eventExists(eventId), true);
        assertEq(wavsIndexer.eventExistsAndDeleted(eventId), false);

        // Now create DELETE payload with the generated eventId
        bytes32[] memory toDelete = new bytes32[](1);
        toDelete[0] = eventId;
        IWavsIndexer.IndexingPayload memory deletePayload = _createPayload(new IWavsIndexer.IndexedEvent[](0), toDelete);

        // Create new envelope for delete operation
        envelope = _createEnvelope(bytes20(uint160(0x1)), bytes12(uint96(0)), deletePayload);

        // Expect delete event emission
        vm.expectEmit(true, true, true, true);
        emit IWavsIndexer.EventDeleted(eventId);

        // Call handleSignedEnvelope for delete
        wavsIndexer.handleSignedEnvelope(envelope, signatureData);

        // Verify event exists but is marked as deleted
        assertEq(wavsIndexer.eventExists(eventId), true);
        assertEq(wavsIndexer.eventExistsAndDeleted(eventId), true);
    }

    // ================================
    // Query Function Tests
    // ================================

    function testGetEventsByChainId() public {
        // Create events for different chains
        IWavsIndexer.IndexedEvent[] memory events = new IWavsIndexer.IndexedEvent[](3);
        events[0] = _createMockEventCustom(
            bytes32(0),
            "1",
            address(0x1),
            1000,
            1000,
            "attestation",
            abi.encode(123),
            new string[](0),
            new address[](0),
            bytes(""),
            false
        );
        events[1] = _createMockEventCustom(
            bytes32(0),
            "1",
            address(0x2),
            1001,
            1001,
            "transfer",
            abi.encode(456),
            new string[](0),
            new address[](0),
            bytes(""),
            false
        );
        events[2] = _createMockEventCustom(
            bytes32(0),
            "2",
            address(0x3),
            1002,
            1002,
            "attestation",
            abi.encode(789),
            new string[](0),
            new address[](0),
            bytes(""),
            false
        );

        IWavsIndexer.IndexingPayload memory payload = _createPayload(events, new bytes32[](0));

        (IWavsServiceHandler.Envelope memory envelope, IWavsServiceHandler.SignatureData memory signatureData) =
            _createEnvelopeAndSignature(payload);

        wavsIndexer.handleSignedEnvelope(envelope, signatureData);

        // Test getting events by chain ID "1"
        IWavsIndexer.IndexedEvent[] memory chain1Events = wavsIndexer.getEventsByChainId("1", 0, 10, false);
        assertEq(chain1Events.length, 2);
        assertEq(chain1Events[0].chainId, "1");
        assertEq(chain1Events[1].chainId, "1");

        // Test getting events by chain ID "2"
        IWavsIndexer.IndexedEvent[] memory chain2Events = wavsIndexer.getEventsByChainId("2", 0, 10, false);
        assertEq(chain2Events.length, 1);
        assertEq(chain2Events[0].chainId, "2");

        // Test reverse order
        IWavsIndexer.IndexedEvent[] memory chain1Reverse = wavsIndexer.getEventsByChainId("1", 0, 10, true);
        assertEq(chain1Reverse.length, 2);
        // In reverse order, second event should come first
        assertEq(chain1Reverse[0].relevantContract, address(0x2));
        assertEq(chain1Reverse[1].relevantContract, address(0x1));
    }

    function testGetEventsByContract() public {
        // Create events for different contracts
        IWavsIndexer.IndexedEvent[] memory events = new IWavsIndexer.IndexedEvent[](4);
        events[0] = _createMockEventCustom(
            bytes32(0),
            "1",
            address(0x100),
            1000,
            1000,
            "attestation",
            abi.encode(123),
            new string[](0),
            new address[](0),
            bytes(""),
            false
        );
        events[1] = _createMockEventCustom(
            bytes32(0),
            "1",
            address(0x100),
            1001,
            1001,
            "transfer",
            abi.encode(456),
            new string[](0),
            new address[](0),
            bytes(""),
            false
        );
        events[2] = _createMockEventCustom(
            bytes32(0),
            "1",
            address(0x200),
            1002,
            1002,
            "attestation",
            abi.encode(789),
            new string[](0),
            new address[](0),
            bytes(""),
            false
        );
        events[3] = _createMockEventCustom(
            bytes32(0),
            "2",
            address(0x200),
            1003,
            1003,
            "attestation",
            abi.encode(789),
            new string[](0),
            new address[](0),
            bytes(""),
            false
        );

        IWavsIndexer.IndexingPayload memory payload = _createPayload(events, new bytes32[](0));

        (IWavsServiceHandler.Envelope memory envelope, IWavsServiceHandler.SignatureData memory signatureData) =
            _createEnvelopeAndSignature(payload);

        wavsIndexer.handleSignedEnvelope(envelope, signatureData);

        // Test getting events by contract 0x100
        IWavsIndexer.IndexedEvent[] memory contract100Events =
            wavsIndexer.getEventsByContract("1", address(0x100), 0, 10, false);
        assertEq(contract100Events.length, 2);
        assertEq(contract100Events[0].relevantContract, address(0x100));
        assertEq(contract100Events[0].eventId, _generateEventId(1, 0));
        assertEq(contract100Events[0].eventType, "attestation");
        assertEq(contract100Events[1].relevantContract, address(0x100));
        assertEq(contract100Events[1].eventId, _generateEventId(1, 1));
        assertEq(contract100Events[1].eventType, "transfer");

        // Test getting events by contract 0x200
        IWavsIndexer.IndexedEvent[] memory contract200Events =
            wavsIndexer.getEventsByContract("1", address(0x200), 0, 10, false);
        assertEq(contract200Events.length, 1);
        assertEq(contract200Events[0].relevantContract, address(0x200));
        assertEq(contract200Events[0].eventId, _generateEventId(1, 2));
        assertEq(contract200Events[0].eventType, "attestation");

        // Test getting events by contract 0x200 on chain 2
        IWavsIndexer.IndexedEvent[] memory contract200Events2 =
            wavsIndexer.getEventsByContract("2", address(0x200), 0, 10, false);
        assertEq(contract200Events2.length, 1);
        assertEq(contract200Events2[0].relevantContract, address(0x200));
        assertEq(contract200Events2[0].eventId, _generateEventId(1, 3));
        assertEq(contract200Events2[0].eventType, "attestation");
    }

    function testGetEventsByAddress() public {
        address[] memory relevantAddresses1 = new address[](1);
        relevantAddresses1[0] = address(0x100);

        address[] memory relevantAddresses2 = new address[](1);
        relevantAddresses2[0] = address(0x200);

        // Create events for different addresses
        IWavsIndexer.IndexedEvent[] memory events = new IWavsIndexer.IndexedEvent[](4);
        events[0] = _createMockEventCustom(
            bytes32(0),
            "1",
            address(0x100),
            1000,
            1000,
            "attestation",
            abi.encode(123),
            new string[](0),
            relevantAddresses1,
            bytes(""),
            false
        );
        events[1] = _createMockEventCustom(
            bytes32(0),
            "1",
            address(0x100),
            1001,
            1001,
            "transfer",
            abi.encode(456),
            new string[](0),
            relevantAddresses1,
            bytes(""),
            false
        );
        events[2] = _createMockEventCustom(
            bytes32(0),
            "1",
            address(0x200),
            1002,
            1002,
            "attestation",
            abi.encode(789),
            new string[](0),
            relevantAddresses2,
            bytes(""),
            false
        );
        events[3] = _createMockEventCustom(
            bytes32(0),
            "1",
            address(0x200),
            1003,
            1003,
            "attestation",
            abi.encode(789),
            new string[](0),
            relevantAddresses2,
            bytes(""),
            false
        );

        IWavsIndexer.IndexingPayload memory payload = _createPayload(events, new bytes32[](0));

        (IWavsServiceHandler.Envelope memory envelope, IWavsServiceHandler.SignatureData memory signatureData) =
            _createEnvelopeAndSignature(payload);

        wavsIndexer.handleSignedEnvelope(envelope, signatureData);

        // Test getting events by address 0x100
        IWavsIndexer.IndexedEvent[] memory addr100Events = wavsIndexer.getEventsByAddress(address(0x100), 0, 10, false);
        assertEq(addr100Events.length, 2);
        assertEq(addr100Events[0].blockNumber, 1000);
        assertEq(addr100Events[1].blockNumber, 1001);

        // Test getting events by address 0x200
        IWavsIndexer.IndexedEvent[] memory addr200Events = wavsIndexer.getEventsByAddress(address(0x200), 0, 10, false);
        assertEq(addr200Events.length, 2);
        assertEq(addr200Events[0].blockNumber, 1002);
        assertEq(addr200Events[1].blockNumber, 1003);
    }

    function testGetEventsByType() public {
        // Create events with different types
        IWavsIndexer.IndexedEvent[] memory events = new IWavsIndexer.IndexedEvent[](4);
        events[0] = _createMockEventCustom(
            bytes32(0),
            "1",
            address(0x1),
            1000,
            1000,
            "attestation",
            abi.encode(123),
            new string[](0),
            new address[](0),
            bytes(""),
            false
        );
        events[1] = _createMockEventCustom(
            bytes32(0),
            "1",
            address(0x2),
            1001,
            1001,
            "transfer",
            abi.encode(456),
            new string[](0),
            new address[](0),
            bytes(""),
            false
        );
        events[2] = _createMockEventCustom(
            bytes32(0),
            "1",
            address(0x3),
            1002,
            1002,
            "system",
            abi.encode(789),
            new string[](0),
            new address[](0),
            bytes(""),
            false
        );
        events[3] = _createMockEventCustom(
            bytes32(0),
            "1",
            address(0x4),
            1003,
            1003,
            "system",
            abi.encode(101112),
            new string[](0),
            new address[](0),
            bytes(""),
            false
        );

        IWavsIndexer.IndexingPayload memory payload = _createPayload(events, new bytes32[](0));

        (IWavsServiceHandler.Envelope memory envelope, IWavsServiceHandler.SignatureData memory signatureData) =
            _createEnvelopeAndSignature(payload);

        wavsIndexer.handleSignedEnvelope(envelope, signatureData);

        // Test getting events by type "attestation"
        IWavsIndexer.IndexedEvent[] memory attestations = wavsIndexer.getEventsByType("attestation", 0, 10, false);
        assertEq(attestations.length, 1);
        assertEq(attestations[0].data, abi.encode(123));

        // Test getting events by type "transfer"
        IWavsIndexer.IndexedEvent[] memory transfers = wavsIndexer.getEventsByType("transfer", 0, 10, false);
        assertEq(transfers.length, 1);
        assertEq(transfers[0].data, abi.encode(456));

        // Test getting events by type "system"
        IWavsIndexer.IndexedEvent[] memory systemEvents = wavsIndexer.getEventsByType("system", 0, 10, false);
        assertEq(systemEvents.length, 2);
        assertEq(systemEvents[0].data, abi.encode(789));
        assertEq(systemEvents[1].data, abi.encode(101112));
    }

    function testGetEventsByTag() public {
        // Create events with different tags
        string[] memory tags1 = new string[](2);
        tags1[0] = "user";
        tags1[1] = "important";

        string[] memory tags2 = new string[](1);
        tags2[0] = "user";

        string[] memory tags3 = new string[](1);
        tags3[0] = "system";

        IWavsIndexer.IndexedEvent[] memory events = new IWavsIndexer.IndexedEvent[](3);
        events[0] = _createMockEventCustom(
            bytes32(0),
            "1",
            address(0x1),
            1000,
            1000,
            "attestation",
            abi.encode(123),
            tags1,
            new address[](0),
            bytes(""),
            false
        );
        events[1] = _createMockEventCustom(
            bytes32(0),
            "1",
            address(0x2),
            1001,
            1001,
            "transfer",
            abi.encode(456),
            tags2,
            new address[](0),
            bytes(""),
            false
        );
        events[2] = _createMockEventCustom(
            bytes32(0),
            "1",
            address(0x3),
            1002,
            1002,
            "system",
            abi.encode(789),
            tags3,
            new address[](0),
            bytes(""),
            false
        );

        IWavsIndexer.IndexingPayload memory payload = _createPayload(events, new bytes32[](0));

        (IWavsServiceHandler.Envelope memory envelope, IWavsServiceHandler.SignatureData memory signatureData) =
            _createEnvelopeAndSignature(payload);

        wavsIndexer.handleSignedEnvelope(envelope, signatureData);

        // Test getting events by tag "user"
        IWavsIndexer.IndexedEvent[] memory userEvents = wavsIndexer.getEventsByTag("user", 0, 10, false);
        assertEq(userEvents.length, 2);

        // Test getting events by tag "important"
        IWavsIndexer.IndexedEvent[] memory importantEvents = wavsIndexer.getEventsByTag("important", 0, 10, false);
        assertEq(importantEvents.length, 1);

        // Test getting events by tag "system"
        IWavsIndexer.IndexedEvent[] memory systemEvents = wavsIndexer.getEventsByTag("system", 0, 10, false);
        assertEq(systemEvents.length, 1);
    }

    function testGetEventsByContractAndAddress() public {
        // Create events with different relevant addresses and types
        address[] memory relevantAddresses1 = new address[](1);
        relevantAddresses1[0] = address(0x1000);

        address[] memory relevantAddresses2 = new address[](1);
        relevantAddresses2[0] = address(0x2000);

        IWavsIndexer.IndexedEvent[] memory events = new IWavsIndexer.IndexedEvent[](3);
        events[0] = _createMockEventCustom(
            bytes32(0),
            "1",
            address(0x1),
            1000,
            1000,
            "attestation",
            abi.encode(123),
            new string[](0),
            relevantAddresses1,
            bytes(""),
            false
        );
        events[1] = _createMockEventCustom(
            bytes32(0),
            "2",
            address(0x1),
            1001,
            1001,
            "attestation",
            abi.encode(456),
            new string[](0),
            relevantAddresses1,
            bytes(""),
            false
        );
        events[2] = _createMockEventCustom(
            bytes32(0),
            "1",
            address(0x3),
            1002,
            1002,
            "attestation",
            abi.encode(789),
            new string[](0),
            relevantAddresses2,
            bytes(""),
            false
        );

        IWavsIndexer.IndexingPayload memory payload = _createPayload(events, new bytes32[](0));

        (IWavsServiceHandler.Envelope memory envelope, IWavsServiceHandler.SignatureData memory signatureData) =
            _createEnvelopeAndSignature(payload);

        wavsIndexer.handleSignedEnvelope(envelope, signatureData);

        // Test getting events by chain ID 1, contract 0x1 and address 0x1000
        IWavsIndexer.IndexedEvent[] memory addr1Attestations =
            wavsIndexer.getEventsByContractAndAddress("1", address(0x1), address(0x1000), 0, 10, false);
        assertEq(addr1Attestations.length, 1);
        assertEq(addr1Attestations[0].blockNumber, 1000);

        // Test getting events by chain ID 2, contract 0x1 and address 0x1000
        IWavsIndexer.IndexedEvent[] memory addr2Attestations =
            wavsIndexer.getEventsByContractAndAddress("2", address(0x1), address(0x1000), 0, 10, false);
        assertEq(addr2Attestations.length, 1);
        assertEq(addr2Attestations[0].blockNumber, 1001);

        // Test getting events by chain ID 1, contract 0x3, and address 0x2000
        IWavsIndexer.IndexedEvent[] memory addr3Attestations =
            wavsIndexer.getEventsByContractAndAddress("1", address(0x3), address(0x2000), 0, 10, false);
        assertEq(addr3Attestations.length, 1);
        assertEq(addr3Attestations[0].blockNumber, 1002);
    }

    function testGetEventsByTypeAndTag() public {
        // Create events with different relevant addresses and tags
        string[] memory tags1 = new string[](2);
        tags1[0] = "schema:0x123";
        tags1[1] = "attester:0x123";

        string[] memory tags2 = new string[](2);
        tags2[0] = "schema:0x456";
        tags2[1] = "attester:0x456";

        IWavsIndexer.IndexedEvent[] memory events = new IWavsIndexer.IndexedEvent[](4);
        events[0] = _createMockEventCustom(
            bytes32(0),
            "1",
            address(0x1),
            1000,
            1000,
            "attestation",
            abi.encode(123),
            tags1,
            new address[](0),
            bytes(""),
            false
        );
        events[1] = _createMockEventCustom(
            bytes32(0),
            "1",
            address(0x1),
            1001,
            1001,
            "attestation",
            abi.encode(456),
            tags2,
            new address[](0),
            bytes(""),
            false
        );
        events[3] = _createMockEventCustom(
            bytes32(0),
            "1",
            address(0x3),
            1002,
            1002,
            "system",
            abi.encode(789),
            tags2,
            new address[](0),
            bytes(""),
            false
        );

        IWavsIndexer.IndexingPayload memory payload = _createPayload(events, new bytes32[](0));

        (IWavsServiceHandler.Envelope memory envelope, IWavsServiceHandler.SignatureData memory signatureData) =
            _createEnvelopeAndSignature(payload);

        wavsIndexer.handleSignedEnvelope(envelope, signatureData);

        // Test getting events by type "attestation" and tag "schema:0x123"
        IWavsIndexer.IndexedEvent[] memory attestations =
            wavsIndexer.getEventsByTypeAndTag("attestation", "schema:0x123", 0, 10, false);
        assertEq(attestations.length, 1);
        assertEq(attestations[0].eventId, _generateEventId(1, 0));
        assertEq(attestations[0].eventType, "attestation");
        assertEq(attestations[0].tags[0], "schema:0x123");
        assertEq(attestations[0].tags[1], "attester:0x123");

        // Test getting events by type "attestation" and tag "schema:0x456"
        IWavsIndexer.IndexedEvent[] memory attestations2 =
            wavsIndexer.getEventsByTypeAndTag("attestation", "schema:0x456", 0, 10, false);
        assertEq(attestations2.length, 1);
        assertEq(attestations2[0].eventId, _generateEventId(1, 1));
        assertEq(attestations2[0].eventType, "attestation");
        assertEq(attestations2[0].tags[0], "schema:0x456");
        assertEq(attestations2[0].tags[1], "attester:0x456");

        // Test getting events by type "attestation" and tag "attester:0x456"
        IWavsIndexer.IndexedEvent[] memory attestations3 =
            wavsIndexer.getEventsByTypeAndTag("attestation", "attester:0x456", 0, 10, false);
        assertEq(attestations3.length, 1);
        assertEq(attestations3[0].eventId, _generateEventId(1, 1));
        assertEq(attestations3[0].eventType, "attestation");
        assertEq(attestations3[0].tags[0], "schema:0x456");
        assertEq(attestations3[0].tags[1], "attester:0x456");
    }

    function testGetEventsByAddressAndType() public {
        // Create events with different relevant addresses and types
        address[] memory relevantAddresses1 = new address[](1);
        relevantAddresses1[0] = address(0x1000);

        address[] memory relevantAddresses2 = new address[](1);
        relevantAddresses2[0] = address(0x2000);

        IWavsIndexer.IndexedEvent[] memory events = new IWavsIndexer.IndexedEvent[](3);
        events[0] = _createMockEventCustom(
            bytes32(0),
            "1",
            address(0x1),
            1000,
            1000,
            "attestation",
            abi.encode(123),
            new string[](0),
            relevantAddresses1,
            bytes(""),
            false
        );
        events[1] = _createMockEventCustom(
            bytes32(0),
            "1",
            address(0x2),
            1001,
            1001,
            "attestation",
            abi.encode(456),
            new string[](0),
            relevantAddresses1,
            bytes(""),
            false
        );
        events[2] = _createMockEventCustom(
            bytes32(0),
            "1",
            address(0x3),
            1002,
            1002,
            "transfer",
            abi.encode(789),
            new string[](0),
            relevantAddresses2,
            bytes(""),
            false
        );

        IWavsIndexer.IndexingPayload memory payload = _createPayload(events, new bytes32[](0));

        (IWavsServiceHandler.Envelope memory envelope, IWavsServiceHandler.SignatureData memory signatureData) =
            _createEnvelopeAndSignature(payload);

        wavsIndexer.handleSignedEnvelope(envelope, signatureData);

        // Test getting events by address 0x1000 and type "attestation"
        IWavsIndexer.IndexedEvent[] memory addr1Attestations =
            wavsIndexer.getEventsByAddressAndType(address(0x1000), "attestation", 0, 10, false);
        assertEq(addr1Attestations.length, 2);

        // Test getting events by address 0x2000 and type "transfer"
        IWavsIndexer.IndexedEvent[] memory addr2Transfers =
            wavsIndexer.getEventsByAddressAndType(address(0x2000), "transfer", 0, 10, false);
        assertEq(addr2Transfers.length, 1);
    }

    function testGetEventsByAddressAndTag() public {
        // Create events with different relevant addresses and tags
        string[] memory tags1 = new string[](1);
        tags1[0] = "important";

        address[] memory relevantAddresses1 = new address[](1);
        relevantAddresses1[0] = address(0x1000);

        address[] memory relevantAddresses2 = new address[](1);
        relevantAddresses2[0] = address(0x2000);

        IWavsIndexer.IndexedEvent[] memory events = new IWavsIndexer.IndexedEvent[](3);
        events[0] = _createMockEventCustom(
            bytes32(0),
            "1",
            address(0x1),
            1000,
            1000,
            "attestation",
            abi.encode(123),
            tags1,
            relevantAddresses1,
            bytes(""),
            false
        );
        events[1] = _createMockEventCustom(
            bytes32(0),
            "1",
            address(0x2),
            1001,
            1001,
            "transfer",
            abi.encode(456),
            tags1,
            relevantAddresses1,
            bytes(""),
            false
        );
        events[2] = _createMockEventCustom(
            bytes32(0),
            "1",
            address(0x3),
            1002,
            1002,
            "system",
            abi.encode(789),
            tags1,
            relevantAddresses2,
            bytes(""),
            false
        );

        IWavsIndexer.IndexingPayload memory payload = _createPayload(events, new bytes32[](0));

        (IWavsServiceHandler.Envelope memory envelope, IWavsServiceHandler.SignatureData memory signatureData) =
            _createEnvelopeAndSignature(payload);

        wavsIndexer.handleSignedEnvelope(envelope, signatureData);

        // Test getting events by address 0x1000 and tag "important"
        IWavsIndexer.IndexedEvent[] memory addr1Events =
            wavsIndexer.getEventsByAddressAndTag(address(0x1000), "important", 0, 10, false);
        assertEq(addr1Events.length, 2);

        // Test getting events by address 0x2000 and tag "important"
        IWavsIndexer.IndexedEvent[] memory addr2Events =
            wavsIndexer.getEventsByAddressAndTag(address(0x2000), "important", 0, 10, false);
        assertEq(addr2Events.length, 1);
    }

    function testGetEventsByContractAndType() public {
        IWavsIndexer.IndexedEvent[] memory events = new IWavsIndexer.IndexedEvent[](4);
        events[0] = _createMockEventCustom(
            bytes32(0),
            "1",
            address(0x1),
            1000,
            1000,
            "attestation",
            abi.encode(123),
            new string[](0),
            new address[](0),
            bytes(""),
            false
        );
        events[1] = _createMockEventCustom(
            bytes32(0),
            "1",
            address(0x1),
            1001,
            1001,
            "attestation",
            abi.encode(456),
            new string[](0),
            new address[](0),
            bytes(""),
            false
        );
        events[2] = _createMockEventCustom(
            bytes32(0),
            "1",
            address(0x2),
            1002,
            1002,
            "transfer",
            abi.encode(789),
            new string[](0),
            new address[](0),
            bytes(""),
            false
        );
        events[3] = _createMockEventCustom(
            bytes32(0),
            "2",
            address(0x1),
            1003,
            1003,
            "transfer",
            abi.encode(101112),
            new string[](0),
            new address[](0),
            bytes(""),
            false
        );

        IWavsIndexer.IndexingPayload memory payload = _createPayload(events, new bytes32[](0));

        (IWavsServiceHandler.Envelope memory envelope, IWavsServiceHandler.SignatureData memory signatureData) =
            _createEnvelopeAndSignature(payload);

        wavsIndexer.handleSignedEnvelope(envelope, signatureData);

        // Test getting events by chain ID 1, contract 0x1, and type "attestation"
        IWavsIndexer.IndexedEvent[] memory addr1Attestations =
            wavsIndexer.getEventsByContractAndType("1", address(0x1), "attestation", 0, 10, false);
        assertEq(addr1Attestations.length, 2);
        assertEq(addr1Attestations[0].blockNumber, 1000);
        assertEq(addr1Attestations[1].blockNumber, 1001);

        // Test getting events by chain ID 1, contract 0x2, and type "transfer"
        IWavsIndexer.IndexedEvent[] memory addr2Transfers =
            wavsIndexer.getEventsByContractAndType("1", address(0x2), "transfer", 0, 10, false);
        assertEq(addr2Transfers.length, 1);
        assertEq(addr2Transfers[0].blockNumber, 1002);

        // Test getting events by chain ID 1, contract 0x2, and type "transfer"
        IWavsIndexer.IndexedEvent[] memory addr3Transfers =
            wavsIndexer.getEventsByContractAndType("2", address(0x1), "transfer", 0, 10, false);
        assertEq(addr3Transfers.length, 1);
        assertEq(addr3Transfers[0].blockNumber, 1003);

        // Test getting events by chain ID 2, contract 0x1, and type "unknown"
        IWavsIndexer.IndexedEvent[] memory addr4Unknown =
            wavsIndexer.getEventsByContractAndType("2", address(0x1), "unknown", 0, 10, false);
        assertEq(addr4Unknown.length, 0);
    }

    function testGetEventsByContractAndTag() public {
        // Create events with different relevant addresses and tags
        string[] memory tags1 = new string[](1);
        tags1[0] = "important";

        IWavsIndexer.IndexedEvent[] memory events = new IWavsIndexer.IndexedEvent[](3);
        events[0] = _createMockEventCustom(
            bytes32(0),
            "1",
            address(0x1),
            1000,
            1000,
            "attestation",
            abi.encode(123),
            tags1,
            new address[](0),
            bytes(""),
            false
        );
        events[1] = _createMockEventCustom(
            bytes32(0),
            "1",
            address(0x2),
            1001,
            1001,
            "transfer",
            abi.encode(456),
            tags1,
            new address[](0),
            bytes(""),
            false
        );
        events[2] = _createMockEventCustom(
            bytes32(0),
            "2",
            address(0x1),
            1002,
            1002,
            "system",
            abi.encode(789),
            tags1,
            new address[](0),
            bytes(""),
            false
        );

        IWavsIndexer.IndexingPayload memory payload = _createPayload(events, new bytes32[](0));

        (IWavsServiceHandler.Envelope memory envelope, IWavsServiceHandler.SignatureData memory signatureData) =
            _createEnvelopeAndSignature(payload);

        wavsIndexer.handleSignedEnvelope(envelope, signatureData);

        // Test getting events by chain ID 1, contract 0x1, and tag "important"
        IWavsIndexer.IndexedEvent[] memory addr1Events =
            wavsIndexer.getEventsByContractAndTag("1", address(0x1), "important", 0, 10, false);
        assertEq(addr1Events.length, 1);
        assertEq(addr1Events[0].blockNumber, 1000);

        // Test getting events by chain ID 1, contract 0x2, and tag "important"
        IWavsIndexer.IndexedEvent[] memory addr2Events =
            wavsIndexer.getEventsByContractAndTag("1", address(0x2), "important", 0, 10, false);
        assertEq(addr2Events.length, 1);
        assertEq(addr2Events[0].blockNumber, 1001);

        // Test getting events by chain ID 2, contract 0x1, and tag "important"
        IWavsIndexer.IndexedEvent[] memory addr3Events =
            wavsIndexer.getEventsByContractAndTag("2", address(0x1), "important", 0, 10, false);
        assertEq(addr3Events.length, 1);
        assertEq(addr3Events[0].blockNumber, 1002);
    }

    function testGetEventsByAddressAndTypeAndTag() public {
        address[] memory relevantAddresses1 = new address[](2);
        relevantAddresses1[0] = address(0x1);

        address[] memory relevantAddresses2 = new address[](1);
        relevantAddresses2[0] = address(0x2);

        // Create events with different relevant addresses and tags
        string[] memory tags1 = new string[](2);
        tags1[0] = "schema:0x123";
        tags1[1] = _addressTag("attester", address(0x1));

        string[] memory tags2 = new string[](2);
        tags2[0] = "schema:0x456";
        tags2[1] = _addressTag("attester", address(0x2));

        IWavsIndexer.IndexedEvent[] memory events = new IWavsIndexer.IndexedEvent[](4);
        events[0] = _createMockEventCustom(
            bytes32(0),
            "1",
            address(0x9),
            1000,
            1000,
            "attestation",
            abi.encode(123),
            tags1,
            relevantAddresses1,
            bytes(""),
            false
        );
        events[1] = _createMockEventCustom(
            bytes32(0),
            "1",
            address(0x9),
            1001,
            1001,
            "attestation",
            abi.encode(456),
            tags1,
            relevantAddresses1,
            bytes(""),
            false
        );
        events[2] = _createMockEventCustom(
            bytes32(0),
            "1",
            address(0x9),
            1002,
            1002,
            "attestation",
            abi.encode(789),
            tags2,
            relevantAddresses1,
            bytes(""),
            false
        );
        events[3] = _createMockEventCustom(
            bytes32(0),
            "1",
            address(0x9),
            1003,
            1003,
            "attestation",
            abi.encode(101112),
            tags2,
            relevantAddresses2,
            bytes(""),
            false
        );

        IWavsIndexer.IndexingPayload memory payload = _createPayload(events, new bytes32[](0));

        (IWavsServiceHandler.Envelope memory envelope, IWavsServiceHandler.SignatureData memory signatureData) =
            _createEnvelopeAndSignature(payload);

        wavsIndexer.handleSignedEnvelope(envelope, signatureData);

        // Test getting events by address 0x1, type "attestation", and tag "schema:0x123"
        IWavsIndexer.IndexedEvent[] memory attestations =
            wavsIndexer.getEventsByAddressAndTypeAndTag(address(0x1), "attestation", "schema:0x123", 0, 10, false);
        assertEq(attestations.length, 2);
        assertEq(attestations[0].eventId, _generateEventId(1, 0));
        assertEq(attestations[0].eventType, "attestation");
        assertEq(attestations[0].tags[0], "schema:0x123");
        assertEq(attestations[0].tags[1], _addressTag("attester", address(0x1)));
        assertEq(attestations[0].data, abi.encode(123));
        assertEq(attestations[1].eventId, _generateEventId(1, 1));
        assertEq(attestations[1].eventType, "attestation");
        assertEq(attestations[1].tags[0], "schema:0x123");
        assertEq(attestations[1].tags[1], _addressTag("attester", address(0x1)));
        assertEq(attestations[1].data, abi.encode(456));

        // Test getting events by address 0x1, type "attestation", and tag "schema:0x456"
        IWavsIndexer.IndexedEvent[] memory attestations2 =
            wavsIndexer.getEventsByAddressAndTypeAndTag(address(0x1), "attestation", "schema:0x456", 0, 10, false);
        assertEq(attestations2.length, 1);
        assertEq(attestations2[0].eventId, _generateEventId(1, 2));
        assertEq(attestations2[0].eventType, "attestation");
        assertEq(attestations2[0].tags[0], "schema:0x456");
        assertEq(attestations2[0].tags[1], _addressTag("attester", address(0x2)));
        assertEq(attestations2[0].data, abi.encode(789));

        // Test getting events by address 0x2, type "attestation", and tag "attester:0x456"
        IWavsIndexer.IndexedEvent[] memory attestations3 = wavsIndexer.getEventsByAddressAndTypeAndTag(
            address(0x2), "attestation", _addressTag("attester", address(0x2)), 0, 10, false
        );
        assertEq(attestations3.length, 1);
        assertEq(attestations3[0].eventId, _generateEventId(1, 3));
        assertEq(attestations3[0].eventType, "attestation");
        assertEq(attestations3[0].tags[0], "schema:0x456");
        assertEq(attestations3[0].tags[1], _addressTag("attester", address(0x2)));
        assertEq(attestations3[0].data, abi.encode(101112));
    }

    function testGetEventsByContractAndTypeAndTag() public {
        // Create events with different relevant addresses and tags
        string[] memory tags1 = new string[](2);
        tags1[0] = "schema:0x123";
        tags1[1] = _addressTag("attester", address(0x1));

        string[] memory tags2 = new string[](2);
        tags2[0] = "schema:0x456";
        tags2[1] = _addressTag("attester", address(0x2));

        IWavsIndexer.IndexedEvent[] memory events = new IWavsIndexer.IndexedEvent[](6);
        events[0] = _createMockEventCustom(
            bytes32(0),
            "1",
            address(0x1),
            1000,
            1000,
            "attestation",
            abi.encode(123),
            tags1,
            new address[](0),
            bytes(""),
            false
        );
        events[1] = _createMockEventCustom(
            bytes32(0),
            "1",
            address(0x1),
            1001,
            1001,
            "attestation",
            abi.encode(456),
            tags1,
            new address[](0),
            bytes(""),
            false
        );
        events[2] = _createMockEventCustom(
            bytes32(0),
            "1",
            address(0x1),
            1002,
            1002,
            "attestation",
            abi.encode(789),
            tags2,
            new address[](0),
            bytes(""),
            false
        );
        events[3] = _createMockEventCustom(
            bytes32(0),
            "1",
            address(0x1),
            1003,
            1003,
            "attestation",
            abi.encode(101112),
            tags2,
            new address[](0),
            bytes(""),
            false
        );
        events[4] = _createMockEventCustom(
            bytes32(0),
            "1",
            address(0x1),
            1004,
            1004,
            "attestation",
            abi.encode(131415),
            new string[](0),
            new address[](0),
            bytes(""),
            false
        );
        events[5] = _createMockEventCustom(
            bytes32(0),
            "2",
            address(0x1),
            1005,
            1005,
            "attestation",
            abi.encode(161718),
            tags2,
            new address[](0),
            bytes(""),
            false
        );

        IWavsIndexer.IndexingPayload memory payload = _createPayload(events, new bytes32[](0));

        (IWavsServiceHandler.Envelope memory envelope, IWavsServiceHandler.SignatureData memory signatureData) =
            _createEnvelopeAndSignature(payload);

        wavsIndexer.handleSignedEnvelope(envelope, signatureData);

        // Test getting events by chain ID 1, contract 0x1, type "attestation", and tag "schema:0x123"
        IWavsIndexer.IndexedEvent[] memory attestations =
            wavsIndexer.getEventsByContractAndTypeAndTag("1", address(0x1), "attestation", "schema:0x123", 0, 10, false);
        assertEq(attestations.length, 2);
        assertEq(attestations[0].blockNumber, 1000);
        assertEq(attestations[1].blockNumber, 1001);

        // Test getting events by chain ID 1, contract 0x1, type "attestation", and tag "schema:0x456"
        IWavsIndexer.IndexedEvent[] memory attestations2 =
            wavsIndexer.getEventsByContractAndTypeAndTag("1", address(0x1), "attestation", "schema:0x456", 0, 10, false);
        assertEq(attestations2.length, 2);
        assertEq(attestations2[0].blockNumber, 1002);
        assertEq(attestations2[1].blockNumber, 1003);

        // Test getting events by chain ID 1, contract 0x1, type "attestation", and tag "attester:0x456"
        IWavsIndexer.IndexedEvent[] memory attestations3 = wavsIndexer.getEventsByContractAndTypeAndTag(
            "1", address(0x1), "attestation", _addressTag("attester", address(0x2)), 0, 10, false
        );
        assertEq(attestations3.length, 2);
        assertEq(attestations3[0].blockNumber, 1002);
        assertEq(attestations3[1].blockNumber, 1003);

        // Test getting events by chain ID 2, contract 0x1, type "attestation", and tag "attester:0x456"
        IWavsIndexer.IndexedEvent[] memory attestations4 = wavsIndexer.getEventsByContractAndTypeAndTag(
            "2", address(0x1), "attestation", _addressTag("attester", address(0x2)), 0, 10, false
        );
        assertEq(attestations4.length, 1);
        assertEq(attestations4[0].blockNumber, 1005);
    }

    function testCountFunctions() public {
        // Create diverse events for count testing
        string[] memory tags1 = new string[](1);
        tags1[0] = "important";

        address[] memory relevantAddresses1 = new address[](1);
        relevantAddresses1[0] = address(0x1000);

        IWavsIndexer.IndexedEvent[] memory events = new IWavsIndexer.IndexedEvent[](5);
        events[0] = _createMockEventCustom(
            bytes32(0),
            "1",
            address(0x100),
            1000,
            1000,
            "attestation",
            abi.encode(123),
            tags1,
            relevantAddresses1,
            bytes(""),
            false
        );
        events[1] = _createMockEventCustom(
            bytes32(0),
            "1",
            address(0x100),
            1001,
            1001,
            "transfer",
            abi.encode(456),
            tags1,
            relevantAddresses1,
            bytes(""),
            false
        );
        events[2] = _createMockEventCustom(
            bytes32(0),
            "2",
            address(0x200),
            1002,
            1002,
            "attestation",
            abi.encode(789),
            tags1,
            relevantAddresses1,
            bytes(""),
            false
        );
        events[3] = _createMockEventCustom(
            bytes32(0),
            "1",
            address(0x100),
            1003,
            1003,
            "attestation",
            abi.encode(101112),
            new string[](0),
            new address[](0),
            bytes(""),
            false
        );
        events[4] = _createMockEventCustom(
            bytes32(0),
            "1",
            address(0x200),
            1004,
            1004,
            "transfer",
            abi.encode(131415),
            new string[](0),
            new address[](0),
            bytes(""),
            false
        );

        IWavsIndexer.IndexingPayload memory payload = _createPayload(events, new bytes32[](0));

        (IWavsServiceHandler.Envelope memory envelope, IWavsServiceHandler.SignatureData memory signatureData) =
            _createEnvelopeAndSignature(payload);

        wavsIndexer.handleSignedEnvelope(envelope, signatureData);

        // Test count functions
        assertEq(wavsIndexer.totalEvents(), 5);

        // Test getEventCountByChainId
        assertEq(wavsIndexer.getEventCountByChainId("1"), 4);
        assertEq(wavsIndexer.getEventCountByChainId("2"), 1);

        // Test getEventCountByContract
        assertEq(wavsIndexer.getEventCountByContract("1", address(0x100)), 3);
        assertEq(wavsIndexer.getEventCountByContract("1", address(0x200)), 1);
        assertEq(wavsIndexer.getEventCountByContract("2", address(0x200)), 1);

        // Test getEventCountByAddress
        assertEq(wavsIndexer.getEventCountByAddress(address(0x1000)), 3);
        assertEq(wavsIndexer.getEventCountByAddress(address(0x2000)), 0);

        // Test getEventCountByType
        assertEq(wavsIndexer.getEventCountByType("attestation"), 3);
        assertEq(wavsIndexer.getEventCountByType("transfer"), 2);

        // Test getEventCountByTag
        assertEq(wavsIndexer.getEventCountByTag("important"), 3);

        // Test getEventCountByContractAndAddress
        assertEq(wavsIndexer.getEventCountByContractAndAddress("1", address(0x100), address(0x1000)), 2);
        assertEq(wavsIndexer.getEventCountByContractAndAddress("2", address(0x200), address(0x1000)), 1);
        assertEq(wavsIndexer.getEventCountByContractAndAddress("2", address(0x200), address(0x2000)), 0);
        assertEq(wavsIndexer.getEventCountByContractAndAddress("1", address(0x200), address(0x1000)), 0);

        // Test getEventCountByTypeAndTag
        assertEq(wavsIndexer.getEventCountByTypeAndTag("attestation", "important"), 2);
        assertEq(wavsIndexer.getEventCountByTypeAndTag("transfer", "important"), 1);

        // Test getEventCountByAddressAndType
        assertEq(wavsIndexer.getEventCountByAddressAndType(address(0x1000), "attestation"), 2);
        assertEq(wavsIndexer.getEventCountByAddressAndType(address(0x1000), "transfer"), 1);

        // Test getEventCountByAddressAndTag
        assertEq(wavsIndexer.getEventCountByAddressAndTag(address(0x1000), "important"), 3);

        // Test getEventCountByContractAndType
        assertEq(wavsIndexer.getEventCountByContractAndType("1", address(0x100), "attestation"), 2);
        assertEq(wavsIndexer.getEventCountByContractAndType("1", address(0x100), "transfer"), 1);
        assertEq(wavsIndexer.getEventCountByContractAndType("2", address(0x100), "transfer"), 0);
        assertEq(wavsIndexer.getEventCountByContractAndType("1", address(0x200), "transfer"), 1);

        // Test getEventCountByContractAndTag
        assertEq(wavsIndexer.getEventCountByContractAndTag("1", address(0x100), "important"), 2);
        assertEq(wavsIndexer.getEventCountByContractAndTag("2", address(0x200), "important"), 1);

        // Test getEventCountByAddressAndTypeAndTag
        assertEq(wavsIndexer.getEventCountByAddressAndTypeAndTag(address(0x1000), "attestation", "important"), 2);
        assertEq(wavsIndexer.getEventCountByAddressAndTypeAndTag(address(0x1000), "transfer", "important"), 1);

        // Test getEventCountByContractAndTypeAndTag
        assertEq(wavsIndexer.getEventCountByContractAndTypeAndTag("1", address(0x100), "attestation", "important"), 1);
        assertEq(wavsIndexer.getEventCountByContractAndTypeAndTag("1", address(0x100), "transfer", "important"), 1);
        assertEq(wavsIndexer.getEventCountByContractAndTypeAndTag("2", address(0x200), "attestation", "important"), 1);
        assertEq(wavsIndexer.getEventCountByContractAndTypeAndTag("1", address(0x200), "attestation", "important"), 0);
    }

    function testPagination() public {
        // Create multiple events for pagination testing
        IWavsIndexer.IndexedEvent[] memory events = new IWavsIndexer.IndexedEvent[](10);
        for (uint256 i = 0; i < 10; i++) {
            events[i] = _createMockEventCustom(
                bytes32(0),
                "1",
                address(0x1),
                1000 + i,
                1000 + i,
                "attestation",
                abi.encode(i),
                new string[](0),
                new address[](0),
                bytes(""),
                false
            );
        }

        IWavsIndexer.IndexingPayload memory payload = _createPayload(events, new bytes32[](0));

        (IWavsServiceHandler.Envelope memory envelope, IWavsServiceHandler.SignatureData memory signatureData) =
            _createEnvelopeAndSignature(payload);

        wavsIndexer.handleSignedEnvelope(envelope, signatureData);

        // Test pagination - get first 3 events
        IWavsIndexer.IndexedEvent[] memory page1 = wavsIndexer.getEventsByChainId("1", 0, 3, false);
        assertEq(page1.length, 3);
        assertEq(page1[0].blockNumber, 1000);
        assertEq(page1[1].blockNumber, 1001);
        assertEq(page1[2].blockNumber, 1002);

        // Test pagination - get next 3 events
        IWavsIndexer.IndexedEvent[] memory page2 = wavsIndexer.getEventsByChainId("1", 3, 3, false);
        assertEq(page2.length, 3);
        assertEq(page2[0].blockNumber, 1003);
        assertEq(page2[1].blockNumber, 1004);
        assertEq(page2[2].blockNumber, 1005);

        // Test reverse order pagination
        IWavsIndexer.IndexedEvent[] memory reversePage = wavsIndexer.getEventsByChainId("1", 0, 3, true);
        assertEq(reversePage.length, 3);
        assertEq(reversePage[0].blockNumber, 1009); // Last event first
        assertEq(reversePage[1].blockNumber, 1008);
        assertEq(reversePage[2].blockNumber, 1007);
    }

    function testInvalidOffsetRevert() public {
        // Create one event
        IWavsIndexer.IndexedEvent[] memory events = new IWavsIndexer.IndexedEvent[](1);
        events[0] = _createMockEvent(0, abi.encode(123), "attestation");

        IWavsIndexer.IndexingPayload memory payload = _createPayload(events, new bytes32[](0));

        (IWavsServiceHandler.Envelope memory envelope, IWavsServiceHandler.SignatureData memory signatureData) =
            _createEnvelopeAndSignature(payload);

        wavsIndexer.handleSignedEnvelope(envelope, signatureData);

        // Test invalid offset (should revert)
        vm.expectRevert(IWavsIndexer.InvalidOffset.selector);
        wavsIndexer.getEventsByChainId("1", 10, 1, false); // offset 10 but only 1 event exists
    }

    function testGetServiceManager() public view {
        address serviceManagerAddress = wavsIndexer.getServiceManager();
        assertEq(serviceManagerAddress, address(mockServiceManager));
    }

    // ================================
    // Attestation Tag Query Tests
    // ================================

    function testQueryAttestations() public {
        string memory schema1 = "0xschema1";
        string memory schema2 = "0xschema2";

        address user1 = address(0x1);
        address user2 = address(0x2);
        address user3 = address(0x3);

        // Create attestations:
        // user1 -> user2 -> schema1
        // user1 -> user3 -> schema1
        // user2 -> user3 -> schema2
        // user3 -> user1 -> schema1
        // user3 -> user2 -> schema2

        IWavsIndexer.IndexedEvent[] memory events = new IWavsIndexer.IndexedEvent[](5);
        events[0] = _createMockAttestationEvent(1000, schema1, user1, user2, abi.encode(0));
        events[1] = _createMockAttestationEvent(1001, schema1, user1, user3, abi.encode(1));
        events[2] = _createMockAttestationEvent(1002, schema2, user2, user3, abi.encode(2));
        events[3] = _createMockAttestationEvent(1003, schema1, user3, user1, abi.encode(3));
        events[4] = _createMockAttestationEvent(1004, schema2, user3, user2, abi.encode(4));

        IWavsIndexer.IndexingPayload memory payload = _createPayload(events, new bytes32[](0));

        (IWavsServiceHandler.Envelope memory envelope, IWavsServiceHandler.SignatureData memory signatureData) =
            _createEnvelopeAndSignature(payload);

        wavsIndexer.handleSignedEnvelope(envelope, signatureData);

        // Test getting attestations by schema
        IWavsIndexer.IndexedEvent[] memory attestationEvents =
            wavsIndexer.getEventsByTypeAndTag("attestation", string.concat("schema:", schema1), 0, 10, false);
        assertEq(attestationEvents.length, 3);
        assertEq(attestationEvents[0].eventId, _generateEventId(1, 0));
        assertEq(attestationEvents[0].eventType, "attestation");
        assertEq(attestationEvents[0].tags[0], "schema:0xschema1");
        assertEq(attestationEvents[0].tags[1], _addressTag("attester", user1));
        assertEq(attestationEvents[0].tags[2], _addressTag("recipient", user2));
        assertEq(attestationEvents[1].eventId, _generateEventId(1, 1));
        assertEq(attestationEvents[1].eventType, "attestation");
        assertEq(attestationEvents[1].tags[0], "schema:0xschema1");
        assertEq(attestationEvents[1].tags[1], _addressTag("attester", user1));
        assertEq(attestationEvents[1].tags[2], _addressTag("recipient", user3));
        assertEq(attestationEvents[2].eventId, _generateEventId(1, 3));
        assertEq(attestationEvents[2].eventType, "attestation");
        assertEq(attestationEvents[2].tags[0], "schema:0xschema1");
        assertEq(attestationEvents[2].tags[1], _addressTag("attester", user3));
        assertEq(attestationEvents[2].tags[2], _addressTag("recipient", user1));

        // Test getting attestations by attester
        IWavsIndexer.IndexedEvent[] memory attestationsBySender =
            wavsIndexer.getEventsByTypeAndTag("attestation", _addressTag("attester", user3), 0, 10, false);
        assertEq(attestationsBySender.length, 2);
        assertEq(attestationsBySender[0].eventId, _generateEventId(1, 3));
        assertEq(attestationsBySender[0].eventType, "attestation");
        assertEq(attestationsBySender[0].tags[0], "schema:0xschema1");
        assertEq(attestationsBySender[0].tags[1], _addressTag("attester", user3));
        assertEq(attestationsBySender[0].tags[2], _addressTag("recipient", user1));
        assertEq(attestationsBySender[1].eventId, _generateEventId(1, 4));
        assertEq(attestationsBySender[1].eventType, "attestation");
        assertEq(attestationsBySender[1].tags[0], "schema:0xschema2");
        assertEq(attestationsBySender[1].tags[1], _addressTag("attester", user3));
        assertEq(attestationsBySender[1].tags[2], _addressTag("recipient", user2));

        // Test getting attestations by recipient
        IWavsIndexer.IndexedEvent[] memory attestationsByRecipient =
            wavsIndexer.getEventsByTypeAndTag("attestation", _addressTag("recipient", user2), 0, 10, false);
        assertEq(attestationsByRecipient.length, 2);
        assertEq(attestationsByRecipient[0].eventId, _generateEventId(1, 0));
        assertEq(attestationsByRecipient[0].eventType, "attestation");
        assertEq(attestationsByRecipient[0].tags[0], "schema:0xschema1");
        assertEq(attestationsByRecipient[0].tags[1], _addressTag("attester", user1));
        assertEq(attestationsByRecipient[0].tags[2], _addressTag("recipient", user2));
        assertEq(attestationsByRecipient[1].eventId, _generateEventId(1, 4));
        assertEq(attestationsByRecipient[1].eventType, "attestation");
        assertEq(attestationsByRecipient[1].tags[0], "schema:0xschema2");
        assertEq(attestationsByRecipient[1].tags[1], _addressTag("attester", user3));
        assertEq(attestationsByRecipient[1].tags[2], _addressTag("recipient", user2));
    }

    // ================================
    // Helper functions
    // ================================

    // Helper function to create a mock indexed event
    function _createMockEvent(uint256 eventId, bytes memory dataValue, string memory eventType)
        internal
        pure
        returns (IWavsIndexer.IndexedEvent memory)
    {
        string[] memory tags = new string[](1);
        tags[0] = "tag";
        address[] memory relevantAddresses = new address[](1);
        relevantAddresses[0] = address(0x1);
        bytes memory metadata = bytes("");

        return _createMockEventCustom(
            bytes32(eventId),
            "1",
            address(0x1),
            1000,
            1000,
            eventType,
            dataValue,
            tags,
            relevantAddresses,
            metadata,
            false
        );
    }

    // Helper function to create a mock attestation event
    function _createMockAttestationEvent(
        uint256 blockNumber,
        string memory schema,
        address attester,
        address recipient,
        bytes memory data
    ) internal pure returns (IWavsIndexer.IndexedEvent memory) {
        string[] memory tags = new string[](3);
        tags[0] = string.concat("schema:", schema);
        tags[1] = _addressTag("attester", attester);
        tags[2] = _addressTag("recipient", recipient);
        return _createMockEventCustom(
            bytes32(0),
            "1",
            address(0x1),
            blockNumber,
            blockNumber,
            "attestation",
            data,
            tags,
            new address[](0),
            bytes(""),
            false
        );
    }

    // Helper function to create a mock indexed event with custom parameters
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
        bytes memory metadata,
        bool deleted
    ) internal pure returns (IWavsIndexer.IndexedEvent memory) {
        return IWavsIndexer.IndexedEvent({
            eventId: eventId,
            chainId: chainId,
            relevantContract: relevantContract,
            blockNumber: blockNumber,
            timestamp: timestamp,
            eventType: eventType,
            data: data,
            tags: tags,
            relevantAddresses: relevantAddresses,
            metadata: metadata,
            deleted: deleted
        });
    }

    function _addressTag(string memory prefix, address addr) internal pure returns (string memory) {
        return string.concat(prefix, ":", Strings.toChecksumHexString(addr));
    }

    // Helper function to create an indexing payload
    function _createPayload(IWavsIndexer.IndexedEvent[] memory toAdd, bytes32[] memory toDelete)
        internal
        pure
        returns (IWavsIndexer.IndexingPayload memory)
    {
        return IWavsIndexer.IndexingPayload({toAdd: toAdd, toDelete: toDelete});
    }

    // Helper function to create mock signature data
    function _createMockSignatureData() internal pure returns (IWavsServiceHandler.SignatureData memory) {
        address[] memory signers = new address[](1);
        signers[0] = address(0x456);
        bytes[] memory signatures = new bytes[](1);
        signatures[0] = abi.encodePacked("mock_signature");

        return IWavsServiceHandler.SignatureData({signers: signers, signatures: signatures, referenceBlock: 1000});
    }

    // Helper function to create an envelope with payload
    function _createEnvelope(bytes20 eventId, bytes12 ordering, IWavsIndexer.IndexingPayload memory payload)
        internal
        pure
        returns (IWavsServiceHandler.Envelope memory)
    {
        bytes memory encodedPayload = abi.encode(payload);

        return IWavsServiceHandler.Envelope({eventId: eventId, ordering: ordering, payload: encodedPayload});
    }

    // Helper function to create envelope and signature data from payload
    function _createEnvelopeAndSignature(IWavsIndexer.IndexingPayload memory payload)
        internal
        pure
        returns (IWavsServiceHandler.Envelope memory envelope, IWavsServiceHandler.SignatureData memory signatureData)
    {
        envelope = _createEnvelope(bytes20(uint160(0x1)), bytes12(uint96(0)), payload);
        signatureData = _createMockSignatureData();
    }

    // Helper function to generate unique event ID from envelope data
    function _generateEventId(uint160 envelopeEventId, uint96 index) internal pure returns (bytes32) {
        return bytes32(abi.encodePacked(bytes20(envelopeEventId), bytes12(index)));
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

    function validate(IWavsServiceHandler.Envelope calldata, IWavsServiceHandler.SignatureData calldata)
        external
        pure
    {
        // Mock validation - always passes for testing
        return;
    }

    function getOperatorWeight(address) external pure returns (uint256) {
        // Return a default weight for testing
        return 100;
    }

    function getLatestOperatorForSigningKey(address) external pure returns (address) {
        // Return a mock operator address
        return address(0x1234567890123456789012345678901234567890);
    }

    function getServiceURI() external pure returns (string memory) {
        // Return a mock service URI
        return "https://mock-service.example.com";
    }
}
