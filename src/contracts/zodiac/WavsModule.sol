// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Module} from "@gnosis-guild/zodiac-core/core/Module.sol";
import {Operation} from "@gnosis-guild/zodiac-core/core/Operation.sol";
import {IWavsServiceManager} from "@wavs/interfaces/IWavsServiceManager.sol";
import {IWavsServiceHandler} from "@wavs/interfaces/IWavsServiceHandler.sol";

/// @title WavsModule - A flexible Zodiac module for executing arbitrary transactions via WAVS
/// @notice This module can execute any transaction payload received through the WAVS service
/// @dev Implements IWavsServiceHandler to receive and execute validated WAVS envelopes
contract WavsModule is Module, IWavsServiceHandler {
    /*///////////////////////////////////////////////////////////////
                                TYPES
    //////////////////////////////////////////////////////////////*/

    /// @dev Single transaction to execute
    struct Transaction {
        address target; // Target address for the transaction
        uint256 value; // ETH value to send
        bytes data; // Calldata for the transaction
        Operation operation; // Operation type (Call or DelegateCall)
    }

    /// @dev Main payload structure for WAVS envelope
    struct TransactionPayload {
        uint256 nonce; // Nonce for tracking/ordering
        Transaction[] transactions; // Array of transactions to execute
        string description; // Optional description of the batch
    }

    /*///////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event TransactionExecuted(address indexed target, uint256 value, bytes data, Operation operation, bool success);

    event BatchExecuted(uint256 indexed nonce, uint256 transactionCount, string description);

    event ModuleConfigured(address indexed owner, address indexed avatar, address indexed target);

    event ServiceManagerUpdated(address indexed oldServiceManager, address indexed newServiceManager);

    /*///////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/

    /// @notice The WAVS service manager instance
    IWavsServiceManager public serviceManager;

    /// @notice Last executed nonce for replay protection
    uint256 public lastExecutedNonce;

    /// @notice Whether the module is initialized
    bool private _initialized;

    /// @notice Whether to require strict nonce ordering
    bool public strictNonceOrdering;

    /// @notice Mapping of executed nonces for non-strict mode
    mapping(uint256 => bool) public executedNonces;

    /*///////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor(
        address _owner,
        address _avatar,
        address _target,
        IWavsServiceManager _serviceManager,
        bool _strictNonceOrdering
    ) {
        _setUp(_owner, _avatar, _target, _serviceManager, _strictNonceOrdering);
    }

    /*///////////////////////////////////////////////////////////////
                            INITIALIZATION
    //////////////////////////////////////////////////////////////*/

    /// @notice Sets up the module for factory deployment
    /// @param initializeParams Encoded parameters for initialization
    function setUp(bytes memory initializeParams) public override {
        require(!_initialized, "Already initialized");

        (
            address _owner,
            address _avatar,
            address _target,
            IWavsServiceManager _serviceManager,
            bool _strictNonceOrdering
        ) = abi.decode(initializeParams, (address, address, address, IWavsServiceManager, bool));

        _setUp(_owner, _avatar, _target, _serviceManager, _strictNonceOrdering);
    }

    /// @dev Internal setup function
    function _setUp(
        address _owner,
        address _avatar,
        address _target,
        IWavsServiceManager _serviceManager,
        bool _strictNonceOrdering
    ) private {
        require(!_initialized, "Already initialized");
        require(address(_serviceManager) != address(0), "Invalid service manager");

        _initialized = true;

        _transferOwnership(_owner);
        avatar = _avatar;
        target = _target;
        serviceManager = _serviceManager;
        strictNonceOrdering = _strictNonceOrdering;

        emit ModuleConfigured(_owner, _avatar, _target);
    }

    /*///////////////////////////////////////////////////////////////
                          WAVS INTEGRATION
    //////////////////////////////////////////////////////////////*/

    /// @inheritdoc IWavsServiceHandler
    /// @notice Handles signed envelope from WAVS for transaction execution
    /// @param envelope The envelope containing transaction data
    /// @param signatureData The signature data for validation
    function handleSignedEnvelope(Envelope calldata envelope, SignatureData calldata signatureData) external {
        // Validate the envelope signature through the service manager
        serviceManager.validate(envelope, signatureData);

        // Decode the payload
        TransactionPayload memory payload = abi.decode(envelope.payload, (TransactionPayload));

        // Check nonce if strict ordering is enabled
        if (strictNonceOrdering) {
            require(payload.nonce == lastExecutedNonce + 1, "Invalid nonce: strict ordering required");
            lastExecutedNonce = payload.nonce;
        } else {
            // For non-strict mode, just ensure nonce hasn't been used
            require(!executedNonces[payload.nonce], "Nonce already executed");
            executedNonces[payload.nonce] = true;

            // Update lastExecutedNonce if this is higher
            if (payload.nonce > lastExecutedNonce) {
                lastExecutedNonce = payload.nonce;
            }
        }

        // Execute the transactions
        _executeTransactions(payload);
    }

    /*///////////////////////////////////////////////////////////////
                        TRANSACTION EXECUTION
    //////////////////////////////////////////////////////////////*/

    /// @dev Execute all transactions in the payload
    /// @param payload The transaction payload to execute
    function _executeTransactions(TransactionPayload memory payload) internal {
        uint256 transactionCount = payload.transactions.length;
        require(transactionCount > 0, "No transactions to execute");

        for (uint256 i = 0; i < transactionCount; i++) {
            Transaction memory txn = payload.transactions[i];

            // Execute the transaction through the Module's exec function
            bool success = exec(txn.target, txn.value, txn.data, txn.operation);

            emit TransactionExecuted(txn.target, txn.value, txn.data, txn.operation, success);

            // Optionally revert on failure (could make this configurable)
            if (!success) {
                revert("Transaction execution failed");
            }
        }

        emit BatchExecuted(payload.nonce, transactionCount, payload.description);
    }

    /*///////////////////////////////////////////////////////////////
                         DIRECT EXECUTION
    //////////////////////////////////////////////////////////////*/

    /// @notice Execute a single transaction directly (owner only)
    /// @param to Destination address
    /// @param value ETH value to send
    /// @param data Calldata for the transaction
    /// @param operation Operation type
    /// @return success Whether the transaction succeeded
    function executeTransaction(address to, uint256 value, bytes memory data, Operation operation)
        public
        onlyOwner
        returns (bool success)
    {
        success = exec(to, value, data, operation);

        emit TransactionExecuted(to, value, data, operation, success);

        return success;
    }

    /// @notice Execute multiple transactions directly (owner only)
    /// @param transactions Array of transactions to execute
    function executeBatch(Transaction[] memory transactions) public onlyOwner {
        uint256 transactionCount = transactions.length;
        require(transactionCount > 0, "No transactions to execute");

        for (uint256 i = 0; i < transactionCount; i++) {
            Transaction memory txn = transactions[i];

            bool success = exec(txn.target, txn.value, txn.data, txn.operation);

            emit TransactionExecuted(txn.target, txn.value, txn.data, txn.operation, success);

            if (!success) {
                revert("Transaction execution failed");
            }
        }
    }

    /*///////////////////////////////////////////////////////////////
                          ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Update the service manager address
    /// @param newServiceManager New service manager address
    function updateServiceManager(IWavsServiceManager newServiceManager) external onlyOwner {
        require(address(newServiceManager) != address(0), "Invalid service manager");

        address oldServiceManager = address(serviceManager);
        serviceManager = newServiceManager;

        emit ServiceManagerUpdated(oldServiceManager, address(newServiceManager));
    }

    /// @notice Toggle strict nonce ordering
    /// @param enabled Whether to enable strict nonce ordering
    function setStrictNonceOrdering(bool enabled) external onlyOwner {
        strictNonceOrdering = enabled;
    }

    /// @notice Update module configuration
    /// @param _avatar New avatar address
    /// @param _target New target address
    function updateModuleConfig(address _avatar, address _target) external onlyOwner {
        require(_avatar != address(0), "Invalid avatar");
        require(_target != address(0), "Invalid target");

        avatar = _avatar;
        target = _target;

        emit ModuleConfigured(owner(), _avatar, _target);
    }

    /*///////////////////////////////////////////////////////////////
                          VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Check if a nonce has been executed (for non-strict mode)
    /// @param nonce The nonce to check
    /// @return Whether the nonce has been executed
    function isNonceExecuted(uint256 nonce) external view returns (bool) {
        if (strictNonceOrdering) {
            return nonce <= lastExecutedNonce;
        } else {
            return executedNonces[nonce];
        }
    }

    /// @notice Get the next expected nonce for strict ordering
    /// @return The next expected nonce
    function getNextNonce() external view returns (uint256) {
        if (strictNonceOrdering) {
            return lastExecutedNonce + 1;
        } else {
            // In non-strict mode, return a suggested nonce
            return lastExecutedNonce + 1;
        }
    }

    /// @notice Get module configuration
    /// @return _owner Current owner address
    /// @return _avatar Current avatar address
    /// @return _target Current target address
    /// @return _serviceManager Current service manager address
    function getModuleConfig()
        external
        view
        returns (address _owner, address _avatar, address _target, address _serviceManager)
    {
        return (owner(), avatar, target, address(serviceManager));
    }
}
