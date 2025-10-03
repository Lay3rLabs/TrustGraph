// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Test} from "forge-std/Test.sol";
import {MerkleSnapshot} from "../../src/contracts/merkle/MerkleSnapshot.sol";
import {IMerkleSnapshot} from "interfaces/merkle/IMerkleSnapshot.sol";
import {IMerkleSnapshotHook} from "interfaces/merkle/IMerkleSnapshotHook.sol";
import {IWavsServiceManager} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceManager.sol";
import {IWavsServiceHandler} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceHandler.sol";
import {IMerkler} from "interfaces/merkle/IMerkler.sol";

contract MerkleSnapshotTest is Test {
    MerkleSnapshot public merkleSnapshot;
    MockWavsServiceManager public mockServiceManager;
    MockMerkleSnapshotHook public mockMerkleSnapshotHook1;
    MockMerkleSnapshotHook public mockMerkleSnapshotHook2;

    // Test data
    address public alice = address(0x1);
    address public bob = address(0x2);
    address public charlie = address(0x3);

    // Merkle tree test data
    bytes32 public constant TEST_ROOT_1 = bytes32(uint256(0x1234567890abcdef));
    bytes32 public constant TEST_ROOT_2 = bytes32(uint256(0xfedcba0987654321));
    bytes32 public constant TEST_ROOT_3 = bytes32(uint256(0xabcdef1234567890));

    bytes32 public constant TEST_IPFS_HASH_1 =
        bytes32(uint256(0x1111111111111111));
    bytes32 public constant TEST_IPFS_HASH_2 =
        bytes32(uint256(0x2222222222222222));
    bytes32 public constant TEST_IPFS_HASH_3 =
        bytes32(uint256(0x3333333333333333));

    string public constant TEST_IPFS_CID_1 = "QmTest1";
    string public constant TEST_IPFS_CID_2 = "QmTest2";
    string public constant TEST_IPFS_CID_3 = "QmTest3";

    function setUp() public {
        mockServiceManager = new MockWavsServiceManager();
        merkleSnapshot = new MerkleSnapshot(mockServiceManager);
        mockMerkleSnapshotHook1 = new MockMerkleSnapshotHook();
        mockMerkleSnapshotHook2 = new MockMerkleSnapshotHook();
        merkleSnapshot.addHook(mockMerkleSnapshotHook1);
        merkleSnapshot.addHook(mockMerkleSnapshotHook2);
    }

    function testConstruction_ShouldInitializeCorrectly() public view {
        assertEq(
            merkleSnapshot.getServiceManager(),
            address(mockServiceManager)
        );
        assertEq(merkleSnapshot.getStateCount(), 0);
        assertEq(merkleSnapshot.hookCount(), 2);
    }

    function testGetLatestState_ShouldRevertWhenNoStates() public {
        vm.expectRevert(IMerkleSnapshot.NoMerkleStates.selector);
        merkleSnapshot.getLatestState();
    }

    function testGetStateAtBlock_ShouldRevertWhenNoStates() public {
        vm.expectRevert(IMerkleSnapshot.NoMerkleStates.selector);
        merkleSnapshot.getStateAtBlock(100);
    }

    function testGetStateAtIndex_ShouldRevertWhenInvalidIndex() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                IMerkleSnapshot.NoMerkleStateAtIndex.selector,
                0,
                0
            )
        );
        merkleSnapshot.getStateAtIndex(0);
    }

    function testGetHooks_ShouldReturnCorrectHooks() public view {
        assertEq(
            address(merkleSnapshot.getHooks()[0]),
            address(mockMerkleSnapshotHook1)
        );
        assertEq(
            address(merkleSnapshot.getHooks()[1]),
            address(mockMerkleSnapshotHook2)
        );
    }

    function testRemoveHook_ShouldRemoveHook() public {
        merkleSnapshot.removeHook(mockMerkleSnapshotHook1);
        assertEq(merkleSnapshot.hookCount(), 1);
        assertEq(
            address(merkleSnapshot.getHooks()[0]),
            address(mockMerkleSnapshotHook2)
        );
        assertEq(merkleSnapshot.getHooks().length, 1);
    }

    function testHandleSignedEnvelope_ShouldCreateFirstState() public {
        uint256 blockNumber = block.number;

        // Create envelope and signature data
        (
            IWavsServiceHandler.Envelope memory envelope,
            IWavsServiceHandler.SignatureData memory signatureData
        ) = _createEnvelopeAndSignature(
                0x1,
                TEST_ROOT_1,
                TEST_IPFS_HASH_1,
                TEST_IPFS_CID_1,
                100
            );

        // Expect event emission
        vm.expectEmit(true, false, false, true);
        emit IMerkleSnapshot.MerkleRootUpdated(
            TEST_ROOT_1,
            TEST_IPFS_HASH_1,
            TEST_IPFS_CID_1,
            100
        );

        // Execute the signed envelope
        merkleSnapshot.handleSignedEnvelope(envelope, signatureData);

        // Verify state was created
        assertEq(merkleSnapshot.getStateCount(), 1);

        MerkleSnapshot.MerkleState memory state = merkleSnapshot
            .getLatestState();
        assertEq(state.blockNumber, blockNumber);
        assertEq(state.root, TEST_ROOT_1);
        assertEq(state.ipfsHash, TEST_IPFS_HASH_1);
        assertEq(state.ipfsHashCid, TEST_IPFS_CID_1);
        assertEq(state.totalValue, 100);

        // Verify state at index 0
        MerkleSnapshot.MerkleState memory stateAtIndex = merkleSnapshot
            .getStateAtIndex(0);
        assertEq(stateAtIndex.blockNumber, blockNumber);
        assertEq(stateAtIndex.root, TEST_ROOT_1);
        assertEq(stateAtIndex.ipfsHash, TEST_IPFS_HASH_1);
        assertEq(stateAtIndex.ipfsHashCid, TEST_IPFS_CID_1);
        assertEq(stateAtIndex.totalValue, 100);

        // Verify block number mapping
        assertEq(merkleSnapshot.blockToStateIndex(blockNumber), 0);
        assertEq(merkleSnapshot.stateBlocks(0), blockNumber);
    }

    function testHandleSignedEnvelope_ShouldCreateMultipleStates() public {
        // Ensure hook states are empty
        assertEq(mockMerkleSnapshotHook1.latestState().root, bytes32(0));
        assertEq(mockMerkleSnapshotHook2.latestState().root, bytes32(0));

        // Create states in different blocks
        // Block 100
        vm.roll(100);
        _createStateAtCurrentBlock(
            0x1,
            TEST_ROOT_1,
            TEST_IPFS_HASH_1,
            TEST_IPFS_CID_1,
            100
        );

        // Ensure hook states are updated
        assertEq(mockMerkleSnapshotHook1.latestState().root, TEST_ROOT_1);
        assertEq(mockMerkleSnapshotHook2.latestState().root, TEST_ROOT_1);

        // Block 200
        vm.roll(200);
        _createStateAtCurrentBlock(
            0x2,
            TEST_ROOT_2,
            TEST_IPFS_HASH_2,
            TEST_IPFS_CID_2,
            200
        );

        // Ensure hook states are updated
        assertEq(mockMerkleSnapshotHook1.latestState().root, TEST_ROOT_2);
        assertEq(mockMerkleSnapshotHook2.latestState().root, TEST_ROOT_2);

        // Remove first hook.
        merkleSnapshot.removeHook(mockMerkleSnapshotHook1);

        // Block 300
        vm.roll(300);
        _createStateAtCurrentBlock(
            0x3,
            TEST_ROOT_3,
            TEST_IPFS_HASH_3,
            TEST_IPFS_CID_3,
            300
        );

        // Ensure only second hook state is updated
        assertEq(mockMerkleSnapshotHook1.latestState().root, TEST_ROOT_2);
        assertEq(mockMerkleSnapshotHook2.latestState().root, TEST_ROOT_3);

        // Verify all states
        assertEq(merkleSnapshot.getStateCount(), 3);

        // Verify latest state
        MerkleSnapshot.MerkleState memory latestState = merkleSnapshot
            .getLatestState();
        assertEq(latestState.blockNumber, 300);
        assertEq(latestState.root, TEST_ROOT_3);

        // Verify specific states by index
        MerkleSnapshot.MerkleState memory state0 = merkleSnapshot
            .getStateAtIndex(0);
        assertEq(state0.blockNumber, 100);
        assertEq(state0.root, TEST_ROOT_1);

        MerkleSnapshot.MerkleState memory state1 = merkleSnapshot
            .getStateAtIndex(1);
        assertEq(state1.blockNumber, 200);
        assertEq(state1.root, TEST_ROOT_2);

        MerkleSnapshot.MerkleState memory state2 = merkleSnapshot
            .getStateAtIndex(2);
        assertEq(state2.blockNumber, 300);
        assertEq(state2.root, TEST_ROOT_3);

        // Verify block mappings
        assertEq(merkleSnapshot.blockToStateIndex(100), 0);
        assertEq(merkleSnapshot.blockToStateIndex(200), 1);
        assertEq(merkleSnapshot.blockToStateIndex(300), 2);
    }

    function testHandleSignedEnvelope_ShouldOverrideStateInSameBlock() public {
        uint256 blockNumber = block.number;

        // Create first state in block
        (
            IWavsServiceHandler.Envelope memory envelope1,
            IWavsServiceHandler.SignatureData memory signatureData1
        ) = _createEnvelopeAndSignature(
                0x1,
                TEST_ROOT_1,
                TEST_IPFS_HASH_1,
                TEST_IPFS_CID_1,
                100
            );

        merkleSnapshot.handleSignedEnvelope(envelope1, signatureData1);

        // Verify first state
        assertEq(merkleSnapshot.getStateCount(), 1);
        MerkleSnapshot.MerkleState memory firstState = merkleSnapshot
            .getLatestState();
        assertEq(firstState.root, TEST_ROOT_1);

        // Create second state in the same block (should override)
        (
            IWavsServiceHandler.Envelope memory envelope2,
            IWavsServiceHandler.SignatureData memory signatureData2
        ) = _createEnvelopeAndSignature(
                0x2,
                TEST_ROOT_2,
                TEST_IPFS_HASH_2,
                TEST_IPFS_CID_2,
                200
            );

        merkleSnapshot.handleSignedEnvelope(envelope2, signatureData2);

        // Verify state was overridden, not added
        assertEq(merkleSnapshot.getStateCount(), 1);
        MerkleSnapshot.MerkleState memory overriddenState = merkleSnapshot
            .getLatestState();
        assertEq(overriddenState.blockNumber, blockNumber);
        assertEq(overriddenState.root, TEST_ROOT_2);
        assertEq(overriddenState.ipfsHash, TEST_IPFS_HASH_2);
        assertEq(overriddenState.ipfsHashCid, TEST_IPFS_CID_2);
        assertEq(overriddenState.totalValue, 200);
    }

    function testGetStateAtBlock_ShouldReturnCorrectState() public {
        // Create states at different blocks using absolute block numbers
        vm.roll(100);
        _createStateAtCurrentBlock(
            0x1,
            TEST_ROOT_1,
            TEST_IPFS_HASH_1,
            TEST_IPFS_CID_1,
            100
        );

        vm.roll(150);
        _createStateAtCurrentBlock(
            0x2,
            TEST_ROOT_2,
            TEST_IPFS_HASH_2,
            TEST_IPFS_CID_2,
            200
        );

        vm.roll(200);
        _createStateAtCurrentBlock(
            0x3,
            TEST_ROOT_3,
            TEST_IPFS_HASH_3,
            TEST_IPFS_CID_3,
            300
        );

        // Test exact block matches
        MerkleSnapshot.MerkleState memory stateAtBlock1 = merkleSnapshot
            .getStateAtBlock(100);
        assertEq(stateAtBlock1.blockNumber, 100);
        assertEq(stateAtBlock1.root, TEST_ROOT_1);
        assertEq(stateAtBlock1.totalValue, 100);

        MerkleSnapshot.MerkleState memory stateAtBlock2 = merkleSnapshot
            .getStateAtBlock(150);
        assertEq(stateAtBlock2.blockNumber, 150);
        assertEq(stateAtBlock2.root, TEST_ROOT_2);
        assertEq(stateAtBlock2.totalValue, 200);

        MerkleSnapshot.MerkleState memory stateAtBlock3 = merkleSnapshot
            .getStateAtBlock(200);
        assertEq(stateAtBlock3.blockNumber, 200);
        assertEq(stateAtBlock3.root, TEST_ROOT_3);
        assertEq(stateAtBlock3.totalValue, 300);

        // Test getting state at block between snapshots (should return previous state)
        MerkleSnapshot.MerkleState memory stateAtIntermediate1 = merkleSnapshot
            .getStateAtBlock(125);
        assertEq(stateAtIntermediate1.blockNumber, 100);
        assertEq(stateAtIntermediate1.root, TEST_ROOT_1);
        assertEq(stateAtIntermediate1.totalValue, 100);

        MerkleSnapshot.MerkleState memory stateAtIntermediate2 = merkleSnapshot
            .getStateAtBlock(175);
        assertEq(stateAtIntermediate2.blockNumber, 150);
        assertEq(stateAtIntermediate2.root, TEST_ROOT_2);
        assertEq(stateAtIntermediate2.totalValue, 200);

        // Test future block (should return latest state)
        MerkleSnapshot.MerkleState memory stateAtFuture = merkleSnapshot
            .getStateAtBlock(300);
        assertEq(stateAtFuture.blockNumber, 200);
        assertEq(stateAtFuture.root, TEST_ROOT_3);
        assertEq(stateAtFuture.totalValue, 300);
    }

    function testGetStateAtBlock_ShouldRevertForBlockBeforeFirstState() public {
        uint256 currentBlock = block.number;
        _createStateAtCurrentBlock(
            0x1,
            TEST_ROOT_1,
            TEST_IPFS_HASH_1,
            TEST_IPFS_CID_1,
            100
        );

        // Try to get state for block before first state
        vm.expectRevert(
            abi.encodeWithSelector(
                IMerkleSnapshot.NoMerkleStateAtBlock.selector,
                currentBlock - 1,
                currentBlock
            )
        );
        merkleSnapshot.getStateAtBlock(currentBlock - 1);
    }

    function testVerifyProof_ShouldWorkWithValidProof() public {
        // Create a simple merkle tree with test data
        bytes32 leaf1 = _generateLeaf(alice, 100);
        bytes32 leaf2 = _generateLeaf(bob, 200);
        bytes32 root = _hashPair(leaf1, leaf2);

        // Create state with this root
        _createStateAtCurrentBlock(
            0x1,
            root,
            TEST_IPFS_HASH_1,
            TEST_IPFS_CID_1,
            100
        );

        // Create proof for alice (leaf1)
        bytes32[] memory proof = new bytes32[](1);
        proof[0] = leaf2; // sibling

        // Verify proof should work
        assertTrue(merkleSnapshot.verifyProof(alice, 100, proof));
        assertFalse(merkleSnapshot.verifyProof(alice, 999, proof)); // wrong value
        assertFalse(merkleSnapshot.verifyProof(charlie, 100, proof)); // wrong account
    }

    function testVerifyMyProof_ShouldWorkForSender() public {
        // Create a simple merkle tree
        bytes32 leaf1 = _generateLeaf(alice, 100);
        bytes32 leaf2 = _generateLeaf(bob, 200);
        bytes32 root = _hashPair(leaf1, leaf2);

        _createStateAtCurrentBlock(
            0x1,
            root,
            TEST_IPFS_HASH_1,
            TEST_IPFS_CID_1,
            100
        );

        // Create proof for alice
        bytes32[] memory proof = new bytes32[](1);
        proof[0] = leaf2;

        // Test verifyMyProof as alice
        vm.prank(alice);
        assertTrue(merkleSnapshot.verifyMyProof(100, proof));

        vm.prank(alice);
        assertFalse(merkleSnapshot.verifyMyProof(999, proof)); // wrong value

        // Test verifyMyProof as bob (should fail with alice's proof)
        vm.prank(bob);
        assertFalse(merkleSnapshot.verifyMyProof(100, proof));
    }

    function testVerifyProofAtBlock_ShouldWorkForHistoricalStates() public {
        // Create first state at block 100
        vm.roll(100);
        bytes32 leaf1 = _generateLeaf(alice, 100);
        bytes32 leaf2 = _generateLeaf(bob, 200);
        bytes32 root1 = _hashPair(leaf1, leaf2);
        _createStateAtCurrentBlock(
            0x1,
            root1,
            TEST_IPFS_HASH_1,
            TEST_IPFS_CID_1,
            100
        );

        // Create second state at block 200 with different root
        vm.roll(200);
        bytes32 leaf3 = _generateLeaf(charlie, 300);
        bytes32 root2 = _hashPair(leaf1, leaf3);
        _createStateAtCurrentBlock(
            0x2,
            root2,
            TEST_IPFS_HASH_2,
            TEST_IPFS_CID_2,
            200
        );

        // Verify against first state
        bytes32[] memory proof1 = new bytes32[](1);
        proof1[0] = leaf2;
        assertTrue(merkleSnapshot.verifyProofAtBlock(alice, 100, proof1, 100));
        assertTrue(merkleSnapshot.verifyProofAtBlock(alice, 100, proof1, 150)); // intermediate block

        // Verify against second state
        bytes32[] memory proof2 = new bytes32[](1);
        proof2[0] = leaf3;
        assertTrue(merkleSnapshot.verifyProofAtBlock(alice, 100, proof2, 200));

        // Old proof should not work with new state
        assertFalse(merkleSnapshot.verifyProofAtBlock(alice, 100, proof1, 200));
    }

    function testVerifyMyProofAtBlock_ShouldWorkForSender() public {
        uint256 block1 = block.number;
        bytes32 leaf1 = _generateLeaf(alice, 100);
        bytes32 leaf2 = _generateLeaf(bob, 200);
        bytes32 root = _hashPair(leaf1, leaf2);
        _createStateAtCurrentBlock(
            0x1,
            root,
            TEST_IPFS_HASH_1,
            TEST_IPFS_CID_1,
            100
        );

        bytes32[] memory proof = new bytes32[](1);
        proof[0] = leaf2;

        vm.prank(alice);
        assertTrue(merkleSnapshot.verifyMyProofAtBlock(100, proof, block1));

        vm.prank(bob);
        assertFalse(merkleSnapshot.verifyMyProofAtBlock(100, proof, block1));
    }

    function testVerifyProofAtStateIndex_ShouldWorkForSpecificIndex() public {
        // Create multiple states
        bytes32 root1 = _hashPair(
            _generateLeaf(alice, 100),
            _generateLeaf(bob, 200)
        );
        _createStateAtCurrentBlock(
            0x1,
            root1,
            TEST_IPFS_HASH_1,
            TEST_IPFS_CID_1,
            100
        );

        vm.roll(block.number + 1);
        bytes32 root2 = _hashPair(
            _generateLeaf(alice, 150),
            _generateLeaf(bob, 250)
        );
        _createStateAtCurrentBlock(
            0x2,
            root2,
            TEST_IPFS_HASH_2,
            TEST_IPFS_CID_2,
            200
        );

        // Test verification against specific state indices
        bytes32[] memory proof1 = new bytes32[](1);
        proof1[0] = _generateLeaf(bob, 200);
        assertTrue(
            merkleSnapshot.verifyProofAtStateIndex(alice, 100, proof1, 0)
        );

        bytes32[] memory proof2 = new bytes32[](1);
        proof2[0] = _generateLeaf(bob, 250);
        assertTrue(
            merkleSnapshot.verifyProofAtStateIndex(alice, 150, proof2, 1)
        );

        // Wrong proof for wrong index
        assertFalse(
            merkleSnapshot.verifyProofAtStateIndex(alice, 100, proof2, 0)
        );
    }

    function testVerifyMyProofAtStateIndex_ShouldWorkForSender() public {
        bytes32 root = _hashPair(
            _generateLeaf(alice, 100),
            _generateLeaf(bob, 200)
        );
        _createStateAtCurrentBlock(
            0x1,
            root,
            TEST_IPFS_HASH_1,
            TEST_IPFS_CID_1,
            100
        );

        bytes32[] memory proof = new bytes32[](1);
        proof[0] = _generateLeaf(bob, 200);

        vm.prank(alice);
        assertTrue(merkleSnapshot.verifyMyProofAtStateIndex(100, proof, 0));

        vm.prank(bob);
        assertFalse(merkleSnapshot.verifyMyProofAtStateIndex(100, proof, 0));
    }

    function testGetStateBlocks_ShouldReturnPaginatedBlockNumbers() public {
        // Create multiple states
        uint256[] memory blocks = new uint256[](5);
        uint256 currentBlock = block.number;
        for (uint256 i = 0; i < 5; i++) {
            blocks[i] = currentBlock + i;
            vm.roll(blocks[i]);
            _createStateAtCurrentBlock(
                uint160(i + 1),
                bytes32(uint256(i + 1)),
                bytes32(uint256(i + 1)),
                string(abi.encodePacked("QmTest", i + 1)),
                i + 1
            );
        }

        // Test full range
        uint256[] memory allBlocks = merkleSnapshot.getStateBlocks(0, 10);
        assertEq(allBlocks.length, 5);
        for (uint256 i = 0; i < 5; i++) {
            assertEq(allBlocks[i], blocks[i]);
        }

        // Test pagination
        uint256[] memory firstTwo = merkleSnapshot.getStateBlocks(0, 2);
        assertEq(firstTwo.length, 2);
        assertEq(firstTwo[0], blocks[0]);
        assertEq(firstTwo[1], blocks[1]);

        uint256[] memory nextTwo = merkleSnapshot.getStateBlocks(2, 2);
        assertEq(nextTwo.length, 2);
        assertEq(nextTwo[0], blocks[2]);
        assertEq(nextTwo[1], blocks[3]);

        uint256[] memory lastOne = merkleSnapshot.getStateBlocks(4, 2);
        assertEq(lastOne.length, 1);
        assertEq(lastOne[0], blocks[4]);
    }

    function testGetStates_ShouldReturnPaginatedStates() public {
        // Create multiple states
        bytes32[] memory roots = new bytes32[](3);
        uint256 currentBlock = block.number;
        for (uint256 i = 0; i < 3; i++) {
            roots[i] = bytes32(uint256(i + 1));
            vm.roll(currentBlock + i);
            _createStateAtCurrentBlock(
                uint160(i + 1),
                roots[i],
                bytes32(uint256(i + 1)),
                string(abi.encodePacked("QmTest", i + 1)),
                i + 1
            );
        }

        // Test full range
        MerkleSnapshot.MerkleState[] memory allStates = merkleSnapshot
            .getStates(0, 10);
        assertEq(allStates.length, 3);
        for (uint256 i = 0; i < 3; i++) {
            assertEq(allStates[i].root, roots[i]);
        }

        // Test pagination
        MerkleSnapshot.MerkleState[] memory firstTwo = merkleSnapshot.getStates(
            0,
            2
        );
        assertEq(firstTwo.length, 2);
        assertEq(firstTwo[0].root, roots[0]);
        assertEq(firstTwo[1].root, roots[1]);

        MerkleSnapshot.MerkleState[] memory lastOne = merkleSnapshot.getStates(
            2,
            2
        );
        assertEq(lastOne.length, 1);
        assertEq(lastOne[0].root, roots[2]);
    }

    function testComplexMerkleTree_ShouldVerifyCorrectly() public {
        // Create a 4-leaf merkle tree
        address[] memory accounts = new address[](4);
        uint256[] memory values = new uint256[](4);
        bytes32[] memory leaves = new bytes32[](4);

        accounts[0] = alice;
        accounts[1] = bob;
        accounts[2] = charlie;
        accounts[3] = address(0x4);

        values[0] = 100;
        values[1] = 200;
        values[2] = 300;
        values[3] = 400;

        for (uint256 i = 0; i < 4; i++) {
            leaves[i] = _generateLeaf(accounts[i], values[i]);
        }

        // Build tree: ((leaf0, leaf1), (leaf2, leaf3))
        bytes32 node01 = _hashPair(leaves[0], leaves[1]);
        bytes32 node23 = _hashPair(leaves[2], leaves[3]);
        bytes32 root = _hashPair(node01, node23);

        _createStateAtCurrentBlock(
            0x1,
            root,
            TEST_IPFS_HASH_1,
            TEST_IPFS_CID_1,
            100
        );

        // Test proof for alice (leaf 0)
        bytes32[] memory proofAlice = new bytes32[](2);
        proofAlice[0] = leaves[1]; // sibling at leaf level
        proofAlice[1] = node23; // sibling at upper level
        assertTrue(merkleSnapshot.verifyProof(alice, 100, proofAlice));

        // Test proof for charlie (leaf 2)
        bytes32[] memory proofCharlie = new bytes32[](2);
        proofCharlie[0] = leaves[3]; // sibling at leaf level
        proofCharlie[1] = node01; // sibling at upper level
        assertTrue(merkleSnapshot.verifyProof(charlie, 300, proofCharlie));

        // Test invalid proofs
        assertFalse(merkleSnapshot.verifyProof(alice, 999, proofAlice)); // wrong value
        assertFalse(merkleSnapshot.verifyProof(bob, 100, proofAlice)); // wrong account
    }

    function testBinarySearch_ShouldFindCorrectState() public {
        // Create states with gaps
        uint256[] memory blockNumbers = new uint256[](5);

        blockNumbers[0] = 100;
        vm.roll(blockNumbers[0]);
        _createStateAtCurrentBlock(
            0x1,
            bytes32(uint256(1)),
            TEST_IPFS_HASH_1,
            TEST_IPFS_CID_1,
            100
        );

        blockNumbers[1] = 150;
        vm.roll(blockNumbers[1]);
        _createStateAtCurrentBlock(
            0x2,
            bytes32(uint256(2)),
            TEST_IPFS_HASH_1,
            TEST_IPFS_CID_1,
            100
        );

        blockNumbers[2] = 200;
        vm.roll(blockNumbers[2]);
        _createStateAtCurrentBlock(
            0x3,
            bytes32(uint256(3)),
            TEST_IPFS_HASH_1,
            TEST_IPFS_CID_1,
            100
        );

        blockNumbers[3] = 300;
        vm.roll(blockNumbers[3]);
        _createStateAtCurrentBlock(
            0x4,
            bytes32(uint256(4)),
            TEST_IPFS_HASH_1,
            TEST_IPFS_CID_1,
            100
        );

        blockNumbers[4] = 500;
        vm.roll(blockNumbers[4]);
        _createStateAtCurrentBlock(
            0x5,
            bytes32(uint256(5)),
            TEST_IPFS_HASH_1,
            TEST_IPFS_CID_1,
            100
        );

        // Test exact matches
        assertEq(merkleSnapshot.getStateAtBlock(100).root, bytes32(uint256(1)));
        assertEq(merkleSnapshot.getStateAtBlock(200).root, bytes32(uint256(3)));
        assertEq(merkleSnapshot.getStateAtBlock(500).root, bytes32(uint256(5)));

        // Test binary search for blocks between states
        assertEq(merkleSnapshot.getStateAtBlock(125).root, bytes32(uint256(1))); // between 100 and 150
        assertEq(merkleSnapshot.getStateAtBlock(175).root, bytes32(uint256(2))); // between 150 and 200
        assertEq(merkleSnapshot.getStateAtBlock(250).root, bytes32(uint256(3))); // between 200 and 300
        assertEq(merkleSnapshot.getStateAtBlock(400).root, bytes32(uint256(4))); // between 300 and 500
        assertEq(merkleSnapshot.getStateAtBlock(600).root, bytes32(uint256(5))); // after 500

        // Test block before first state should revert
        vm.expectRevert(
            abi.encodeWithSelector(
                IMerkleSnapshot.NoMerkleStateAtBlock.selector,
                50,
                100
            )
        );
        merkleSnapshot.getStateAtBlock(50);
    }

    function testFuzzMerkleProofs(
        address account,
        uint256 value,
        bytes32 randomRoot
    ) public {
        vm.assume(account != address(0));

        // Create state with random root
        _createStateAtCurrentBlock(
            0x1,
            randomRoot,
            TEST_IPFS_HASH_1,
            TEST_IPFS_CID_1,
            100
        );

        // Generate leaf for the account/value
        bytes32 leaf = _generateLeaf(account, value);

        // Create a simple proof (just the leaf itself as root)
        if (randomRoot == leaf) {
            bytes32[] memory emptyProof = new bytes32[](0);
            assertTrue(merkleSnapshot.verifyProof(account, value, emptyProof));
        } else {
            // For any other root, proof should fail without proper siblings
            bytes32[] memory invalidProof = new bytes32[](1);
            invalidProof[0] = bytes32(uint256(0x123));
            assertFalse(
                merkleSnapshot.verifyProof(account, value, invalidProof)
            );
        }
    }

    // Helper functions
    function _createStateAtCurrentBlock(
        uint160 eventId,
        bytes32 root,
        bytes32 ipfsHash,
        string memory ipfsHashCid,
        uint256 totalValue
    ) internal {
        (
            IWavsServiceHandler.Envelope memory envelope,
            IWavsServiceHandler.SignatureData memory signatureData
        ) = _createEnvelopeAndSignature(
                eventId,
                root,
                ipfsHash,
                ipfsHashCid,
                totalValue
            );
        merkleSnapshot.handleSignedEnvelope(envelope, signatureData);
    }

    function _createEnvelopeAndSignature(
        uint160 eventId,
        bytes32 root,
        bytes32 ipfsHash,
        string memory ipfsHashCid,
        uint256 totalValue
    )
        public
        view
        returns (
            IWavsServiceHandler.Envelope memory envelope,
            IWavsServiceHandler.SignatureData memory signatureData
        )
    {
        // Create AVS output
        IMerkler.MerklerAvsOutput memory avsOutput = IMerkler.MerklerAvsOutput({
            expiresAt: block.timestamp + 1000,
            prune: 0,
            root: root,
            ipfsHash: ipfsHash,
            ipfsHashCid: ipfsHashCid,
            totalValue: totalValue
        });

        // Create envelope
        envelope = IWavsServiceHandler.Envelope({
            eventId: bytes20(eventId),
            ordering: bytes12(uint96(0)),
            payload: abi.encode(avsOutput)
        });

        // Create mock signature data
        address[] memory signers = new address[](1);
        signers[0] = address(0x456);
        bytes[] memory signatures = new bytes[](1);
        signatures[0] = abi.encodePacked("mock_signature");

        signatureData = IWavsServiceHandler.SignatureData({
            signers: signers,
            signatures: signatures,
            referenceBlock: 1000
        });
    }

    function _generateLeaf(
        address account,
        uint256 value
    ) internal pure returns (bytes32) {
        return keccak256(bytes.concat(keccak256(abi.encode(account, value))));
    }

    function _hashPair(bytes32 a, bytes32 b) internal pure returns (bytes32) {
        return
            a < b
                ? keccak256(abi.encodePacked(a, b))
                : keccak256(abi.encodePacked(b, a));
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
        return 100;
    }

    function getLatestOperatorForSigningKey(
        address
    ) external pure returns (address) {
        return address(0x1234567890123456789012345678901234567890);
    }

    function getServiceURI() external pure returns (string memory) {
        return "https://mock-service.example.com";
    }

    function setServiceURI(string calldata) external {
        // Mock implementation
    }

    function getAllocationManager() external view override returns (address) {}

    function getDelegationManager() external view override returns (address) {}

    function getStakeRegistry() external view override returns (address) {}
}

contract MockMerkleSnapshotHook is IMerkleSnapshotHook, IMerkleSnapshot {
    IMerkleSnapshot.MerkleState public _state;

    function latestState()
        external
        view
        returns (IMerkleSnapshot.MerkleState memory)
    {
        return _state;
    }

    function onMerkleUpdate(IMerkleSnapshot.MerkleState memory state) external {
        _state = state;
        emit IMerkleSnapshot.MerkleRootUpdated(
            state.root,
            state.ipfsHash,
            state.ipfsHashCid,
            state.totalValue
        );
    }
}
