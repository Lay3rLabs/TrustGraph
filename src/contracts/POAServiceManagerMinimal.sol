// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {IWavsServiceManager} from "@wavs/interfaces/IWavsServiceManager.sol";
import {IWavsServiceHandler} from "@wavs/interfaces/IWavsServiceHandler.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {SignatureChecker} from "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import {SignerECDSAUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/cryptography/signers/SignerECDSAUpgradeable.sol";

// ORIGINAL SOURCE: https://github.com/Lay3rLabs/wavs-bridge/pull/84/files

/**
 * Openzepplin-contracts-upgradable v4.9.0 contracts/interfaces/IERC1271Upgradeable.sol
 * @dev Interface of the ERC1271 standard signature validation method for
 * contracts as defined in https://eips.ethereum.org/EIPS/eip-1271[ERC-1271].
 *
 * _Available since v4.1._
 */
interface IERC1271Upgradeable {
    /**
     * @dev Should return whether the signature provided is valid for the provided data
     * @param hash      Hash of the data to be signed
     * @param signature Signature byte array associated with _data
     */
    function isValidSignature(bytes32 hash, bytes memory signature) external view returns (bytes4 magicValue);
}

// PoAValidatorSet is a contract that is a *really* minimal version of the contracts/src/eigenlayer/ecdsa/WavsServiceManager.sol
// TODO(Jake): would be cool if we could have a WAVServiceManager + handler in 1. Not sure if we really want people to have to deploy both
// TODO(reece): slashing could be done manually from owner (it's poa), rewards could be done with merkle drop / vault shares as payout.
contract PoAValidatorSet is Ownable, ReentrancyGuard, IWavsServiceManager {
    /// @notice The URI of the service
    string public serviceURI;
    /// @notice The numerator of the quorum threshold
    uint256 public quorumNumerator;
    /// @notice The denominator of the quorum threshold
    uint256 public quorumDenominator;

    // mapping of addresses to weights
    mapping(address => uint256) private operatorWeights;
    // array to track all operator addresses for pagination
    address[] private operatorAddresses;
    uint256 private totalWeight = 0;

    // operator address -> signing key link
    mapping(address => address) private operatorSigningKeys;
    // mapping of signing key -> operator address
    mapping(address => address) private signingKeyOperators;

    error OperatorDoesNotExistForSigningKey();
    error OperatorAlreadyWhitelisted();
    error OperatorNotWhitelisted();
    error InvalidOperatorAddress();
    error InvalidOffset();

    // sig verification
    error LengthMismatch();
    error InvalidLength();
    error SignerNotRegistered();
    error NotSorted();
    error InvalidSignedWeight();
    error InsufficientSignedStake();

    constructor() Ownable(msg.sender) {
        // TODO: move to initialize function call
        quorumNumerator = 2;
        quorumDenominator = 3;
    }

    function getOperatorWeight(
        address operator
    ) public view returns (uint256) {
        return operatorWeights[operator];
    }

    function getOperator(address signingKey) public view returns (address) {
        return signingKeyOperators[signingKey];
    }

    // TODO: issue, from eigen ECDSAStakeRegistry.sol (re: license)
    function isValidSignature(
        bytes32 digest,
        bytes memory _signatureData
    ) virtual public view returns (bytes4) {
        (address[] memory operators, bytes[] memory signatures, uint32 referenceBlock) =
            abi.decode(_signatureData, (address[], bytes[], uint32));
        _checkSignatures(digest, operators, signatures, referenceBlock);
        return IERC1271Upgradeable.isValidSignature.selector;
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
        uint32 // referenceBlock not used since we are PoA and latest is always when we submit (for now at least)
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
            operator = getOperator(currentSigner);
            if (operator == address(0)) {
                revert SignerNotRegistered();
            }

            if (lastSigner >= currentSigner) {
                revert NotSorted();
            }


            // _validateSignature(currentSigner, digest, signatures[i]);
            if( !SignatureChecker.isValidSignatureNow(currentSigner, digest, signatures[i])) {
                revert InvalidSignature();
            }

            lastSigner = currentSigner;
            uint256 operatorWeight = getOperatorWeight(operator);
            signedWeight += operatorWeight;
        }

        // _validateThresholdStake(signedWeight, referenceBlock);
        uint256 currentTotalWeight = _getTotalWeight();
        if (signedWeight > currentTotalWeight) {
            revert InvalidSignedWeight();
        }
        uint256 thresholdStake = _getThresholdStake();
        if (thresholdStake > signedWeight) {
            revert InsufficientSignedStake();
        }
    }

    function validate(
        IWavsServiceHandler.Envelope calldata envelope,
        IWavsServiceHandler.SignatureData calldata signatureData
    ) external view override {
        // Input validation
        if (
            signatureData.signers.length == 0
                || signatureData.signers.length != signatureData.signatures.length
        ) {
            revert IWavsServiceManager.InvalidSignatureLength();
        }
        if (!(signatureData.referenceBlock < block.number)) {
            revert IWavsServiceManager.InvalidSignatureBlock();
        }

        // Create message hash
        bytes32 message = keccak256(abi.encode(envelope));
        bytes32 ethSignedMessageHash = toEthSignedMessageHash(message);

        // Validate signatures through the stake registry
        bytes4 magicValue = IERC1271Upgradeable.isValidSignature.selector;
        bytes memory signatureDataBytes = abi.encode(
            signatureData.signers, signatureData.signatures, signatureData.referenceBlock
        );

        // Check signature validity
        if (
            // magicValue != ECDSAStakeRegistry(stakeRegistry).isValidSignature(ethSignedMessageHash, signatureDataBytes)
            magicValue != isValidSignature(ethSignedMessageHash, signatureDataBytes)
        ) {
            revert IWavsServiceManager.InvalidSignature();
        }

        // // Calculate the total weight of the operators that signed
        // IECDSAStakeRegistry registry = IECDSAStakeRegistry(stakeRegistry);
        uint256 signedWeight = 0;
        for (uint256 i = 0; i < signatureData.signers.length; ++i) {
            // address operator = registry.getOperatorForSigningKeyAtBlock(
            //     signatureData.signers[i], signatureData.referenceBlock
            // );
            address operator = getOperator(signatureData.signers[i]);
            // signedWeight +=
            //     registry.getOperatorWeightAtBlock(operator, signatureData.referenceBlock);
            signedWeight += getOperatorWeight(operator);
        }

        // uint256 totalWeight =
        //     registry.getLastCheckpointTotalWeightAtBlock(signatureData.referenceBlock);

        // Ensure sufficient quorum was reached
        uint256 currentTotalWeight = _getTotalWeight();
        _validateQuorumSigned(signedWeight, currentTotalWeight);
    }

    // openzeppelin-contracts-upgradable-v4.9.0 contracts/utils/cryptography/ECDSAUpgradable.sol
   /**
     * @dev Returns an Ethereum Signed Message, created from a `hash`. This
     * produces hash corresponding to the one signed with the
     * https://eth.wiki/json-rpc/API#eth_sign[`eth_sign`]
     * JSON-RPC method as part of EIP-191.
     *
     * See {recover}.
     */
    function toEthSignedMessageHash(bytes32 hash) internal pure returns (bytes32 message) {
        // 32 is the length in bytes of hash,
        // enforced by the type signature above
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, "\x19Ethereum Signed Message:\n32")
            mstore(0x1c, hash)
            message := keccak256(0x00, 0x3c)
        }
    }

    /**
     * @notice Validates that sufficient quorum has been reached
     * @param signedWeight The total weight of operators who signed
     * @param currentTotalWeight The total weight of all operators
     * @dev Requires at least quorumNumerator/quorumDenominator of the total weight to have signed
     */
    function _validateQuorumSigned(uint256 signedWeight, uint256 currentTotalWeight) internal view {
        // Avoid 0 weight ever passing this check
        if (currentTotalWeight == 0) {
            revert IWavsServiceManager.InsufficientQuorumZero();
        }

        // Calculate threshold weight
        uint256 thresholdWeight = (currentTotalWeight * quorumNumerator) / quorumDenominator;

        // Check if signedWeight >= thresholdWeight
        if (signedWeight < thresholdWeight) {
            revert IWavsServiceManager.InsufficientQuorum(
                signedWeight, thresholdWeight, currentTotalWeight
            );
        }
    }

    function getServiceURI() external view override returns (string memory) {
        return serviceURI;
    }

    function setServiceURI(string calldata _serviceURI) external override {
        serviceURI = _serviceURI;
        emit ServiceURIUpdated(_serviceURI);
    }

    function getLatestOperatorForSigningKey(
        address signingKeyAddress
    ) external view override returns (address) {
        address operator = signingKeyOperators[signingKeyAddress];
        if (operator == address(0)) {
            revert OperatorDoesNotExistForSigningKey();

        }
        return operator;
    }

    // extra
    /**
     * @notice Sets a new quorum threshold for signature validation
     * @param numerator The numerator of the quorum fraction
     * @param denominator The denominator of the quorum fraction
     * @dev The fraction numerator/denominator represents the minimum portion of stake
     *      required for a valid signature (e.g., 2/3 or 51/100)
     */
    function setQuorumThreshold(uint256 numerator, uint256 denominator) external onlyOwner {
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


    // Operator management events
    event OperatorWhitelisted(address indexed operator, uint256 weight);
    event OperatorRemoved(address indexed operator);

    /**
     * @notice Whitelists an operator with a specified weight
     * @param operator The address of the operator to whitelist
     * @param weight The weight to assign to the operator
     * @dev Only the owner can call this function
     */
    function whitelistOperator(address operator, uint256 weight) external onlyOwner {
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
        _removeFromOperatorAddresses(operator);

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
    function updateOperatorWeight(address operator, uint256 newWeight) external onlyOwner {
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

    /**
     * @notice Checks if an operator is whitelisted
     * @param operator The address to check
     * @return bool True if the operator is whitelisted
     */
    function isOperatorWhitelisted(address operator) external view returns (bool) {
        return operatorWeights[operator] != 0;
    }

    // Signing key management
    event SigningKeySet(address indexed operator, address indexed signingKey);
    error AlreadyHasSigningKey();
    error SigningKeyAlreadyUsed();
    error CannotUseOperatorAsSigningKey();

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
        if (operatorSigningKeys[msg.sender] != address(0)) {
            revert AlreadyHasSigningKey();
        }

        // Check if signing key is already used
        if (signingKeyOperators[signingKey] != address(0)) {
            revert SigningKeyAlreadyUsed();
        }

        // Set both mappings
        operatorSigningKeys[msg.sender] = signingKey;
        signingKeyOperators[signingKey] = msg.sender;

        emit SigningKeySet(msg.sender, signingKey);
    }

    // View functions
    function getSigningKey(address operator) external view returns (address) {
        return operatorSigningKeys[operator];
    }

    function getTotalWeight() external view returns (uint256) {
        return totalWeight;
    }

    function _getTotalWeight() internal view returns (uint256) {
        return totalWeight;
    }

    function _getThresholdStake() internal view returns (uint256) {
        return (totalWeight * quorumNumerator) / quorumDenominator;
    }

    /**
     * @notice Removes an operator from the operatorAddresses array
     * @param operator The operator address to remove
     */
    function _removeFromOperatorAddresses(address operator) internal {
        for (uint256 i = 0; i < operatorAddresses.length; i++) {
            if (operatorAddresses[i] == operator) {
                // Move last element to the position of the element to be removed
                operatorAddresses[i] = operatorAddresses[operatorAddresses.length - 1];
                // Remove last element
                operatorAddresses.pop();
                break;
            }
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
    function getOperators(uint256 start, uint256 length, bool reverseOrder)
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
                uint256 index = reverseOrder ? operatorsLength - (start + i + 1) : start + i;
                address operator = operatorAddresses[index];
                operators[i] = operator;
                weights[i] = operatorWeights[operator];
            }

            return (operators, weights);
        }
    }

    /**
     * @notice Returns the total number of operators
     * @return The total number of operators
     */
    function getOperatorCount() external view returns (uint256) {
        return operatorAddresses.length;
    }

}
