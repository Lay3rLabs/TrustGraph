// SPDX-License-Identifier: MIT

pragma solidity 0.8.27;

import {IWavsServiceManager} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceManager.sol";
import {IWavsServiceHandler} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceHandler.sol";
import {ITypes} from "../interfaces/ITypes.sol";
import {IUniversalIndexer} from "../interfaces/IUniversalIndexer.sol";
import {Semver} from "@ethereum-attestation-service/eas-contracts/contracts/Semver.sol";
import {EMPTY_UID, uncheckedInc} from "@ethereum-attestation-service/eas-contracts/contracts/Common.sol";

/// @title UniversalIndexer
/// @notice A universal indexing service for arbitrary blockchain events and data
/// @dev Integrates with WAVS to receive indexed data from off-chain components
contract UniversalIndexer is IWavsServiceHandler, IUniversalIndexer, Semver {
    // Core storage mappings
    mapping(bytes32 => UniversalEvent) public events;
    mapping(bytes32 => bool) public eventExists;
    mapping(bytes32 => bool) public eventDeleted;

    // Multi-dimensional indexing for efficient queries
    mapping(string => bytes32[]) public eventsByChainId;
    mapping(address => bytes32[]) public eventsByContract;
    mapping(string => bytes32[]) public eventsByType;
    mapping(string => bytes32[]) public eventsByTag;
    mapping(address => bytes32[]) public eventsByRelevantAddress;

    // Combined indexing for common query patterns (gas optimization)
    mapping(address => mapping(string => bytes32[]))
        public eventsByAddressAndTag;
    mapping(address => mapping(string => bytes32[]))
        public eventsByAddressAndType;
    mapping(string => mapping(string => bytes32[])) public eventsByTypeAndTag;

    // Global counters
    uint256 public totalEvents;
    mapping(string => uint256) public eventCountByChainId;
    mapping(address => uint256) public eventCountByContract;
    mapping(string => uint256) public eventCountByType;

    // WAVS service manager
    IWavsServiceManager private _serviceManager;

    /// @notice Creates a new UniversalIndexer instance
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
        Envelope calldata envelope,
        SignatureData calldata signatureData
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

        if (payload.events.length == 0) {
            revert NoEvents();
        }

        // Process the indexing operation
        if (payload.operation == IndexOperation.ADD) {
            _batchIndexEvents(envelope.eventId, payload.events);
        } else if (payload.operation == IndexOperation.DELETE) {
            _batchDeleteEvents(payload.events);
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
    function _indexEvent(
        bytes32 eventId,
        UniversalEvent memory event_
    ) internal {
        // validate that the eventId is not already set, since it should only be set by this contract
        if (event_.eventId != bytes32(0)) {
            revert ExpectedEventIdZero();
        }

        // override eventId with the one provided
        event_.eventId = eventId;

        if (eventExists[eventId]) {
            revert EventAlreadyExists();
        }

        // Store the event
        events[eventId] = event_;
        eventExists[eventId] = true;
        totalEvents++;

        // Update counters
        eventCountByChainId[event_.chainId]++;
        eventCountByContract[event_.relevantContract]++;
        eventCountByType[event_.eventType]++;

        // Index by chain ID
        eventsByChainId[event_.chainId].push(eventId);

        // Index by relevant contract
        eventsByContract[event_.relevantContract].push(eventId);

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
            eventsByRelevantAddress[addr].push(eventId);
            eventsByAddressAndType[addr][event_.eventType].push(eventId);

            // Cross-index with tags for efficient combined queries
            for (uint256 j = 0; j < event_.tags.length; j = uncheckedInc(j)) {
                eventsByAddressAndTag[addr][event_.tags[j]].push(eventId);
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
        UniversalEvent[] memory events_
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
    /// @param events_ Array of events to delete
    function _batchDeleteEvents(UniversalEvent[] memory events_) internal {
        for (uint256 i = 0; i < events_.length; i = uncheckedInc(i)) {
            _deleteEvent(events_[i].eventId);
        }
    }

    /// @notice Deletes an event (marks as deleted, keeps data for audit)
    /// @param eventId The ID of the event to delete
    function _deleteEvent(bytes32 eventId) internal {
        if (!eventExists[eventId]) {
            revert EventDoesNotExist();
        }

        if (eventDeleted[eventId]) {
            revert EventAlreadyDeleted();
        }

        // Mark as deleted
        eventDeleted[eventId] = true;

        emit EventDeleted(eventId);
    }

    // ============ QUERY FUNCTIONS ============

    /// @notice Checks whether an event exists and is deleted
    /// @param eventId The ID of the event to check
    /// @return true if the event exists and is deleted, false otherwise
    function eventExistsAndDeleted(
        bytes32 eventId
    ) external view returns (bool) {
        return eventExists[eventId] && eventDeleted[eventId];
    }

    /// @notice Gets events by address and tag combination
    /// @param relevantAddress The address to filter by
    /// @param tag The tag to filter by
    /// @param start The offset to start from
    /// @param length The number of events to retrieve
    /// @param reverseOrder Whether to return in reverse chronological order
    /// @return Array of UniversalEvent structs
    function getEventsByAddressAndTag(
        address relevantAddress,
        string memory tag,
        uint256 start,
        uint256 length,
        bool reverseOrder
    ) external view returns (UniversalEvent[] memory) {
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
    /// @return Array of UniversalEvent structs
    function getEventsByAddressAndType(
        address relevantAddress,
        string calldata eventType,
        uint256 start,
        uint256 length,
        bool reverseOrder
    ) external view returns (UniversalEvent[] memory) {
        bytes32[] memory eventIds = _sliceUIDs(
            eventsByAddressAndType[relevantAddress][eventType],
            start,
            length,
            reverseOrder
        );

        return _getEventsByIds(eventIds);
    }

    /// @notice Gets events by chain ID
    /// @param chainId The chain ID to filter by
    /// @param start The offset to start from
    /// @param length The number of events to retrieve
    /// @param reverseOrder Whether to return in reverse chronological order
    /// @return Array of UniversalEvent structs
    function getEventsByChainId(
        string calldata chainId,
        uint256 start,
        uint256 length,
        bool reverseOrder
    ) external view returns (UniversalEvent[] memory) {
        bytes32[] memory eventIds = _sliceUIDs(
            eventsByChainId[chainId],
            start,
            length,
            reverseOrder
        );

        return _getEventsByIds(eventIds);
    }

    /// @notice Gets events by contract
    /// @param relevantContract The contract to filter by
    /// @param start The offset to start from
    /// @param length The number of events to retrieve
    /// @param reverseOrder Whether to return in reverse chronological order
    /// @return Array of UniversalEvent structs
    function getEventsByContract(
        address relevantContract,
        uint256 start,
        uint256 length,
        bool reverseOrder
    ) external view returns (UniversalEvent[] memory) {
        bytes32[] memory eventIds = _sliceUIDs(
            eventsByContract[relevantContract],
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
    /// @return Array of UniversalEvent structs
    function getEventsByTag(
        string calldata tag,
        uint256 start,
        uint256 length,
        bool reverseOrder
    ) external view returns (UniversalEvent[] memory) {
        bytes32[] memory eventIds = _sliceUIDs(
            eventsByTag[tag],
            start,
            length,
            reverseOrder
        );

        return _getEventsByIds(eventIds);
    }

    /// @notice Gets a timeline of events for a specific address across multiple tags
    /// @param userAddress The address to get timeline for
    /// @param tags Array of tags to include in timeline
    /// @param fromTimestamp Start timestamp for timeline
    /// @param toTimestamp End timestamp for timeline
    /// @param maxEvents Maximum number of events to return
    /// @return Array of TimelineEvent structs sorted by timestamp
    function getUserTimeline(
        address userAddress,
        string[] calldata tags,
        uint256 fromTimestamp,
        uint256 toTimestamp,
        uint256 maxEvents
    ) external view returns (TimelineEvent[] memory) {
        TimelineEvent[] memory timeline = new TimelineEvent[](maxEvents);
        uint256 timelineCount = 0;

        // Collect events from all specified tags
        for (
            uint256 i = 0;
            i < tags.length && timelineCount < maxEvents;
            i = uncheckedInc(i)
        ) {
            bytes32[] memory eventIds = eventsByAddressAndTag[userAddress][
                tags[i]
            ];

            for (
                uint256 j = 0;
                j < eventIds.length && timelineCount < maxEvents;
                j = uncheckedInc(j)
            ) {
                UniversalEvent memory event_ = events[eventIds[j]];

                // Filter by timestamp range
                if (
                    event_.timestamp >= fromTimestamp &&
                    event_.timestamp <= toTimestamp
                ) {
                    timeline[timelineCount] = TimelineEvent({
                        eventId: eventIds[j],
                        timestamp: event_.timestamp,
                        eventType: event_.eventType,
                        eventSummary: _generateEventSummary(event_),
                        relevantContract: event_.relevantContract
                    });
                    timelineCount++;
                }
            }
        }

        // Resize array to actual count
        TimelineEvent[] memory result = new TimelineEvent[](timelineCount);
        for (uint256 i = 0; i < timelineCount; i = uncheckedInc(i)) {
            result[i] = timeline[i];
        }

        return result;
    }

    // ============ COUNT FUNCTIONS ============

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

    /// @notice Gets total number of events by chain ID
    function getEventCountByChainId(
        string calldata chainId
    ) external view returns (uint256) {
        return eventsByChainId[chainId].length;
    }

    /// @notice Gets total number of events by contract
    function getEventCountByContract(
        address relevantContract
    ) external view returns (uint256) {
        return eventsByContract[relevantContract].length;
    }

    /// @notice Gets total number of events by tag
    function getEventCountByTag(
        string calldata tag
    ) external view returns (uint256) {
        return eventsByTag[tag].length;
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
    ) internal view returns (UniversalEvent[] memory) {
        UniversalEvent[] memory result = new UniversalEvent[](eventIds.length);

        for (uint256 i = 0; i < eventIds.length; i = uncheckedInc(i)) {
            result[i] = events[eventIds[i]];
        }

        return result;
    }

    /// @notice Helper function to generate event summary for timeline
    function _generateEventSummary(
        UniversalEvent memory event_
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
