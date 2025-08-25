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
        // Transfer ownership to Geyser
        vm.prank(owner);
        poaManager.transferOwnership(address(geyser));

        // Verify ownership transferred
        assertEq(poaManager.owner(), address(geyser));

        // Create envelope and signature data
        IWavsServiceHandler.Envelope memory envelope = IWavsServiceHandler.Envelope({
            eventId: bytes20(uint160(1)),
            ordering: bytes12(0),
            payload: "test123"
        });

        IWavsServiceHandler.SignatureData memory signatureData = IWavsServiceHandler.SignatureData({
            signers: new address[](0),
            signatures: new bytes[](0),
            referenceBlock: uint32(block.number - 1)
        });

        // Call handleSignedEnvelope as anyone
        vm.prank(randomUser);
        geyser.handleSignedEnvelope(envelope, signatureData);

        // Validate serviceURI was updated
        assertEq(poaManager.getServiceURI(), "test123");
    }
}
