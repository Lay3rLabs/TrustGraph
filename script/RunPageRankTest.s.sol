// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {DeployEAS} from "./DeployEAS.s.sol";
import {PageRankTest} from "./PageRankTest.s.sol";
import {Common} from "./Common.s.sol";

/// @title RunPageRankTest
/// @notice Simple script to deploy EAS system and run PageRank test network
/// @dev This script provides an easy way to set up a complete test environment
///      for PageRank algorithm testing with realistic attestation patterns
contract RunPageRankTest is Common {
    /// @notice Run the complete PageRank test setup
    /// @dev This will deploy EAS contracts and create test attestation network
    /// @param wavsServiceManagerAddr The WAVS service manager address (use mock for testing)
    function run(string memory wavsServiceManagerAddr) public {
        console.log("=== Starting PageRank Test Setup ===");

        // Step 1: Deploy EAS system
        console.log("Step 1: Deploying EAS system...");
        DeployEAS deployer = new DeployEAS();
        DeployEAS.EASDeployment memory deployment = deployer.run(
            wavsServiceManagerAddr
        );

        console.log("EAS deployment complete!");
        console.log("- EAS:", deployment.eas);
        console.log("- Attester:", deployment.attester);
        console.log("- SchemaRegistry:", deployment.schemaRegistry);

        // Step 2: Run PageRank test
        console.log("\nStep 2: Creating PageRank test network...");
        PageRankTest testRunner = new PageRankTest();
        testRunner.run(
            deployment.eas,
            deployment.attester,
            deployment.basicSchema,
            deployment.likeSchema,
            deployment.vouchingSchema,
            deployment.statementSchema
        );

        console.log("\n=== PageRank Test Setup Complete ===");
        console.log("Your test network is ready!");
        console.log("\nNext steps:");
        console.log("1. Start your WAVS services:");
        console.log("   make start-all-local");
        console.log("2. Deploy and run the rewards component:");
        console.log("   make wasi-build");
        console.log(
            "   # Check components/rewards/ for PageRank implementation"
        );
        console.log("3. Monitor attestations and PageRank scores");

        _logContractAddresses(deployment);
    }

    /// @notice Run with mock service manager for testing
    /// @dev Uses a simple mock address for local testing
    function runWithMock() public {
        // Use a deterministic mock address
        address mockServiceManager = address(
            0x1234567890123456789012345678901234567890
        );
        run(vm.toString(mockServiceManager));
    }

    /// @notice Log important contract addresses for reference
    function _logContractAddresses(
        DeployEAS.EASDeployment memory deployment
    ) internal pure {
        console.log("\n=== Contract Addresses for Reference ===");
        console.log("EAS:", deployment.eas);
        console.log("SchemaRegistry:", deployment.schemaRegistry);
        console.log("Attester:", deployment.attester);
        console.log("SchemaRegistrar:", deployment.schemaRegistrar);
        console.log("Indexer:", deployment.indexer);
        console.log("IndexerResolver:", deployment.indexerResolver);
        console.log("EASAttestTrigger:", deployment.easAttestTrigger);

        console.log("\n=== Schema IDs ===");
        console.log("Basic Schema:", vm.toString(deployment.basicSchema));
        console.log("Compute Schema:", vm.toString(deployment.computeSchema));
        console.log(
            "Statement Schema:",
            vm.toString(deployment.statementSchema)
        );
        console.log("IsTrue Schema:", vm.toString(deployment.isTrueSchema));
        console.log("Like Schema:", vm.toString(deployment.likeSchema));
        console.log("Vouching Schema:", vm.toString(deployment.vouchingSchema));

        console.log("\n=== Save these addresses to your .env file ===");
        console.log("export WAVS_ENV_EAS_ADDRESS=", deployment.eas);
        console.log("export WAVS_ENV_ATTESTER_ADDRESS=", deployment.attester);
        console.log(
            "export WAVS_ENV_BASIC_SCHEMA_ID=",
            vm.toString(deployment.basicSchema)
        );
        console.log(
            "export WAVS_ENV_LIKE_SCHEMA_ID=",
            vm.toString(deployment.likeSchema)
        );
        console.log(
            "export WAVS_ENV_VOUCHING_SCHEMA_ID=",
            vm.toString(deployment.vouchingSchema)
        );
    }
}
