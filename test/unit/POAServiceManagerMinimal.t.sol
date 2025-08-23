// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;

import {Test} from "forge-std/Test.sol";
import {PoAValidatorSet} from "src/contracts/POAServiceManagerMinimal.sol";
import {IWavsServiceManager} from "@wavs/interfaces/IWavsServiceManager.sol";
import {IWavsServiceHandler} from "@wavs/interfaces/IWavsServiceHandler.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

uint256 constant OPERATOR_WEIGHT = 100;

/**
 * @title POAServiceManagerMinimalTest
 * @author Lay3rLabs
 * @notice This contract contains tests for the PoAValidatorSet contract.
 * @dev This contract is used to test the PoAValidatorSet contract functionality.
 */
contract POAServiceManagerMinimalTest is Test {
    PoAValidatorSet public validatorSet;

    address public owner = address(0x123);
    address public nonOwner = address(0x456);
    address public operator1 = address(0x1);
    address public operator2 = address(0x2);
    address public operator3 = address(0x3);
    address public operator4 = address(0x4);
    address public operator5 = address(0x5);

    // Private keys for generating signatures
    uint256[] public privateKeys;
    address[] public signingKeys;

    address public signingKey1 = address(0x11);
    address public signingKey2 = address(0x22);
    address public signingKey3 = address(0x33);
    address public signingKey4 = address(0x44);
    address public signingKey5 = address(0x55);

    error POAServiceManagerMinimalTest__ArraysLengthMismatch();
    error POAServiceManagerMinimalTest__SignatureRecoveryFailed();

    function setUp() public {
        vm.startPrank(owner);
        validatorSet = new PoAValidatorSet();
        vm.stopPrank();

        // Initialize private keys and corresponding signing key addresses
        privateKeys = new uint256[](5);
        signingKeys = new address[](5);

        for (uint256 i = 0; i < 5; ++i) {
            privateKeys[i] = i + 1000; // Use higher numbers to avoid conflicts
            signingKeys[i] = vm.addr(privateKeys[i]);
        }

        // Override the hardcoded signing keys with derived ones for signature tests
        signingKey1 = signingKeys[0];
        signingKey2 = signingKeys[1];
        signingKey3 = signingKeys[2];
        signingKey4 = signingKeys[3];
        signingKey5 = signingKeys[4];
    }

    /* solhint-disable func-name-mixedcase */
    function test_initial_state() public view {
        /* solhint-enable func-name-mixedcase */
        assertEq(validatorSet.owner(), owner, "Initial owner should match");
        assertEq(validatorSet.quorumNumerator(), 2, "Initial quorum numerator should be 2");
        assertEq(validatorSet.quorumDenominator(), 3, "Initial quorum denominator should be 3");
        assertEq(validatorSet.getTotalWeight(), 0, "Initial total weight should be 0");
        assertEq(validatorSet.getServiceURI(), "", "Initial service URI should be empty");
    }

    /* solhint-disable func-name-mixedcase */
    function test_whitelistOperator_success() public {
        /* solhint-enable func-name-mixedcase */
        vm.startPrank(owner);

        vm.expectEmit(true, false, false, true);
        emit PoAValidatorSet.OperatorWhitelisted(operator1, OPERATOR_WEIGHT);

        validatorSet.whitelistOperator(operator1, OPERATOR_WEIGHT);

        assertEq(validatorSet.getOperatorWeight(operator1), OPERATOR_WEIGHT, "Operator weight should be set");
        assertEq(validatorSet.getTotalWeight(), OPERATOR_WEIGHT, "Total weight should be updated");
        assertTrue(validatorSet.isOperatorWhitelisted(operator1), "Operator should be whitelisted");

        vm.stopPrank();
    }

    /* solhint-disable func-name-mixedcase */
    function test_whitelistOperator_revert_zero_address() public {
        /* solhint-enable func-name-mixedcase */
        vm.startPrank(owner);

        vm.expectRevert(PoAValidatorSet.InvalidOperatorAddress.selector);
        validatorSet.whitelistOperator(address(0), OPERATOR_WEIGHT);

        vm.stopPrank();
    }

    /* solhint-disable func-name-mixedcase */
    function test_whitelistOperator_revert_zero_weight() public {
        /* solhint-enable func-name-mixedcase */
        vm.startPrank(owner);

        vm.expectRevert(PoAValidatorSet.InvalidOperatorAddress.selector);
        validatorSet.whitelistOperator(operator1, 0);

        vm.stopPrank();
    }

    /* solhint-disable func-name-mixedcase */
    function test_whitelistOperator_revert_already_whitelisted() public {
        /* solhint-enable func-name-mixedcase */
        vm.startPrank(owner);

        validatorSet.whitelistOperator(operator1, OPERATOR_WEIGHT);

        vm.expectRevert(PoAValidatorSet.OperatorAlreadyWhitelisted.selector);
        validatorSet.whitelistOperator(operator1, OPERATOR_WEIGHT);

        vm.stopPrank();
    }

    /* solhint-disable func-name-mixedcase */
    function test_whitelistOperator_revert_non_owner() public {
        /* solhint-enable func-name-mixedcase */
        vm.startPrank(nonOwner);

        vm.expectRevert();
        validatorSet.whitelistOperator(operator1, OPERATOR_WEIGHT);

        vm.stopPrank();
    }

    /* solhint-disable func-name-mixedcase */
    function test_removeOperator_success() public {
        /* solhint-enable func-name-mixedcase */
        vm.startPrank(owner);

        validatorSet.whitelistOperator(operator1, OPERATOR_WEIGHT);
        assertEq(validatorSet.getTotalWeight(), OPERATOR_WEIGHT, "Total weight should be OPERATOR_WEIGHT");

        vm.expectEmit(true, false, false, true);
        emit PoAValidatorSet.OperatorRemoved(operator1);

        validatorSet.removeOperator(operator1);

        assertEq(validatorSet.getOperatorWeight(operator1), 0, "Operator weight should be 0");
        assertEq(validatorSet.getTotalWeight(), 0, "Total weight should be 0");
        assertFalse(validatorSet.isOperatorWhitelisted(operator1), "Operator should not be whitelisted");

        vm.stopPrank();
    }

    /* solhint-disable func-name-mixedcase */
    function test_removeOperator_with_signing_key() public {
        /* solhint-enable func-name-mixedcase */
        vm.startPrank(owner);
        validatorSet.whitelistOperator(operator1, OPERATOR_WEIGHT);
        vm.stopPrank();

        vm.startPrank(operator1);
        validatorSet.setSigningKey(signingKey1);
        vm.stopPrank();

        assertEq(validatorSet.getSigningKey(operator1), signingKey1, "Signing key should be set");
        assertEq(validatorSet.getOperator(signingKey1), operator1, "Operator should be mapped to signing key");

        vm.startPrank(owner);
        validatorSet.removeOperator(operator1);
        vm.stopPrank();

        assertEq(validatorSet.getSigningKey(operator1), address(0), "Signing key should be cleared");
        assertEq(validatorSet.getOperator(signingKey1), address(0), "Operator mapping should be cleared");
    }

    /* solhint-disable func-name-mixedcase */
    function test_removeOperator_revert_not_whitelisted() public {
        /* solhint-enable func-name-mixedcase */
        vm.startPrank(owner);

        vm.expectRevert(PoAValidatorSet.OperatorNotWhitelisted.selector);
        validatorSet.removeOperator(operator1);

        vm.stopPrank();
    }

    /* solhint-disable func-name-mixedcase */
    function test_updateOperatorWeight_increase() public {
        /* solhint-enable func-name-mixedcase */
        vm.startPrank(owner);

        validatorSet.whitelistOperator(operator1, OPERATOR_WEIGHT);
        validatorSet.updateOperatorWeight(operator1, OPERATOR_WEIGHT * 2);

        assertEq(validatorSet.getOperatorWeight(operator1), OPERATOR_WEIGHT * 2, "Weight should be doubled");
        assertEq(validatorSet.getTotalWeight(), OPERATOR_WEIGHT * 2, "Total weight should be doubled");

        vm.stopPrank();
    }

    /* solhint-disable func-name-mixedcase */
    function test_updateOperatorWeight_decrease() public {
        /* solhint-enable func-name-mixedcase */
        vm.startPrank(owner);

        validatorSet.whitelistOperator(operator1, OPERATOR_WEIGHT);
        validatorSet.updateOperatorWeight(operator1, OPERATOR_WEIGHT / 2);

        assertEq(validatorSet.getOperatorWeight(operator1), OPERATOR_WEIGHT / 2, "Weight should be halved");
        assertEq(validatorSet.getTotalWeight(), OPERATOR_WEIGHT / 2, "Total weight should be halved");

        vm.stopPrank();
    }

    /* solhint-disable func-name-mixedcase */
    function test_updateOperatorWeight_revert_not_whitelisted() public {
        /* solhint-enable func-name-mixedcase */
        vm.startPrank(owner);

        vm.expectRevert(PoAValidatorSet.OperatorNotWhitelisted.selector);
        validatorSet.updateOperatorWeight(operator1, OPERATOR_WEIGHT);

        vm.stopPrank();
    }

    /* solhint-disable func-name-mixedcase */
    function test_setSigningKey_success() public {
        /* solhint-enable func-name-mixedcase */
        vm.startPrank(owner);
        validatorSet.whitelistOperator(operator1, OPERATOR_WEIGHT);
        vm.stopPrank();

        vm.startPrank(operator1);

        vm.expectEmit(true, true, false, true);
        emit PoAValidatorSet.SigningKeySet(operator1, signingKey1);

        validatorSet.setSigningKey(signingKey1);

        assertEq(validatorSet.getSigningKey(operator1), signingKey1, "Signing key should be set");
        assertEq(validatorSet.getOperator(signingKey1), operator1, "Operator should be mapped to signing key");
        assertEq(validatorSet.getLatestOperatorForSigningKey(signingKey1), operator1, "Latest operator should match");

        vm.stopPrank();
    }

    /* solhint-disable func-name-mixedcase */
    function test_setSigningKey_revert_operator_not_whitelisted() public {
        /* solhint-enable func-name-mixedcase */
        vm.startPrank(operator1);

        vm.expectRevert(PoAValidatorSet.OperatorNotWhitelisted.selector);
        validatorSet.setSigningKey(signingKey1);

        vm.stopPrank();
    }

    /* solhint-disable func-name-mixedcase */
    function test_setSigningKey_revert_cannot_use_operator_as_signing_key() public {
        /* solhint-enable func-name-mixedcase */
        vm.startPrank(owner);
        validatorSet.whitelistOperator(operator1, OPERATOR_WEIGHT);
        vm.stopPrank();

        vm.startPrank(operator1);

        vm.expectRevert(PoAValidatorSet.CannotUseOperatorAsSigningKey.selector);
        validatorSet.setSigningKey(operator1);

        vm.stopPrank();
    }

    /* solhint-disable func-name-mixedcase */
    function test_setSigningKey_revert_already_has_signing_key() public {
        /* solhint-enable func-name-mixedcase */
        vm.startPrank(owner);
        validatorSet.whitelistOperator(operator1, OPERATOR_WEIGHT);
        vm.stopPrank();

        vm.startPrank(operator1);
        validatorSet.setSigningKey(signingKey1);

        vm.expectRevert(PoAValidatorSet.AlreadyHasSigningKey.selector);
        validatorSet.setSigningKey(signingKey2);

        vm.stopPrank();
    }

    /* solhint-disable func-name-mixedcase */
    function test_setSigningKey_revert_signing_key_already_used() public {
        /* solhint-enable func-name-mixedcase */
        vm.startPrank(owner);
        validatorSet.whitelistOperator(operator1, OPERATOR_WEIGHT);
        validatorSet.whitelistOperator(operator2, OPERATOR_WEIGHT);
        vm.stopPrank();

        vm.startPrank(operator1);
        validatorSet.setSigningKey(signingKey1);
        vm.stopPrank();

        vm.startPrank(operator2);
        vm.expectRevert(PoAValidatorSet.SigningKeyAlreadyUsed.selector);
        validatorSet.setSigningKey(signingKey1);
        vm.stopPrank();
    }

    /* solhint-disable func-name-mixedcase */
    function test_getLatestOperatorForSigningKey_revert_not_exist() public {
        /* solhint-enable func-name-mixedcase */
        vm.expectRevert(PoAValidatorSet.OperatorDoesNotExistForSigningKey.selector);
        validatorSet.getLatestOperatorForSigningKey(signingKey1);
    }

    /* solhint-disable func-name-mixedcase */
    function test_setQuorumThreshold_success() public {
        /* solhint-enable func-name-mixedcase */
        vm.startPrank(owner);

        vm.expectEmit(false, false, false, true);
        emit IWavsServiceManager.QuorumThresholdUpdated(3, 5);

        validatorSet.setQuorumThreshold(3, 5);

        assertEq(validatorSet.quorumNumerator(), 3, "Quorum numerator should be updated");
        assertEq(validatorSet.quorumDenominator(), 5, "Quorum denominator should be updated");

        vm.stopPrank();
    }

    /* solhint-disable func-name-mixedcase */
    function test_setQuorumThreshold_revert_zero_numerator() public {
        /* solhint-enable func-name-mixedcase */
        vm.startPrank(owner);

        vm.expectRevert(IWavsServiceManager.InvalidQuorumParameters.selector);
        validatorSet.setQuorumThreshold(0, 5);

        vm.stopPrank();
    }

    /* solhint-disable func-name-mixedcase */
    function test_setQuorumThreshold_revert_zero_denominator() public {
        /* solhint-enable func-name-mixedcase */
        vm.startPrank(owner);

        vm.expectRevert(IWavsServiceManager.InvalidQuorumParameters.selector);
        validatorSet.setQuorumThreshold(3, 0);

        vm.stopPrank();
    }

    /* solhint-disable func-name-mixedcase */
    function test_setQuorumThreshold_revert_numerator_greater_than_denominator() public {
        /* solhint-enable func-name-mixedcase */
        vm.startPrank(owner);

        vm.expectRevert(IWavsServiceManager.InvalidQuorumParameters.selector);
        validatorSet.setQuorumThreshold(6, 5);

        vm.stopPrank();
    }

    /* solhint-disable func-name-mixedcase */
    function test_setQuorumThreshold_revert_non_owner() public {
        /* solhint-enable func-name-mixedcase */
        vm.startPrank(nonOwner);

        vm.expectRevert();
        validatorSet.setQuorumThreshold(3, 5);

        vm.stopPrank();
    }

    /* solhint-disable func-name-mixedcase */
    function test_setServiceURI_success() public {
        /* solhint-enable func-name-mixedcase */
        string memory testURI = "https://example.com/service";

        vm.expectEmit(false, false, false, true);
        emit IWavsServiceManager.ServiceURIUpdated(testURI);

        validatorSet.setServiceURI(testURI);

        assertEq(validatorSet.getServiceURI(), testURI, "Service URI should be set");
    }

    /* solhint-disable func-name-mixedcase */
    function test_validate_revert_empty_signers() public {
        /* solhint-enable func-name-mixedcase */
        IWavsServiceHandler.Envelope memory envelope = IWavsServiceHandler.Envelope({
            eventId: bytes20(0),
            ordering: bytes12(0),
            payload: ""
        });

        address[] memory emptySigners = new address[](0);
        bytes[] memory emptySignatures = new bytes[](0);

        IWavsServiceHandler.SignatureData memory signatureData = IWavsServiceHandler.SignatureData({
            signers: emptySigners,
            signatures: emptySignatures,
            referenceBlock: uint32(block.number - 1)
        });

        vm.expectRevert(IWavsServiceManager.InvalidSignatureLength.selector);
        validatorSet.validate(envelope, signatureData);
    }

    /* solhint-disable func-name-mixedcase */
    function test_validate_revert_length_mismatch() public {
        /* solhint-enable func-name-mixedcase */
        IWavsServiceHandler.Envelope memory envelope = IWavsServiceHandler.Envelope({
            eventId: bytes20(0),
            ordering: bytes12(0),
            payload: ""
        });

        address[] memory signers = new address[](1);
        bytes[] memory signatures = new bytes[](2);
        signers[0] = signingKey1;
        signatures[0] = "";
        signatures[1] = "";

        IWavsServiceHandler.SignatureData memory signatureData = IWavsServiceHandler.SignatureData({
            signers: signers,
            signatures: signatures,
            referenceBlock: uint32(block.number - 1)
        });

        vm.expectRevert(IWavsServiceManager.InvalidSignatureLength.selector);
        validatorSet.validate(envelope, signatureData);
    }

    /* solhint-disable func-name-mixedcase */
    function test_validate_revert_invalid_reference_block() public {
        /* solhint-enable func-name-mixedcase */
        IWavsServiceHandler.Envelope memory envelope = IWavsServiceHandler.Envelope({
            eventId: bytes20(0),
            ordering: bytes12(0),
            payload: ""
        });

        address[] memory signers = new address[](1);
        bytes[] memory signatures = new bytes[](1);
        signers[0] = signingKey1;
        signatures[0] = "";

        IWavsServiceHandler.SignatureData memory signatureData = IWavsServiceHandler.SignatureData({
            signers: signers,
            signatures: signatures,
            referenceBlock: uint32(block.number)
        });

        vm.expectRevert(IWavsServiceManager.InvalidSignatureBlock.selector);
        validatorSet.validate(envelope, signatureData);
    }

    /* solhint-disable func-name-mixedcase */
    function test_validate_revert_insufficient_quorum() public {
        /* solhint-enable func-name-mixedcase */
        _setupOperatorsWithSigningKeys();

        IWavsServiceHandler.Envelope memory envelope = IWavsServiceHandler.Envelope({
            eventId: bytes20(0),
            ordering: bytes12(0),
            payload: ""
        });

        address[] memory signers = new address[](1);
        bytes[] memory signatures = new bytes[](1);
        signers[0] = signingKey1;
        signatures[0] = "";

        IWavsServiceHandler.SignatureData memory signatureData = IWavsServiceHandler.SignatureData({
            signers: signers,
            signatures: signatures,
            referenceBlock: uint32(block.number - 1)
        });

        vm.expectRevert();
        validatorSet.validate(envelope, signatureData);
    }

    function _setupOperatorsWithSigningKeys() internal {
        vm.startPrank(owner);
        validatorSet.whitelistOperator(operator1, OPERATOR_WEIGHT);
        validatorSet.whitelistOperator(operator2, OPERATOR_WEIGHT);
        validatorSet.whitelistOperator(operator3, OPERATOR_WEIGHT);
        vm.stopPrank();

        vm.prank(operator1);
        validatorSet.setSigningKey(signingKey1);

        vm.prank(operator2);
        validatorSet.setSigningKey(signingKey2);

        vm.prank(operator3);
        validatorSet.setSigningKey(signingKey3);
    }

    /* solhint-disable func-name-mixedcase */
    function test_validate_success_with_sufficient_quorum() public {
        /* solhint-enable func-name-mixedcase */
        _setupOperatorsWithSigningKeys();

        IWavsServiceHandler.Envelope memory envelope = IWavsServiceHandler.Envelope({
            eventId: bytes20(uint160(1)),
            ordering: bytes12(0),
            payload: "test message"
        });

        // Create signature data with 2 operators (2/3 >= 2/3 == success)
        IWavsServiceHandler.SignatureData memory signatureData = _createSignatureData(envelope, 2, 0);

        // Call validate - should not revert
        validatorSet.validate(envelope, signatureData);
    }

    /* solhint-disable func-name-mixedcase */
    function test_validate_revert_insufficient_quorum_with_signatures() public {
        /* solhint-enable func-name-mixedcase */
        _setupOperatorsWithSigningKeys();

        IWavsServiceHandler.Envelope memory envelope = IWavsServiceHandler.Envelope({
            eventId: bytes20(uint160(2)),
            ordering: bytes12(0),
            payload: "insufficient test"
        });

        // Create signature data with only 1 operator (1/3 < 2/3 == failure)
        IWavsServiceHandler.SignatureData memory signatureData = _createSignatureData(envelope, 1, 0);

        // Should revert with insufficient signed stake (thrown by internal _checkSignatures)
        vm.expectRevert(PoAValidatorSet.InsufficientSignedStake.selector);
        validatorSet.validate(envelope, signatureData);
    }

    /**
     * @notice Create signature data for testing
     * @param envelope The envelope to sign
     * @param numOperators The number of operators to include
     * @param referenceBlockOffset The reference block offset
     * @return The signature data
     */
    function _createSignatureData(
        IWavsServiceHandler.Envelope memory envelope,
        uint256 numOperators,
        uint32 referenceBlockOffset
    ) internal view returns (IWavsServiceHandler.SignatureData memory) {
        // Create digest using the same logic as the contract
        bytes32 message = keccak256(abi.encode(envelope));
        bytes32 digest = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", message));

        // Create signature data with the desired number of signers
        address[] memory signers = new address[](numOperators);
        bytes[] memory signatures = new bytes[](numOperators);

        for (uint256 i = 0; i < numOperators; ++i) {
            // Use the signing keys from our setup
            signers[i] = signingKeys[i];
            // Generate signature using private key
            signatures[i] = _generateSignature(privateKeys[i], digest);
        }

        // Sort signers and signatures by signer address (required by contract)
        _sortSignersAndSignatures(signers, signatures);

        // Verify signatures are correct
        _verifySignatures(digest, signers, signatures);

        return IWavsServiceHandler.SignatureData({
            signers: signers,
            signatures: signatures,
            referenceBlock: uint32(block.number - 1 - referenceBlockOffset)
        });
    }

    /**
     * @notice Helper function to generate an ECDSA signature using a private key
     * @param privateKey The private key to sign with
     * @param digest The message hash to sign
     * @return The signature in bytes format ready for validation
     */
    function _generateSignature(
        uint256 privateKey,
        bytes32 digest
    ) internal pure returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        return abi.encodePacked(r, s, v);
    }

    /**
     * @notice Helper function to sort signers and their corresponding signatures in ascending order by signer address
     * @dev Contract requires signers to be sorted in ascending order
     * @param signers Array of signer addresses
     * @param signatures Array of signatures that correspond to signers at the same index
     */
    function _sortSignersAndSignatures(
        address[] memory signers,
        bytes[] memory signatures
    ) internal pure {
        // Simple bubble sort since we're working with small arrays
        uint256 length = signers.length;
        for (uint256 i = 0; i < length - 1; ++i) {
            for (uint256 j = 0; j < length - i - 1; ++j) {
                if (signers[j] > signers[j + 1]) {
                    // Swap signers
                    address tempAddr = signers[j];
                    signers[j] = signers[j + 1];
                    signers[j + 1] = tempAddr;

                    // Swap corresponding signatures
                    bytes memory tempSig = signatures[j];
                    signatures[j] = signatures[j + 1];
                    signatures[j + 1] = tempSig;
                }
            }
        }
    }

    /**
     * @notice Helper function to verify that signatures can be recovered to the expected signers
     * @param digest Message hash that was signed
     * @param signers Array of signer addresses (should be sorted)
     * @param signatures Array of signatures corresponding to signers
     */
    function _verifySignatures(
        bytes32 digest,
        address[] memory signers,
        bytes[] memory signatures
    ) internal pure {
        if (signers.length != signatures.length) {
            revert POAServiceManagerMinimalTest__ArraysLengthMismatch();
        }

        for (uint256 i = 0; i < signers.length; ++i) {
            address recovered = ECDSA.recover(digest, signatures[i]);
            if (recovered != signers[i]) {
                revert POAServiceManagerMinimalTest__SignatureRecoveryFailed();
            }
        }
    }
}
