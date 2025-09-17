// SPDX-License-Identifier: MIT

pragma solidity 0.8.27;

/// @title IWavsIndexer
/// @notice Interface and types for the WAVS Indexer system
interface IWavsIndexer {
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
    error CannotCreateDeletedEvent();

    /// ================================================
    /// TYPES
    /// ================================================

    /// @notice Represents a universally indexed event
    struct IndexedEvent {
        bytes32 eventId; // Unique identifier for this event
        string chainId; // Chain ID of the event
        address relevantContract; // Relevant contract for the event
        uint256 blockNumber; // Block number when event was emitted
        uint128 timestamp; // Timestamp when event was processed (milliseconds)
        string eventType; // Type of the event (e.g., "attestation")
        bytes data; // Data for the event
        string[] tags; // Searchable tags (e.g., "sender:ADDRESS", "recipient:ADDRESS", "schema:SCHEMA_ID")
        address[] relevantAddresses; // Addresses relevant to this event (users, contracts, etc.)
        bytes metadata; // Optional: additional metadata
        bool deleted; // Whether the event has been deleted
    }

    /// @notice Payload structure for WAVS indexing operations
    struct IndexingPayload {
        // Events to add
        IndexedEvent[] toAdd;
        // Event IDs to delete
        bytes32[] toDelete;
    }

    /// ================================================
    /// FUNCTIONS
    /// ================================================

    /// @notice Checks whether an event exists and was deleted
    /// @param eventId The ID of the event to check
    /// @return true if the event exists and was deleted, false otherwise
    function eventExistsAndDeleted(bytes32 eventId) external view returns (bool);

    /// @notice Gets events by chain ID
    /// @param chainId The chain ID to filter by
    /// @param start The offset to start from
    /// @param length The number of events to retrieve
    /// @param reverseOrder Whether to return in reverse chronological order
    /// @return Array of IndexedEvent structs
    function getEventsByChainId(string calldata chainId, uint256 start, uint256 length, bool reverseOrder)
        external
        view
        returns (IndexedEvent[] memory);

    /// @notice Gets events by contract
    /// @param chainId The chain ID of the contract to filter by
    /// @param contract_ The contract to filter by
    /// @param start The offset to start from
    /// @param length The number of events to retrieve
    /// @param reverseOrder Whether to return in reverse chronological order
    /// @return Array of IndexedEvent structs
    function getEventsByContract(
        string calldata chainId,
        address contract_,
        uint256 start,
        uint256 length,
        bool reverseOrder
    ) external view returns (IndexedEvent[] memory);

    /// @notice Gets events by address
    /// @param addr The address to filter by
    /// @param start The offset to start from
    /// @param length The number of events to retrieve
    /// @param reverseOrder Whether to return in reverse chronological order
    /// @return Array of IndexedEvent structs
    function getEventsByAddress(address addr, uint256 start, uint256 length, bool reverseOrder)
        external
        view
        returns (IndexedEvent[] memory);

    /// @notice Gets events by type
    /// @param eventType The event type to filter by
    /// @param start The offset to start from
    /// @param length The number of events to retrieve
    /// @param reverseOrder Whether to return in reverse chronological order
    /// @return Array of IndexedEvent structs
    function getEventsByType(string calldata eventType, uint256 start, uint256 length, bool reverseOrder)
        external
        view
        returns (IndexedEvent[] memory);

    /// @notice Gets events by tag
    /// @param tag The tag to filter by
    /// @param start The offset to start from
    /// @param length The number of events to retrieve
    /// @param reverseOrder Whether to return in reverse chronological order
    /// @return Array of IndexedEvent structs
    function getEventsByTag(string calldata tag, uint256 start, uint256 length, bool reverseOrder)
        external
        view
        returns (IndexedEvent[] memory);

