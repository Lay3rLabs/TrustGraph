// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {HatsModule} from "@hats-module/src/HatsModule.sol";
import {IHats} from "hats-protocol/Interfaces/IHats.sol";
import {IWavsServiceManager} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceManager.sol";
import {IWavsServiceHandler} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceHandler.sol";
import {IHatsAvsTypes} from "../../interfaces/IHatsAvsTypes.sol";

/**
 * @title HatsAvsMinter
 * @notice A WAVS service handler that can mint hats to addresses based on signed data
 */
contract HatsAvsMinter is HatsModule, IWavsServiceHandler, IHatsAvsTypes {
    error EnvelopeAlreadySeen();
    /// @notice The next trigger ID to be assigned
    uint64 public nextTriggerId;

    /// @notice Service manager instance
    IWavsServiceManager private immutable _serviceManager;

    // Prevent replay attacks
    mapping(bytes20 eventId => bool seen) public envelopesSeen;

    /**
     * @notice Initialize the module implementation
     * @param _hats The Hats protocol contract
     * @param serviceManager The service manager instance
     * @param _version The version of the module
     */
    constructor(IHats _hats, IWavsServiceManager serviceManager, string memory _version) HatsModule(_version) {
        require(address(serviceManager) != address(0), "HatsAvsMinter: invalid service manager");
        _serviceManager = serviceManager;
    }

    /**
     * @notice Request a hat minting
     * @param _hatId The hat ID to mint
     * @param _wearer The address that will wear the hat
     * @return triggerId The ID of the created trigger
     */
    function requestHatMinting(uint256 _hatId, address _wearer) external returns (uint64 triggerId) {
        // Input validation
        require(_hatId > 0, "Invalid hat ID");
        require(_wearer != address(0), "Invalid wearer address");

        // Create new trigger ID
        nextTriggerId = nextTriggerId + 1;
        triggerId = nextTriggerId;

        // Emit the new structured event for WAVS
        emit MintingTrigger(triggerId, msg.sender, _hatId, _wearer);
    }

    /// @inheritdoc IWavsServiceHandler
    /// @notice Handles signed envelope from WAVS for hat minting operations
    /// @param envelope The envelope containing the hat minting data
    /// @param signatureData The signature data for validation
    function handleSignedEnvelope(Envelope calldata envelope, SignatureData calldata signatureData) external {
        // Validate the envelope signature through the service manager
        _serviceManager.validate(envelope, signatureData);

        // Prevent replay attacks
        if (envelopesSeen[envelope.eventId]) {
            revert EnvelopeAlreadySeen();
        }

        envelopesSeen[envelope.eventId] = true;

        // Decode the minting data
        HatMintingData memory mintingData = abi.decode(envelope.payload, (HatMintingData));

        // Ensure hat ID is valid
        require(mintingData.hatId > 0, "Invalid hat ID");
        require(mintingData.wearer != address(0), "Invalid wearer address");

        // For offchain-triggered events, create a new triggerId
        nextTriggerId = nextTriggerId + 1;
        uint64 newTriggerId = nextTriggerId;

        // Mint the hat directly if success flag is true
        if (mintingData.success) {
            HATS().mintHat(mintingData.hatId, mintingData.wearer);

            // Emit the event
            emit HatMintingResultReceived(newTriggerId, mintingData.hatId, mintingData.wearer, true);
        }
    }

    /**
     * @notice Get the service manager address
     * @return address The address of the service manager
     */
    function getServiceManager() external view returns (address) {
        return address(_serviceManager);
    }

    /**
     * @notice Implements the moduleInterfaceId function from HatsModule
     * @return moduleId The module interface ID
     */
    function moduleInterfaceId() public pure returns (bytes4 moduleId) {
        return this.moduleInterfaceId.selector ^ this.requestHatMinting.selector ^ this.handleSignedEnvelope.selector;
    }
}
