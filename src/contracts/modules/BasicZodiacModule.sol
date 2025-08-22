// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Module} from "@gnosis-guild/zodiac-core/core/Module.sol";
import {Operation} from "@gnosis-guild/zodiac-core/core/Operation.sol";

/// @title BasicZodiacModule - A simple Zodiac module for experimental governance
/// @notice This module serves as a foundation for custom governance mechanisms
/// @dev Extends the base Zodiac Module contract with basic functionality
contract BasicZodiacModule is Module {
    event ActionExecuted(address indexed to, uint256 value, bytes data, Operation operation);
    event ModuleConfigured(address indexed avatar, address indexed target);

    bool private _initialized;

    constructor(address _owner, address _avatar, address _target) {
        // For direct deployment via constructor
        _setUp(_owner, _avatar, _target);
    }

    /// @notice Sets up the module - required by FactoryFriendly interface
    /// @param initializeParams Encoded parameters for initialization (_owner, _avatar, _target)
    function setUp(bytes memory initializeParams) public override {
        require(!_initialized, "Module already initialized");

        (address _owner, address _avatar, address _target) = abi.decode(initializeParams, (address, address, address));

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

    /// @notice Execute a transaction through the module
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
        emit ActionExecuted(to, value, data, operation);
        return success;
    }

    /// @notice Execute a transaction and return data through the module
    /// @param to Destination address of the transaction
    /// @param value Ether value of the transaction
    /// @param data Data payload of the transaction
    /// @param operation Operation type: 0 == call, 1 == delegate call
    function executeTransactionReturnData(address to, uint256 value, bytes memory data, Operation operation)
        public
        onlyOwner
        returns (bool success, bytes memory returnData)
    {
        (success, returnData) = execAndReturnData(to, value, data, operation);
        emit ActionExecuted(to, value, data, operation);
        return (success, returnData);
    }
}
