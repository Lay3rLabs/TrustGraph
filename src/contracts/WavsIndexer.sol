// SPDX-License-Identifier: MIT

pragma solidity 0.8.27;

import {IWavsServiceManager} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceManager.sol";
import {IWavsServiceHandler} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceHandler.sol";
import {ITypes} from "../interfaces/ITypes.sol";
import {IWavsIndexer} from "../interfaces/IWavsIndexer.sol";
import {Semver} from "@ethereum-attestation-service/eas-contracts/contracts/Semver.sol";
import {EMPTY_UID, uncheckedInc} from "@ethereum-attestation-service/eas-contracts/contracts/Common.sol";

/// @title WavsIndexer
/// @notice An indexing service for arbitrary blockchain events and data running on WAVS
/// @dev Integrates with WAVS to receive indexed data from off-chain components
contract WavsIndexer is IWavsServiceHandler, IWavsIndexer, Semver {
    // Core storage mappings
    mapping(bytes32 => IndexedEvent) public events;
    mapping(bytes32 => bool) public eventExists;

    // Multi-dimensional indexing for efficient queries
    mapping(string => bytes32[]) public eventsByChainId;
    mapping(string => mapping(address => bytes32[]))
        public eventsByChainIdAndContract;
    mapping(string => bytes32[]) public eventsByType;
    mapping(string => bytes32[]) public eventsByTag;
    mapping(address => bytes32[]) public eventsByAddress;

    // Combined indexing for common query patterns (gas optimization)
    mapping(address => mapping(string => bytes32[]))
        public eventsByAddressAndTag;
    mapping(address => mapping(string => bytes32[]))
        public eventsByAddressAndType;
    mapping(string => mapping(string => bytes32[])) public eventsByTypeAndTag;
    mapping(address => mapping(string => mapping(string => bytes32[])))
        public eventsByAddressAndTypeAndTag;

    // Global counters
    uint256 public totalEvents;

    // WAVS service manager
    IWavsServiceManager private _serviceManager;

    /// @notice Creates a new WavsIndexer instance
    /// @param serviceManager The WAVS service manager contract
    constructor(IWavsServiceManager serviceManager) Semver(1, 0, 0) {
        if (address(serviceManager) == address(0)) {
            revert InvalidServiceManager();
        }
        _serviceManager = serviceManager;
    }

    /// @inheritdoc IWavsServiceHandler
    /// @notice Handles signed envelope from WAVS containing indexing data
    function handleSignedEnvelope(
        IWavsServiceHandler.Envelope calldata envelope,
        IWavsServiceHandler.SignatureData calldata signatureData
    ) external override {
        // Validate envelope through service manager
        _serviceManager.validate(envelope, signatureData);

        // Decode the indexing payload
        IndexingPayload memory payload;
        try this.decodeIndexingPayload(envelope.payload) returns (
            IndexingPayload memory decodedPayload
        ) {
            payload = decodedPayload;
        } catch {
            revert PayloadDecodingFailed();
        }

        if (payload.toAdd.length == 0 && payload.toDelete.length == 0) {
            revert NoEvents();
        }

        // Process the indexing operation
        if (payload.toAdd.length > 0) {
            _batchIndexEvents(envelope.eventId, payload.toAdd);
        }
        if (payload.toDelete.length > 0) {
            _batchDeleteEvents(payload.toDelete);
        }
    }

    /// @notice Helper function for decoding IndexingPayload
    function decodeIndexingPayload(
        bytes calldata payload
    ) external pure returns (IndexingPayload memory) {
        return abi.decode(payload, (IndexingPayload));
    }

    /// @notice Indexes a single event
    /// @param event_ The event to index
    function _indexEvent(bytes32 eventId, IndexedEvent memory event_) internal {
        // validate that the eventId is not already set, since it should only be set by this contract
        if (event_.eventId != bytes32(0)) {
            revert ExpectedEventIdZero();
        }

        // override eventId with the one provided
        event_.eventId = eventId;

        if (eventExists[eventId]) {
            revert EventAlreadyExists();
        }

        if (event_.deleted) {
            revert CannotCreateDeletedEvent();
        }

        // Store the event
        events[eventId] = event_;
        eventExists[eventId] = true;
        totalEvents++;

        // Index by chain ID
        eventsByChainId[event_.chainId].push(eventId);

        // Index by relevant contract
        eventsByChainIdAndContract[event_.chainId][event_.relevantContract]
            .push(eventId);

        // Index by event type
        eventsByType[event_.eventType].push(eventId);

        // Index by tags
        for (uint256 i = 0; i < event_.tags.length; i = uncheckedInc(i)) {
            string memory tag = event_.tags[i];
            eventsByTag[tag].push(eventId);
            eventsByTypeAndTag[event_.eventType][tag].push(eventId);
        }

        // Index by relevant addresses
        for (
            uint256 i = 0;
            i < event_.relevantAddresses.length;
            i = uncheckedInc(i)
        ) {
            address addr = event_.relevantAddresses[i];
            eventsByAddress[addr].push(eventId);
            eventsByAddressAndType[addr][event_.eventType].push(eventId);

            // Cross-index with tags for efficient combined queries
            for (uint256 j = 0; j < event_.tags.length; j = uncheckedInc(j)) {
                eventsByAddressAndTag[addr][event_.tags[j]].push(eventId);
                eventsByAddressAndTypeAndTag[addr][event_.eventType][
                    event_.tags[j]
                ].push(eventId);
            }
        }

        emit EventIndexed(
            eventId,
            event_.relevantContract,
            event_.eventType,
            event_.relevantAddresses,
            event_.tags
        );
    }

    /// @notice Indexes multiple events in a batch
    /// @param events_ Array of events to index
    function _batchIndexEvents(
        bytes20 baseEventId,
        IndexedEvent[] memory events_
    ) internal {
        for (uint256 i = 0; i < events_.length; i = uncheckedInc(i)) {
            // concat 20-byte eventId with 12-byte index
            bytes32 eventId = bytes32(
                abi.encodePacked(baseEventId, bytes12(uint96(i)))
            );

            // index the event
            _indexEvent(eventId, events_[i]);
        }
    }

    /// @notice Deletes multiple events in a batch
    /// @param eventIds_ Array of event IDs to delete
    function _batchDeleteEvents(bytes32[] memory eventIds_) internal {
        for (uint256 i = 0; i < eventIds_.length; i = uncheckedInc(i)) {
            _deleteEvent(eventIds_[i]);
        }
    }

    /// @notice Deletes an event (marks as deleted, keeps data for audit)
    /// @param eventId The ID of the event to delete
    function _deleteEvent(bytes32 eventId) internal {
        if (!eventExists[eventId]) {
            revert EventDoesNotExist();
        }

        if (events[eventId].deleted) {
            revert EventAlreadyDeleted();
        }

        // Mark as deleted
        events[eventId].deleted = true;

        emit EventDeleted(eventId);
    }

    // ============ QUERY FUNCTIONS ============

    /// @notice Checks whether an event exists and is deleted
    /// @param eventId The ID of the event to check
    /// @return true if the event exists and is deleted, false otherwise
    function eventExistsAndDeleted(
        bytes32 eventId
    ) external view returns (bool) {
        return eventExists[eventId] && events[eventId].deleted;
    }

    /// @notice Gets events by chain ID
    /// @param chainId The chain ID to filter by
    /// @param start The offset to start from
    /// @param length The number of events to retrieve
    /// @param reverseOrder Whether to return in reverse chronological order
    /// @return Array of IndexedEvent structs
    function getEventsByChainId(
        string calldata chainId,
        uint256 start,
        uint256 length,
        bool reverseOrder
    ) external view returns (IndexedEvent[] memory) {
        bytes32[] memory eventIds = _sliceUIDs(
            eventsByChainId[chainId],
            start,
            length,
            reverseOrder
        );

        return _getEventsByIds(eventIds);
    }

    /// @notice Gets events by contract
    /// @param chainId The chain ID of the contract to filter by
    /// @param relevantContract The contract to filter by
    /// @param start The offset to start from
    /// @param length The number of events to retrieve
    /// @param reverseOrder Whether to return in reverse chronological order
    /// @return Array of IndexedEvent structs
    function getEventsByContract(
        string calldata chainId,
        address relevantContract,
        uint256 start,
        uint256 length,
        bool reverseOrder
    ) external view returns (IndexedEvent[] memory) {
        bytes32[] memory eventIds = _sliceUIDs(
            eventsByChainIdAndContract[chainId][relevantContract],
            start,
            length,
            reverseOrder
        );

        return _getEventsByIds(eventIds);
    }

    /// @notice Gets events by type
    /// @param eventType The event type to filter by
    /// @param start The offset to start from
    /// @param length The number of events to retrieve
    /// @param reverseOrder Whether to return in reverse chronological order
    /// @return Array of IndexedEvent structs
    function getEventsByType(
        string calldata eventType,
        uint256 start,
        uint256 length,
        bool reverseOrder
    ) external view returns (IndexedEvent[] memory) {
        bytes32[] memory eventIds = _sliceUIDs(
            eventsByType[eventType],
            start,
            length,
            reverseOrder
        );

        return _getEventsByIds(eventIds);
    }

    /// @notice Gets events by tag
    /// @param tag The tag to filter by
    /// @param start The offset to start from
    /// @param length The number of events to retrieve
    /// @param reverseOrder Whether to return in reverse chronological order
    /// @return Array of IndexedEvent structs
    function getEventsByTag(
        string calldata tag,
        uint256 start,
        uint256 length,
        bool reverseOrder
    ) external view returns (IndexedEvent[] memory) {
        bytes32[] memory eventIds = _sliceUIDs(
            eventsByTag[tag],
            start,
            length,
            reverseOrder
        );

        return _getEventsByIds(eventIds);
    }

    /// @notice Gets events by address and tag combination
    /// @param relevantAddress The address to filter by
    /// @param tag The tag to filter by
    /// @param start The offset to start from
    /// @param length The number of events to retrieve
    /// @param reverseOrder Whether to return in reverse chronological order
    /// @return Array of IndexedEvent structs
    function getEventsByAddressAndTag(
        address relevantAddress,
        string memory tag,
        uint256 start,
        uint256 length,
        bool reverseOrder
    ) external view returns (IndexedEvent[] memory) {
        bytes32[] memory eventIds = _sliceUIDs(
            eventsByAddressAndTag[relevantAddress][tag],
            start,
            length,
            reverseOrder
        );

        return _getEventsByIds(eventIds);
    }

    /// @notice Gets events by address and type combination
    /// @param relevantAddress The address to filter by
    /// @param eventType The event type to filter by
    /// @param start The offset to start from
    /// @param length The number of events to retrieve
    /// @param reverseOrder Whether to return in reverse chronological order
    /// @return Array of IndexedEvent structs
    function getEventsByAddressAndType(
        address relevantAddress,
        string calldata eventType,
        uint256 start,
        uint256 length,
        bool reverseOrder
    ) external view returns (IndexedEvent[] memory) {
        bytes32[] memory eventIds = _sliceUIDs(
            eventsByAddressAndType[relevantAddress][eventType],
            start,
            length,
            reverseOrder
        );

        return _getEventsByIds(eventIds);
    }

    /// @notice Gets events by type and tag combination
    /// @param eventType The event type to filter by
    /// @param tag The tag to filter by
    /// @param start The offset to start from
    /// @param length The number of events to retrieve
    /// @param reverseOrder Whether to return in reverse chronological order
    /// @return Array of IndexedEvent structs
    function getEventsByTypeAndTag(
        string calldata eventType,
        string calldata tag,
        uint256 start,
        uint256 length,
        bool reverseOrder
    ) external view returns (IndexedEvent[] memory) {
        bytes32[] memory eventIds = _sliceUIDs(
            eventsByTypeAndTag[eventType][tag],
            start,
            length,
            reverseOrder
        );

        return _getEventsByIds(eventIds);
    }

    /// @notice Gets events by address, type, and tag combination
    /// @param relevantAddress The address to filter by
    /// @param eventType The event type to filter by
    /// @param tag The tag to filter by
    /// @param start The offset to start from
    /// @param length The number of events to retrieve
    /// @param reverseOrder Whether to return in reverse chronological order
    /// @return Array of IndexedEvent structs
    function getEventsByAddressAndTypeAndTag(
        address relevantAddress,
        string calldata eventType,
        string calldata tag,
        uint256 start,
        uint256 length,
        bool reverseOrder
    ) external view returns (IndexedEvent[] memory) {
        bytes32[] memory eventIds = _sliceUIDs(
            eventsByAddressAndTypeAndTag[relevantAddress][eventType][tag],
            start,
            length,
            reverseOrder
        );

        return _getEventsByIds(eventIds);
    }

    // ============ COUNT FUNCTIONS ============

    /// @notice Gets total number of events by chain ID
    function getEventCountByChainId(
        string calldata chainId
    ) external view returns (uint256) {
        return eventsByChainId[chainId].length;
    }

    /// @notice Gets total number of events by contract
    function getEventCountByContract(
        string calldata chainId,
        address relevantContract
    ) external view returns (uint256) {
        return eventsByChainIdAndContract[chainId][relevantContract].length;
    }

    /// @notice Gets total number of events by type
    function getEventCountByType(
        string calldata eventType
    ) external view returns (uint256) {
        return eventsByType[eventType].length;
    }

    /// @notice Gets total number of events by tag
    function getEventCountByTag(
        string calldata tag
    ) external view returns (uint256) {
        return eventsByTag[tag].length;
    }

    /// @notice Gets total number of events for an address and tag
    function getEventCountByAddressAndTag(
        address addr,
        string calldata tag
    ) external view returns (uint256) {
        return eventsByAddressAndTag[addr][tag].length;
    }

    /// @notice Gets total number of events for an address and type
    function getEventCountByAddressAndType(
        address addr,
        string calldata eventType
    ) external view returns (uint256) {
        return eventsByAddressAndType[addr][eventType].length;
    }

    /// @notice Gets total number of events for a type and tag
    function getEventCountByTypeAndTag(
        string calldata eventType,
        string calldata tag
    ) external view returns (uint256) {
        return eventsByTypeAndTag[eventType][tag].length;
    }

    /// @notice Gets total number of events for an address, type, and tag
    function getEventCountByAddressAndTypeAndTag(
        address addr,
        string calldata eventType,
        string calldata tag
    ) external view returns (uint256) {
        return eventsByAddressAndTypeAndTag[addr][eventType][tag].length;
    }

    // ============ INTERNAL HELPER FUNCTIONS ============

    /// @notice Helper function to slice array of event IDs
    function _sliceUIDs(
        bytes32[] memory uids,
        uint256 start,
        uint256 length,
        bool reverseOrder
    ) internal pure returns (bytes32[] memory) {
        uint256 uidsLength = uids.length;
        if (uidsLength == 0) {
            return new bytes32[](0);
        }

        if (start >= uidsLength) {
            revert InvalidOffset();
        }

        unchecked {
            uint256 len = length;
            if (uidsLength < start + length) {
                len = uidsLength - start;
            }

            bytes32[] memory res = new bytes32[](len);

            for (uint256 i = 0; i < len; ++i) {
                res[i] = uids[
                    reverseOrder ? uidsLength - (start + i + 1) : start + i
                ];
            }

            return res;
        }
    }

    /// @notice Helper function to get events by their IDs
    function _getEventsByIds(
        bytes32[] memory eventIds
    ) internal view returns (IndexedEvent[] memory) {
        IndexedEvent[] memory result = new IndexedEvent[](eventIds.length);

        for (uint256 i = 0; i < eventIds.length; i = uncheckedInc(i)) {
            result[i] = events[eventIds[i]];
        }

        return result;
    }

    /// @notice Helper function to generate event summary for timeline
    function _generateEventSummary(
        IndexedEvent memory event_
    ) internal pure returns (string memory) {
        // Simple summary generation - could be enhanced
        if (event_.tags.length > 0) {
            return event_.tags[0];
        }
        return "Event";
    }

    /// @notice Gets the service manager address
    function getServiceManager() external view returns (address) {
        return address(_serviceManager);
    }
}
