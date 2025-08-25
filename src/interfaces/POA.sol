// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

interface IPOAServiceManager {
    // Errors
    error OperatorDoesNotExistForSigningKey();
    error SingingKeyDoesNotExistForOperator();
    error OperatorAlreadyWhitelisted();
    error OperatorNotWhitelisted();
    error InvalidOperatorAddress();
    error InvalidOffset();

    // signing key
    error AlreadyHasSigningKey();
    error SigningKeyAlreadyUsed();
    error CannotUseOperatorAsSigningKey();

    // Events
    event SigningKeySet(address indexed operator, address indexed signingKey);
    event OperatorWhitelisted(address indexed operator, uint256 weight);
    event OperatorRemoved(address indexed operator);

    // functions
    function setSigningKey(address signingKey) external;

    function whitelistOperator(address operator,uint256 weight) external;
    function removeOperator(address operator) external;
    function updateOperatorWeight(address operator,uint256 newWeight) external;

    // function getLatestOperatorForSigningKey(address signingKeyAddress) external view returns (address); // already in WAVSServiceManager
    function getLatestSigningKeyForOperator(address operatorAddress) external view returns (address);

    // view
    function isOperatorWhitelisted(address operatorAddress) external view returns (bool);
    function getOperators(
        uint256 start,
        uint256 length,
        bool reverseOrder
    ) external view returns (address[] memory operators, uint256[] memory weights);
}
