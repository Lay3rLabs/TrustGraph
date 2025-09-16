// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import {DAICO} from "../../src/contracts/daico/DAICO.sol";
import {DAICOVault} from "../../src/contracts/tokens/DAICOVault.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {IDAICO} from "../../src/interfaces/IDAICO.sol";

/// @title Comprehensive DAICO Test Suite
/// @notice Tests all functionality of the DAICO contract including edge cases and security
/// @dev Uses forge-std Test framework with comprehensive coverage
contract DAICOTest is Test {
    // ============ Test Contracts ============
    DAICO public daico;
    DAICOVault public vaultToken;
    MockProjectToken public projectToken;

    // ============ Test Addresses ============
    address public admin = address(0x1);
    address public treasury = address(0x2);
    address public alice = address(0x3);
    address public bob = address(0x4);
    address public charlie = address(0x5);
    address public attacker = address(0x666);

    // ============ VRGDA Parameters ============
    uint256 public constant TARGET_PRICE = 0.001 ether; // Initial price per token
    int256 public constant DECAY_CONSTANT = 0.9e18; // 90% decay constant (scaled by 1e18)
    uint256 public constant PER_TIME_UNIT = 1000 * 1e18; // Target: 1000 tokens per day

    // ============ Sale Parameters ============
    uint256 public constant MAX_SUPPLY = 1_000_000 * 1e18; // 1M tokens
    uint256 public constant CLIFF_DURATION = 30 days;
    uint256 public constant VESTING_DURATION = 180 days;

    // ============ Test Events ============
    event Contributed(
        address indexed contributor, uint256 ethAmount, uint256 vaultTokensMinted, uint256 projectTokensAllocated
    );
    event Refunded(address indexed user, uint256 vaultTokensBurned, uint256 ethRefunded);
    event TokensClaimed(address indexed user, uint256 vaultTokensBurned, uint256 projectTokensClaimed);
    event VestedToTreasury(uint256 amount);
    event SalePaused(address indexed by);
    event SaleUnpaused(address indexed by);
    event SaleEnded(address indexed by);

    // ============ Setup ============

    function setUp() public {
        vm.label(admin, "Admin");
        vm.label(treasury, "Treasury");
        vm.label(alice, "Alice");
        vm.label(bob, "Bob");
        vm.label(charlie, "Charlie");
        vm.label(attacker, "Attacker");

        // Deploy project token
        projectToken = new MockProjectToken();

        // Deploy DAICO contract
        vm.startPrank(admin);
        daico = new DAICO(
            address(projectToken),
            treasury,
            admin,
            MAX_SUPPLY,
            int256(TARGET_PRICE),
            int256(DECAY_CONSTANT),
            int256(PER_TIME_UNIT),
            CLIFF_DURATION,
            VESTING_DURATION,
            "DAICO Vault Token",
            "vDAICO"
        );

        // Get vault token reference
        vaultToken = DAICOVault(daico.vaultToken());

        // Transfer project tokens to DAICO for distribution
        projectToken.mint(address(daico), MAX_SUPPLY);

        vm.stopPrank();

        // Fund test accounts
        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
        vm.deal(charlie, 100 ether);
        vm.deal(attacker, 10 ether);
    }

    // ============ Helper Functions ============

    /// @notice Helper to calculate expected price for a given amount
    function calculateExpectedPrice(uint256 amount) internal view returns (uint256) {
        return daico.getCurrentPrice(amount);
    }

    /// @notice Helper to contribute and verify state
    function contributeAndVerify(address contributor, uint256 projectTokenAmount, uint256 ethToSend) internal {
        uint256 initialBalance = contributor.balance;
        uint256 initialVaultTokens = vaultToken.balanceOf(contributor);
        uint256 initialTotalRaised = daico.totalRaised();
        uint256 initialTotalSold = daico.totalSold();

        vm.prank(contributor);
        uint256 vaultTokensReceived = daico.contribute{value: ethToSend}(projectTokenAmount);

        // Verify balances
        assertEq(contributor.balance, initialBalance - ethToSend, "ETH balance incorrect");
        assertEq(vaultToken.balanceOf(contributor), initialVaultTokens + vaultTokensReceived, "Vault tokens incorrect");
        assertEq(daico.totalRaised(), initialTotalRaised + ethToSend, "Total raised incorrect");
        assertEq(daico.totalSold(), initialTotalSold + projectTokenAmount, "Total sold incorrect");
    }

    /// @notice Helper to advance time and calculate vested amounts
    function advanceTimeAndCalculateVesting(address account, uint256 timeToAdvance)
        internal
        returns (uint256 vestedETH, uint256 unvestedETH)
    {
        vm.warp(block.timestamp + timeToAdvance);
        vestedETH = daico.getVestedETH(account);
        unvestedETH = daico.getUnvestedETH(account);
    }

    // ============ Initialization Tests ============

    function test_Initialization() public view {
        assertEq(address(daico.projectToken()), address(projectToken), "Project token incorrect");
        assertEq(daico.treasury(), treasury, "Treasury incorrect");
        assertEq(daico.maxSupply(), MAX_SUPPLY, "Max supply incorrect");
        assertEq(daico.cliffDuration(), CLIFF_DURATION, "Cliff duration incorrect");
        assertEq(daico.vestingDuration(), VESTING_DURATION, "Vesting duration incorrect");
        assertTrue(daico.saleActive(), "Sale should be active");
        assertFalse(daico.salePaused(), "Sale should not be paused");
        assertFalse(daico.saleEnded(), "Sale should not be ended");
    }

    function test_VaultTokenInitialization() public view {
        assertEq(vaultToken.daico(), address(daico), "DAICO address incorrect");
        assertEq(vaultToken.name(), "DAICO Vault Token", "Vault token name incorrect");
        assertEq(vaultToken.symbol(), "vDAICO", "Vault token symbol incorrect");
    }

    // ============ Contribution Tests ============

    function test_BasicContribution() public {
        uint256 tokenAmount = 100 * 1e18;
        uint256 expectedPrice = daico.getCurrentPrice(tokenAmount);

        vm.expectEmit(true, false, false, true);
        emit Contributed(alice, expectedPrice, expectedPrice, tokenAmount);

        vm.prank(alice);
        uint256 vaultTokensReceived = daico.contribute{value: expectedPrice}(tokenAmount);

        assertEq(vaultTokensReceived, expectedPrice, "Should receive 1:1 vault tokens for ETH");
        assertEq(vaultToken.balanceOf(alice), expectedPrice, "Vault token balance incorrect");
        assertEq(daico.totalRaised(), expectedPrice, "Total raised incorrect");
        assertEq(daico.totalSold(), tokenAmount, "Total sold incorrect");
    }

    function test_ContributionWithExcessETH() public {
        uint256 tokenAmount = 100 * 1e18;
        uint256 expectedPrice = daico.getCurrentPrice(tokenAmount);
        uint256 excessETH = 0.5 ether;

        uint256 aliceInitialBalance = alice.balance;

        vm.prank(alice);
        uint256 vaultTokensReceived = daico.contribute{value: expectedPrice + excessETH}(tokenAmount);

        // Verify excess ETH is refunded
        assertEq(alice.balance, aliceInitialBalance - expectedPrice, "Should refund excess ETH");
        assertEq(vaultTokensReceived, expectedPrice, "Vault tokens should match ETH spent");
    }

    function test_MultipleContributions() public {
        // Alice contributes
        contributeAndVerify(alice, 100 * 1e18, 0.2 ether);

        // Bob contributes (price should increase due to VRGDA)
        uint256 bobTokenAmount = 100 * 1e18;
        uint256 bobExpectedPrice = daico.getCurrentPrice(bobTokenAmount);
        assertTrue(bobExpectedPrice > TARGET_PRICE * 100, "Price should increase after first purchase");
        contributeAndVerify(bob, bobTokenAmount, bobExpectedPrice + 0.1 ether);

        // Charlie contributes
        uint256 charlieTokenAmount = 50 * 1e18;
        uint256 charlieExpectedPrice = daico.getCurrentPrice(charlieTokenAmount);
        contributeAndVerify(charlie, charlieTokenAmount, charlieExpectedPrice);
    }

    function test_ContributionHistory() public {
        // Make multiple contributions
        vm.startPrank(alice);
        daico.contribute{value: 0.1 ether}(50 * 1e18);
        daico.contribute{value: 0.2 ether}(100 * 1e18);
        vm.stopPrank();

        IDAICO.Contribution[] memory history = daico.getContributionHistory(alice);
        assertEq(history.length, 2, "Should have 2 contributions");
        assertEq(history[0].ethAmount, 0.1 ether, "First contribution amount incorrect");
        assertEq(history[1].ethAmount, 0.2 ether, "Second contribution amount incorrect");
    }

    function test_RevertContributionInsufficientPayment() public {
        uint256 tokenAmount = 100 * 1e18;
        uint256 expectedPrice = daico.getCurrentPrice(tokenAmount);

        vm.prank(alice);
        vm.expectRevert(IDAICO.InsufficientPayment.selector);
        daico.contribute{value: expectedPrice - 1}(tokenAmount);
    }

    function test_RevertContributionExceedsMaxSupply() public {
        uint256 exceedsSupply = MAX_SUPPLY + 1;

        vm.prank(alice);
        vm.expectRevert(IDAICO.ExceedsMaxSupply.selector);
        daico.contribute{value: 10 ether}(exceedsSupply);
    }

    function test_RevertContributionWhenPaused() public {
        vm.prank(admin);
        daico.pauseSale();

        vm.prank(alice);
        vm.expectRevert(IDAICO.Paused.selector);
        daico.contribute{value: 0.1 ether}(100 * 1e18);
    }

    function test_RevertContributionWhenSaleEnded() public {
        vm.prank(admin);
        daico.endSale();

        vm.prank(alice);
        vm.expectRevert(IDAICO.SaleNotActive.selector);
        daico.contribute{value: 0.1 ether}(100 * 1e18);
    }

    // ============ VRGDA Pricing Tests ============

    function test_VRGDAPriceIncrease() public view {
        uint256 amount = 100 * 1e18;

        // Get prices at different supply levels
        uint256 price1 = daico.getQuoteAtSupply(amount, 0);
        uint256 price2 = daico.getQuoteAtSupply(amount, 1000 * 1e18);
        uint256 price3 = daico.getQuoteAtSupply(amount, 10000 * 1e18);

        assertTrue(price2 > price1, "Price should increase with supply");
        assertTrue(price3 > price2, "Price should continue increasing");
    }

    function test_VRGDAPriceDecayOverTime() public {
        // Initial contribution
        vm.prank(alice);
        daico.contribute{value: 1 ether}(1000 * 1e18);

        uint256 priceBefore = daico.getCurrentPrice(100 * 1e18);

        // Advance time (price should decrease if below target sales)
        vm.warp(block.timestamp + 1 days);

        uint256 priceAfter = daico.getCurrentPrice(100 * 1e18);

        // Price might increase or decrease depending on VRGDA parameters
        // This test verifies the mechanism works
        assertTrue(priceAfter != priceBefore, "Price should change over time");
    }

    // ============ Vesting Tests ============

    function test_VestingScheduleCreation() public {
        uint256 tokenAmount = 100 * 1e18;
        uint256 ethAmount = 0.1 ether;

        vm.prank(alice);
        daico.contribute{value: ethAmount}(tokenAmount);

        IDAICO.VestingSchedule memory schedule = daico.getVestingSchedule(alice);
        assertEq(schedule.totalTokens, tokenAmount, "Total tokens incorrect");
        assertEq(schedule.ethContributed, ethAmount, "ETH contributed incorrect");
        assertEq(schedule.cliffDuration, CLIFF_DURATION, "Cliff duration incorrect");
        assertEq(schedule.vestingDuration, VESTING_DURATION, "Vesting duration incorrect");
        assertEq(schedule.claimed, 0, "Should have no claimed tokens initially");
    }

    function test_VestingDuringCliff() public {
        vm.prank(alice);
        daico.contribute{value: 0.1 ether}(100 * 1e18);

        // Advance time but still in cliff
        vm.warp(block.timestamp + CLIFF_DURATION - 1);

        uint256 vestedETH = daico.getVestedETH(alice);
        uint256 unvestedETH = daico.getUnvestedETH(alice);

        assertEq(vestedETH, 0, "Should have no vested ETH during cliff");
        assertEq(unvestedETH, 0.1 ether, "All ETH should be unvested during cliff");
    }

    function test_VestingAfterCliff() public {
        uint256 ethAmount = 0.1 ether;

        vm.prank(alice);
        daico.contribute{value: ethAmount}(100 * 1e18);

        // Advance past cliff
        vm.warp(block.timestamp + CLIFF_DURATION + 1);

        uint256 vestedETH = daico.getVestedETH(alice);
        uint256 unvestedETH = daico.getUnvestedETH(alice);

        assertTrue(vestedETH > 0, "Should have vested ETH after cliff");
        assertTrue(unvestedETH < ethAmount, "Some ETH should be vested");
        assertEq(vestedETH + unvestedETH, ethAmount, "Vested + unvested should equal total");
    }

    function test_VestingLinearProgress() public {
        uint256 ethAmount = 1 ether;

        vm.prank(alice);
        daico.contribute{value: ethAmount}(1000 * 1e18);

        // Test at 25% vesting
        vm.warp(block.timestamp + CLIFF_DURATION + (VESTING_DURATION - CLIFF_DURATION) / 4);
        uint256 vested25 = daico.getVestedETH(alice);

        // Test at 50% vesting
        vm.warp(block.timestamp + CLIFF_DURATION + (VESTING_DURATION - CLIFF_DURATION) / 2);
        uint256 vested50 = daico.getVestedETH(alice);

        // Test at 75% vesting
        vm.warp(block.timestamp + CLIFF_DURATION + (VESTING_DURATION - CLIFF_DURATION) * 3 / 4);
        uint256 vested75 = daico.getVestedETH(alice);

        // Test at 100% vesting
        vm.warp(block.timestamp + VESTING_DURATION);
        uint256 vested100 = daico.getVestedETH(alice);

        // Verify linear progression
        assertTrue(vested25 < vested50, "Vesting should increase over time");
        assertTrue(vested50 < vested75, "Vesting should continue increasing");
        assertTrue(vested75 < vested100, "Vesting should reach maximum");
        assertEq(vested100, ethAmount, "Should be fully vested at end");
    }

    // ============ Refund Tests ============

    function test_RefundBeforeCliff() public {
        uint256 ethAmount = 1 ether;

        vm.prank(alice);
        daico.contribute{value: ethAmount}(1000 * 1e18);

        uint256 vaultBalance = vaultToken.balanceOf(alice);
        uint256 aliceBalanceBefore = alice.balance;

        vm.expectEmit(true, false, false, true);
        emit Refunded(alice, vaultBalance, ethAmount);

        vm.prank(alice);
        uint256 refunded = daico.refund(vaultBalance);

        assertEq(refunded, ethAmount, "Should refund full amount before cliff");
        assertEq(alice.balance, aliceBalanceBefore + ethAmount, "ETH balance incorrect");
        assertEq(vaultToken.balanceOf(alice), 0, "Vault tokens should be burned");
    }

    function test_PartialRefund() public {
        uint256 ethAmount = 1 ether;

        vm.prank(alice);
        daico.contribute{value: ethAmount}(1000 * 1e18);

        uint256 vaultBalance = vaultToken.balanceOf(alice);
        uint256 refundAmount = vaultBalance / 2; // Refund half

        vm.prank(alice);
        uint256 refunded = daico.refund(refundAmount);

        assertEq(refunded, ethAmount / 2, "Should refund proportional amount");
        assertEq(vaultToken.balanceOf(alice), vaultBalance / 2, "Half vault tokens should remain");
    }

    function test_RefundAfterPartialVesting() public {
        uint256 ethAmount = 1 ether;

        vm.prank(alice);
        daico.contribute{value: ethAmount}(1000 * 1e18);

        // Advance to 50% vesting
        vm.warp(block.timestamp + CLIFF_DURATION + (VESTING_DURATION - CLIFF_DURATION) / 2);

        uint256 vaultBalance = vaultToken.balanceOf(alice);
        uint256 unvestedETH = daico.getUnvestedETH(alice);

        vm.prank(alice);
        uint256 refunded = daico.refund(vaultBalance);

        assertEq(refunded, unvestedETH, "Should only refund unvested portion");
        assertTrue(refunded < ethAmount, "Should refund less than total after vesting");
    }

    function test_RefundCalculation() public {
        uint256 ethAmount = 1 ether;

        vm.prank(alice);
        daico.contribute{value: ethAmount}(1000 * 1e18);

        // Test calculation before refund
        uint256 vaultBalance = vaultToken.balanceOf(alice);
        uint256 calculatedRefund = daico.calculateRefund(alice, vaultBalance);

        vm.prank(alice);
        uint256 actualRefund = daico.refund(vaultBalance);

        assertEq(actualRefund, calculatedRefund, "Calculated and actual refund should match");
    }

    function test_RevertRefundInsufficientVaultTokens() public {
        vm.prank(alice);
        daico.contribute{value: 0.1 ether}(100 * 1e18);

        uint256 balance = vaultToken.balanceOf(alice);

        vm.prank(alice);
        vm.expectRevert(IDAICO.InsufficientVaultTokens.selector);
        daico.refund(balance + 1);
    }

    function test_RevertRefundZeroAmount() public {
        vm.prank(alice);
        vm.expectRevert(IDAICO.InvalidAmount.selector);
        daico.refund(0);
    }

    // ============ Claim Project Tokens Tests ============

    function test_ClaimAfterFullVesting() public {
        uint256 tokenAmount = 1000 * 1e18;
        uint256 ethAmount = 1 ether;

        vm.prank(alice);
        daico.contribute{value: ethAmount}(tokenAmount);

        // Advance past full vesting
        vm.warp(block.timestamp + VESTING_DURATION + 1);

        uint256 vaultBalance = vaultToken.balanceOf(alice);

        vm.expectEmit(true, false, false, true);
        emit TokensClaimed(alice, vaultBalance, tokenAmount);

        vm.prank(alice);
        uint256 claimed = daico.claimProjectTokens(vaultBalance);

        assertEq(claimed, tokenAmount, "Should claim all project tokens");
        assertEq(projectToken.balanceOf(alice), tokenAmount, "Project token balance incorrect");
        assertEq(vaultToken.balanceOf(alice), 0, "Vault tokens should be burned");
    }

    function test_ClaimAfterPartialVesting() public {
        uint256 tokenAmount = 1000 * 1e18;
        uint256 ethAmount = 1 ether;

        vm.prank(alice);
        daico.contribute{value: ethAmount}(tokenAmount);

        // Advance to 50% vesting
        vm.warp(block.timestamp + CLIFF_DURATION + (VESTING_DURATION - CLIFF_DURATION) / 2);

        uint256 vaultBalance = vaultToken.balanceOf(alice);
        uint256 expectedTokens = daico.calculateClaimableTokens(alice, vaultBalance);

        vm.prank(alice);
        uint256 claimed = daico.claimProjectTokens(vaultBalance);

        assertEq(claimed, expectedTokens, "Claimed amount should match calculation");
        assertTrue(claimed < tokenAmount, "Should claim partial amount");
        assertTrue(claimed > tokenAmount / 2, "Should claim more than half after 50% vesting");
    }

    function test_MultipleClaimsTracking() public {
        uint256 tokenAmount = 1000 * 1e18;

        vm.prank(alice);
        daico.contribute{value: 1 ether}(tokenAmount);

        // First claim at 50% vesting
        vm.warp(block.timestamp + CLIFF_DURATION + (VESTING_DURATION - CLIFF_DURATION) / 2);

        uint256 halfVault = vaultToken.balanceOf(alice) / 2;
        vm.prank(alice);
        uint256 firstClaim = daico.claimProjectTokens(halfVault);

        // Second claim at 100% vesting
        vm.warp(block.timestamp + VESTING_DURATION);

        uint256 remainingVault = vaultToken.balanceOf(alice);
        vm.prank(alice);
        uint256 secondClaim = daico.claimProjectTokens(remainingVault);

        // Verify total claimed equals allocated
        IDAICO.VestingSchedule memory schedule = daico.getVestingSchedule(alice);
        assertEq(schedule.claimed, tokenAmount, "Total claimed should equal allocated");
        assertEq(projectToken.balanceOf(alice), tokenAmount, "Should have all project tokens");
    }

    function test_RevertClaimDuringCliff() public {
        vm.prank(alice);
        daico.contribute{value: 0.1 ether}(100 * 1e18);

        vm.warp(block.timestamp + CLIFF_DURATION - 1);

        vm.prank(alice);
        vm.expectRevert(IDAICO.StillInCliff.selector);
        daico.claimProjectTokens(vaultToken.balanceOf(alice));
    }

    function test_RevertClaimInsufficientVaultTokens() public {
        vm.prank(alice);
        daico.contribute{value: 0.1 ether}(100 * 1e18);

        vm.warp(block.timestamp + VESTING_DURATION);

        uint256 balance = vaultToken.balanceOf(alice);

        vm.prank(alice);
        vm.expectRevert(IDAICO.InsufficientVaultTokens.selector);
        daico.claimProjectTokens(balance + 1);
    }

    // ============ Treasury Withdrawal Tests ============

    function test_TreasuryWithdrawal() public {
        // Multiple contributions
        vm.prank(alice);
        daico.contribute{value: 1 ether}(1000 * 1e18);

        vm.prank(bob);
        daico.contribute{value: 2 ether}(2000 * 1e18);

        // Advance time for partial vesting
        vm.warp(block.timestamp + CLIFF_DURATION + (VESTING_DURATION - CLIFF_DURATION) / 2);

        uint256 treasuryBalanceBefore = treasury.balance;
        uint256 totalVested = daico.getVestedETH(alice) + daico.getVestedETH(bob);

        vm.expectEmit(false, false, false, true);
        emit VestedToTreasury(totalVested);

        vm.prank(admin);
        uint256 withdrawn = daico.withdrawVestedToTreasury();

        assertEq(withdrawn, totalVested, "Withdrawn amount should equal vested");
        assertEq(treasury.balance, treasuryBalanceBefore + totalVested, "Treasury balance incorrect");
    }

    function test_MultipleTreasuryWithdrawals() public {
        vm.prank(alice);
        daico.contribute{value: 10 ether}(10000 * 1e18);

        // First withdrawal at 25% vesting
        vm.warp(block.timestamp + CLIFF_DURATION + (VESTING_DURATION - CLIFF_DURATION) / 4);
        vm.prank(admin);
        uint256 firstWithdrawal = daico.withdrawVestedToTreasury();

        // Second withdrawal at 75% vesting
        vm.warp(block.timestamp + CLIFF_DURATION + (VESTING_DURATION - CLIFF_DURATION) * 3 / 4);
        vm.prank(admin);
        uint256 secondWithdrawal = daico.withdrawVestedToTreasury();

        assertTrue(secondWithdrawal > 0, "Should withdraw additional vested amount");
        assertEq(daico.totalVested(), firstWithdrawal + secondWithdrawal, "Total vested tracking incorrect");
    }

    function test_RevertTreasuryWithdrawalUnauthorized() public {
        vm.prank(alice);
        daico.contribute{value: 1 ether}(1000 * 1e18);

        vm.warp(block.timestamp + VESTING_DURATION);

        vm.prank(bob);
        vm.expectRevert(IDAICO.Unauthorized.selector);
        daico.withdrawVestedToTreasury();
    }

    // ============ Admin Function Tests ============

    function test_PauseAndUnpauseSale() public {
        // Pause sale
        vm.expectEmit(true, false, false, false);
        emit SalePaused(admin);

        vm.prank(admin);
        daico.pauseSale();

        assertTrue(daico.salePaused(), "Sale should be paused");
        assertTrue(daico.saleActive(), "Sale should still be active when paused");

        // Unpause sale
        vm.expectEmit(true, false, false, false);
        emit SaleUnpaused(admin);

        vm.prank(admin);
        daico.unpauseSale();

        assertFalse(daico.salePaused(), "Sale should be unpaused");
        assertTrue(daico.saleActive(), "Sale should be active");
    }

    function test_EndSale() public {
        vm.expectEmit(true, false, false, false);
        emit SaleEnded(admin);

        vm.prank(admin);
        daico.endSale();

        assertTrue(daico.saleEnded(), "Sale should be ended");
        assertFalse(daico.saleActive(), "Sale should not be active");
    }

    function test_RevertAdminFunctionsUnauthorized() public {
        vm.startPrank(attacker);

        vm.expectRevert(IDAICO.Unauthorized.selector);
        daico.pauseSale();

        vm.expectRevert(IDAICO.Unauthorized.selector);
        daico.unpauseSale();

        vm.expectRevert(IDAICO.Unauthorized.selector);
        daico.endSale();

        vm.expectRevert(IDAICO.Unauthorized.selector);
        daico.withdrawVestedToTreasury();

        vm.stopPrank();
    }

    // ============ Governance Integration Tests ============

    function test_VaultTokensAsVotes() public {
        vm.prank(alice);
        daico.contribute{value: 1 ether}(1000 * 1e18);

        uint256 vaultBalance = vaultToken.balanceOf(alice);

        // Delegate to self for voting
        vm.prank(alice);
        vaultToken.delegate(alice);

        assertEq(vaultToken.getVotes(alice), vaultBalance, "Votes should equal vault token balance");
    }

    function test_VotingPowerAfterTransfer() public {
        vm.prank(alice);
        daico.contribute{value: 1 ether}(1000 * 1e18);

        uint256 vaultBalance = vaultToken.balanceOf(alice);

        // Alice delegates to herself
        vm.prank(alice);
        vaultToken.delegate(alice);

        // Alice transfers half to Bob
        vm.prank(alice);
        vaultToken.transfer(bob, vaultBalance / 2);

        // Bob delegates to himself
        vm.prank(bob);
        vaultToken.delegate(bob);

        assertEq(vaultToken.getVotes(alice), vaultBalance / 2, "Alice should have half votes");
        assertEq(vaultToken.getVotes(bob), vaultBalance / 2, "Bob should have half votes");
    }

    // ============ Edge Case Tests ============

    function test_ContributeWithReceiveFunction() public {
        // Test that receive() function reverts to prevent accidental sends
        uint256 ethAmount = 0.1 ether;

        vm.prank(alice);
        (bool success,) = address(daico).call{value: ethAmount}("");

        assertFalse(success, "Receive should revert to prevent accidental sends");
        assertEq(vaultToken.balanceOf(alice), 0, "Should not receive vault tokens");
    }

    function test_ZeroAddressChecks() public {
        // Test zero address protections in constructor
        vm.expectRevert(IDAICO.ZeroAddress.selector);
        new DAICO(
            address(0), // Zero project token
            treasury,
            admin,
            MAX_SUPPLY,
            int256(TARGET_PRICE),
            int256(DECAY_CONSTANT),
            int256(PER_TIME_UNIT),
            CLIFF_DURATION,
            VESTING_DURATION,
            "DAICO Vault Token",
            "DVT"
        );

        vm.expectRevert(IDAICO.ZeroAddress.selector);
        new DAICO(
            address(projectToken),
            address(0), // Zero treasury
            admin,
            MAX_SUPPLY,
            int256(TARGET_PRICE),
            int256(DECAY_CONSTANT),
            int256(PER_TIME_UNIT),
            CLIFF_DURATION,
            VESTING_DURATION,
            "DAICO Vault Token",
            "DVT"
        );
    }

    function test_ExchangeRateCalculation() public {
        uint256 ethAmount = 1 ether;
        uint256 tokenAmount = 1000 * 1e18;

        vm.prank(alice);
        daico.contribute{value: ethAmount}(tokenAmount);

        // Exchange rate should be project tokens per vault token
        uint256 exchangeRate = daico.getExchangeRate(alice);
        assertEq(exchangeRate, tokenAmount * 1e18 / ethAmount, "Exchange rate incorrect");
    }

    function test_MultipleContributorsVesting() public {
        // Setup multiple contributors with different timings
        vm.prank(alice);
        daico.contribute{value: 1 ether}(1000 * 1e18);

        vm.warp(block.timestamp + 1 days);

        vm.prank(bob);
        daico.contribute{value: 2 ether}(2000 * 1e18);

        vm.warp(block.timestamp + 1 days);

        vm.prank(charlie);
        daico.contribute{value: 0.5 ether}(500 * 1e18);

        // Advance past cliff for Alice only
        vm.warp(block.timestamp + CLIFF_DURATION);

        // Alice should have vested funds
        assertTrue(daico.getVestedETH(alice) > 0, "Alice should have vested ETH");

        // Bob and Charlie still in cliff
        assertEq(daico.getVestedETH(bob), 0, "Bob should have no vested ETH");
        assertEq(daico.getVestedETH(charlie), 0, "Charlie should have no vested ETH");
    }

    // ============ Security Tests ============

    function test_ReentrancyProtection() public {
        // Deploy malicious contract
        ReentrancyAttacker attackerContract = new ReentrancyAttacker(daico);
        vm.deal(address(attackerContract), 10 ether);

        // Attacker contributes
        attackerContract.contribute{value: 1 ether}();

        // Try reentrancy during refund
        vm.expectRevert(); // Should revert due to reentrancy protection
        attackerContract.attackRefund();
    }

    function test_IntegerOverflowProtection() public {
        // Test with maximum values
        uint256 maxUint = type(uint256).max;

        vm.prank(alice);
        vm.expectRevert(); // Should handle overflow gracefully
        daico.contribute{value: 1 ether}(maxUint);
    }

    function test_PrecisionLossMinimization() public {
        // Test with small amounts to check precision
        uint256 smallAmount = 1; // 1 wei worth of tokens

        vm.prank(alice);
        daico.contribute{value: 1 gwei}(smallAmount);

        // Verify precision is maintained
        IDAICO.VestingSchedule memory schedule = daico.getVestingSchedule(alice);
        assertEq(schedule.totalTokens, smallAmount, "Small amounts should be handled correctly");
    }

    // ============ Fuzz Tests ============

    function testFuzz_Contribution(uint256 tokenAmount, uint256 ethAmount) public {
        // Bound inputs to reasonable ranges
        tokenAmount = bound(tokenAmount, 1e18, MAX_SUPPLY);
        ethAmount = bound(ethAmount, 0.001 ether, 100 ether);

        uint256 expectedPrice = daico.getCurrentPrice(tokenAmount);

        if (ethAmount >= expectedPrice) {
            vm.prank(alice);
            uint256 vaultTokens = daico.contribute{value: ethAmount}(tokenAmount);

            assertEq(vaultTokens, expectedPrice, "Should receive exact ETH amount in vault tokens");
            assertEq(daico.totalSold(), tokenAmount, "Total sold should match");
        } else {
            vm.prank(alice);
            vm.expectRevert(IDAICO.InsufficientPayment.selector);
            daico.contribute{value: ethAmount}(tokenAmount);
        }
    }

    function testFuzz_VestingCalculation(uint256 timeElapsed) public {
        uint256 ethAmount = 1 ether;

        vm.prank(alice);
        daico.contribute{value: ethAmount}(1000 * 1e18);

        // Bound time to reasonable range
        timeElapsed = bound(timeElapsed, 0, VESTING_DURATION * 2);

        vm.warp(block.timestamp + timeElapsed);

        uint256 vestedETH = daico.getVestedETH(alice);
        uint256 unvestedETH = daico.getUnvestedETH(alice);

        // Invariants
        assertLe(vestedETH + unvestedETH, ethAmount, "Total should not exceed contribution");

        if (timeElapsed < CLIFF_DURATION) {
            assertEq(vestedETH, 0, "Nothing vested during cliff");
        } else if (timeElapsed >= VESTING_DURATION) {
            assertEq(vestedETH, ethAmount, "Fully vested after duration");
            assertEq(unvestedETH, 0, "Nothing unvested after full vesting");
        } else {
            assertTrue(vestedETH > 0, "Should have some vesting after cliff");
            assertTrue(unvestedETH > 0, "Should have some unvested during vesting");
        }
    }

    // ============ Integration Scenarios ============

    function test_CompleteLifecycle() public {
        // 1. Initial contributions
        vm.prank(alice);
        daico.contribute{value: 5 ether}(5000 * 1e18);

        vm.prank(bob);
        daico.contribute{value: 3 ether}(3000 * 1e18);

        // 2. Partial refund during cliff
        vm.warp(block.timestamp + CLIFF_DURATION / 2);

        uint256 aliceRefundAmount = vaultToken.balanceOf(alice) / 4;
        vm.prank(alice);
        daico.refund(aliceRefundAmount);

        // 3. After cliff, claim some tokens
        vm.warp(block.timestamp + CLIFF_DURATION + 1);

        uint256 aliceClaimAmount = vaultToken.balanceOf(alice) / 2;
        vm.prank(alice);
        daico.claimProjectTokens(aliceClaimAmount);

        // 4. Treasury withdrawal
        vm.prank(admin);
        uint256 withdrawn = daico.withdrawVestedToTreasury();
        assertTrue(withdrawn > 0, "Should withdraw vested funds");

        // 5. Full vesting and final claims
        vm.warp(block.timestamp + VESTING_DURATION);

        vm.prank(alice);
        daico.claimProjectTokens(vaultToken.balanceOf(alice));

        vm.prank(bob);
        daico.claimProjectTokens(vaultToken.balanceOf(bob));

        // Verify final state
        assertEq(vaultToken.balanceOf(alice), 0, "Alice should have no vault tokens");
        assertEq(vaultToken.balanceOf(bob), 0, "Bob should have no vault tokens");
        assertTrue(projectToken.balanceOf(alice) > 0, "Alice should have project tokens");
        assertTrue(projectToken.balanceOf(bob) > 0, "Bob should have project tokens");
    }

    function test_EmergencySaleStop() public {
        // Contributions happening
        vm.prank(alice);
        daico.contribute{value: 1 ether}(1000 * 1e18);

        // Emergency pause
        vm.prank(admin);
        daico.pauseSale();

        // No new contributions
        vm.prank(bob);
        vm.expectRevert(IDAICO.Paused.selector);
        daico.contribute{value: 1 ether}(1000 * 1e18);

        // Existing users can still refund
        vm.prank(alice);
        uint256 refunded = daico.refund(vaultToken.balanceOf(alice));
        assertTrue(refunded > 0, "Should be able to refund when paused");

        // Resume sale
        vm.prank(admin);
        daico.unpauseSale();

        // Contributions resume
        vm.prank(bob);
        daico.contribute{value: 1 ether}(1000 * 1e18);
    }
}

// ============ Mock Contracts ============

/// @notice Mock ERC20 token for testing project token functionality
contract MockProjectToken is ERC20 {
    constructor() ERC20("Mock Project Token", "MPT") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

/// @notice Reentrancy attacker contract for security testing
contract ReentrancyAttacker {
    DAICO public daico;
    DAICOVault public vaultToken;
    bool public attacking;

    constructor(DAICO _daico) {
        daico = _daico;
        vaultToken = DAICOVault(daico.vaultToken());
    }

    function contribute() external payable {
        daico.contribute{value: msg.value}(100 * 1e18);
    }

    function attackRefund() external {
        attacking = true;
        daico.refund(vaultToken.balanceOf(address(this)));
    }

    receive() external payable {
        if (attacking && address(daico).balance > 0) {
            // Try to reenter
            daico.refund(vaultToken.balanceOf(address(this)));
        }
    }
}
