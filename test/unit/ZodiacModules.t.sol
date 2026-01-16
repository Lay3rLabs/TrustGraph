// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import { Test } from 'forge-std/Test.sol';

// Safe contracts
import { GnosisSafe } from '@gnosis.pm/safe-contracts/GnosisSafe.sol';
import {
  GnosisSafeProxyFactory
} from '@gnosis.pm/safe-contracts/proxies/GnosisSafeProxyFactory.sol';

// Zodiac
import { Operation } from '@gnosis-guild/zodiac-core/core/Operation.sol';

// WAVS interfaces
import {
  IWavsServiceManager
} from '@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceManager.sol';
import {
  IWavsServiceHandler
} from '@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceHandler.sol';

// Our modules
import {
  SignerSyncManagerModule
} from '../../src/contracts/zodiac/SignerSyncManagerModule.sol';
import { WavsModule } from '../../src/contracts/zodiac/WavsModule.sol';

contract ZodiacModulesTest is Test {
  // Core contracts
  GnosisSafe public safeSingleton;
  GnosisSafeProxyFactory public safeFactory;
  GnosisSafe public safe;
  SignerSyncManagerModule public signerModule;
  WavsModule public wavsModule;
  IWavsServiceManager public mockServiceManager;

  // Test accounts
  address public owner = address(0x1111111111111111111111111111111111111111);
  address public user1 = address(0x2222222222222222222222222222222222222222);
  address public user2 = address(0x3333333333333333333333333333333333333333);
  address public user3 = address(0x4444444444444444444444444444444444444444);
  address public newSigner =
    address(0x5555555555555555555555555555555555555555);

  // Events for testing
  event ModuleConfigured(address indexed avatar, address indexed target);
  event SignerAdded(address indexed signer, uint256 newThreshold);
  event SignerRemoved(address indexed signer, uint256 newThreshold);
  event SignerSwapped(address indexed oldSigner, address indexed newSigner);
  event ThresholdChanged(uint256 newThreshold);
  event ActionExecuted(
    address indexed to,
    uint256 value,
    bytes data,
    Operation operation
  );

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
      'setup(address[],uint256,address,bytes,address,address,uint256,address)',
      signers,
      2, // threshold
      address(0), // to
      '', // data
      address(0), // fallback handler
      address(0), // payment token
      0, // payment
      address(0) // payment receiver
    );

    address safeProxy = address(
      safeFactory.createProxyWithNonce(
        address(safeSingleton),
        setupData,
        uint256(keccak256(abi.encodePacked('test', block.timestamp)))
      )
    );

    safe = GnosisSafe(payable(safeProxy));

    // Deploy mock service manager
    mockServiceManager = IWavsServiceManager(
      address(new MockWavsServiceManager())
    );

    // Deploy modules
    signerModule = new SignerSyncManagerModule(
      owner,
      address(safe),
      address(safe),
      mockServiceManager
    );
    wavsModule = new WavsModule(
      owner,
      address(safe),
      address(safe),
      mockServiceManager,
      true
    ); // strict nonce ordering
  }

  function test_SignerModule_Setup() public view {
    assertEq(signerModule.avatar(), address(safe));
    assertEq(signerModule.target(), address(safe));
    assertEq(signerModule.owner(), owner);
  }

  function test_SignerModule_GetCurrentSigners() public view {
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

    assertTrue(foundOwner, 'Owner not found in signers');
    assertTrue(foundUser1, 'User1 not found in signers');
    assertTrue(foundUser2, 'User2 not found in signers');
  }

  function test_SignerModule_GetThreshold() public view {
    uint256 threshold = signerModule.getThreshold();
    assertEq(threshold, 2, 'Threshold should be 2');
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

  function test_SafeHasCorrectInitialState() public view {
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
  function enableModuleOnSafe(address module) internal pure {
    // This would require executing a Safe transaction to enable the module
    // For testing purposes, this is a placeholder
    // In practice, you'd need to:
    // 1. Create a Safe transaction to enableModule(module)
    // 2. Get required signatures from Safe owners
    // 3. Execute the transaction

    // For now, we can test that the Safe has the enableModule function
    bytes memory enableData = abi.encodeWithSignature(
      'enableModule(address)',
      module
    );
    assertTrue(enableData.length > 0, 'Enable module data should be non-empty');
  }

  // WAVS functionality tests
  function test_SignerModule_WAVSAddSigner() public {
    // First enable the module on the Safe
    // Note: In real scenario, this would require multi-sig approval

    // Create WAVS payload for adding a signer
    SignerSyncManagerModule.SignerOperation[]
      memory operations = new SignerSyncManagerModule.SignerOperation[](1);
    operations[0] = SignerSyncManagerModule.SignerOperation({
      operationType: SignerSyncManagerModule.OperationType.ADD_SIGNER,
      prevSigner: address(0),
      signer: newSigner,
      newSigner: address(0),
      threshold: 2
    });

    SignerSyncManagerModule.SignerManagerPayload
      memory payload = SignerSyncManagerModule.SignerManagerPayload({
        operations: operations
      });

    // Create envelope
    IWavsServiceHandler.Envelope memory envelope = IWavsServiceHandler
      .Envelope({
        eventId: bytes20(uint160(0x1)),
        ordering: bytes12(uint96(0)),
        payload: abi.encode(payload)
      });

    // Create signature data (mock)
    IWavsServiceHandler.SignatureData memory signatureData;

    // Execute through WAVS - this should fail because module is not enabled on Safe
    vm.expectRevert('GS104');
    signerModule.handleSignedEnvelope(envelope, signatureData);
  }

  function test_SignerModule_WAVSOperations() public {
    // Test multiple operations in one envelope
    SignerSyncManagerModule.SignerOperation[]
      memory operations = new SignerSyncManagerModule.SignerOperation[](2);

    // Operation 1: Change threshold
    operations[0] = SignerSyncManagerModule.SignerOperation({
      operationType: SignerSyncManagerModule.OperationType.CHANGE_THRESHOLD,
      prevSigner: address(0),
      signer: address(0),
      newSigner: address(0),
      threshold: 3
    });

    // Operation 2: Add signer
    operations[1] = SignerSyncManagerModule.SignerOperation({
      operationType: SignerSyncManagerModule.OperationType.ADD_SIGNER,
      prevSigner: address(0),
      signer: newSigner,
      newSigner: address(0),
      threshold: 3
    });

    SignerSyncManagerModule.SignerManagerPayload
      memory payload = SignerSyncManagerModule.SignerManagerPayload({
        operations: operations
      });

    // Create envelope
    IWavsServiceHandler.Envelope memory envelope = IWavsServiceHandler
      .Envelope({
        eventId: bytes20(uint160(0x2)),
        ordering: bytes12(uint96(0)),
        payload: abi.encode(payload)
      });

    // Create signature data (mock)
    IWavsServiceHandler.SignatureData memory signatureData;

    // This will revert with GS104 because module is not enabled
    vm.expectRevert('GS104');
    signerModule.handleSignedEnvelope(envelope, signatureData);
  }

  function test_SignerModule_WAVSSwapSigner() public {
    // Test swap signer operation
    SignerSyncManagerModule.SignerOperation[]
      memory operations = new SignerSyncManagerModule.SignerOperation[](1);
    operations[0] = SignerSyncManagerModule.SignerOperation({
      operationType: SignerSyncManagerModule.OperationType.SWAP_SIGNER,
      prevSigner: owner,
      signer: user1,
      newSigner: newSigner,
      threshold: 0 // Not used for swap
    });

    SignerSyncManagerModule.SignerManagerPayload
      memory payload = SignerSyncManagerModule.SignerManagerPayload({
        operations: operations
      });

    IWavsServiceHandler.Envelope memory envelope = IWavsServiceHandler
      .Envelope({
        eventId: bytes20(uint160(0x3)),
        ordering: bytes12(uint96(0)),
        payload: abi.encode(payload)
      });

    IWavsServiceHandler.SignatureData memory signatureData;

    vm.expectRevert('GS104');
    signerModule.handleSignedEnvelope(envelope, signatureData);
  }

  function test_SignerModule_WAVSRemoveSigner() public {
    // Test remove signer operation
    SignerSyncManagerModule.SignerOperation[]
      memory operations = new SignerSyncManagerModule.SignerOperation[](1);
    operations[0] = SignerSyncManagerModule.SignerOperation({
      operationType: SignerSyncManagerModule.OperationType.REMOVE_SIGNER,
      prevSigner: owner,
      signer: user1,
      newSigner: address(0),
      threshold: 1 // New threshold after removal
    });

    SignerSyncManagerModule.SignerManagerPayload
      memory payload = SignerSyncManagerModule.SignerManagerPayload({
        operations: operations
      });

    IWavsServiceHandler.Envelope memory envelope = IWavsServiceHandler
      .Envelope({
        eventId: bytes20(uint160(0x4)),
        ordering: bytes12(uint96(0)),
        payload: abi.encode(payload)
      });

    IWavsServiceHandler.SignatureData memory signatureData;

    vm.expectRevert('GS104');
    signerModule.handleSignedEnvelope(envelope, signatureData);
  }

  // ============================================
  // WavsModule Tests
  // ============================================

  function test_WavsModule_Setup() public view {
    assertEq(wavsModule.avatar(), address(safe));
    assertEq(wavsModule.target(), address(safe));
    assertEq(wavsModule.owner(), owner);
    assertEq(address(wavsModule.serviceManager()), address(mockServiceManager));
    assertTrue(wavsModule.strictNonceOrdering());
    assertEq(wavsModule.lastExecutedNonce(), 0);
  }

  function test_WavsModule_DirectExecutionOnlyOwner() public {
    bytes memory data = abi.encodeWithSignature(
      'transfer(address,uint256)',
      user1,
      100
    );

    // Non-owner cannot execute
    vm.prank(user1);
    vm.expectRevert();
    wavsModule.executeTransaction(address(0x123), 0, data, Operation.Call);

    // Owner can execute (will fail with GS104 since module not enabled on Safe)
    vm.prank(owner);
    vm.expectRevert('GS104');
    wavsModule.executeTransaction(address(safe), 0, data, Operation.Call);
  }

  function test_WavsModule_BatchExecution() public {
    WavsModule.Transaction[] memory transactions = new WavsModule.Transaction[](
      2
    );

    transactions[0] = WavsModule.Transaction({
      target: address(0x123),
      value: 0,
      data: abi.encodeWithSignature('test()'),
      operation: Operation.Call
    });

    transactions[1] = WavsModule.Transaction({
      target: address(0x456),
      value: 100,
      data: '',
      operation: Operation.Call
    });

    // Non-owner cannot execute batch
    vm.prank(user1);
    vm.expectRevert();
    wavsModule.executeBatch(transactions);

    // Owner tries to execute batch (will fail on first tx since module not enabled)
    vm.prank(owner);
    vm.expectRevert('GS104');
    wavsModule.executeBatch(transactions);
  }

  function test_WavsModule_StrictNonceOrdering() public {
    // Create first transaction with nonce 1
    WavsModule.Transaction[] memory transactions = new WavsModule.Transaction[](
      1
    );
    transactions[0] = WavsModule.Transaction({
      target: address(0x123),
      value: 0,
      data: abi.encodeWithSignature('test()'),
      operation: Operation.Call
    });

    WavsModule.TransactionPayload memory payload1 = WavsModule
      .TransactionPayload({
        nonce: 1,
        transactions: transactions,
        description: 'Test transaction 1'
      });

    IWavsServiceHandler.Envelope memory envelope1 = IWavsServiceHandler
      .Envelope({
        eventId: bytes20(uint160(0x10)),
        ordering: bytes12(uint96(0)),
        payload: abi.encode(payload1)
      });

    IWavsServiceHandler.SignatureData memory signatureData;

    // Execute first transaction
    vm.expectRevert('GS104'); // Module not enabled on Safe
    wavsModule.handleSignedEnvelope(envelope1, signatureData);

    // Try to execute with wrong nonce (should fail even before module execution)
    WavsModule.TransactionPayload memory payload3 = WavsModule
      .TransactionPayload({
        nonce: 3, // Wrong nonce, should be 1
        transactions: transactions,
        description: 'Test transaction 3'
      });

    IWavsServiceHandler.Envelope memory envelope3 = IWavsServiceHandler
      .Envelope({
        eventId: bytes20(uint160(0x12)),
        ordering: bytes12(uint96(0)),
        payload: abi.encode(payload3)
      });

    vm.expectRevert('Invalid nonce: strict ordering required');
    wavsModule.handleSignedEnvelope(envelope3, signatureData);
  }

  function test_WavsModule_NonStrictNonceOrdering() public {
    // Deploy a new module with non-strict ordering
    WavsModule nonStrictModule = new WavsModule(
      owner,
      address(safe),
      address(safe),
      mockServiceManager,
      false
    );

    // For this test, we'll create a mock contract that we can successfully call
    MockTarget mockTarget = new MockTarget();

    WavsModule.Transaction[] memory transactions = new WavsModule.Transaction[](
      1
    );
    transactions[0] = WavsModule.Transaction({
      target: address(mockTarget),
      value: 0,
      data: abi.encodeWithSignature('successfulCall()'),
      operation: Operation.Call
    });

    // Execute nonce 5 first (out of order)
    WavsModule.TransactionPayload memory payload5 = WavsModule
      .TransactionPayload({
        nonce: 5,
        transactions: transactions,
        description: 'Test transaction 5'
      });

    IWavsServiceHandler.Envelope memory envelope5 = IWavsServiceHandler
      .Envelope({
        eventId: bytes20(uint160(0x15)),
        ordering: bytes12(uint96(0)),
        payload: abi.encode(payload5)
      });

    IWavsServiceHandler.SignatureData memory signatureData;

    // This will still fail because module is not enabled on Safe
    vm.expectRevert('GS104');
    nonStrictModule.handleSignedEnvelope(envelope5, signatureData);

    // Try to reuse same nonce - will fail with same error since transaction reverted
    vm.expectRevert('GS104');
    nonStrictModule.handleSignedEnvelope(envelope5, signatureData);
  }

  function test_WavsModule_EmptyTransactions() public {
    WavsModule.Transaction[]
      memory emptyTransactions = new WavsModule.Transaction[](0);

    WavsModule.TransactionPayload memory payload = WavsModule
      .TransactionPayload({
        nonce: 1,
        transactions: emptyTransactions,
        description: 'Empty batch'
      });

    IWavsServiceHandler.Envelope memory envelope = IWavsServiceHandler
      .Envelope({
        eventId: bytes20(uint160(0x20)),
        ordering: bytes12(uint96(0)),
        payload: abi.encode(payload)
      });

    IWavsServiceHandler.SignatureData memory signatureData;

    vm.expectRevert('No transactions to execute');
    wavsModule.handleSignedEnvelope(envelope, signatureData);
  }

  function test_WavsModule_UpdateServiceManager() public {
    IWavsServiceManager newServiceManager = IWavsServiceManager(address(0x999));

    // Non-owner cannot update
    vm.prank(user1);
    vm.expectRevert();
    wavsModule.updateServiceManager(newServiceManager);

    // Owner can update
    vm.prank(owner);
    wavsModule.updateServiceManager(newServiceManager);
    assertEq(address(wavsModule.serviceManager()), address(newServiceManager));

    // Cannot set to zero address
    vm.prank(owner);
    vm.expectRevert('Invalid service manager');
    wavsModule.updateServiceManager(IWavsServiceManager(address(0)));
  }

  function test_WavsModule_ToggleStrictOrdering() public {
    assertTrue(wavsModule.strictNonceOrdering());

    // Non-owner cannot toggle
    vm.prank(user1);
    vm.expectRevert();
    wavsModule.setStrictNonceOrdering(false);

    // Owner can toggle
    vm.prank(owner);
    wavsModule.setStrictNonceOrdering(false);
    assertFalse(wavsModule.strictNonceOrdering());

    vm.prank(owner);
    wavsModule.setStrictNonceOrdering(true);
    assertTrue(wavsModule.strictNonceOrdering());
  }

  function test_WavsModule_UpdateModuleConfig() public {
    address newAvatar = address(0x777);
    address newTarget = address(0x888);

    // Non-owner cannot update
    vm.prank(user1);
    vm.expectRevert();
    wavsModule.updateModuleConfig(newAvatar, newTarget);

    // Owner can update
    vm.prank(owner);
    wavsModule.updateModuleConfig(newAvatar, newTarget);
    assertEq(wavsModule.avatar(), newAvatar);
    assertEq(wavsModule.target(), newTarget);

    // Cannot set to zero addresses
    vm.prank(owner);
    vm.expectRevert('Invalid avatar');
    wavsModule.updateModuleConfig(address(0), newTarget);

    vm.prank(owner);
    vm.expectRevert('Invalid target');
    wavsModule.updateModuleConfig(newAvatar, address(0));
  }

  function test_WavsModule_ViewFunctions() public view {
    // Test getNextNonce
    assertEq(wavsModule.getNextNonce(), 1);

    // Test isNonceExecuted
    assertFalse(wavsModule.isNonceExecuted(1));
    assertFalse(wavsModule.isNonceExecuted(5));

    // Test getModuleConfig
    (
      address _owner,
      address _avatar,
      address _target,
      address _serviceManager
    ) = wavsModule.getModuleConfig();
    assertEq(_owner, owner);
    assertEq(_avatar, address(safe));
    assertEq(_target, address(safe));
    assertEq(_serviceManager, address(mockServiceManager));
  }

  function test_WavsModule_MultipleTransactionsInBatch() public {
    WavsModule.Transaction[] memory transactions = new WavsModule.Transaction[](
      3
    );

    // Transaction 1: Call to address
    transactions[0] = WavsModule.Transaction({
      target: address(0x111),
      value: 0,
      data: abi.encodeWithSignature('function1()'),
      operation: Operation.Call
    });

    // Transaction 2: Send ETH
    transactions[1] = WavsModule.Transaction({
      target: address(0x222),
      value: 1 ether,
      data: '',
      operation: Operation.Call
    });

    // Transaction 3: Delegate call
    transactions[2] = WavsModule.Transaction({
      target: address(0x333),
      value: 0,
      data: abi.encodeWithSignature('function2(uint256)', 42),
      operation: Operation.DelegateCall
    });

    WavsModule.TransactionPayload memory payload = WavsModule
      .TransactionPayload({
        nonce: 1,
        transactions: transactions,
        description: 'Multiple operations batch'
      });

    IWavsServiceHandler.Envelope memory envelope = IWavsServiceHandler
      .Envelope({
        eventId: bytes20(uint160(0x30)),
        ordering: bytes12(uint96(0)),
        payload: abi.encode(payload)
      });

    IWavsServiceHandler.SignatureData memory signatureData;

    // Will fail because module is not enabled on Safe
    vm.expectRevert('GS104');
    wavsModule.handleSignedEnvelope(envelope, signatureData);
  }
}

// Mock Target contract for testing successful calls
contract MockTarget {
  event Called();

  function successfulCall() external {
    emit Called();
  }
}

// Mock WAVS Service Manager for testing
contract MockWavsServiceManager is IWavsServiceManager {
  function validate(
    IWavsServiceHandler.Envelope calldata,
    IWavsServiceHandler.SignatureData calldata
  ) external pure {
    // Mock validation - always passes for testing
    return;
  }

  function getOperatorWeight(address) external pure returns (uint256) {
    // Return a default weight for testing
    return 100;
  }

  function getLatestOperatorForSigningKey(
    address
  ) external pure returns (address) {
    // Return a mock operator address
    return address(0x1234567890123456789012345678901234567890);
  }

  function getServiceURI() external pure returns (string memory) {
    // Return a mock service URI
    return 'https://mock-service.example.com';
  }

  function setServiceURI(string calldata) external {
    // Mock implementation - does nothing in tests
  }

  function getAllocationManager() external view override returns (address) {}

  function getDelegationManager() external view override returns (address) {}

  function getStakeRegistry() external view override returns (address) {}
}
