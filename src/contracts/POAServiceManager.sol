// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {IWavsServiceManager} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceManager.sol";
import {IWavsServiceHandler} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceHandler.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {SignatureChecker} from "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import {SignerECDSAUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/cryptography/signers/SignerECDSAUpgradeable.sol";
import {IERC1271} from "@openzeppelin/contracts/interfaces/IERC1271.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {IPOAServiceManager} from "interfaces/POA.sol";

// POAServiceManager is a contract that is a *really* minimal version of the contracts/src/eigenlayer/ecdsa/WavsServiceManager.sol
// TODO(Jake): would be cool if we could have a WAVServiceManager + handler in 1. Not sure if we really want people to have to deploy both
// TODO(reece): slashing could be done manually from owner (it's poa), rewards could be done with merkle drop / vault shares as payout.
contract POAServiceManager is Ownable, ReentrancyGuard, IPOAServiceManager, IWavsServiceManager {
    /// @notice The URI of the service
    string public serviceURI;
    /// @notice The numerator of the quorum threshold
    uint256 public quorumNumerator;
    /// @notice The denominator of the quorum threshold
    uint256 public quorumDenominator;

    /// @notice mapping of operator address to their weight
    mapping(address => uint256) private operatorWeights;
    /// @notice array to track all operator addresses for pagination
    address[] private operatorAddresses;
    /// @notice total weight of all operators (cache) of the operatorWeights map.
    uint256 private totalWeight;

    /// @notice mapping of operator address -> signing key link
    mapping(address => address) private operatorSigningKeys;
    /// @notice mapping of signing key -> operator address
    mapping(address => address) private signingKeyOperators;

    // Sig verification
    error LengthMismatch();
    error InvalidLength();
    error SignerNotRegistered();
    error NotSorted();
    error InvalidSignedWeight();
    error InsufficientSignedStake();

    constructor() Ownable(msg.sender) {
        // TODO: move to initialize function call?
        totalWeight = 0;
        quorumNumerator = 2;
        quorumDenominator = 3;
    }

    /// @dev IWavsServiceManager
    function validate(
        IWavsServiceHandler.Envelope calldata envelope,
        IWavsServiceHandler.SignatureData calldata signatureData
    ) external view override {
        if (
            signatureData.signers.length == 0 ||
            signatureData.signers.length != signatureData.signatures.length
        ) {
            revert IWavsServiceManager.InvalidSignatureLength();
        }
        if (!(signatureData.referenceBlock < block.number)) {
            revert IWavsServiceManager.InvalidSignatureBlock();
        }

        bytes32 message = keccak256(abi.encode(envelope));
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(
            message
        );
        bytes memory signatureDataBytes = abi.encode(
            signatureData.signers,
            signatureData.signatures,
            signatureData.referenceBlock
        );

        bytes4 magicValue = IERC1271.isValidSignature.selector;
        if (
            magicValue !=
            isValidSignature(ethSignedMessageHash, signatureDataBytes)
        ) {
            revert IWavsServiceManager.InvalidSignature();
        }

        // Calculate the total weight of the operators that signed
        uint256 signedWeight = 0;
        for (uint256 i = 0; i < signatureData.signers.length; ++i) {
            address operator = getLatestOperatorForSigningKey(
                signatureData.signers[i]
            );
            signedWeight += getOperatorWeight(operator);
        }

        // Ensure sufficient quorum was reached
        uint256 currentTotalWeight = getTotalWeight();
        if (currentTotalWeight == 0) {
            revert IWavsServiceManager.InsufficientQuorumZero();
        }

        // Check if signedWeight >= thresholdWeight
        uint256 thresholdWeight = (currentTotalWeight * quorumNumerator) /
            quorumDenominator;
        if (signedWeight < thresholdWeight) {
            revert IWavsServiceManager.InsufficientQuorum(
                signedWeight,
                thresholdWeight,
                currentTotalWeight
            );
        }
    }

    function setServiceURI(
        string calldata _serviceURI
    ) external override onlyOwner {
        serviceURI = _serviceURI;
        emit ServiceURIUpdated(_serviceURI);
    }

    /**
     * @notice Sets a new quorum threshold for signature validation
     * @param numerator The numerator of the quorum fraction
     * @param denominator The denominator of the quorum fraction
     * @dev The fraction numerator/denominator represents the minimum portion of stake
     *      required for a valid signature (e.g., 2/3 or 51/100)
     */
    function setQuorumThreshold(
        uint256 numerator,
        uint256 denominator
    ) external onlyOwner {
        if (numerator == 0) {
            revert IWavsServiceManager.InvalidQuorumParameters();
        }
        if (denominator == 0) {
            revert IWavsServiceManager.InvalidQuorumParameters();
        }
        if (numerator > denominator) {
            revert IWavsServiceManager.InvalidQuorumParameters();
        }

        quorumNumerator = numerator;
        quorumDenominator = denominator;

        emit QuorumThresholdUpdated(numerator, denominator);
    }

    /**
     * @notice Whitelists an operator with a specified weight
     * @param operator The address of the operator to whitelist
     * @param weight The weight to assign to the operator
     * @dev Only the owner can call this function
     */
    function whitelistOperator(
        address operator,
        uint256 weight
    ) external onlyOwner {
        if (operator == address(0)) {
            revert InvalidOperatorAddress();
        }
        if (operatorWeights[operator] != 0) {
            revert OperatorAlreadyWhitelisted();
        }
        if (weight == 0) {
            revert InvalidOperatorAddress();
        }

        operatorWeights[operator] = weight;
        operatorAddresses.push(operator);
        totalWeight += weight;
        emit OperatorWhitelisted(operator, weight);
    }

    /**
     * @notice Removes an operator from the whitelist
     * @param operator The address of the operator to remove
     * @dev Only the owner can call this function
     */
    function removeOperator(address operator) external onlyOwner {
        if (operator == address(0)) {
            revert InvalidOperatorAddress();
        }
        if (operatorWeights[operator] == 0) {
            revert OperatorNotWhitelisted();
        }

        // Remove operator weight
        uint256 operatorWeight = operatorWeights[operator];
        delete operatorWeights[operator];
        totalWeight -= operatorWeight;

        // Remove from operator addresses array
        for (uint256 i = 0; i < operatorAddresses.length; i++) {
            if (operatorAddresses[i] == operator) {
                // Move last element to the position of the element to be removed
                operatorAddresses[i] = operatorAddresses[
                    operatorAddresses.length - 1
                ];
                // Remove last element
                operatorAddresses.pop();
                break;
            }
        }

        // Clean up signing key mappings if they exist
        address signingKey = operatorSigningKeys[operator];
        if (signingKey != address(0)) {
            delete operatorSigningKeys[operator];
            delete signingKeyOperators[signingKey];
        }

        emit OperatorRemoved(operator);
    }

    /**
     * @notice Updates the weight of an existing operator
     * @param operator The address of the operator to update
     * @param newWeight The new weight to assign to the operator
     * @dev Only the owner can call this function
     */
    function updateOperatorWeight(
        address operator,
        uint256 newWeight
    ) external onlyOwner {
        if (operator == address(0)) {
            revert InvalidOperatorAddress();
        }
        if (operatorWeights[operator] == 0) {
            revert OperatorNotWhitelisted();
        }
        if (newWeight == 0) {
            revert InvalidOperatorAddress();
        }

        uint256 oldWeight = operatorWeights[operator];
        operatorWeights[operator] = newWeight;

        if (newWeight > oldWeight) {
            totalWeight += (newWeight - oldWeight);
        } else {
            totalWeight -= (oldWeight - newWeight);
        }

        emit OperatorWhitelisted(operator, newWeight);
    }

    // ==========================================
    //          Signing Key Management
    // ==========================================

    /**
     * @dev Sets a signing key for an operator (can only be set once)
     * @param signingKey The signing key address
     */
    function setSigningKey(address signingKey) external {
        require(signingKey != address(0), "Invalid signing key");

        // Operator must be whitelisted
        if (operatorWeights[msg.sender] == 0) {
            revert OperatorNotWhitelisted();
        }

        // Operator cannot use their own address as signing key
        if (msg.sender == signingKey) {
            revert CannotUseOperatorAsSigningKey();
        }

        // Check if operator already has a signing key
        // TODO: is this required? if they need to update their singing key we should let them.
        // if (operatorSigningKeys[msg.sender] != address(0)) {
        //     revert AlreadyHasSigningKey();
        // }

        // Check if signing key is already used
        if (signingKeyOperators[signingKey] != address(0)) {
            revert SigningKeyAlreadyUsed();
        }

        // Set both mappings
        operatorSigningKeys[msg.sender] = signingKey;
        signingKeyOperators[signingKey] = msg.sender;

        emit SigningKeySet(msg.sender, signingKey);
    }

    // ==========================================
    //               View Functions
    // ==========================================
    function getLatestOperatorForSigningKey(
        address signingKeyAddress
    ) public view override returns (address) {
        address operator = signingKeyOperators[signingKeyAddress];
        if (operator == address(0)) {
            revert OperatorDoesNotExistForSigningKey();
        }
        return operator;
    }

    function getLatestSigningKeyForOperator(
        address operatorAddress
    ) external view returns (address) {
        address sk = operatorSigningKeys[operatorAddress];
        if (sk == address(0)) {
            revert SingingKeyDoesNotExistForOperator();
        }
        return sk;
    }

    function isOperatorWhitelisted(
        address operatorAddress
    ) external view returns (bool) {
        return operatorWeights[operatorAddress] != 0;
    }

    function getOperatorWeight(
        address operatorAddress
    ) public view returns (uint256) {
        return operatorWeights[operatorAddress];
    }

    function getServiceURI() external view override returns (string memory) {
        return serviceURI;
    }

    function getTotalWeight() public view returns (uint256) {
        return totalWeight;
    }

    function getThresholdStake() public view returns (uint256) {
        return (totalWeight * quorumNumerator) / quorumDenominator;
    }

    function getOperatorCount() external view returns (uint256) {
        return operatorAddresses.length;
    }

    function isValidSignature(
        bytes32 digest,
        bytes memory _signatureData
    ) public view virtual returns (bytes4) {
        (
            address[] memory operators,
            bytes[] memory signatures,
            uint32 referenceBlock
        ) = abi.decode(_signatureData, (address[], bytes[], uint32));
        _checkSignatures(digest, operators, signatures, referenceBlock);
        return IERC1271.isValidSignature.selector;
    }

    /**
     * @notice Common logic to verify a batch of ECDSA signatures against a hash, using either last stake weight or at a specific block.
     * @param digest The hash of the data the signers endorsed.
     * @param signers A collection of signing key addresses that endorsed the data hash.
     * @param signatures A collection of signatures matching the signers.
     */
    function _checkSignatures(
        bytes32 digest,
        address[] memory signers,
        bytes[] memory signatures,
        uint32 // referenceBlock //  not used since we are POA and latest is always when we submit (for now at least)
    ) internal view {
        uint256 signersLength = signers.length;
        address currentSigner;
        address lastSigner;
        address operator;
        uint256 signedWeight;

        if (signersLength != signatures.length) {
            revert LengthMismatch();
        }
        if (signersLength == 0) {
            revert InvalidLength();
        }
        for (uint256 i; i < signersLength; i++) {
            currentSigner = signers[i];
            operator = getLatestOperatorForSigningKey(currentSigner);
            if (operator == address(0)) {
                revert SignerNotRegistered();
            }
            if (lastSigner >= currentSigner) {
                revert NotSorted();
            }

            if (
                !SignatureChecker.isValidSignatureNow(
                    currentSigner,
                    digest,
                    signatures[i]
                )
            ) {
                revert InvalidSignature();
            }

            lastSigner = currentSigner;
            uint256 operatorWeight = getOperatorWeight(operator);
            signedWeight += operatorWeight;
        }

        uint256 currentTotalWeight = getTotalWeight();
        if (signedWeight > currentTotalWeight) {
            revert InvalidSignedWeight();
        }
        uint256 thresholdStake = getThresholdStake();
        if (thresholdStake > signedWeight) {
            revert InsufficientSignedStake();
        }
    }

    /**
     * @notice Returns a paginated list of operator addresses and their weights
     * @param start The offset to start from
     * @param length The number of operators to retrieve
     * @param reverseOrder Whether the offset starts from the end and the data is returned in reverse
     * @return operators An array of operator addresses
     * @return weights An array of operator weights corresponding to the addresses
     */
    function getOperators(
        uint256 start,
        uint256 length,
        bool reverseOrder
    )
        external
        view
        returns (address[] memory operators, uint256[] memory weights)
    {
        uint256 operatorsLength = operatorAddresses.length;
        if (operatorsLength == 0) {
            return (new address[](0), new uint256[](0));
        }

        if (start >= operatorsLength) {
            revert InvalidOffset();
        }

        unchecked {
            uint256 len = length;
            if (operatorsLength < start + length) {
                len = operatorsLength - start;
            }

            operators = new address[](len);
            weights = new uint256[](len);

            for (uint256 i = 0; i < len; ++i) {
                uint256 index = reverseOrder
                    ? operatorsLength - (start + i + 1)
                    : start + i;
                address operator = operatorAddresses[index];
                operators[i] = operator;
                weights[i] = operatorWeights[operator];
            }

            return (operators, weights);
        }
    }

    function getAllocationManager() external view override returns (address) {}

    function getDelegationManager() external view override returns (address) {}

    function getStakeRegistry() external view override returns (address) {}
}
