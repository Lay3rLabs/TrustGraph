// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {Test} from "forge-std/Test.sol";
import {console} from "forge-std/console.sol";

// Safe contracts
import {GnosisSafe} from "@gnosis.pm/safe-contracts/GnosisSafe.sol";
import {GnosisSafeProxyFactory} from "@gnosis.pm/safe-contracts/proxies/GnosisSafeProxyFactory.sol";

// Zodiac
import {Operation} from "@gnosis-guild/zodiac-core/core/Operation.sol";

// WAVS interfaces
import {IWavsServiceManager} from "@wavs/interfaces/IWavsServiceManager.sol";
import {IWavsServiceHandler} from "@wavs/interfaces/IWavsServiceHandler.sol";

// Our modules
import {SignerManagerModule} from "../../src/contracts/zodiac/SignerManagerModule.sol";

contract ZodiacModulesTest is Test {
    // Core contracts
    GnosisSafe public safeSingleton;
    GnosisSafeProxyFactory public safeFactory;
    GnosisSafe public safe;
    SignerManagerModule public signerModule;
    IWavsServiceManager public mockServiceManager;

    // Test accounts
    address public owner = address(0x1111111111111111111111111111111111111111);
    address public user1 = address(0x2222222222222222222222222222222222222222);
    address public user2 = address(0x3333333333333333333333333333333333333333);
    address public user3 = address(0x4444444444444444444444444444444444444444);
    address public newSigner = address(0x5555555555555555555555555555555555555555);

    // Events for testing
    event ModuleConfigured(address indexed avatar, address indexed target);
    event SignerAdded(address indexed signer, uint256 newThreshold);
    event SignerRemoved(address indexed signer, uint256 newThreshold);
    event SignerSwapped(address indexed oldSigner, address indexed newSigner);
    event ThresholdChanged(uint256 newThreshold);
    event ActionExecuted(address indexed to, uint256 value, bytes data, Operation operation);

    function setUp() public {
        // Deploy Safe infrastructure
        safeSingleton = new GnosisSafe();
        safeFactory = new GnosisSafeProxyFactory();

        // Setup initial signers
        address[] memory signers = new address[](3);
        signers[0] = owner;
        signers[1] = user1;
        signers[2] = user2;

        // Deploy Safe proxy
        bytes memory setupData = abi.encodeWithSignature(
            "setup(address[],uint256,address,bytes,address,address,uint256,address)",
            signers,
            2, // threshold
            address(0), // to
            "", // data
            address(0), // fallback handler
            address(0), // payment token
            0, // payment
            address(0) // payment receiver
        );

        address safeProxy = address(
            safeFactory.createProxyWithNonce(
                address(safeSingleton), setupData, uint256(keccak256(abi.encodePacked("test", block.timestamp)))
            )
        );

        safe = GnosisSafe(payable(safeProxy));

        // Deploy mock service manager
        mockServiceManager = IWavsServiceManager(address(new MockWavsServiceManager()));

        // Deploy modules
        signerModule = new SignerManagerModule(owner, address(safe), address(safe), mockServiceManager);
    }

    function test_SignerModule_Setup() public {
        assertEq(signerModule.avatar(), address(safe));
        assertEq(signerModule.target(), address(safe));
        assertEq(signerModule.owner(), owner);
    }

    function test_SignerModule_GetCurrentSigners() public {
        // This is a view function test
        address[] memory currentSigners = signerModule.getSigners();

        // Should return 3 signers as set up in setUp()
        assertEq(currentSigners.length, 3);

        // Check that our initial signers are present (order might vary due to Safe's linked list)
        bool foundOwner = false;
        bool foundUser1 = false;
        bool foundUser2 = false;

        for (uint256 i = 0; i < currentSigners.length; i++) {
            if (currentSigners[i] == owner) foundOwner = true;
            if (currentSigners[i] == user1) foundUser1 = true;
            if (currentSigners[i] == user2) foundUser2 = true;
        }

        assertTrue(foundOwner, "Owner not found in signers");
        assertTrue(foundUser1, "User1 not found in signers");
        assertTrue(foundUser2, "User2 not found in signers");
    }

    function test_SignerModule_GetThreshold() public {
        uint256 threshold = signerModule.getThreshold();
        assertEq(threshold, 2, "Threshold should be 2");
    }

    function test_SignerModule_OnlyOwnerCanCallFunctions() public {
        vm.prank(user1);
        vm.expectRevert();
        signerModule.addSigner(newSigner, 2);

        vm.prank(user1);
        vm.expectRevert();
        signerModule.removeSigner(owner, user1, 1);

        vm.prank(user1);
        vm.expectRevert();
        signerModule.swapSigner(owner, user1, newSigner);

        vm.prank(user1);
        vm.expectRevert();
        signerModule.changeThreshold(3);
    }

    function test_ModulesHaveCorrectInterfaces() public view {
        // Test that modules implement expected functions
        assertTrue(address(signerModule).code.length > 0);

        // Modules should have the expected avatar and target
        assertEq(signerModule.avatar(), address(safe));
        assertEq(signerModule.target(), address(safe));
    }

    function test_SafeHasCorrectInitialState() public {
        // Verify Safe was set up correctly
        assertEq(safe.getThreshold(), 2);

        address[] memory owners = safe.getOwners();
        assertEq(owners.length, 3);

        assertTrue(safe.isOwner(owner));
        assertTrue(safe.isOwner(user1));
        assertTrue(safe.isOwner(user2));
        assertFalse(safe.isOwner(user3));
    }

    // Helper function to enable module on Safe (would require multi-sig in practice)
    function enableModuleOnSafe(address module) internal {
        // This would require executing a Safe transaction to enable the module
        // For testing purposes, this is a placeholder
        // In practice, you'd need to:
        // 1. Create a Safe transaction to enableModule(module)
        // 2. Get required signatures from Safe owners
        // 3. Execute the transaction

        // For now, we can test that the Safe has the enableModule function
        bytes memory enableData = abi.encodeWithSignature("enableModule(address)", module);
        assertTrue(enableData.length > 0, "Enable module data should be non-empty");
    }

    // WAVS functionality tests
    function test_SignerModule_WAVSAddSigner() public {
        // First enable the module on the Safe
        // Note: In real scenario, this would require multi-sig approval

        // Create WAVS payload for adding a signer
        SignerManagerModule.SignerOperation[] memory operations = new SignerManagerModule.SignerOperation[](1);
        operations[0] = SignerManagerModule.SignerOperation({
            operationType: SignerManagerModule.OperationType.ADD_SIGNER,
            prevSigner: address(0),
            signer: newSigner,
            newSigner: address(0),
            threshold: 2
        });

        SignerManagerModule.SignerManagerPayload memory payload =
            SignerManagerModule.SignerManagerPayload({operations: operations});

        // Create envelope
        IWavsServiceHandler.Envelope memory envelope = IWavsServiceHandler.Envelope({
            eventId: bytes20(uint160(0x1)),
            ordering: bytes12(uint96(0)),
            payload: abi.encode(payload)
        });

        // Create signature data (mock)
        IWavsServiceHandler.SignatureData memory signatureData;

        // Execute through WAVS - this should fail because module is not enabled on Safe
        vm.expectRevert("GS104");
        signerModule.handleSignedEnvelope(envelope, signatureData);
    }

    function test_SignerModule_WAVSOperations() public {
        // Test multiple operations in one envelope
        SignerManagerModule.SignerOperation[] memory operations = new SignerManagerModule.SignerOperation[](2);

        // Operation 1: Change threshold
        operations[0] = SignerManagerModule.SignerOperation({
            operationType: SignerManagerModule.OperationType.CHANGE_THRESHOLD,
            prevSigner: address(0),
            signer: address(0),
            newSigner: address(0),
            threshold: 3
        });

        // Operation 2: Add signer
        operations[1] = SignerManagerModule.SignerOperation({
            operationType: SignerManagerModule.OperationType.ADD_SIGNER,
            prevSigner: address(0),
            signer: newSigner,
            newSigner: address(0),
            threshold: 3
        });

        SignerManagerModule.SignerManagerPayload memory payload =
            SignerManagerModule.SignerManagerPayload({operations: operations});

        // Create envelope
        IWavsServiceHandler.Envelope memory envelope = IWavsServiceHandler.Envelope({
            eventId: bytes20(uint160(0x2)),
            ordering: bytes12(uint96(0)),
            payload: abi.encode(payload)
        });

        // Create signature data (mock)
        IWavsServiceHandler.SignatureData memory signatureData;

        // This will revert with GS104 because module is not enabled
        vm.expectRevert("GS104");
        signerModule.handleSignedEnvelope(envelope, signatureData);
    }

    function test_SignerModule_WAVSSwapSigner() public {
        // Test swap signer operation
        SignerManagerModule.SignerOperation[] memory operations = new SignerManagerModule.SignerOperation[](1);
        operations[0] = SignerManagerModule.SignerOperation({
            operationType: SignerManagerModule.OperationType.SWAP_SIGNER,
            prevSigner: owner,
            signer: user1,
            newSigner: newSigner,
            threshold: 0 // Not used for swap
        });

        SignerManagerModule.SignerManagerPayload memory payload =
            SignerManagerModule.SignerManagerPayload({operations: operations});

        IWavsServiceHandler.Envelope memory envelope = IWavsServiceHandler.Envelope({
            eventId: bytes20(uint160(0x3)),
            ordering: bytes12(uint96(0)),
            payload: abi.encode(payload)
        });

        IWavsServiceHandler.SignatureData memory signatureData;

        vm.expectRevert("GS104");
        signerModule.handleSignedEnvelope(envelope, signatureData);
    }

    function test_SignerModule_WAVSRemoveSigner() public {
        // Test remove signer operation
        SignerManagerModule.SignerOperation[] memory operations = new SignerManagerModule.SignerOperation[](1);
        operations[0] = SignerManagerModule.SignerOperation({
            operationType: SignerManagerModule.OperationType.REMOVE_SIGNER,
            prevSigner: owner,
            signer: user1,
            newSigner: address(0),
            threshold: 1 // New threshold after removal
        });

        SignerManagerModule.SignerManagerPayload memory payload =
            SignerManagerModule.SignerManagerPayload({operations: operations});

        IWavsServiceHandler.Envelope memory envelope = IWavsServiceHandler.Envelope({
            eventId: bytes20(uint160(0x4)),
            ordering: bytes12(uint96(0)),
            payload: abi.encode(payload)
        });

        IWavsServiceHandler.SignatureData memory signatureData;

        vm.expectRevert("GS104");
        signerModule.handleSignedEnvelope(envelope, signatureData);
    }
}

// Mock WAVS Service Manager for testing
contract MockWavsServiceManager is IWavsServiceManager {
    function validate(IWavsServiceHandler.Envelope calldata, IWavsServiceHandler.SignatureData calldata)
        external
        pure
    {
        // Mock validation - always passes for testing
        return;
    }

    function getOperatorWeight(address) external pure returns (uint256) {
        // Return a default weight for testing
        return 100;
    }

    function getLatestOperatorForSigningKey(address) external pure returns (address) {
        // Return a mock operator address
        return address(0x1234567890123456789012345678901234567890);
    }

    function getServiceURI() external pure returns (string memory) {
        // Return a mock service URI
        return "https://mock-service.example.com";
    }

    function setServiceURI(string calldata) external {
        // Mock implementation - does nothing in tests
    }
}
