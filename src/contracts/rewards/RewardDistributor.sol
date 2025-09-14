// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/*
 Note: having stupid version issues with this contract's dependencies so it's disabled for now.
*/

import {ITypes} from "interfaces/ITypes.sol";
import {IMerkler} from "interfaces/IMerkler.sol";
import {IWavsServiceManager} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceManager.sol";
import {IWavsServiceHandler} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceHandler.sol";
import {UniversalRewardsDistributor} from "@morpho-org/universal-rewards-distributor/UniversalRewardsDistributor.sol";

contract RewardDistributor is IWavsServiceHandler, UniversalRewardsDistributor, IMerkler {
    /// @notice The last trigger ID seen
    uint64 public lastTriggerId;

    /// @notice Mapping of valid triggers
    mapping(uint64 _triggerId => bool _isValid) internal _validTriggers;
    /// @notice Mapping of trigger data
    mapping(uint64 _triggerId => bytes _data) internal _datas;
    /// @notice Mapping of trigger signatures
    mapping(uint64 _triggerId => SignatureData _signature) internal _signatures;

    /// @notice Service manager instance
    IWavsServiceManager private _serviceManager;

    /// @notice The optional ipfs hash CID containing metadata about the root (e.g. the merkle tree itself).
    string public ipfsHashCid;

    /**
     * @notice Initialize the contract
     * @param serviceManager The service manager instance
     */
    constructor(IWavsServiceManager serviceManager)
        UniversalRewardsDistributor(address(this), 0, bytes32(0), bytes32(0))
    {
        _serviceManager = serviceManager;
    }

    /// @inheritdoc IWavsServiceHandler
    function handleSignedEnvelope(Envelope calldata envelope, SignatureData calldata signatureData) external {
        _serviceManager.validate(envelope, signatureData);

        MerklerAvsOutput memory avsOutput = abi.decode(envelope.payload, (MerklerAvsOutput));

        _signatures[avsOutput.triggerId] = signatureData;
        _datas[avsOutput.triggerId] = envelope.payload;
        _validTriggers[avsOutput.triggerId] = true;
        if (avsOutput.triggerId > lastTriggerId) {
            lastTriggerId = avsOutput.triggerId;
        }

        // Update distributor

        _setRoot(avsOutput.root, avsOutput.ipfsHash);
        ipfsHashCid = avsOutput.ipfsHashCid;
    }

    function isValidTriggerId(uint64 _triggerId) external view returns (bool _isValid) {
        _isValid = _validTriggers[_triggerId];
    }

    function getSignature(uint64 _triggerId) external view returns (SignatureData memory _signature) {
        _signature = _signatures[_triggerId];
    }

    function getData(uint64 _triggerId) external view returns (bytes memory _data) {
        _data = _datas[_triggerId];
    }

    /**
     * @notice Get the service manager address
     * @return address The address of the service manager
     */
    function getServiceManager() external view returns (address) {
        return address(_serviceManager);
    }
}
