// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Test} from "forge-std/Test.sol";
import {
    MerkleFundDistributor
} from "../../src/contracts/merkle/MerkleFundDistributor.sol";
import {IMerkleFundDistributor} from "interfaces/IMerkleFundDistributor.sol";
import {IMerkleSnapshot} from "interfaces/merkle/IMerkleSnapshot.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MerkleFundDistributorTest is Test {
    MerkleFundDistributor public distributor;
    MockMerkleSnapshot public mockMerkleSnapshot;
    MockERC20 public mockToken;

    // Test addresses
    address public owner = address(0x1);
    address public feeRecipient = address(0x2);
    address public alice = address(0x3);
    address public bob = address(0x4);
    address public charlie = address(0x5);

    // Test constants
    uint256 public constant DEFAULT_FEE_PERCENTAGE = 1e16; // 1%
    uint256 public constant FEE_RANGE = 1e18;

    // Test merkle data
    bytes32 public constant TEST_ROOT = bytes32(uint256(0x1234567890abcdef));
    bytes32 public constant TEST_IPFS_HASH =
        bytes32(uint256(0x1111111111111111));
    string public constant TEST_IPFS_CID = "QmTest1";
    uint256 public constant TEST_TOTAL_VALUE = 1000;

    function setUp() public {
        mockMerkleSnapshot = new MockMerkleSnapshot();
        mockToken = new MockERC20("Test Token", "TEST");

        // Set up default merkle state
        mockMerkleSnapshot.setMerkleState(
            IMerkleSnapshot.MerkleState({
                blockNumber: block.number,
                timestamp: block.timestamp,
                root: TEST_ROOT,
                ipfsHash: TEST_IPFS_HASH,
                ipfsHashCid: TEST_IPFS_CID,
                totalValue: TEST_TOTAL_VALUE
            })
        );

        vm.prank(owner);
        distributor = new MerkleFundDistributor(
            owner,
            address(mockMerkleSnapshot),
            feeRecipient,
            DEFAULT_FEE_PERCENTAGE,
            false // allowlist disabled
        );

        // Fund test accounts
        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
        vm.deal(charlie, 100 ether);
        mockToken.mint(alice, 1000 ether);
        mockToken.mint(bob, 1000 ether);
    }

    /* ========== CONSTRUCTOR TESTS ========== */

    function test_Constructor_InitializesWithDeployerAsOwner() public {
        vm.prank(alice);
        MerkleFundDistributor newDistributor = new MerkleFundDistributor(
            alice, // same as deployer
            address(mockMerkleSnapshot),
            feeRecipient,
            DEFAULT_FEE_PERCENTAGE,
            false
        );
        assertEq(newDistributor.owner(), alice);
        assertEq(newDistributor.pendingOwner(), address(0));
    }

    function test_Constructor_StartsTwoStepTransferWhenOwnerDiffersFromDeployer()
        public
    {
        vm.prank(alice);
        MerkleFundDistributor newDistributor = new MerkleFundDistributor(
            bob, // different from deployer (alice)
            address(mockMerkleSnapshot),
            feeRecipient,
            DEFAULT_FEE_PERCENTAGE,
            false
        );
        assertEq(newDistributor.owner(), alice); // deployer is still owner
        assertEq(newDistributor.pendingOwner(), bob); // bob is pending
    }

    function test_Constructor_RevertsOnZeroMerkleSnapshot() public {
        vm.expectRevert(IMerkleFundDistributor.InvalidAddress.selector);
        new MerkleFundDistributor(
            owner,
            address(0),
            feeRecipient,
            DEFAULT_FEE_PERCENTAGE,
            false
        );
    }

    function test_Constructor_RevertsOnZeroFeeRecipient() public {
        vm.expectRevert(IMerkleFundDistributor.InvalidAddress.selector);
        new MerkleFundDistributor(
            owner,
            address(mockMerkleSnapshot),
            address(0),
            DEFAULT_FEE_PERCENTAGE,
            false
        );
    }

    function test_Constructor_RevertsOnFeePercentageTooHigh() public {
        vm.expectRevert(IMerkleFundDistributor.FeePercentageTooHigh.selector);
        new MerkleFundDistributor(
            owner,
            address(mockMerkleSnapshot),
            feeRecipient,
            FEE_RANGE + 1,
            false
        );
    }

    function test_Constructor_SetsAllParameters() public view {
        assertEq(distributor.owner(), owner);
        assertEq(distributor.merkleSnapshot(), address(mockMerkleSnapshot));
        assertEq(distributor.feeRecipient(), feeRecipient);
        assertEq(distributor.feePercentage(), DEFAULT_FEE_PERCENTAGE);
        assertEq(distributor.allowlistEnabled(), false);
    }

    /* ========== OWNERSHIP TESTS ========== */

    function test_TransferOwnership_SetsNewPendingOwner() public {
        vm.prank(owner);
        vm.expectEmit(true, false, false, false);
        emit IMerkleFundDistributor.OwnershipTransferStarted(alice);
        distributor.transferOwnership(alice);

        assertEq(distributor.pendingOwner(), alice);
        assertEq(distributor.owner(), owner); // owner unchanged
    }

    function test_TransferOwnership_RevertsIfNotOwner() public {
        vm.prank(alice);
        vm.expectRevert(IMerkleFundDistributor.NotOwner.selector);
        distributor.transferOwnership(bob);
    }

    function test_TransferOwnership_RevertsOnZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(IMerkleFundDistributor.InvalidAddress.selector);
        distributor.transferOwnership(address(0));
    }

    function test_AcceptOwnership_TransfersOwnership() public {
        vm.prank(owner);
        distributor.transferOwnership(alice);

        vm.prank(alice);
        vm.expectEmit(true, true, false, false);
        emit IMerkleFundDistributor.OwnershipTransferred(owner, alice);
        distributor.acceptOwnership();

        assertEq(distributor.owner(), alice);
        assertEq(distributor.pendingOwner(), address(0));
    }

    function test_AcceptOwnership_RevertsIfNotPendingOwner() public {
        vm.prank(owner);
        distributor.transferOwnership(alice);

        vm.prank(bob);
        vm.expectRevert(IMerkleFundDistributor.NotPendingOwner.selector);
        distributor.acceptOwnership();
    }

    /* ========== ADMIN SETTER TESTS ========== */

    function test_SetFeeRecipient_UpdatesValue() public {
        vm.prank(owner);
        vm.expectEmit(true, true, false, false);
        emit IMerkleFundDistributor.FeeRecipientSet(feeRecipient, alice);
        distributor.setFeeRecipient(alice);

        assertEq(distributor.feeRecipient(), alice);
    }

    function test_SetFeeRecipient_RevertsIfNotOwner() public {
        vm.prank(alice);
        vm.expectRevert(IMerkleFundDistributor.NotOwner.selector);
        distributor.setFeeRecipient(bob);
    }

    function test_SetFeeRecipient_RevertsOnZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(IMerkleFundDistributor.InvalidAddress.selector);
        distributor.setFeeRecipient(address(0));
    }

    function test_SetFeePercentage_UpdatesValue() public {
        uint256 newFee = 5e16; // 5%
        vm.prank(owner);
        vm.expectEmit(true, true, false, false);
        emit IMerkleFundDistributor.FeePercentageSet(
            DEFAULT_FEE_PERCENTAGE,
            newFee
        );
        distributor.setFeePercentage(newFee);

        assertEq(distributor.feePercentage(), newFee);
    }

    function test_SetFeePercentage_RevertsIfNotOwner() public {
        vm.prank(alice);
        vm.expectRevert(IMerkleFundDistributor.NotOwner.selector);
        distributor.setFeePercentage(5e16);
    }

    function test_SetFeePercentage_RevertsIfTooHigh() public {
        vm.prank(owner);
        vm.expectRevert(IMerkleFundDistributor.FeePercentageTooHigh.selector);
        distributor.setFeePercentage(FEE_RANGE + 1);
    }

    function test_SetFeePercentage_AllowsMaxFee() public {
        vm.prank(owner);
        distributor.setFeePercentage(FEE_RANGE);
        assertEq(distributor.feePercentage(), FEE_RANGE);
    }

    function test_SetMerkleSnapshot_UpdatesValue() public {
        address newSnapshot = address(0x999);
        vm.prank(owner);
        vm.expectEmit(true, true, false, false);
        emit IMerkleFundDistributor.MerkleSnapshotUpdated(
            address(mockMerkleSnapshot),
            newSnapshot
        );
        distributor.setMerkleSnapshot(newSnapshot);

        assertEq(distributor.merkleSnapshot(), newSnapshot);
    }

    function test_SetMerkleSnapshot_RevertsIfNotOwner() public {
        vm.prank(alice);
        vm.expectRevert(IMerkleFundDistributor.NotOwner.selector);
        distributor.setMerkleSnapshot(address(0x999));
    }

    function test_SetMerkleSnapshot_RevertsOnZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(IMerkleFundDistributor.InvalidAddress.selector);
        distributor.setMerkleSnapshot(address(0));
    }

    function test_SetAllowlistEnabled_UpdatesValue() public {
        vm.prank(owner);
        vm.expectEmit(true, false, false, false);
        emit IMerkleFundDistributor.DistributorAllowlistUpdated(true);
        distributor.setAllowlistEnabled(true);

        assertEq(distributor.allowlistEnabled(), true);
    }

    function test_SetAllowlistEnabled_RevertsIfNotOwner() public {
        vm.prank(alice);
        vm.expectRevert(IMerkleFundDistributor.NotOwner.selector);
        distributor.setAllowlistEnabled(true);
    }

    function test_UpdateDistributorAllowance_AddsToAllowlist() public {
        vm.prank(owner);
        vm.expectEmit(true, true, false, false);
        emit IMerkleFundDistributor.DistributorAllowanceUpdated(alice, true);
        distributor.updateDistributorAllowance(alice, true);

        assertTrue(distributor.isAllowlisted(alice));
        assertEq(distributor.getAllowlistLength(), 1);
    }

    function test_UpdateDistributorAllowance_RemovesFromAllowlist() public {
        vm.startPrank(owner);
        distributor.updateDistributorAllowance(alice, true);
        assertTrue(distributor.isAllowlisted(alice));

        vm.expectEmit(true, true, false, false);
        emit IMerkleFundDistributor.DistributorAllowanceUpdated(alice, false);
        distributor.updateDistributorAllowance(alice, false);
        vm.stopPrank();

        assertFalse(distributor.isAllowlisted(alice));
        assertEq(distributor.getAllowlistLength(), 0);
    }

    function test_UpdateDistributorAllowance_RevertsIfNotOwner() public {
        vm.prank(alice);
        vm.expectRevert(IMerkleFundDistributor.NotOwner.selector);
        distributor.updateDistributorAllowance(bob, true);
    }

    /* ========== PAUSE/UNPAUSE TESTS ========== */

    function test_Pause_PausesContract() public {
        vm.prank(owner);
        distributor.pause();

        assertTrue(distributor.paused());
    }

    function test_Pause_RevertsIfNotOwner() public {
        vm.prank(alice);
        vm.expectRevert(IMerkleFundDistributor.NotOwner.selector);
        distributor.pause();
    }

    function test_Unpause_UnpausesContract() public {
        vm.startPrank(owner);
        distributor.pause();
        distributor.unpause();
        vm.stopPrank();

        assertFalse(distributor.paused());
    }

    function test_Unpause_RevertsIfNotOwner() public {
        vm.prank(owner);
        distributor.pause();

        vm.prank(alice);
        vm.expectRevert(IMerkleFundDistributor.NotOwner.selector);
        distributor.unpause();
    }

    /* ========== ALLOWLIST VIEW TESTS ========== */

    function test_IsAllowlisted_ReturnsTrueForAllowlistedAddress() public {
        vm.prank(owner);
        distributor.updateDistributorAllowance(alice, true);

        assertTrue(distributor.isAllowlisted(alice));
    }

    function test_IsAllowlisted_ReturnsFalseForNonAllowlistedAddress()
        public
        view
    {
        assertFalse(distributor.isAllowlisted(alice));
    }

    function test_GetAllowlistLength_ReturnsCorrectLength() public {
        vm.startPrank(owner);
        distributor.updateDistributorAllowance(alice, true);
        distributor.updateDistributorAllowance(bob, true);
        vm.stopPrank();

        assertEq(distributor.getAllowlistLength(), 2);
    }

    function test_GetAllowlistAt_ReturnsCorrectAddress() public {
        vm.startPrank(owner);
        distributor.updateDistributorAllowance(alice, true);
        distributor.updateDistributorAllowance(bob, true);
        vm.stopPrank();

        assertEq(distributor.getAllowlistAt(0), alice);
        assertEq(distributor.getAllowlistAt(1), bob);
    }

    function test_GetAllowlist_ReturnsAllAddresses() public {
        vm.startPrank(owner);
        distributor.updateDistributorAllowance(alice, true);
        distributor.updateDistributorAllowance(bob, true);
        vm.stopPrank();

        address[] memory allowlist = distributor.getAllowlist();
        assertEq(allowlist.length, 2);
        assertEq(allowlist[0], alice);
        assertEq(allowlist[1], bob);
    }

    function test_GetAllowlistPaginated_ReturnsPaginatedResults() public {
        vm.startPrank(owner);
        distributor.updateDistributorAllowance(alice, true);
        distributor.updateDistributorAllowance(bob, true);
        distributor.updateDistributorAllowance(charlie, true);
        vm.stopPrank();

        address[] memory firstTwo = distributor.getAllowlistPaginated(0, 2);
        assertEq(firstTwo.length, 2);
        assertEq(firstTwo[0], alice);
        assertEq(firstTwo[1], bob);

        address[] memory lastOne = distributor.getAllowlistPaginated(2, 2);
        assertEq(lastOne.length, 1);
        assertEq(lastOne[0], charlie);
    }

    function test_GetAllowlistPaginated_ReturnsEmptyForOffsetBeyondLength()
        public
    {
        vm.prank(owner);
        distributor.updateDistributorAllowance(alice, true);

        address[] memory result = distributor.getAllowlistPaginated(10, 5);
        assertEq(result.length, 0);
    }

    /* ========== DISTRIBUTION VIEW TESTS ========== */

    function test_GetDistributionCount_ReturnsZeroInitially() public view {
        assertEq(distributor.getDistributionCount(), 0);
    }

    function test_GetDistribution_ReturnsCorrectData() public {
        // Create a distribution first
        _createERC20Distribution(alice, 100 ether);

        IMerkleFundDistributor.DistributionState memory dist = distributor
            .getDistribution(0);
        assertEq(dist.distributor, alice);
        assertEq(dist.token, address(mockToken));
        assertEq(dist.amountFunded, 100 ether);
        assertEq(dist.root, TEST_ROOT);
    }

    function test_GetDistributions_ReturnsPaginatedResults() public {
        // Create 3 distributions
        _createERC20Distribution(alice, 100 ether);
        _createERC20Distribution(alice, 200 ether);
        _createERC20Distribution(alice, 300 ether);

        IMerkleFundDistributor.DistributionState[] memory firstTwo = distributor
            .getDistributions(0, 2);
        assertEq(firstTwo.length, 2);
        assertEq(firstTwo[0].amountFunded, 100 ether);
        assertEq(firstTwo[1].amountFunded, 200 ether);

        IMerkleFundDistributor.DistributionState[] memory lastOne = distributor
            .getDistributions(2, 5);
        assertEq(lastOne.length, 1);
        assertEq(lastOne[0].amountFunded, 300 ether);
    }

    function test_GetDistributions_ReturnsEmptyForOffsetBeyondLength() public {
        _createERC20Distribution(alice, 100 ether);

        IMerkleFundDistributor.DistributionState[] memory result = distributor
            .getDistributions(10, 5);
        assertEq(result.length, 0);
    }

    /* ========== DISTRIBUTE TESTS ========== */

    function test_Distribute_ERC20_CreatesDistribution() public {
        uint256 amount = 100 ether;
        uint256 expectedFee = (amount * DEFAULT_FEE_PERCENTAGE) / FEE_RANGE;

        vm.startPrank(alice);
        mockToken.approve(address(distributor), amount);

        vm.expectEmit(true, true, true, true);
        emit IMerkleFundDistributor.Distributed(
            0,
            alice,
            address(mockToken),
            amount,
            expectedFee
        );

        uint256 distributionIndex = distributor.distribute(
            address(mockToken),
            amount,
            bytes32(0)
        );
        vm.stopPrank();

        assertEq(distributionIndex, 0);
        assertEq(distributor.getDistributionCount(), 1);

        IMerkleFundDistributor.DistributionState memory dist = distributor
            .getDistribution(0);
        assertEq(dist.distributor, alice);
        assertEq(dist.token, address(mockToken));
        assertEq(dist.amountFunded, amount);
        assertEq(dist.feeAmount, expectedFee);
        assertEq(dist.feeRecipient, feeRecipient);
        assertEq(dist.root, TEST_ROOT);
        assertEq(dist.totalMerkleValue, TEST_TOTAL_VALUE);
    }

    function test_Distribute_ERC20_TransfersFundsCorrectly() public {
        uint256 amount = 100 ether;
        uint256 expectedFee = (amount * DEFAULT_FEE_PERCENTAGE) / FEE_RANGE;

        uint256 aliceBalanceBefore = mockToken.balanceOf(alice);
        uint256 feeRecipientBalanceBefore = mockToken.balanceOf(feeRecipient);
        uint256 distributorBalanceBefore = mockToken.balanceOf(
            address(distributor)
        );

        _createERC20Distribution(alice, amount);

        assertEq(mockToken.balanceOf(alice), aliceBalanceBefore - amount);
        assertEq(
            mockToken.balanceOf(feeRecipient),
            feeRecipientBalanceBefore + expectedFee
        );
        assertEq(
            mockToken.balanceOf(address(distributor)),
            distributorBalanceBefore + amount - expectedFee
        );
    }

    function test_Distribute_NativeToken_CreatesDistribution() public {
        uint256 amount = 10 ether;
        uint256 expectedFee = (amount * DEFAULT_FEE_PERCENTAGE) / FEE_RANGE;

        vm.prank(alice);
        vm.expectEmit(true, true, true, true);
        emit IMerkleFundDistributor.Distributed(
            0,
            alice,
            address(0),
            amount,
            expectedFee
        );

        uint256 distributionIndex = distributor.distribute{value: amount}(
            address(0),
            amount,
            bytes32(0)
        );

        assertEq(distributionIndex, 0);

        IMerkleFundDistributor.DistributionState memory dist = distributor
            .getDistribution(0);
        assertEq(dist.token, address(0));
        assertEq(dist.amountFunded, amount);
        assertEq(dist.feeAmount, expectedFee);
    }

    function test_Distribute_NativeToken_TransfersFundsCorrectly() public {
        uint256 amount = 10 ether;
        uint256 expectedFee = (amount * DEFAULT_FEE_PERCENTAGE) / FEE_RANGE;

        uint256 aliceBalanceBefore = alice.balance;
        uint256 feeRecipientBalanceBefore = feeRecipient.balance;
        uint256 distributorBalanceBefore = address(distributor).balance;

        vm.prank(alice);
        distributor.distribute{value: amount}(address(0), amount, bytes32(0));

        assertEq(alice.balance, aliceBalanceBefore - amount);
        assertEq(feeRecipient.balance, feeRecipientBalanceBefore + expectedFee);
        assertEq(
            address(distributor).balance,
            distributorBalanceBefore + amount - expectedFee
        );
    }

    function test_Distribute_WithExpectedRoot_Succeeds() public {
        vm.startPrank(alice);
        mockToken.approve(address(distributor), 100 ether);
        distributor.distribute(address(mockToken), 100 ether, TEST_ROOT);
        vm.stopPrank();

        assertEq(distributor.getDistributionCount(), 1);
    }

    function test_Distribute_WithExpectedRoot_RevertsOnMismatch() public {
        bytes32 wrongRoot = bytes32(uint256(0xdeadbeef));

        vm.startPrank(alice);
        mockToken.approve(address(distributor), 100 ether);

        vm.expectRevert(
            abi.encodeWithSelector(
                IMerkleFundDistributor.UnexpectedMerkleRoot.selector,
                wrongRoot,
                TEST_ROOT
            )
        );
        distributor.distribute(address(mockToken), 100 ether, wrongRoot);
        vm.stopPrank();
    }

    function test_Distribute_RevertsOnInvalidMerkleState_ZeroRoot() public {
        mockMerkleSnapshot.setMerkleState(
            IMerkleSnapshot.MerkleState({
                blockNumber: block.number,
                timestamp: block.timestamp,
                root: bytes32(0),
                ipfsHash: TEST_IPFS_HASH,
                ipfsHashCid: TEST_IPFS_CID,
                totalValue: TEST_TOTAL_VALUE
            })
        );

        vm.startPrank(alice);
        mockToken.approve(address(distributor), 100 ether);

        vm.expectRevert(IMerkleFundDistributor.InvalidMerkleState.selector);
        distributor.distribute(address(mockToken), 100 ether, bytes32(0));
        vm.stopPrank();
    }

    function test_Distribute_RevertsOnInvalidMerkleState_ZeroTotalValue()
        public
    {
        mockMerkleSnapshot.setMerkleState(
            IMerkleSnapshot.MerkleState({
                blockNumber: block.number,
                timestamp: block.timestamp,
                root: TEST_ROOT,
                ipfsHash: TEST_IPFS_HASH,
                ipfsHashCid: TEST_IPFS_CID,
                totalValue: 0
            })
        );

        vm.startPrank(alice);
        mockToken.approve(address(distributor), 100 ether);

        vm.expectRevert(IMerkleFundDistributor.InvalidMerkleState.selector);
        distributor.distribute(address(mockToken), 100 ether, bytes32(0));
        vm.stopPrank();
    }

    function test_Distribute_NativeToken_RevertsOnWrongMsgValue() public {
        vm.prank(alice);
        vm.expectRevert(
            IMerkleFundDistributor.InvalidNativeTokenTransferAmount.selector
        );
        distributor.distribute{value: 5 ether}(
            address(0),
            10 ether,
            bytes32(0)
        );
    }

    function test_Distribute_ERC20_RevertsIfMsgValueSent() public {
        vm.startPrank(alice);
        mockToken.approve(address(distributor), 100 ether);

        vm.expectRevert(
            IMerkleFundDistributor.InvalidNativeTokenTransfer.selector
        );
        distributor.distribute{value: 1 ether}(
            address(mockToken),
            100 ether,
            bytes32(0)
        );
        vm.stopPrank();
    }

    function test_Distribute_RevertsWhenPaused() public {
        vm.prank(owner);
        distributor.pause();

        vm.startPrank(alice);
        mockToken.approve(address(distributor), 100 ether);

        vm.expectRevert(abi.encodeWithSignature("EnforcedPause()"));
        distributor.distribute(address(mockToken), 100 ether, bytes32(0));
        vm.stopPrank();
    }

    function test_Distribute_RevertsWhenNotAllowlisted() public {
        vm.prank(owner);
        distributor.setAllowlistEnabled(true);

        vm.startPrank(alice);
        mockToken.approve(address(distributor), 100 ether);

        vm.expectRevert(IMerkleFundDistributor.CannotDistribute.selector);
        distributor.distribute(address(mockToken), 100 ether, bytes32(0));
        vm.stopPrank();
    }

    function test_Distribute_SucceedsWhenAllowlisted() public {
        vm.startPrank(owner);
        distributor.setAllowlistEnabled(true);
        distributor.updateDistributorAllowance(alice, true);
        vm.stopPrank();

        _createERC20Distribution(alice, 100 ether);

        assertEq(distributor.getDistributionCount(), 1);
    }

    function test_Distribute_NativeToken_RevertsOnFeeTransferFailure() public {
        // Deploy a rejecting contract as fee recipient
        RejectingReceiver rejecter = new RejectingReceiver();

        vm.prank(owner);
        distributor.setFeeRecipient(address(rejecter));

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(
                IMerkleFundDistributor.FailedToTransferFee.selector,
                ""
            )
        );
        distributor.distribute{value: 10 ether}(
            address(0),
            10 ether,
            bytes32(0)
        );
    }

    function test_Distribute_ZeroFeePercentage() public {
        vm.prank(owner);
        distributor.setFeePercentage(0);

        uint256 amount = 100 ether;
        uint256 feeRecipientBalanceBefore = mockToken.balanceOf(feeRecipient);

        _createERC20Distribution(alice, amount);

        IMerkleFundDistributor.DistributionState memory dist = distributor
            .getDistribution(0);
        assertEq(dist.feeAmount, 0);
        // Fee recipient receives nothing (but SafeERC20 still calls transfer with 0)
        assertEq(mockToken.balanceOf(feeRecipient), feeRecipientBalanceBefore);
    }

    function test_Distribute_MaxFeePercentage() public {
        vm.prank(owner);
        distributor.setFeePercentage(FEE_RANGE); // 100%

        uint256 amount = 100 ether;

        _createERC20Distribution(alice, amount);

        IMerkleFundDistributor.DistributionState memory dist = distributor
            .getDistribution(0);
        assertEq(dist.feeAmount, amount); // entire amount is fee
        assertEq(mockToken.balanceOf(feeRecipient), amount);
        assertEq(mockToken.balanceOf(address(distributor)), 0);
    }

    /* ========== CLAIM TESTS ========== */

    function test_Claim_ERC20_TransfersCorrectAmount() public {
        // Create merkle tree: alice=600, bob=400 (total=1000)
        bytes32 aliceLeaf = _generateLeaf(alice, 600);
        bytes32 bobLeaf = _generateLeaf(bob, 400);
        bytes32 root = _hashPair(aliceLeaf, bobLeaf);

        // Update mock to use this root
        mockMerkleSnapshot.setMerkleState(
            IMerkleSnapshot.MerkleState({
                blockNumber: block.number,
                timestamp: block.timestamp,
                root: root,
                ipfsHash: TEST_IPFS_HASH,
                ipfsHashCid: TEST_IPFS_CID,
                totalValue: 1000
            })
        );

        // Create distribution with 100 tokens, 1% fee = 99 distributable
        uint256 fundedAmount = 100 ether;
        _createERC20Distribution(alice, fundedAmount);

        uint256 feeAmount = (fundedAmount * DEFAULT_FEE_PERCENTAGE) / FEE_RANGE;
        uint256 distributable = fundedAmount - feeAmount;

        // Alice claims (600/1000 * 99 = 59.4 tokens)
        bytes32[] memory aliceProof = new bytes32[](1);
        aliceProof[0] = bobLeaf;

        uint256 aliceBalanceBefore = mockToken.balanceOf(alice);
        uint256 expectedAliceClaim = (distributable * 600) / 1000;

        vm.expectEmit(true, true, true, true);
        emit IMerkleFundDistributor.Claimed(
            0,
            alice,
            address(mockToken),
            expectedAliceClaim,
            600,
            expectedAliceClaim
        );

        uint256 claimedAmount = distributor.claim(0, alice, 600, aliceProof);

        assertEq(claimedAmount, expectedAliceClaim);
        assertEq(
            mockToken.balanceOf(alice),
            aliceBalanceBefore + expectedAliceClaim
        );
        assertEq(distributor.claimed(0, alice), expectedAliceClaim);
    }

    function test_Claim_NativeToken_TransfersCorrectAmount() public {
        // Create merkle tree: alice=600, bob=400 (total=1000)
        bytes32 aliceLeaf = _generateLeaf(alice, 600);
        bytes32 bobLeaf = _generateLeaf(bob, 400);
        bytes32 root = _hashPair(aliceLeaf, bobLeaf);

        mockMerkleSnapshot.setMerkleState(
            IMerkleSnapshot.MerkleState({
                blockNumber: block.number,
                timestamp: block.timestamp,
                root: root,
                ipfsHash: TEST_IPFS_HASH,
                ipfsHashCid: TEST_IPFS_CID,
                totalValue: 1000
            })
        );

        // Create native token distribution
        uint256 fundedAmount = 10 ether;
        vm.prank(alice);
        distributor.distribute{value: fundedAmount}(
            address(0),
            fundedAmount,
            bytes32(0)
        );

        uint256 feeAmount = (fundedAmount * DEFAULT_FEE_PERCENTAGE) / FEE_RANGE;
        uint256 distributable = fundedAmount - feeAmount;

        bytes32[] memory aliceProof = new bytes32[](1);
        aliceProof[0] = bobLeaf;

        uint256 aliceBalanceBefore = alice.balance;
        uint256 expectedAliceClaim = (distributable * 600) / 1000;

        uint256 claimedAmount = distributor.claim(0, alice, 600, aliceProof);

        assertEq(claimedAmount, expectedAliceClaim);
        assertEq(alice.balance, aliceBalanceBefore + expectedAliceClaim);
    }

    function test_Claim_MultipleUsersFromSameDistribution() public {
        // Create merkle tree
        bytes32 aliceLeaf = _generateLeaf(alice, 600);
        bytes32 bobLeaf = _generateLeaf(bob, 400);
        bytes32 root = _hashPair(aliceLeaf, bobLeaf);

        mockMerkleSnapshot.setMerkleState(
            IMerkleSnapshot.MerkleState({
                blockNumber: block.number,
                timestamp: block.timestamp,
                root: root,
                ipfsHash: TEST_IPFS_HASH,
                ipfsHashCid: TEST_IPFS_CID,
                totalValue: 1000
            })
        );

        uint256 fundedAmount = 100 ether;
        _createERC20Distribution(alice, fundedAmount);

        uint256 feeAmount = (fundedAmount * DEFAULT_FEE_PERCENTAGE) / FEE_RANGE;
        uint256 distributable = fundedAmount - feeAmount;

        // Alice claims
        bytes32[] memory aliceProof = new bytes32[](1);
        aliceProof[0] = bobLeaf;
        uint256 aliceClaimed = distributor.claim(0, alice, 600, aliceProof);

        // Bob claims
        bytes32[] memory bobProof = new bytes32[](1);
        bobProof[0] = aliceLeaf;
        uint256 bobClaimed = distributor.claim(0, bob, 400, bobProof);

        uint256 expectedAlice = (distributable * 600) / 1000;
        uint256 expectedBob = (distributable * 400) / 1000;

        assertEq(aliceClaimed, expectedAlice);
        assertEq(bobClaimed, expectedBob);

        IMerkleFundDistributor.DistributionState memory dist = distributor
            .getDistribution(0);
        assertEq(dist.amountDistributed, aliceClaimed + bobClaimed);
    }

    function test_Claim_RevertsOnDistributionNotFound() public {
        bytes32[] memory proof = new bytes32[](0);

        vm.expectRevert(IMerkleFundDistributor.DistributionNotFound.selector);
        distributor.claim(0, alice, 100, proof);
    }

    function test_Claim_RevertsOnInvalidAddress() public {
        _createERC20Distribution(alice, 100 ether);

        bytes32[] memory proof = new bytes32[](0);

        vm.expectRevert(IMerkleFundDistributor.InvalidAddress.selector);
        distributor.claim(0, address(0), 100, proof);
    }

    function test_Claim_RevertsOnAlreadyClaimed() public {
        bytes32 aliceLeaf = _generateLeaf(alice, 600);
        bytes32 bobLeaf = _generateLeaf(bob, 400);
        bytes32 root = _hashPair(aliceLeaf, bobLeaf);

        mockMerkleSnapshot.setMerkleState(
            IMerkleSnapshot.MerkleState({
                blockNumber: block.number,
                timestamp: block.timestamp,
                root: root,
                ipfsHash: TEST_IPFS_HASH,
                ipfsHashCid: TEST_IPFS_CID,
                totalValue: 1000
            })
        );

        _createERC20Distribution(alice, 100 ether);

        bytes32[] memory aliceProof = new bytes32[](1);
        aliceProof[0] = bobLeaf;

        // First claim succeeds
        distributor.claim(0, alice, 600, aliceProof);

        // Second claim reverts
        vm.expectRevert(IMerkleFundDistributor.AlreadyClaimed.selector);
        distributor.claim(0, alice, 600, aliceProof);
    }

    function test_Claim_RevertsOnInvalidMerkleProof() public {
        _createERC20Distribution(alice, 100 ether);

        bytes32[] memory invalidProof = new bytes32[](1);
        invalidProof[0] = bytes32(uint256(0xdeadbeef));

        vm.expectRevert(IMerkleFundDistributor.InvalidMerkleProof.selector);
        distributor.claim(0, alice, 100, invalidProof);
    }

    function test_Claim_RevertsOnNoFundsToClaim() public {
        // Create tree where alice has 0 value
        bytes32 aliceLeaf = _generateLeaf(alice, 0);
        bytes32 bobLeaf = _generateLeaf(bob, 1000);
        bytes32 root = _hashPair(aliceLeaf, bobLeaf);

        mockMerkleSnapshot.setMerkleState(
            IMerkleSnapshot.MerkleState({
                blockNumber: block.number,
                timestamp: block.timestamp,
                root: root,
                ipfsHash: TEST_IPFS_HASH,
                ipfsHashCid: TEST_IPFS_CID,
                totalValue: 1000
            })
        );

        _createERC20Distribution(alice, 100 ether);

        bytes32[] memory aliceProof = new bytes32[](1);
        aliceProof[0] = bobLeaf;

        vm.expectRevert(IMerkleFundDistributor.NoFundsToClaim.selector);
        distributor.claim(0, alice, 0, aliceProof);
    }

    function test_Claim_RevertsWhenPaused() public {
        _createERC20Distribution(alice, 100 ether);

        vm.prank(owner);
        distributor.pause();

        bytes32[] memory proof = new bytes32[](0);

        vm.expectRevert(abi.encodeWithSignature("EnforcedPause()"));
        distributor.claim(0, alice, 100, proof);
    }

    function test_Claim_NativeToken_RevertsOnTransferFailure() public {
        // Create merkle tree with rejecting receiver
        RejectingReceiver rejecter = new RejectingReceiver();
        bytes32 rejecterLeaf = _generateLeaf(address(rejecter), 600);
        bytes32 bobLeaf = _generateLeaf(bob, 400);
        bytes32 root = _hashPair(rejecterLeaf, bobLeaf);

        mockMerkleSnapshot.setMerkleState(
            IMerkleSnapshot.MerkleState({
                blockNumber: block.number,
                timestamp: block.timestamp,
                root: root,
                ipfsHash: TEST_IPFS_HASH,
                ipfsHashCid: TEST_IPFS_CID,
                totalValue: 1000
            })
        );

        // Create native token distribution
        vm.prank(alice);
        distributor.distribute{value: 10 ether}(
            address(0),
            10 ether,
            bytes32(0)
        );

        bytes32[] memory proof = new bytes32[](1);
        proof[0] = bobLeaf;

        vm.expectRevert(
            abi.encodeWithSelector(
                IMerkleFundDistributor.FailedToTransferTokens.selector,
                ""
            )
        );
        distributor.claim(0, address(rejecter), 600, proof);
    }

    function test_Claim_AnyoneCanClaimOnBehalfOfAccount() public {
        bytes32 aliceLeaf = _generateLeaf(alice, 600);
        bytes32 bobLeaf = _generateLeaf(bob, 400);
        bytes32 root = _hashPair(aliceLeaf, bobLeaf);

        mockMerkleSnapshot.setMerkleState(
            IMerkleSnapshot.MerkleState({
                blockNumber: block.number,
                timestamp: block.timestamp,
                root: root,
                ipfsHash: TEST_IPFS_HASH,
                ipfsHashCid: TEST_IPFS_CID,
                totalValue: 1000
            })
        );

        _createERC20Distribution(alice, 100 ether);

        bytes32[] memory aliceProof = new bytes32[](1);
        aliceProof[0] = bobLeaf;

        uint256 aliceBalanceBefore = mockToken.balanceOf(alice);

        // Charlie claims on behalf of alice
        vm.prank(charlie);
        uint256 claimedAmount = distributor.claim(0, alice, 600, aliceProof);

        // Tokens go to alice, not charlie
        assertEq(
            mockToken.balanceOf(alice),
            aliceBalanceBefore + claimedAmount
        );
    }

    /* ========== COMPLEX MERKLE TREE TESTS ========== */

    function test_Claim_ComplexMerkleTree_FourLeaves() public {
        // Create a 4-leaf merkle tree
        bytes32 leaf0 = _generateLeaf(alice, 250);
        bytes32 leaf1 = _generateLeaf(bob, 250);
        bytes32 leaf2 = _generateLeaf(charlie, 250);
        bytes32 leaf3 = _generateLeaf(address(0x6), 250);

        bytes32 node01 = _hashPair(leaf0, leaf1);
        bytes32 node23 = _hashPair(leaf2, leaf3);
        bytes32 root = _hashPair(node01, node23);

        mockMerkleSnapshot.setMerkleState(
            IMerkleSnapshot.MerkleState({
                blockNumber: block.number,
                timestamp: block.timestamp,
                root: root,
                ipfsHash: TEST_IPFS_HASH,
                ipfsHashCid: TEST_IPFS_CID,
                totalValue: 1000
            })
        );

        _createERC20Distribution(alice, 100 ether);

        // Alice claims with proof [leaf1, node23]
        bytes32[] memory aliceProof = new bytes32[](2);
        aliceProof[0] = leaf1;
        aliceProof[1] = node23;

        uint256 claimedAmount = distributor.claim(0, alice, 250, aliceProof);

        uint256 feeAmount = (100 ether * DEFAULT_FEE_PERCENTAGE) / FEE_RANGE;
        uint256 distributable = 100 ether - feeAmount;
        uint256 expectedClaim = (distributable * 250) / 1000;

        assertEq(claimedAmount, expectedClaim);
    }

    /* ========== HELPER FUNCTIONS ========== */

    function _createERC20Distribution(address from, uint256 amount) internal {
        vm.startPrank(from);
        mockToken.approve(address(distributor), amount);
        distributor.distribute(address(mockToken), amount, bytes32(0));
        vm.stopPrank();
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

/* ========== MOCK CONTRACTS ========== */

contract MockMerkleSnapshot is IMerkleSnapshot {
    MerkleState private _state;

    function setMerkleState(MerkleState memory state) external {
        _state = state;
    }

    function getLatestState()
        external
        view
        override
        returns (MerkleState memory)
    {
        return _state;
    }
}

contract MockERC20 is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract RejectingReceiver {
    receive() external payable {
        revert();
    }
}
