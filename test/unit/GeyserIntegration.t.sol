// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;

import {Test} from "forge-std/Test.sol";
import {POAServiceManager} from "src/contracts/POAServiceManager.sol";
import {Geyser} from "src/contracts/Geyser.sol";
import {IWavsServiceManager} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceManager.sol";
import {IWavsServiceHandler} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceHandler.sol";

contract GeyserIntegrationTest is Test {
    POAServiceManager public poaManager;
    Geyser public geyser;

    address public owner = address(0x123);
    address public randomUser = address(0x456);

    function setUp() public {
        vm.startPrank(owner);

        // Deploy POAServiceManager
        poaManager = new POAServiceManager();

        // Deploy Geyser with POA manager address
        geyser = new Geyser(address(poaManager));

        vm.stopPrank();
    }

    /* solhint-disable func-name-mixedcase */
    function test_geyserOwnershipAndServiceURIUpdate() public {
        /* solhint-enable func-name-mixedcase */
        // First set up an operator and signing key
        address operator = address(0x789);
        address signingKey = address(0xABC);

        vm.startPrank(owner);
        // Whitelist an operator with sufficient weight
        poaManager.whitelistOperator(operator, 100);
        vm.stopPrank();

        // Set signing key for the operator
        vm.prank(operator);
        poaManager.setSigningKey(signingKey);

        // Transfer ownership to Geyser
        vm.prank(owner);
        poaManager.transferOwnership(address(geyser));

        // Verify ownership transferred
        assertEq(poaManager.owner(), address(geyser));

        // Create envelope and signature data with proper signature
        IWavsServiceHandler.Envelope memory envelope = IWavsServiceHandler.Envelope({
            eventId: bytes20(uint160(1)),
            ordering: bytes12(0),
            payload: "test123"
        });

        // Create a valid signature for the envelope
        bytes32 messageHash = keccak256(abi.encode(envelope));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));

        // Create a mock signature - in a real test this would be signed by the signingKey
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(1, ethSignedMessageHash); // Use key #1 for signing
        bytes memory signature = abi.encodePacked(r, s, v);

        // We need to use the signing key that we set up
        address[] memory signers = new address[](1);
        signers[0] = vm.addr(1); // This should match the signing key
        bytes[] memory signatures = new bytes[](1);
        signatures[0] = signature;

        // Update the operator's signing key to match what we're using
        vm.prank(operator);
        poaManager.setSigningKey(vm.addr(1));

        IWavsServiceHandler.SignatureData memory signatureData = IWavsServiceHandler.SignatureData({
            signers: signers,
            signatures: signatures,
            referenceBlock: uint32(block.number - 1)
        });

        // Call handleSignedEnvelope as anyone
        vm.prank(randomUser);
        geyser.handleSignedEnvelope(envelope, signatureData);

        // Validate serviceURI was updated
        assertEq(poaManager.getServiceURI(), "test123");
    }
}
