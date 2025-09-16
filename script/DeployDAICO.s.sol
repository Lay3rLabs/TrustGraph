// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {stdJson} from "forge-std/StdJson.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {console} from "forge-std/console.sol";
import {IWavsServiceManager} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceManager.sol";

import {Common} from "script/Common.s.sol";
import {DAICO} from "contracts/daico/DAICO.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title DeployDAICO
/// @notice Deployment script for DAICO contract with polynomial bonding curve
/// @dev Configures and deploys a DAICO with various pricing strategies via environment variables
contract DeployScript is Common {
    using stdJson for string;

    string public root = vm.projectRoot();
    string public script_output_path = string.concat(root, "/.docker/daico_deploy.json");

    /**
     * @dev Deploys the DAICO contract and writes the results to a JSON file
     * @param serviceManagerAddr The address of the service manager
     */
    function run(string calldata serviceManagerAddr) public {
        address serviceManager = vm.parseAddress(serviceManagerAddr);

        // Get configuration from environment variables
        address token = vm.envOr("DAICO_TOKEN", address(0));
        address treasury = vm.envOr("DAICO_TREASURY", address(0));
        address admin = vm.envOr("DAICO_ADMIN", vm.addr(_privateKey));

        // If no token address provided, you'll need to deploy or specify one
        require(token != address(0), "Token address required");
        require(treasury != address(0), "Treasury address required");

        // Token sale configuration
        uint256 maxSupply = vm.envOr("DAICO_MAX_SUPPLY", uint256(100_000_000e18)); // Default: 100M tokens
        uint256 saleDuration = vm.envOr("DAICO_SALE_DURATION", uint256(90 days)); // Default: 90 days

        // Calculate target velocity (tokens per second)
        uint256 targetVelocity = maxSupply / saleDuration;

        // Pace adjustment factor (default: 50% = moderate adjustments)
        uint256 paceAdjustmentFactor = vm.envOr("DAICO_PACE_ADJUSTMENT", uint256(0.5e18));

        // Vesting Configuration
        uint256 cliffDuration = vm.envOr("DAICO_CLIFF_DURATION", uint256(30 days)); // Default: 30 days
        uint256 vestingDuration = vm.envOr("DAICO_VESTING_DURATION", uint256(365 days)); // Default: 1 year

        // Vault Token Configuration
        string memory vaultName = vm.envOr("DAICO_VAULT_NAME", string("Vested DAICO Token"));
        string memory vaultSymbol = vm.envOr("DAICO_VAULT_SYMBOL", string("vDAICO"));

        // Configure polynomial bonding curve based on environment variable
        string memory curveType = vm.envOr("DAICO_CURVE_TYPE", string("quadratic"));
        uint256[4] memory polynomialCoefficients = configureCurve(curveType);

        console.log("Deploying DAICO contract...");
        console.log("Token:", token);
        console.log("Treasury:", treasury);
        console.log("Admin:", admin);
        console.log("Max Supply:", maxSupply / 1e18);
        console.log("Sale Duration:", saleDuration / 1 days, "days");
        console.log("Target Velocity:", targetVelocity);
        console.log("Curve Type:", curveType);

        vm.startBroadcast(_privateKey);

        DAICO daicoInstance = new DAICO(
            token,
            treasury,
            admin,
            maxSupply,
            targetVelocity,
            paceAdjustmentFactor,
            polynomialCoefficients,
            cliffDuration,
            vestingDuration,
            vaultName,
            vaultSymbol
        );

        // Fund DAICO with project tokens from treasury
        IERC20(token).transferFrom(treasury, address(daicoInstance), maxSupply);

        vm.stopBroadcast();

        console.log("\n=== DAICO Deployment Summary ===");
        console.log("DAICO deployed at:", address(daicoInstance));
        console.log("Vault Token:", address(daicoInstance.vaultToken()));
        console.log("");

        // Log pricing info
        console.log("Pricing Information:");
        console.log("Starting price (1 token):", daicoInstance.getCurrentPrice(1e18));
        console.log("Price at 10% sold:", daicoInstance.getQuoteAtSupply(1e18, maxSupply / 10));
        console.log("Price at 50% sold:", daicoInstance.getQuoteAtSupply(1e18, maxSupply / 2));
        console.log("Price at 90% sold:", daicoInstance.getQuoteAtSupply(1e18, (maxSupply * 9) / 10));

        // Write deployment info to JSON
        string memory _json = "json";
        vm.serializeAddress(_json, "daico", address(daicoInstance));
        vm.serializeAddress(_json, "vaultToken", address(daicoInstance.vaultToken()));
        vm.serializeAddress(_json, "token", token);
        vm.serializeAddress(_json, "treasury", treasury);
        vm.serializeAddress(_json, "admin", admin);
        vm.serializeUint(_json, "maxSupply", maxSupply);
        vm.serializeUint(_json, "targetVelocity", targetVelocity);
        vm.serializeUint(_json, "saleStartTime", daicoInstance.saleStartTime());
        vm.serializeString(_json, "curveType", curveType);
        string memory finalJson = vm.serializeAddress(_json, "serviceManager", serviceManager);

        vm.writeFile(script_output_path, finalJson);

        console.log("\nDeployment info written to:", script_output_path);
    }

    /// @notice Configure bonding curve based on type
    /// @param curveType The type of curve to configure
    /// @return coefficients The polynomial coefficients for the curve
    function configureCurve(string memory curveType) internal pure returns (uint256[4] memory coefficients) {
        if (keccak256(bytes(curveType)) == keccak256(bytes("linear"))) {
            return configureLinearGrowthCurve();
        } else if (keccak256(bytes(curveType)) == keccak256(bytes("s-curve"))) {
            return configureSCurve();
        } else if (keccak256(bytes(curveType)) == keccak256(bytes("early-bird"))) {
            return configureEarlyBirdCurve();
        } else {
            // Default to quadratic
            return configureQuadraticGrowthCurve();
        }
    }

    /// @notice Configure a quadratic growth curve (steady acceleration)
    /// @dev Starts at 0.001 ETH and grows to ~0.1 ETH at max supply
    function configureQuadraticGrowthCurve() internal pure returns (uint256[4] memory) {
        uint256[4] memory coefficients;

        // a0: Starting price of 0.001 ETH per token
        coefficients[0] = 0.001 ether;

        // a1: Small linear growth component (0.000001 ETH per token)
        coefficients[1] = 1e12; // 1e12 / 1e18 = 0.000001

        // a2: Primary quadratic growth (creates acceleration)
        // At 100M tokens: adds ~0.09 ETH to price
        coefficients[2] = 9e9; // 9e9 * (100e6)^2 / 1e36 ≈ 0.09

        // a3: No cubic term for simple quadratic curve
        coefficients[3] = 0;

        return coefficients;
    }

    /// @notice Configure an S-curve (slow-fast-slow growth)
    /// @dev Natural adoption curve that starts slow, accelerates, then tapers
    function configureSCurve() internal pure returns (uint256[4] memory) {
        uint256[4] memory coefficients;

        // a0: Very low starting price to encourage early adoption
        coefficients[0] = 0.0001 ether;

        // a1: No linear component
        coefficients[1] = 0;

        // a2: Strong quadratic component for middle growth
        coefficients[2] = 2e11;

        // a3: Negative cubic to create tapering effect
        coefficients[3] = type(uint256).max - 1e6 + 1; // -1e6 in two's complement

        return coefficients;
    }

    /// @notice Configure a linear growth curve (constant price increase)
    /// @dev Simple and predictable pricing
    function configureLinearGrowthCurve() internal pure returns (uint256[4] memory) {
        uint256[4] memory coefficients;

        // a0: Starting price of 0.01 ETH
        coefficients[0] = 0.01 ether;

        // a1: Linear growth to reach 0.1 ETH at max supply
        // (0.1 - 0.01) / 100e6 = 9e-10 ETH per token
        coefficients[1] = 9e8; // 9e8 / 1e18 = 9e-10

        // a2: No quadratic component
        coefficients[2] = 0;

        // a3: No cubic component
        coefficients[3] = 0;

        return coefficients;
    }

    /// @notice Configure an aggressive early bird curve
    /// @dev High initial price that decreases, then increases again
    function configureEarlyBirdCurve() internal pure returns (uint256[4] memory) {
        uint256[4] memory coefficients;

        // a0: Start at relatively high price
        coefficients[0] = 0.05 ether;

        // a1: Negative linear creates initial price decrease
        coefficients[1] = type(uint256).max - 3e12 + 1; // -3e12 in two's complement

        // a2: Quadratic takes over to create price increase
        coefficients[2] = 5e10;

        // a3: Small cubic for fine-tuning
        coefficients[3] = 1e6;

        return coefficients;
    }
}
