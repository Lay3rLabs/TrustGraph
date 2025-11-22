// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {HatsToggleModule} from "@hats-module/src/HatsToggleModule.sol";
import {IHats} from "hats-protocol/Interfaces/IHats.sol";
import {IWavsServiceManager} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceManager.sol";
import {IWavsServiceHandler} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceHandler.sol";
import {IHatsAvsTypes} from "../../interfaces/IHatsAvsTypes.sol";
import {HatsModule} from "@hats-module/src/HatsModule.sol";

/**
 * @title HatsAvsToggleModule
 * @notice A WAVS service handler that implements a Hats toggle module
 */
contract HatsAvsToggleModule is HatsToggleModule, IWavsServiceHandler, IHatsAvsTypes {
    error EnvelopeAlreadySeen();
    /// @notice The next trigger ID to be assigned
    uint64 public nextTriggerId;

    /// @notice Mapping of hat ID to the latest result
    mapping(uint256 _hatId => StatusResult _result) internal _statusResults;

    /// @notice Mapping of hat ID to the timestamp of the last update
    mapping(uint256 _hatId => uint256 _timestamp) internal _lastUpdateTimestamps;

    /// @notice Service manager instance
    IWavsServiceManager private immutable _serviceManager;

    // Prevent replay attacks
    mapping(bytes20 eventId => bool seen) public envelopesSeen;

    /**
     * @notice Initialize the module implementation
     * @param _hats The Hats protocol contract - passed to factory, not used in constructor
     * @param serviceManager The service manager instance
     * @param _version The version of the module
     */
    constructor(IHats _hats, IWavsServiceManager serviceManager, string memory _version) HatsModule(_version) {
        require(address(serviceManager) != address(0), "HatsAvsToggleModule: invalid service manager");
        _serviceManager = serviceManager;
    }

    /**
     * @notice Request a status check for a hat ID
     * @param _hatId The ID of the hat
     * @return triggerId The ID of the created trigger
     */
    function requestStatusCheck(uint256 _hatId) external returns (uint64 triggerId) {
        // Input validation
        require(_hatId > 0, "Invalid hat ID");

        // Create new trigger ID
        nextTriggerId = nextTriggerId + 1;
        triggerId = nextTriggerId;

        // Emit the new structured event for WAVS
        emit StatusCheckTrigger(triggerId, msg.sender, _hatId);
    }

    /// @inheritdoc IWavsServiceHandler
    /// @notice Handles signed envelope from WAVS for status check operations
    /// @param envelope The envelope containing the status result data
    /// @param signatureData The signature data for validation
    function handleSignedEnvelope(Envelope calldata envelope, SignatureData calldata signatureData) external {
        // Validate the envelope signature through the service manager
        _serviceManager.validate(envelope, signatureData);

        // Prevent replay attacks
        if (envelopesSeen[envelope.eventId]) {
            revert EnvelopeAlreadySeen();
        }

        envelopesSeen[envelope.eventId] = true;

        // Decode the result
        StatusResult memory result = abi.decode(envelope.payload, (StatusResult));

        // Verify triggerId is valid
        require(result.triggerId > 0, "Invalid triggerId");

        // Update the status result
        _statusResults[result.hatId] = result;
        _lastUpdateTimestamps[result.hatId] = block.timestamp;

        // Emit the event with unwrapped triggerId
        emit StatusResultReceived(result.triggerId, result.active);
    }

    /**
     * @notice Check the latest status result for a hat ID
     * @param _hatId The ID of the hat
     * @return active Whether the hat is active
     * @return timestamp The timestamp of the result
     */
    function getLatestStatusResult(uint256 _hatId) external view returns (bool active, uint256 timestamp) {
        // Get the result and timestamp
        StatusResult memory result = _statusResults[_hatId];
        timestamp = _lastUpdateTimestamps[_hatId];

        active = result.active;
    }

    /**
     * @notice Returns the status of a hat (implements IHatsToggle)
     * @param _hatId The id of the hat in question
     * @return Whether the hat is active
     */
    function getHatStatus(uint256 _hatId) public view override returns (bool) {
        // Get the result
        StatusResult memory result = _statusResults[_hatId];

        return result.active;
    }

    /**
     * @notice Get the service manager address
     * @return address The address of the service manager
     */
    function getServiceManager() external view returns (address) {
        return address(_serviceManager);
    }
}
