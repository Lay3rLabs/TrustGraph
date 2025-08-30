// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {POAServiceManager} from "../src/contracts/wavs/POAServiceManager.sol";
import {Vm} from "forge-std/Vm.sol";

/**
 * @title DeployPOAServiceManager
 * @notice Deployment script for the POAServiceManager (POAServiceManager) contract
 * @dev Run with: forge script contracts/script/DeployPOAServiceManager.s.sol --rpc-url <RPC_URL> --broadcast
 */
contract DeployPOAServiceManager is Script {
    /// @notice The deployed poaServiceManager contract
    POAServiceManager public poaServiceManager;

    /// @notice Initial operators to whitelist with their weights
    struct InitialOperator {
        address operator;
        uint256 weight;
    }

    function run() external {
        // Get the private key from environment or use default anvil key
        uint256 deployerPrivateKey =
            vm.envOr("FUNDED_KEY", uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80));

        // Get deployer address
        address deployer = vm.addr(deployerPrivateKey);
        console2.log("Deploying POAServiceManager with deployer:", deployer);

        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        // Deploy the POAServiceManager contract
        poaServiceManager = new POAServiceManager();
        console2.log("POAServiceManager deployed at:", address(poaServiceManager));

        // Set service URI (optional)
        string memory serviceURI = vm.envOr("SERVICE_URI", string(""));
        if (bytes(serviceURI).length > 0) {
            poaServiceManager.setServiceURI(serviceURI);
            console2.log("Service URI set to:", serviceURI);
        }

        // Set custom quorum threshold if provided (default is 2/3)
        uint256 quorumNumerator = vm.envOr("QUORUM_NUMERATOR", uint256(2));
        uint256 quorumDenominator = vm.envOr("QUORUM_DENOMINATOR", uint256(3));
        if (quorumNumerator != 2 || quorumDenominator != 3) {
            poaServiceManager.setQuorumThreshold(quorumNumerator, quorumDenominator);
            console2.log("Quorum threshold set to:", quorumNumerator, "/", quorumDenominator);
        }

        // Whitelist initial operators if provided
        address[] memory operators = _getInitialOperators();
        uint256[] memory weights = _getInitialWeights();

        if (operators.length > 0) {
            require(operators.length == weights.length, "Operators and weights length mismatch");

            for (uint256 i = 0; i < operators.length; i++) {
                if (operators[i] != address(0) && weights[i] > 0) {
                    poaServiceManager.whitelistOperator(operators[i], weights[i]);
                    console2.log("Whitelisted operator:", operators[i], "with weight:", weights[i]);
                }
            }
        }

        // Stop broadcasting
        vm.stopBroadcast();

        // Save deployment info to JSON file
        _saveDeploymentInfo();

        // Log deployment summary
        _logDeploymentSummary();
    }

    /**
     * @notice Get initial operators from environment variables
     * @return operators Array of operator addresses
     */
    function _getInitialOperators() internal view returns (address[] memory) {
        // Try to get operators from environment
        // Format: OPERATORS=0xaddr1,0xaddr2,0xaddr3
        string memory operatorsStr = vm.envOr("OPERATORS", string(""));

        if (bytes(operatorsStr).length == 0) {
            return new address[](0);
        }

        // Parse comma-separated addresses (simplified - in production use a proper parser)
        // For now, return empty array - implement parsing if needed
        return new address[](0);
    }

    /**
     * @notice Get initial weights from environment variables
     * @return weights Array of operator weights
     */
    function _getInitialWeights() internal view returns (uint256[] memory) {
        // Try to get weights from environment
        // Format: WEIGHTS=100,100,100
        string memory weightsStr = vm.envOr("WEIGHTS", string(""));

        if (bytes(weightsStr).length == 0) {
            return new uint256[](0);
        }

        // Parse comma-separated weights (simplified - in production use a proper parser)
        // For now, return empty array - implement parsing if needed
        return new uint256[](0);
    }

    /**
     * @notice Save deployment information to JSON file
     */
    function _saveDeploymentInfo() internal {
        // Create the deployment info JSON
        string memory json = "deployment";

        // Add contract address
        vm.serializeAddress(json, "contract", address(poaServiceManager));

        // Add owner
        vm.serializeAddress(json, "owner", poaServiceManager.owner());

        // Add quorum settings
        vm.serializeUint(json, "quorumNumerator", poaServiceManager.quorumNumerator());
        vm.serializeUint(json, "quorumDenominator", poaServiceManager.quorumDenominator());

        // Add service URI
        vm.serializeString(json, "serviceURI", poaServiceManager.getServiceURI());

        // Add deployment block and timestamp
        vm.serializeUint(json, "deploymentBlock", block.number);
        vm.serializeUint(json, "deploymentTimestamp", block.timestamp);

        // Add chain ID
        string memory finalJson = vm.serializeUint(json, "chainId", block.chainid);

        // Write the JSON to file in ../.docker directory (relative to contracts folder)
        string memory filePath = string.concat(vm.projectRoot(), "/.docker/poa_sm_deploy.json");
        vm.writeJson(finalJson, filePath);

        console2.log("Deployment info saved to:", filePath);
    }

    /**
     * @notice Log deployment summary
     */
    function _logDeploymentSummary() internal view {
        console2.log("\n========== Deployment Summary ==========");
        console2.log("POAServiceManager:", address(poaServiceManager));
        console2.log("Owner:", poaServiceManager.owner());
        console2.log("Quorum Numerator:", poaServiceManager.quorumNumerator());
        console2.log("Quorum Denominator:", poaServiceManager.quorumDenominator());

        string memory uri = poaServiceManager.getServiceURI();
        if (bytes(uri).length > 0) {
            console2.log("Service URI:", uri);
        }
        console2.log("========================================\n");
    }
}
