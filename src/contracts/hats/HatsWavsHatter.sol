// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {HatsModule} from "@hats-module/src/HatsModule.sol";
import {IHats} from "hats-protocol/Interfaces/IHats.sol";
import {IWavsServiceManager} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceManager.sol";
import {IWavsServiceHandler} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceHandler.sol";
import {IHatsAvsTypes} from "../../interfaces/IHatsAvsTypes.sol";

/**
 * @title HatsWavsHatter
 * @notice A WAVS service handler that can create hats based on signed data
 */
contract HatsWavsHatter is HatsModule, IWavsServiceHandler, IHatsAvsTypes {
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
        require(address(serviceManager) != address(0), "HatsWavsHatter: invalid service manager");
        _serviceManager = serviceManager;
    }

    /**
     * @notice Request a hat creation
     * @param _admin The admin hat ID
     * @param _details The hat details
     * @param _maxSupply The maximum supply
     * @param _eligibility The eligibility module address
     * @param _toggle The toggle module address
     * @param _mutable Whether the hat is mutable
     * @param _imageURI The hat image URI
     * @return triggerId The ID of the created trigger
     */
    function requestHatCreation(
        uint256 _admin,
        string calldata _details,
        uint32 _maxSupply,
        address _eligibility,
        address _toggle,
        bool _mutable,
        string calldata _imageURI
    ) external returns (uint64 triggerId) {
        // Input validation
        require(_admin > 0, "Invalid admin hat ID");

        // Create new trigger ID
        nextTriggerId = nextTriggerId + 1;
        triggerId = nextTriggerId;

        // Only emit the event, do not store the request
        emit HatCreationTrigger(
            triggerId, msg.sender, _admin, _details, _maxSupply, _eligibility, _toggle, _mutable, _imageURI
        );
    }

    /// @inheritdoc IWavsServiceHandler
    /// @notice Handles signed envelope from WAVS for hat creation operations
    /// @param envelope The envelope containing the hat creation data
    /// @param signatureData The signature data for validation
    function handleSignedEnvelope(Envelope calldata envelope, SignatureData calldata signatureData) external {
        // Validate the envelope signature through the service manager
        _serviceManager.validate(envelope, signatureData);

        // Prevent replay attacks
        if (envelopesSeen[envelope.eventId]) {
            revert EnvelopeAlreadySeen();
        }

        envelopesSeen[envelope.eventId] = true;

        // Decode the hat creation data
        HatCreationData memory creationData = abi.decode(envelope.payload, (HatCreationData));

        // Create the hat directly
        if (creationData.success) {
            uint256 newHatId = HATS()
                .createHat(
                    creationData.admin,
                    creationData.details,
                    creationData.maxSupply,
                    creationData.eligibility,
                    creationData.toggle,
                    creationData.mutable_,
                    creationData.imageURI
                );

            // Create a new triggerId for this offchain-triggered event
            nextTriggerId = nextTriggerId + 1;
            uint64 newTriggerId = nextTriggerId;

            // Emit the event
            emit HatCreationResultReceived(newTriggerId, newHatId, true);
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
        return this.moduleInterfaceId.selector ^ this.requestHatCreation.selector ^ this.handleSignedEnvelope.selector;
    }
}
