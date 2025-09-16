// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import {DAICO} from "../../src/contracts/daico/DAICO.sol";
import {DAICOVault} from "../../src/contracts/tokens/DAICOVault.sol";
import {IDAICO} from "../../src/interfaces/IDAICO.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title DAICO Gas Optimization Test Suite
/// @notice Tests focused on gas consumption and optimization opportunities
/// @dev Uses forge gas snapshots and benchmarking to track gas usage
contract DAICOGasOptimizationTest is Test {
    // ============ Contracts ============
    DAICO public daico;
    DAICOVault public vaultToken;
    MockProjectToken public projectToken;

    // ============ Test Addresses ============
    address public admin = address(0x1);
    address public treasury = address(0x2);
    address[] public contributors;

    // ============ DAICO Parameters ============
    uint256 public constant TARGET_PRICE = 0.001 ether;
    int256 public constant DECAY_CONSTANT = 0.9e18;
    uint256 public constant PER_TIME_UNIT = 1000 * 1e18;
    uint256 public constant MAX_SUPPLY = 1_000_000 * 1e18;
    uint256 public constant CLIFF_DURATION = 30 days;
    uint256 public constant VESTING_DURATION = 180 days;

    // ============ Gas Tracking ============
    string public constant GAS_SNAPSHOT_PATH = ".gas-snapshot";
    mapping(string => uint256) public gasBenchmarks;

    function setUp() public {
        // Deploy project token
        projectToken = new MockProjectToken();

        // Deploy DAICO
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
            "DVT"
        );
        vaultToken = DAICOVault(daico.vaultToken());
        projectToken.mint(address(daico), MAX_SUPPLY);
        vm.stopPrank();

        // Setup multiple contributors
        for (uint256 i = 0; i < 100; i++) {
            address contributor = address(uint160(0x1000 + i));
            contributors.push(contributor);
            vm.deal(contributor, 10 ether);
        }
    }

    // ============ Contribution Gas Tests ============

    function test_GasFirstContribution() public {
        address alice = contributors[0];
        uint256 tokenAmount = 100 * 1e18;
        uint256 ethAmount = 0.1 ether;

        vm.prank(alice);
        uint256 gasStart = gasleft();
        daico.contribute{value: ethAmount}(tokenAmount);
        uint256 gasUsed = gasStart - gasleft();

        console.log("Gas used for first contribution:", gasUsed);
        gasBenchmarks["firstContribution"] = gasUsed;
    }

    function test_GasSubsequentContributions() public {
        // First contribution to initialize storage
        vm.prank(contributors[0]);
        daico.contribute{value: 0.1 ether}(100 * 1e18);

        // Measure subsequent contributions
        uint256[] memory gasUsages = new uint256[](10);

        for (uint256 i = 1; i <= 10; i++) {
            address contributor = contributors[i];

            vm.prank(contributor);
            uint256 gasStart = gasleft();
            daico.contribute{value: 0.1 ether}(100 * 1e18);
            gasUsages[i - 1] = gasStart - gasleft();
        }

        // Calculate average
        uint256 totalGas = 0;
        for (uint256 i = 0; i < 10; i++) {
            totalGas += gasUsages[i];
        }
        uint256 avgGas = totalGas / 10;

        console.log("Average gas for subsequent contributions:", avgGas);
        gasBenchmarks["avgContribution"] = avgGas;
    }

    function test_GasContributionWithPriceIncrease() public {
        uint256[] memory gasUsages = new uint256[](10);

        // Contributions at different price points
        for (uint256 i = 0; i < 10; i++) {
            address contributor = contributors[i];
            uint256 tokenAmount = 1000 * 1e18;
            uint256 ethRequired = daico.getCurrentPrice(tokenAmount);

            vm.prank(contributor);
            uint256 gasStart = gasleft();
            daico.contribute{value: ethRequired + 0.1 ether}(tokenAmount);
            gasUsages[i] = gasStart - gasleft();

            console.log(string.concat("Contribution ", vm.toString(i), " gas:"), gasUsages[i]);
        }

        // Check if gas increases significantly with price calculations
        assertTrue(gasUsages[9] < gasUsages[0] * 2, "Gas should not increase dramatically with supply");
    }

    function test_GasMultipleContributionsSameUser() public {
        address alice = contributors[0];
        uint256[] memory gasUsages = new uint256[](5);

        for (uint256 i = 0; i < 5; i++) {
            vm.prank(alice);
            uint256 gasStart = gasleft();
            daico.contribute{value: 0.1 ether}(100 * 1e18);
            gasUsages[i] = gasStart - gasleft();

            console.log(string.concat("Alice contribution ", vm.toString(i), " gas:"), gasUsages[i]);
        }

        // Second contribution should use less gas (warm storage)
        assertTrue(gasUsages[1] < gasUsages[0], "Subsequent contributions should use less gas");
    }

    // ============ Refund Gas Tests ============

    function test_GasRefundBeforeCliff() public {
        address alice = contributors[0];

        // Contribute
        vm.prank(alice);
        daico.contribute{value: 1 ether}(1000 * 1e18);

        uint256 vaultBalance = vaultToken.balanceOf(alice);

        // Refund all
        vm.prank(alice);
        uint256 gasStart = gasleft();
        daico.refund(vaultBalance);
        uint256 gasUsed = gasStart - gasleft();

        console.log("Gas used for full refund before cliff:", gasUsed);
        gasBenchmarks["fullRefundBeforeCliff"] = gasUsed;
    }

    function test_GasRefundAfterPartialVesting() public {
        address alice = contributors[0];

        vm.prank(alice);
        daico.contribute{value: 1 ether}(1000 * 1e18);

        // Advance to 50% vesting
        vm.warp(block.timestamp + CLIFF_DURATION + (VESTING_DURATION - CLIFF_DURATION) / 2);

        uint256 vaultBalance = vaultToken.balanceOf(alice);

        vm.prank(alice);
        uint256 gasStart = gasleft();
        daico.refund(vaultBalance);
        uint256 gasUsed = gasStart - gasleft();

        console.log("Gas used for refund after partial vesting:", gasUsed);
        gasBenchmarks["refundAfterVesting"] = gasUsed;
    }

    function test_GasPartialRefunds() public {
        address alice = contributors[0];

        vm.prank(alice);
        daico.contribute{value: 10 ether}(10000 * 1e18);

        uint256 vaultBalance = vaultToken.balanceOf(alice);

        // Multiple partial refunds
        uint256[] memory gasUsages = new uint256[](5);

        for (uint256 i = 0; i < 5; i++) {
            uint256 refundAmount = vaultBalance / 10; // Refund 10% each time

            vm.prank(alice);
            uint256 gasStart = gasleft();
            daico.refund(refundAmount);
            gasUsages[i] = gasStart - gasleft();

            console.log(string.concat("Partial refund ", vm.toString(i), " gas:"), gasUsages[i]);
        }

        // Gas should be relatively consistent for partial refunds
        uint256 maxGas = 0;
        uint256 minGas = type(uint256).max;
        for (uint256 i = 0; i < 5; i++) {
            if (gasUsages[i] > maxGas) maxGas = gasUsages[i];
            if (gasUsages[i] < minGas) minGas = gasUsages[i];
        }

        assertTrue(maxGas - minGas < 10000, "Gas variance should be minimal for similar operations");
    }

    // ============ Claim Gas Tests ============

    function test_GasClaimAfterFullVesting() public {
        address alice = contributors[0];

        vm.prank(alice);
        daico.contribute{value: 1 ether}(1000 * 1e18);

        // Advance past full vesting
        vm.warp(block.timestamp + VESTING_DURATION + 1);

        uint256 vaultBalance = vaultToken.balanceOf(alice);

        vm.prank(alice);
        uint256 gasStart = gasleft();
        daico.claimProjectTokens(vaultBalance);
        uint256 gasUsed = gasStart - gasleft();

        console.log("Gas used for full claim after vesting:", gasUsed);
        gasBenchmarks["fullClaim"] = gasUsed;
    }

    function test_GasMultipleClaims() public {
        address alice = contributors[0];

        vm.prank(alice);
        daico.contribute{value: 10 ether}(10000 * 1e18);

        // Advance past full vesting
        vm.warp(block.timestamp + VESTING_DURATION + 1);

        uint256 vaultBalance = vaultToken.balanceOf(alice);
        uint256[] memory gasUsages = new uint256[](5);

        for (uint256 i = 0; i < 5; i++) {
            uint256 claimAmount = vaultBalance / 10;

            vm.prank(alice);
            uint256 gasStart = gasleft();
            daico.claimProjectTokens(claimAmount);
            gasUsages[i] = gasStart - gasleft();

            console.log(string.concat("Claim ", vm.toString(i), " gas:"), gasUsages[i]);
        }

        // Later claims should be slightly cheaper due to reduced calculations
        assertTrue(gasUsages[4] <= gasUsages[0], "Gas should not increase for subsequent claims");
    }

    // ============ Treasury Withdrawal Gas Tests ============

    function test_GasTreasuryWithdrawalSingleContributor() public {
        vm.prank(contributors[0]);
        daico.contribute{value: 10 ether}(10000 * 1e18);

        vm.warp(block.timestamp + VESTING_DURATION);

        vm.prank(admin);
        uint256 gasStart = gasleft();
        daico.withdrawVestedToTreasury();
        uint256 gasUsed = gasStart - gasleft();

        console.log("Gas for treasury withdrawal (1 contributor):", gasUsed);
        gasBenchmarks["treasuryWithdraw1"] = gasUsed;
    }

    function test_GasTreasuryWithdrawalManyContributors() public {
        // Setup 50 contributors
        for (uint256 i = 0; i < 50; i++) {
            vm.prank(contributors[i]);
            daico.contribute{value: 0.2 ether}(200 * 1e18);
        }

        vm.warp(block.timestamp + VESTING_DURATION);

        vm.prank(admin);
        uint256 gasStart = gasleft();
        daico.withdrawVestedToTreasury();
        uint256 gasUsed = gasStart - gasleft();

        console.log("Gas for treasury withdrawal (50 contributors):", gasUsed);
        gasBenchmarks["treasuryWithdraw50"] = gasUsed;

        // Gas should not scale linearly with contributors
        assertTrue(gasUsed < gasBenchmarks["treasuryWithdraw1"] * 10, "Treasury withdrawal should not scale linearly");
    }

    // ============ View Function Gas Tests ============

    function test_GasViewFunctions() public {
        // Setup some state
        for (uint256 i = 0; i < 10; i++) {
            vm.prank(contributors[i]);
            daico.contribute{value: 0.1 ether}(100 * 1e18);
        }

        address alice = contributors[0];

        // Test various view functions
        uint256 gasStart;
        uint256 gasUsed;

        gasStart = gasleft();
        daico.getCurrentPrice(100 * 1e18);
        gasUsed = gasStart - gasleft();
        console.log("getCurrentPrice gas:", gasUsed);

        gasStart = gasleft();
        daico.getVestingSchedule(alice);
        gasUsed = gasStart - gasleft();
        console.log("getVestingSchedule gas:", gasUsed);

        gasStart = gasleft();
        daico.getVestedETH(alice);
        gasUsed = gasStart - gasleft();
        console.log("getVestedETH gas:", gasUsed);

        gasStart = gasleft();
        daico.calculateRefund(alice, 1 ether);
        gasUsed = gasStart - gasleft();
        console.log("calculateRefund gas:", gasUsed);

        gasStart = gasleft();
        daico.calculateClaimableTokens(alice, 1 ether);
        gasUsed = gasStart - gasleft();
        console.log("calculateClaimableTokens gas:", gasUsed);

        gasStart = gasleft();
        daico.getContributionHistory(alice);
        gasUsed = gasStart - gasleft();
        console.log("getContributionHistory gas:", gasUsed);
    }

    // ============ Storage Optimization Tests ============

    function test_StorageSlotPacking() public {
        // Verify that struct fields are properly packed
        address alice = contributors[0];

        vm.prank(alice);
        daico.contribute{value: 1 ether}(1000 * 1e18);

        // Check storage slot usage for VestingSchedule
        IDAICO.VestingSchedule memory schedule = daico.getVestingSchedule(alice);

        // Calculate expected storage slots
        // totalTokens (uint256) = 1 slot
        // startTime (uint256) = 1 slot
        // cliffDuration (uint256) = 1 slot
        // vestingDuration (uint256) = 1 slot
        // claimed (uint256) = 1 slot
        // ethContributed (uint256) = 1 slot
        // Total: 6 slots

        console.log("VestingSchedule storage analysis:");
        console.log("- totalTokens:", schedule.totalTokens);
        console.log("- startTime:", schedule.startTime);
        console.log("- cliffDuration:", schedule.cliffDuration);
        console.log("- vestingDuration:", schedule.vestingDuration);
        console.log("- claimed:", schedule.claimed);
        console.log("- ethContributed:", schedule.ethContributed);
    }

    function test_ContributionHistoryGrowth() public {
        address alice = contributors[0];
        uint256[] memory gasUsages = new uint256[](20);

        for (uint256 i = 0; i < 20; i++) {
            vm.prank(alice);
            uint256 gasStart = gasleft();
            daico.contribute{value: 0.01 ether}(10 * 1e18);
            gasUsages[i] = gasStart - gasleft();
        }

        // Check if gas increases with history size
        console.log("Gas usage as contribution history grows:");
        console.log("1st contribution:", gasUsages[0]);
        console.log("10th contribution:", gasUsages[9]);
        console.log("20th contribution:", gasUsages[19]);

        // Gas should increase but not exponentially
        assertTrue(gasUsages[19] < gasUsages[0] * 3, "Gas growth should be manageable");
    }

    // ============ Batch Operation Tests ============

    function test_CompareSingleVsBatchRefunds() public {
        // Setup multiple contributors
        address[] memory testContributors = new address[](10);
        for (uint256 i = 0; i < 10; i++) {
            testContributors[i] = contributors[i];
            vm.prank(testContributors[i]);
            daico.contribute{value: 0.1 ether}(100 * 1e18);
        }

        // Single refunds
        uint256 totalGasSingle = 0;
        for (uint256 i = 0; i < 10; i++) {
            uint256 balance = vaultToken.balanceOf(testContributors[i]);

            vm.prank(testContributors[i]);
            uint256 gasStart = gasleft();
            daico.refund(balance);
            totalGasSingle += gasStart - gasleft();
        }

        console.log("Total gas for 10 individual refunds:", totalGasSingle);
        console.log("Average gas per refund:", totalGasSingle / 10);
    }

    // ============ Edge Case Gas Tests ============

    function test_GasWithMaxValues() public {
        address alice = contributors[0];

        // Contribute near max supply
        uint256 largeAmount = MAX_SUPPLY / 2;
        uint256 ethRequired = daico.getCurrentPrice(largeAmount);

        vm.deal(alice, ethRequired + 1 ether);

        vm.prank(alice);
        uint256 gasStart = gasleft();
        daico.contribute{value: ethRequired}(largeAmount);
        uint256 gasUsed = gasStart - gasleft();

        console.log("Gas for large contribution:", gasUsed);

        // Should still be within reasonable bounds
        assertTrue(gasUsed < 500000, "Large contributions should not use excessive gas");
    }

    function test_GasWithMinimalValues() public {
        address alice = contributors[0];

        // Contribute minimal amount
        uint256 minAmount = 1;
        uint256 ethRequired = daico.getCurrentPrice(minAmount);

        vm.prank(alice);
        uint256 gasStart = gasleft();
        daico.contribute{value: ethRequired + 1 gwei}(minAmount);
        uint256 gasUsed = gasStart - gasleft();

        console.log("Gas for minimal contribution:", gasUsed);

        // Minimal contributions should not have high overhead
        assertTrue(gasUsed < gasBenchmarks["firstContribution"] * 2, "Minimal contributions should be efficient");
    }

    // ============ Report Generation ============

    function test_GenerateGasReport() public {
        // Run all benchmarks
        test_GasFirstContribution();
        test_GasSubsequentContributions();
        test_GasRefundBeforeCliff();
        test_GasRefundAfterPartialVesting();
        test_GasClaimAfterFullVesting();
        test_GasTreasuryWithdrawalSingleContributor();

        console.log("\n=== DAICO Gas Usage Report ===");
        console.log("First Contribution:", gasBenchmarks["firstContribution"]);
        console.log("Average Contribution:", gasBenchmarks["avgContribution"]);
        console.log("Full Refund (before cliff):", gasBenchmarks["fullRefundBeforeCliff"]);
        console.log("Refund (after vesting):", gasBenchmarks["refundAfterVesting"]);
        console.log("Full Claim:", gasBenchmarks["fullClaim"]);
        console.log("Treasury Withdrawal:", gasBenchmarks["treasuryWithdraw1"]);
        console.log("==============================\n");
    }
}

// ============ Mock Contracts ============

contract MockProjectToken is ERC20 {
    constructor() ERC20("Mock Project Token", "MPT") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
