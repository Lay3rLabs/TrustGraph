// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;

import {Test} from "forge-std/Test.sol";
import {POAStakeRegistry} from "@lay3rlabs/poa-middleware/src/ecdsa/POAStakeRegistry.sol";
import {Geyser} from "src/contracts/wavs/Geyser.sol";
import {IWavsServiceHandler} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceHandler.sol";

contract GeyserIntegrationTest is Test {
    POAStakeRegistry public poaStakeRegistry;
    Geyser public geyser;

    address public owner = address(0x123);
    address public randomUser = address(0x456);

    function setUp() public {
        vm.startPrank(owner);

        // Deploy POAStakeRegistry
        poaStakeRegistry = new POAStakeRegistry();
        poaStakeRegistry.initialize(owner, 1000, 2, 3);

        // Deploy Geyser with POA manager address
        geyser = new Geyser(address(poaStakeRegistry));

        vm.stopPrank();
    }

    /* solhint-disable func-name-mixedcase */
    function test_geyserOwnershipAndServiceURIUpdate() public {
        /* solhint-enable func-name-mixedcase */
        // First set up an operator and signing key
        address operator = address(0x789);
        address signingKey = address(0xABC);

        vm.startPrank(owner);
        // Register / whitelist an operator with sufficient weight
        poaStakeRegistry.registerOperator(operator, 1000);
        vm.stopPrank();

        // Set signing key for the operator
        vm.prank(operator);
        poaStakeRegistry.updateOperatorSigningKey(signingKey);

        // Transfer ownership to Geyser
        vm.prank(owner);
        poaStakeRegistry.transferOwnership(address(geyser));

        // Verify ownership transferred
        assertEq(poaStakeRegistry.owner(), address(geyser));

        // Create envelope and signature data with proper signature
        IWavsServiceHandler.Envelope memory envelope =
            IWavsServiceHandler.Envelope({eventId: bytes20(uint160(1)), ordering: bytes12(0), payload: "test123"});

        // Create a valid signature for the envelope
        bytes32 messageHash = keccak256(abi.encode(envelope));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));

        // Create a mock signature - in a real test this would be signed by the signingKey
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(1, ethSignedMessageHash); // Use key #1 for signing
        bytes memory signature = abi.encodePacked(r, s, v);

        // We need to use the signing key that we set up
        address[] memory operators = new address[](1);
        operators[0] = operator; // This should match the signing key
        bytes[] memory signatures = new bytes[](1);
        signatures[0] = signature;

        // Update the operator's signing key to match what we're using
        vm.prank(operator);
        poaStakeRegistry.updateOperatorSigningKey(vm.addr(1));

        vm.roll(block.number + 1);
        IWavsServiceHandler.SignatureData memory signatureData = IWavsServiceHandler.SignatureData({
            signers: operators,
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