    /// @notice Gets events by contract and address combination
    /// @param chainId The chain ID of the contract to filter by
    /// @param contract_ The contract to filter by
    /// @param addr The address to filter by
    /// @param start The offset to start from
    /// @param length The number of events to retrieve
    /// @param reverseOrder Whether to return in reverse chronological order
    /// @return Array of IndexedEvent structs
    function getEventsByContractAndAddress(
        string calldata chainId,
        address contract_,
        address addr,
        uint256 start,
        uint256 length,
        bool reverseOrder
    ) external view returns (IndexedEvent[] memory);

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
    ) external view returns (IndexedEvent[] memory);

    /// @notice Gets events by address and type combination
    /// @param addr The address to filter by
    /// @param eventType The event type to filter by
    /// @param start The offset to start from
    /// @param length The number of events to retrieve
    /// @param reverseOrder Whether to return in reverse chronological order
    /// @return Array of IndexedEvent structs
    function getEventsByAddressAndType(
        address addr,
        string calldata eventType,
        uint256 start,
        uint256 length,
        bool reverseOrder
    ) external view returns (IndexedEvent[] memory);

    /// @notice Gets events by address and tag combination
    /// @param addr The address to filter by
    /// @param tag The tag to filter by
    /// @param start The offset to start from
    /// @param length The number of events to retrieve
    /// @param reverseOrder Whether to return in reverse chronological order
    /// @return Array of IndexedEvent structs
    function getEventsByAddressAndTag(
        address addr,
        string calldata tag,
        uint256 start,
        uint256 length,
        bool reverseOrder
    ) external view returns (IndexedEvent[] memory);

    /// @notice Gets events by contract and type combination
    /// @param chainId The chain ID of the contract to filter by
    /// @param contract_ The contract to filter by
    /// @param eventType The event type to filter by
    /// @param start The offset to start from
    /// @param length The number of events to retrieve
    /// @param reverseOrder Whether to return in reverse chronological order
    /// @return Array of IndexedEvent structs
    function getEventsByContractAndType(
        string calldata chainId,
        address contract_,
        string calldata eventType,
        uint256 start,
        uint256 length,
        bool reverseOrder
    ) external view returns (IndexedEvent[] memory);

    /// @notice Gets events by contract and tag combination
    /// @param chainId The chain ID of the contract to filter by
    /// @param contract_ The contract to filter by
    /// @param tag The tag to filter by
    /// @param start The offset to start from
    /// @param length The number of events to retrieve
    /// @param reverseOrder Whether to return in reverse chronological order
    /// @return Array of IndexedEvent structs
    function getEventsByContractAndTag(
        string calldata chainId,
        address contract_,
        string calldata tag,
        uint256 start,
        uint256 length,
        bool reverseOrder
    ) external view returns (IndexedEvent[] memory);

    /// @notice Gets events by address, type, and tag combination
    /// @param addr The address to filter by
    /// @param eventType The event type to filter by
    /// @param tag The tag to filter by
    /// @param start The offset to start from
    /// @param length The number of events to retrieve
    /// @param reverseOrder Whether to return in reverse chronological order
    /// @return Array of IndexedEvent structs
    function getEventsByAddressAndTypeAndTag(
        address addr,
        string calldata eventType,
        string calldata tag,
        uint256 start,
        uint256 length,
        bool reverseOrder
    ) external view returns (IndexedEvent[] memory);

    /// @notice Gets events by contract, type, and tag combination
    /// @param chainId The chain ID of the contract to filter by
    /// @param contract_ The contract to filter by
    /// @param eventType The event type to filter by
    /// @param tag The tag to filter by
    /// @param start The offset to start from
    /// @param length The number of events to retrieve
    /// @param reverseOrder Whether to return in reverse chronological order
    /// @return Array of IndexedEvent structs
    function getEventsByContractAndTypeAndTag(
        string calldata chainId,
        address contract_,
        string calldata eventType,
        string calldata tag,
        uint256 start,
        uint256 length,
        bool reverseOrder
    ) external view returns (IndexedEvent[] memory);

    // ============ COUNT FUNCTIONS ============

    /// @notice Gets total number of events by chain ID
    function getEventCountByChainId(string calldata chainId) external view returns (uint256);

    /// @notice Gets total number of events by contract
    function getEventCountByContract(string calldata chainId, address contract_) external view returns (uint256);

    /// @notice Gets total number of events by type
    function getEventCountByType(string calldata eventType) external view returns (uint256);

    /// @notice Gets total number of events by tag
    function getEventCountByTag(string calldata tag) external view returns (uint256);

    /// @notice Gets total number of events for a contract and address
    function getEventCountByContractAndAddress(string calldata chainId, address contract_, address addr)
        external
        view
        returns (uint256);

    /// @notice Gets total number of events for a type and tag
    function getEventCountByTypeAndTag(string calldata eventType, string calldata tag)
        external
        view
        returns (uint256);

    /// @notice Gets total number of events for an address and type
    function getEventCountByAddressAndType(address addr, string calldata eventType) external view returns (uint256);

    /// @notice Gets total number of events for an address and tag
    function getEventCountByAddressAndTag(address addr, string calldata tag) external view returns (uint256);

    /// @notice Gets total number of events for a contract and type
    function getEventCountByContractAndType(string calldata chainId, address contract_, string calldata eventType)
        external
        view
        returns (uint256);

    /// @notice Gets total number of events for a contract and tag
    function getEventCountByContractAndTag(string calldata chainId, address contract_, string calldata tag)
        external
        view
        returns (uint256);

    /// @notice Gets total number of events for an address, type, and tag
    function getEventCountByAddressAndTypeAndTag(address addr, string calldata eventType, string calldata tag)
        external
        view
        returns (uint256);

    /// @notice Gets total number of events for a contract, type, and tag
    function getEventCountByContractAndTypeAndTag(
        string calldata chainId,
        address contract_,
        string calldata eventType,
        string calldata tag
    ) external view returns (uint256);
}
