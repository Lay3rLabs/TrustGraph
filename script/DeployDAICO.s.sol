// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {stdJson} from "forge-std/StdJson.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {console} from "forge-std/console.sol";
import {IWavsServiceManager} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceManager.sol";

import {Common} from "script/Common.s.sol";
import {DAICO} from "contracts/daico/DAICO.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @dev Deployment script for DAICO contract
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

        // VRGDA Configuration
        uint256 maxSupply = 100_000_000e18; // 100M tokens total
        int256 targetPrice = 0.001 ether; // Starting price: 0.001 ETH per token
        int256 priceDecayPercent = 0.1e18; // 10% daily price decay
        int256 timeScale = 30e18; // 30 day time scale for logistic curve

        // Vesting Configuration
        uint256 cliffDuration = 90 days; // 3 month cliff
        uint256 vestingDuration = 365 days; // 1 year total vesting

        // Vault Token Configuration
        string memory vaultName = "DAICO Vault Token";
        string memory vaultSymbol = "DVT";

        console.log("Deploying DAICO contract...");
        console.log("Token:", token);
        console.log("Treasury:", treasury);
        console.log("Admin:", admin);
        console.log("Max Supply:", maxSupply / 1e18);

        vm.startBroadcast(_privateKey);

        DAICO daicoInstance = new DAICO(
            token,
            treasury,
            admin,
            maxSupply,
            targetPrice,
            priceDecayPercent,
            timeScale,
            cliffDuration,
            vestingDuration,
            vaultName,
            vaultSymbol
        );

        vm.stopBroadcast();

        console.log("DAICO deployed at:", address(daicoInstance));
        console.log("");
        console.log("IMPORTANT: Treasury must approve DAICO to transfer tokens:");
        console.log("  token.approve(DAICO, maxSupply)");

        // Log deployment summary
        console.log("\n=== DAICO Deployment Summary ===");
        console.log("DAICO:", address(daicoInstance));
        console.log("Sale started at:", daicoInstance.saleStartTime());

        string memory _json = "json";
        string memory finalJson = _json.serialize("daico", Strings.toChecksumHexString(address(daicoInstance)));

        vm.writeFile(script_output_path, finalJson);
    }
}
