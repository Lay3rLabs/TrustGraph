// SPDX-License-Identifier: MIT

pragma solidity 0.8.27;

/// @title IUniversalIndexer
/// @notice Interface and types for the Universal Indexer system
interface IUniversalIndexer {
    /// @notice Represents a universally indexed event
    struct UniversalEvent {
        bytes32 eventId; // Unique identifier for this event
        address sourceContract; // Contract that originally emitted the event
        bytes32 eventType; // Hash of the event signature
        bytes eventData; // ABI-encoded event data
        uint256 blockNumber; // Block number when event was emitted
        uint256 timestamp; // Timestamp when event was processed
        string[] tags; // Searchable tags (e.g., "attestation", "nft", "governance")
        address[] relevantAddresses; // Addresses relevant to this event (users, contracts, etc.)
        bytes32 parentEvent; // Optional: link to parent event for relationships
        bytes data; // Optional: data
        bytes metadata; // Optional: additional metadata
    }

    /// @notice Operation types for indexing
    enum IndexOperation {
        ADD,
        DELETE,
        BATCH_ADD
    }

    /// @notice Payload structure for WAVS indexing operations
    struct IndexingPayload {
        IndexOperation operation;
        UniversalEvent[] events;
    }

    /// @notice Timeline event for user activity queries
    struct TimelineEvent {
        bytes32 eventId;
        uint256 timestamp;
        bytes32 eventType;
        string eventSummary;
        address sourceContract;
    }

    /// @notice Emitted when an event has been indexed
    /// @param eventId The unique identifier of the indexed event
    /// @param sourceContract The contract that originally emitted the event
    /// @param eventType The type/signature of the event
    /// @param relevantAddresses Addresses relevant to this event
    /// @param tags Searchable tags for this event
    event EventIndexed(
        bytes32 indexed eventId,
        address indexed sourceContract,
        bytes32 indexed eventType,
        address[] relevantAddresses,
        string[] tags
    );

    /// @notice Emitted when an event is updated
    /// @param eventId The unique identifier of the updated event
    /// @param updatedBy The address that performed the update
    event EventUpdated(bytes32 indexed eventId, address indexed updatedBy);

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
    ) external view returns (UniversalEvent[] memory);

    /// @notice Gets events by address and type combination
    /// @param relevantAddress The address to filter by
    /// @param eventType The event type to filter by
    /// @param start The offset to start from
    /// @param length The number of events to retrieve
    /// @param reverseOrder Whether to return in reverse chronological order
    /// @return Array of UniversalEvent structs
    function getEventsByAddressAndType(
        address relevantAddress,
        bytes32 eventType,
        uint256 start,
        uint256 length,
        bool reverseOrder
    ) external view returns (UniversalEvent[] memory);

    /// @notice Gets events by contract
    /// @param sourceContract The contract to filter by
    /// @param start The offset to start from
    /// @param length The number of events to retrieve
    /// @param reverseOrder Whether to return in reverse chronological order
    /// @return Array of UniversalEvent structs
    function getEventsByContract(
        address sourceContract,
        uint256 start,
        uint256 length,
        bool reverseOrder
    ) external view returns (UniversalEvent[] memory);

    /// @notice Gets events by tag
    /// @param tag The tag to filter by
    /// @param start The offset to start from
    /// @param length The number of events to retrieve
    /// @param reverseOrder Whether to return in reverse chronological order
    /// @return Array of UniversalEvent structs
    function getEventsByTag(
        string memory tag,
        uint256 start,
        uint256 length,
        bool reverseOrder
    ) external view returns (UniversalEvent[] memory);

    /// @notice Gets child events of a parent event
    /// @param parentEventId The parent event ID
    /// @return Array of UniversalEvent structs representing child events
    function getChildEvents(
        bytes32 parentEventId
    ) external view returns (UniversalEvent[] memory);

    /// @notice Gets a timeline of events for a specific address across multiple tags
    /// @param userAddress The address to get timeline for
    /// @param tags Array of tags to include in timeline
    /// @param fromTimestamp Start timestamp for timeline
    /// @param toTimestamp End timestamp for timeline
    /// @param maxEvents Maximum number of events to return
    /// @return Array of TimelineEvent structs sorted by timestamp
    function getUserTimeline(
        address userAddress,
        string[] memory tags,
        uint256 fromTimestamp,
        uint256 toTimestamp,
        uint256 maxEvents
    ) external view returns (TimelineEvent[] memory);

    /// @notice Gets total number of events for an address and tag
    function getEventCountByAddressAndTag(
        address addr,
        string memory tag
    ) external view returns (uint256);

    /// @notice Gets total number of events for an address and type
    function getEventCountByAddressAndType(
        address addr,
        bytes32 eventType
    ) external view returns (uint256);

    /// @notice Gets total number of events by contract
    function getEventCountByContract(
        address sourceContract
    ) external view returns (uint256);

    /// @notice Gets total number of events by tag
    function getEventCountByTag(
        string memory tag
    ) external view returns (uint256);
}
