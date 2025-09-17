// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {VestingAllocationFactory} from "@metalex-tech/metavest/VestingAllocationFactory.sol";
import {TokenOptionFactory} from "@metalex-tech/metavest/TokenOptionFactory.sol";
import {RestrictedTokenFactory} from "@metalex-tech/metavest/RestrictedTokenFactory.sol";
import {MetaVesTFactory} from "@metalex-tech/metavest/MetaVesTFactory.sol";
import {metavestController} from "@metalex-tech/metavest/MetaVesTController.sol";
import {BaseAllocation} from "@metalex-tech/metavest/BaseAllocation.sol";

contract MetaVestDeployment is Script {
    // Structure to hold vesting configuration from JSON
    struct VestingConfig {
        address grantee;
        uint256 totalAmount;
        uint256 vestingCliff;
        uint256 unlockCliff;
        uint256 vestingDuration; // in seconds
        uint256 unlockDuration; // in seconds
        uint256 startTime; // 0 means current block timestamp
        string category; // "investor", "team", "advisor", etc.
    }

    // Deployed contract addresses
    address public vestingFactory;
    address public tokenOptionFactory;
    address public restrictedTokenFactory;
    address public metaVestFactory;
    address public metaVestController;

    // Configuration
    address public authority;
    address public dao;
    address public tokenAddress;

    function run() external {
        // Load configuration from environment
        uint256 deployerPrivateKey = vm.envUint("FUNDED_KEY");
        authority = vm.addr(deployerPrivateKey);
        dao = vm.envOr("DAO_ADDRESS", authority); // Default to authority if no DAO
        tokenAddress = vm.envAddress("TOKEN_ADDRESS");

        console.log("Deploying MetaVest Framework");
        console.log("Authority:", authority);
        console.log("DAO:", dao);
        console.log("Token:", tokenAddress);

        vm.startBroadcast(deployerPrivateKey);

        // Step 1: Deploy all factory contracts
        deployFactories();

        // Step 2: Deploy MetaVest controller
        deployController();

        // Step 3: Ensure sufficient token balance
        ensureSufficientTokens();

        // Step 4: Load and create vesting allocations
        createVestingAllocations();

        vm.stopBroadcast();

        // Log deployment summary
        logDeploymentSummary();
    }

    function deployFactories() internal {
        console.log("\n=== Deploying Factory Contracts ===");

        vestingFactory = address(new VestingAllocationFactory());
        console.log("VestingAllocationFactory deployed at:", vestingFactory);

        tokenOptionFactory = address(new TokenOptionFactory());
        console.log("TokenOptionFactory deployed at:", tokenOptionFactory);

        restrictedTokenFactory = address(new RestrictedTokenFactory());
        console.log("RestrictedTokenFactory deployed at:", restrictedTokenFactory);

        metaVestFactory = address(new MetaVesTFactory());
        console.log("MetaVesTFactory deployed at:", metaVestFactory);
    }

    function deployController() internal {
        console.log("\n=== Deploying MetaVest Controller ===");

        metaVestController = MetaVesTFactory(metaVestFactory).deployMetavestAndController(
            authority,
            dao,
            vestingFactory,
            tokenOptionFactory,
            restrictedTokenFactory
        );

        console.log("MetaVestController deployed at:", metaVestController);
    }

    function ensureSufficientTokens() internal {
        console.log("\n=== Ensuring Sufficient Token Balance ===");

        // Read JSON file to calculate total needed
        string memory root = vm.projectRoot();
        string memory path = string.concat(root, "/script-metavest/data/vesting_allocations.json");
        string memory json = vm.readFile(path);
        
        // Calculate total amount needed
        uint256 totalNeeded = 0;
        uint256 allocationCount = 0;
        for (uint256 i = 0; i < 100; i++) { // Max 100 allocations
            try vm.parseJsonUint(json, string.concat(".allocations[", vm.toString(i), "].totalAmount")) returns (uint256 amount) {
                totalNeeded += amount;
                allocationCount++;
            } catch {
                break;
            }
        }

        console.log("Total tokens needed:", totalNeeded);
        console.log("For", allocationCount, "allocations");

        // Check current balance
        uint256 currentBalance = IERC20(tokenAddress).balanceOf(authority);
        console.log("Current balance:", currentBalance);

        if (currentBalance < totalNeeded) {
            uint256 toMint = totalNeeded - currentBalance;
            console.log("Minting additional tokens:", toMint);
            
            // Mint tokens (assuming the token has a mint function and authority can mint)
            (bool success,) = tokenAddress.call(abi.encodeWithSignature("mint(address,uint256)", authority, toMint));
            if (!success) {
                console.log("Warning: Could not mint tokens. Ensure sufficient balance manually.");
            } else {
                console.log("Successfully minted tokens");
            }
        } else {
            console.log("Sufficient tokens available");
        }
    }

    function createVestingAllocations() internal {
        console.log("\n=== Creating Vesting Allocations ===");

        // Read JSON file
        string memory root = vm.projectRoot();
        string memory path = string.concat(root, "/script-metavest/data/vesting_allocations.json");
        string memory json = vm.readFile(path);
        
        // Parse allocations array - start with a reasonable upper bound and find actual length
        uint256 allocationCount = 0;
        for (uint256 i = 0; i < 100; i++) { // Max 100 allocations
            try vm.parseJsonAddress(json, string.concat(".allocations[", vm.toString(i), "].grantee")) {
                allocationCount++;
            } catch {
                break;
            }
        }
        console.log("Found", allocationCount, "allocations to process");

        // Process each allocation
        for (uint256 i = 0; i < allocationCount; i++) {
            string memory key = string.concat(".allocations[", vm.toString(i), "]");
            
            VestingConfig memory config;
            config.grantee = vm.parseJsonAddress(json, string.concat(key, ".grantee"));
            config.totalAmount = vm.parseJsonUint(json, string.concat(key, ".totalAmount"));
            config.vestingCliff = vm.parseJsonUint(json, string.concat(key, ".vestingCliff"));
            config.unlockCliff = vm.parseJsonUint(json, string.concat(key, ".unlockCliff"));
            config.vestingDuration = vm.parseJsonUint(json, string.concat(key, ".vestingDuration"));
            config.unlockDuration = vm.parseJsonUint(json, string.concat(key, ".unlockDuration"));
            config.startTime = vm.parseJsonUint(json, string.concat(key, ".startTime"));
            config.category = vm.parseJsonString(json, string.concat(key, ".category"));

            console.log("Processing allocation", i + 1, "of", allocationCount);
            createSingleVestingAllocation(config);
        }
        
        console.log("All vesting allocations created successfully");
    }

    function createSingleVestingAllocation(VestingConfig memory config) internal {
        console.log("\nCreating vesting for:", config.grantee);
        console.log("  Category:", config.category);
        console.log("  Amount:", config.totalAmount);

        // Calculate vesting and unlock rates
        uint160 vestingRate = 0;
        uint160 unlockRate = 0;

        if (config.vestingDuration > 0) {
            vestingRate = uint160((config.totalAmount - config.vestingCliff) / config.vestingDuration);
        }

        if (config.unlockDuration > 0) {
            unlockRate = uint160((config.totalAmount - config.unlockCliff) / config.unlockDuration);
        }

        // Use current timestamp if startTime is 0
        uint48 startTime = config.startTime == 0 ? uint48(block.timestamp) : uint48(config.startTime);

        // Create allocation struct
        BaseAllocation.Allocation memory allocation = BaseAllocation.Allocation({
            tokenContract: tokenAddress,
            tokenStreamTotal: config.totalAmount,
            vestingCliffCredit: uint128(config.vestingCliff),
            unlockingCliffCredit: uint128(config.unlockCliff),
            vestingRate: vestingRate,
            vestingStartTime: startTime,
            unlockRate: unlockRate,
            unlockStartTime: startTime
        });

        // Create empty milestones array (can be added later)
        BaseAllocation.Milestone[] memory milestones = new BaseAllocation.Milestone[](0);

        // Approve tokens for the controller
        IERC20(tokenAddress).approve(metaVestController, config.totalAmount);

        // Create the vesting allocation
        address vestingContract = metavestController(metaVestController).createMetavest(
            metavestController.metavestType.Vesting, // Vesting = 0
            config.grantee,
            allocation,
            milestones,
            0, // exercisePrice (not used for vesting)
            address(0), // paymentToken (not used for vesting)
            0, // shortStopDuration (not used for vesting)
            0  // longStopDate (not used for vesting)
        );

        console.log("  Vesting contract created at:", vestingContract);
    }

    function logDeploymentSummary() internal view {
        console.log("\n=== Deployment Summary ===");
        console.log("VestingAllocationFactory:", vestingFactory);
        console.log("TokenOptionFactory:", tokenOptionFactory);
        console.log("RestrictedTokenFactory:", restrictedTokenFactory);
        console.log("MetaVesTFactory:", metaVestFactory);
        console.log("MetaVestController:", metaVestController);
        console.log("\nSave these addresses for future reference!");
    }
}
