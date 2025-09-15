// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {IWavsServiceHandler} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceHandler.sol";
import {IWavsServiceManager} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceManager.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

// Geyser is a factory pattern that allows the handler to control the ServiceManager to add new services via an updated serviceURI.
// Some Trigger w/ component info -> WAVS watch -> Submit to Geyser -> Geyser updates ServiceManager with new serviceURI
contract Geyser is Ownable, IWavsServiceHandler {
    error EnvelopeAlreadySeen();

    IWavsServiceManager private _serviceManager;

    // Prevent replay attacks.
    mapping(bytes20 eventId => bool seen) public envelopesSeen;

    event UpdateService(string json);

    constructor(
        address wavsServiceManager
    ) Ownable(msg.sender) {
        _serviceManager = IWavsServiceManager(wavsServiceManager);
    }

    function updateExample(string memory jsonBlob) public {
        // just emit UpdateService for WAVS to watch to then call the
        // handleSignedEnvelope and properly perform the JSON stuff :D
        emit UpdateService(jsonBlob);
    }

    function handleSignedEnvelope(
        Envelope calldata envelope,
        SignatureData calldata signatureData
    ) external override {
        _serviceManager.validate(envelope, signatureData);

        // Prevent replay attacks.
        if (envelopesSeen[envelope.eventId]) {
            revert EnvelopeAlreadySeen();
        }

        envelopesSeen[envelope.eventId] = true;

        // this should be an ipfs link returned from the component
        _serviceManager.setServiceURI(string(envelope.payload));
    }

    /**
     * @notice Get the service manager address
     * @return address The address of the service manager
     */
    function getServiceManager() external view returns (address) {
        return address(_serviceManager);
    }
}
