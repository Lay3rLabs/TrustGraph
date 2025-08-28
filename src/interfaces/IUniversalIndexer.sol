// SPDX-License-Identifier: MIT

pragma solidity 0.8.27;

/// @title IUniversalIndexer
/// @notice Interface and types for the Universal Indexer system
interface IUniversalIndexer {
    /// ================================================
    /// EVENTS
    /// ================================================

    /// @notice Emitted when an event has been indexed
    /// @param eventId The unique identifier of the indexed event
    /// @param relevantContract The relevant contract for the event
    /// @param eventType The type/signature of the event
    /// @param relevantAddresses Addresses relevant to this event
    /// @param tags Searchable tags for this event
    event EventIndexed(
        bytes32 indexed eventId,
        address indexed relevantContract,
        string indexed eventType,
        address[] relevantAddresses,
        string[] tags
    );

    /// @notice Emitted when an event has been deleted
    /// @param eventId The unique identifier of the deleted event
    event EventDeleted(bytes32 indexed eventId);

    /// ================================================
    /// ERRORS
    /// ================================================

    error InvalidServiceManager();
    error ExpectedEventIdZero();
    error InvalidOffset();
    error PayloadDecodingFailed();
    error EventAlreadyExists();
    error EventDoesNotExist();
    error EventAlreadyDeleted();
    error NoEvents();

    /// ================================================
    /// TYPES
    /// ================================================

    /// @notice Represents a universally indexed event
    struct UniversalEvent {
        bytes32 eventId; // Unique identifier for this event
        string chainId; // Chain ID of the event
        address relevantContract; // Relevant contract for the event
        uint256 blockNumber; // Block number when event was emitted
        uint256 timestamp; // Timestamp when event was processed
        string eventType; // Type of the event (e.g., "attestation")
        bytes data; // Data for the event
        string[] tags; // Searchable tags (e.g., "sender:ADDRESS", "recipient:ADDRESS", "schema:SCHEMA_ID")
        address[] relevantAddresses; // Addresses relevant to this event (users, contracts, etc.)
        bytes metadata; // Optional: additional metadata
    }

    /// @notice Operation types for indexing
    enum IndexOperation {
        ADD,
        DELETE
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
        string eventType;
        string eventSummary;
        address relevantContract;
    }

    /// ================================================
    /// FUNCTIONS
    /// ================================================

    /// @notice Checks whether an event exists and was deleted
    /// @param eventId The ID of the event to check
    /// @return true if the event exists and was deleted, false otherwise
    function eventExistsAndDeleted(
        bytes32 eventId
    ) external view returns (bool);

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
        string calldata eventType,
        uint256 start,
        uint256 length,
        bool reverseOrder
    ) external view returns (UniversalEvent[] memory);

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
    ) external view returns (UniversalEvent[] memory);

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
    ) external view returns (UniversalEvent[] memory);

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
        string[] calldata tags,
        uint256 fromTimestamp,
        uint256 toTimestamp,
        uint256 maxEvents
    ) external view returns (TimelineEvent[] memory);

    /// @notice Gets total number of events for an address and tag
    function getEventCountByAddressAndTag(
        address addr,
        string calldata tag
    ) external view returns (uint256);

    /// @notice Gets total number of events for an address and type
    function getEventCountByAddressAndType(
        address addr,
        string calldata eventType
    ) external view returns (uint256);

    /// @notice Gets total number of events by chain ID
    function getEventCountByChainId(
        string calldata chainId
    ) external view returns (uint256);

    /// @notice Gets total number of events by contract
    function getEventCountByContract(
        address relevantContract
    ) external view returns (uint256);

    /// @notice Gets total number of events by tag
    function getEventCountByTag(
        string calldata tag
    ) external view returns (uint256);
}
