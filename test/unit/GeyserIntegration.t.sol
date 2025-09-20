// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;

import {Test} from "forge-std/Test.sol";
import {POAStakeRegistry} from "@lay3rlabs/poa-middleware/src/ecdsa/POAStakeRegistry.sol";
import {Geyser} from "src/contracts/wavs/Geyser.sol";
import {IWavsServiceHandler} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceHandler.sol";
import {UpgradeableProxyLib} from "@lay3rlabs/poa-middleware/script/ecdsa/utils/UpgradeableProxyLib.sol";

contract GeyserIntegrationTest is Test {
    POAStakeRegistry public poaStakeRegistry;
    Geyser public geyser;

    address public owner = address(0x123);
    address public randomUser = address(0x456);

    function setUp() public {
        vm.startPrank(owner);

        // Deploy POAStakeRegistry using proxy pattern
        address poaStakeRegistryProxy = UpgradeableProxyLib.setUpEmptyProxy(owner);
        address poaStakeRegistryImpl = address(new POAStakeRegistry());

        bytes memory poaStakeRegistryInitCall = abi.encodeCall(
            POAStakeRegistry.initialize,
            (owner, 1000, 2, 3)
        );

        UpgradeableProxyLib.upgradeAndCall(
            poaStakeRegistryProxy,
            poaStakeRegistryImpl,
            poaStakeRegistryInitCall
        );

        poaStakeRegistry = POAStakeRegistry(poaStakeRegistryProxy);

        // Deploy Geyser with POA manager address
        geyser = new Geyser(address(poaStakeRegistry));

        vm.stopPrank();
    }

    /* solhint-disable func-name-mixedcase */
    function test_geyserOwnershipAndServiceURIUpdate() public {
        /* solhint-enable func-name-mixedcase */
        // First set up an operator and signing key
        address operator = address(0x789);
        uint256 signingKeyPrivateKey = 0xDEADBEEF;
        address signingKey = vm.addr(signingKeyPrivateKey);

        vm.startPrank(owner);
        // Register / whitelist an operator with sufficient weight
        poaStakeRegistry.registerOperator(operator, 1000);
        vm.stopPrank();

        // Set signing key for the operator with proper signature
        vm.startPrank(operator);
        // Generate the message hash that needs to be signed by the new signing key
        bytes32 messageHash = keccak256(abi.encode(operator));
        // Sign the message with the signing key's private key
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signingKeyPrivateKey, messageHash);
        bytes memory signingKeySignature = abi.encodePacked(r, s, v);
        // Update the signing key with the signature
        poaStakeRegistry.updateOperatorSigningKey(signingKey, signingKeySignature);
        vm.stopPrank();

        // Transfer ownership to Geyser
        vm.prank(owner);
        poaStakeRegistry.transferOwnership(address(geyser));

        // Verify ownership transferred
        assertEq(poaStakeRegistry.owner(), address(geyser));

        // Create envelope and signature data with proper signature
        IWavsServiceHandler.Envelope memory envelope =
            IWavsServiceHandler.Envelope({eventId: bytes20(uint160(1)), ordering: bytes12(0), payload: "test123"});

        // We need to use the signing key address in the signers array
        address[] memory signers = new address[](1);
        signers[0] = signingKey; // Use the signing key address, not the operator
        bytes[] memory signatures = new bytes[](1);

        // Create the signature using the already set signing key
        // The signature should be from the signingKey we already set up
        bytes32 correctMessageHash = keccak256(abi.encode(envelope));
        bytes32 correctEthSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", correctMessageHash));
        (uint8 vCorrect, bytes32 rCorrect, bytes32 sCorrect) = vm.sign(signingKeyPrivateKey, correctEthSignedMessageHash);
        signatures[0] = abi.encodePacked(rCorrect, sCorrect, vCorrect);

        vm.roll(block.number + 1);
        IWavsServiceHandler.SignatureData memory signatureData = IWavsServiceHandler.SignatureData({
            signers: signers,
            signatures: signatures,
            referenceBlock: uint32(block.number - 1)
        });

        // Call handleSignedEnvelope as anyone
        vm.prank(randomUser);
        geyser.handleSignedEnvelope(envelope, signatureData);

        // Validate serviceURI was updated
        assertEq(poaStakeRegistry.getServiceURI(), "test123");
    }
}
