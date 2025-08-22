// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Module} from "@gnosis-guild/zodiac-core/core/Module.sol";
import {Operation} from "@gnosis-guild/zodiac-core/core/Operation.sol";
import {IWavsServiceManager} from "@wavs/interfaces/IWavsServiceManager.sol";
import {IWavsServiceHandler} from "@wavs/interfaces/IWavsServiceHandler.sol";
import {ITypes} from "../../interfaces/ITypes.sol";

/// @title SignerManagerModule - A Zodiac module that can manage Safe signers
/// @notice This module allows for programmatic management of Safe signers and threshold
/// @dev Provides functions to add, remove, swap owners and change threshold on the connected Safe
contract SignerManagerModule is Module, IWavsServiceHandler {
    /// @dev Operation types for signer management
    enum OperationType {
        ADD_SIGNER, // 0 - Add a new signer with threshold
        REMOVE_SIGNER, // 1 - Remove a signer with threshold
        SWAP_SIGNER, // 2 - Swap an existing signer with a new one
        CHANGE_THRESHOLD // 3 - Change only the threshold

    }

    /// @dev Single signer management operation
    struct SignerOperation {
        OperationType operationType; // The operation to perform
        address prevSigner; // Previous signer in linked list (for remove/swap)
        address signer; // The signer address (to add/remove/swap)
        address newSigner; // New signer address (for swap only)
        uint256 threshold; // New threshold (0 means no change)
    }

    /// @dev Main payload structure for WAVS envelope
    struct SignerManagerPayload {
        SignerOperation[] operations; // Array of operations to execute
    }

    event SignerAdded(address indexed signer, uint256 newThreshold);
    event SignerRemoved(address indexed signer, uint256 newThreshold);
    event SignerSwapped(address indexed oldSigner, address indexed newSigner);
    event ThresholdChanged(uint256 newThreshold);
    event ModuleConfigured(address indexed avatar, address indexed target);
    event WAVSOperationExecuted(OperationType indexed operationType, uint256 totalOperations);

    // The WAVS service manager instance
    IWavsServiceManager private _serviceManager;

    bool private _initialized;

    constructor(address _owner, address _avatar, address _target, IWavsServiceManager serviceManager) {
        require(address(serviceManager) != address(0), "SignerManagerModule: invalid service manager");
        _serviceManager = serviceManager;
        // For direct deployment via constructor
        _setUp(_owner, _avatar, _target);
    }

    /// @notice Sets up the module - required by FactoryFriendly interface
    /// @param initializeParams Encoded parameters for initialization (_owner, _avatar, _target, _serviceManager)
    function setUp(bytes memory initializeParams) public override {
        require(!_initialized, "Module already initialized");

        (address _owner, address _avatar, address _target, IWavsServiceManager serviceManager) =
            abi.decode(initializeParams, (address, address, address, IWavsServiceManager));

        require(address(serviceManager) != address(0), "SignerManagerModule: invalid service manager");
        _serviceManager = serviceManager;
        _setUp(_owner, _avatar, _target);
    }

    /// @notice Internal setup function used by both constructor and setUp
    function _setUp(address _owner, address _avatar, address _target) private {
        require(!_initialized, "Module already initialized");
        _initialized = true;

        // Initialize Ownable with the owner
        _transferOwnership(_owner);

        // Set avatar and target
        avatar = _avatar;
        target = _target;

        emit ModuleConfigured(_avatar, _target);
    }

    /// @notice Sets up the module configuration
    /// @param _avatar Address that will ultimately execute function calls (usually a Safe)
    /// @param _target Address that this module will pass transactions to (usually same as avatar)
    function setUpModule(address _avatar, address _target) public onlyOwner {
        avatar = _avatar;
        target = _target;
        emit ModuleConfigured(_avatar, _target);
    }

    /// @notice Add a new signer to the Safe
    /// @param signer New signer address to add
    /// @param newThreshold New threshold for the Safe
    function addSigner(address signer, uint256 newThreshold) public onlyOwner {
        bytes memory data = abi.encodeWithSignature("addOwnerWithThreshold(address,uint256)", signer, newThreshold);

        bool success = exec(target, 0, data, Operation.Call);
        require(success, "Failed to add signer");

        emit SignerAdded(signer, newThreshold);
    }

    /// @notice Remove a signer from the Safe
    /// @param prevSigner Address that points to the signer to remove in the linked list
    /// @param signer Signer address to remove
    /// @param newThreshold New threshold for the Safe
    function removeSigner(address prevSigner, address signer, uint256 newThreshold) public onlyOwner {
        bytes memory data =
            abi.encodeWithSignature("removeOwner(address,address,uint256)", prevSigner, signer, newThreshold);

        bool success = exec(target, 0, data, Operation.Call);
        require(success, "Failed to remove signer");

        emit SignerRemoved(signer, newThreshold);
    }

    /// @notice Swap a signer in the Safe with a new address
    /// @param prevSigner Address that points to the signer to swap in the linked list
    /// @param oldSigner Current signer address to replace
    /// @param newSigner New signer address
    function swapSigner(address prevSigner, address oldSigner, address newSigner) public onlyOwner {
        bytes memory data =
            abi.encodeWithSignature("swapOwner(address,address,address)", prevSigner, oldSigner, newSigner);

        bool success = exec(target, 0, data, Operation.Call);
        require(success, "Failed to swap signer");

        emit SignerSwapped(oldSigner, newSigner);
    }

    /// @notice Change the threshold required for Safe transactions
    /// @param newThreshold New threshold value
    function changeThreshold(uint256 newThreshold) public onlyOwner {
        bytes memory data = abi.encodeWithSignature("changeThreshold(uint256)", newThreshold);

        bool success = exec(target, 0, data, Operation.Call);
        require(success, "Failed to change threshold");

        emit ThresholdChanged(newThreshold);
    }

    /// @notice Execute a custom transaction through the module
    /// @param to Destination address of the transaction
    /// @param value Ether value of the transaction
    /// @param data Data payload of the transaction
    /// @param operation Operation type: 0 == call, 1 == delegate call
    function executeTransaction(address to, uint256 value, bytes memory data, Operation operation)
        public
        onlyOwner
        returns (bool success)
    {
        success = exec(to, value, data, operation);
        return success;
    }

    /// @notice Get the current Safe signers (view function)
    /// @return Array of current Safe owners
    function getSigners() public view returns (address[] memory) {
        bytes memory data = abi.encodeWithSignature("getOwners()");

        // This is a view call, so we can't use exec() - we'd need to call the Safe directly
        // In a real implementation, you might want to add a view-only call mechanism
        // For now, this serves as a placeholder showing the intended functionality
        (bool success, bytes memory returnData) = target.staticcall(data);

        if (success) {
            return abi.decode(returnData, (address[]));
        } else {
            // Return empty array if call fails
            return new address[](0);
        }
    }

    /// @notice Get the current Safe threshold (view function)
    /// @return Current threshold value
    function getThreshold() public view returns (uint256) {
        bytes memory data = abi.encodeWithSignature("getThreshold()");

        (bool success, bytes memory returnData) = target.staticcall(data);

        if (success) {
            return abi.decode(returnData, (uint256));
        } else {
            return 0;
        }
    }

    /// @inheritdoc IWavsServiceHandler
    /// @notice Handles signed envelope from WAVS for signer management operations
    /// @param envelope The envelope containing the signer operation data
    /// @param signatureData The signature data for validation
    function handleSignedEnvelope(Envelope calldata envelope, SignatureData calldata signatureData) external {
        // Validate the envelope signature through the service manager
        _serviceManager.validate(envelope, signatureData);

        // Decode the payload
        SignerManagerPayload memory payload = abi.decode(envelope.payload, (SignerManagerPayload));

        // Execute the operations
        _executeOperations(payload);
    }

    /// @dev Execute signer management operations
    /// @param payload The operation payload to execute
    function _executeOperations(SignerManagerPayload memory payload) internal {
        uint256 totalOperations = payload.operations.length;

        unchecked {
            for (uint256 i = 0; i < totalOperations; ++i) {
                SignerOperation memory op = payload.operations[i];

                if (op.operationType == OperationType.ADD_SIGNER) {
                    require(op.signer != address(0), "Invalid signer address");
                    require(op.threshold > 0, "Invalid threshold");

                    bytes memory data =
                        abi.encodeWithSignature("addOwnerWithThreshold(address,uint256)", op.signer, op.threshold);

                    bool success = exec(target, 0, data, Operation.Call);
                    require(success, "Failed to add signer");

                    emit SignerAdded(op.signer, op.threshold);
                } else if (op.operationType == OperationType.REMOVE_SIGNER) {
                    require(op.prevSigner != address(0), "Invalid prevSigner address");
                    require(op.signer != address(0), "Invalid signer address");
                    require(op.threshold > 0, "Invalid threshold");

                    bytes memory data = abi.encodeWithSignature(
                        "removeOwner(address,address,uint256)", op.prevSigner, op.signer, op.threshold
                    );

                    bool success = exec(target, 0, data, Operation.Call);
                    require(success, "Failed to remove signer");

                    emit SignerRemoved(op.signer, op.threshold);
                } else if (op.operationType == OperationType.SWAP_SIGNER) {
                    require(op.prevSigner != address(0), "Invalid prevSigner address");
                    require(op.signer != address(0), "Invalid signer address");
                    require(op.newSigner != address(0), "Invalid newSigner address");

                    bytes memory data = abi.encodeWithSignature(
                        "swapOwner(address,address,address)", op.prevSigner, op.signer, op.newSigner
                    );

                    bool success = exec(target, 0, data, Operation.Call);
                    require(success, "Failed to swap signer");

                    emit SignerSwapped(op.signer, op.newSigner);
                } else if (op.operationType == OperationType.CHANGE_THRESHOLD) {
                    require(op.threshold > 0, "Invalid threshold");

                    bytes memory data = abi.encodeWithSignature("changeThreshold(uint256)", op.threshold);

                    bool success = exec(target, 0, data, Operation.Call);
                    require(success, "Failed to change threshold");

                    emit ThresholdChanged(op.threshold);
                }
            }
        }

        emit WAVSOperationExecuted(
            payload.operations.length > 0 ? payload.operations[0].operationType : OperationType.ADD_SIGNER,
            totalOperations
        );
    }
}
