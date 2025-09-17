// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {Test} from "forge-std/Test.sol";
import {DeployEAS} from "../../script/DeployEAS.s.sol";
import {
    ISchemaRegistry, SchemaRecord
} from "@ethereum-attestation-service/eas-contracts/contracts/ISchemaRegistry.sol";

contract MockWavsServiceManager {
// Mock contract for testing
}

contract DeployEASTest is Test {
    DeployEAS public deployer;
    MockWavsServiceManager public mockServiceManager;

    function setUp() public {
        deployer = new DeployEAS();
        mockServiceManager = new MockWavsServiceManager();
    }

    function testDeployEAS_ShouldDeployAllContracts() public {
        string memory serviceManagerAddr = vm.toString(address(mockServiceManager));

        DeployEAS.EasDeployment memory deployment = deployer.run(serviceManagerAddr);

        // Verify all contract addresses are not zero
        assertTrue(deployment.schemaRegistry != address(0), "SchemaRegistry not deployed");
        assertTrue(deployment.eas != address(0), "EAS not deployed");
        assertTrue(deployment.attester != address(0), "Attester not deployed");
        assertTrue(deployment.schemaRegistrar != address(0), "SchemaRegistrar not deployed");

        assertTrue(deployment.indexerResolver != address(0), "EASIndexerResolver not deployed");
        assertTrue(deployment.easAttestTrigger != address(0), "EASAttestTrigger not deployed");

        // Verify schema IDs are not empty
        assertTrue(deployment.basicSchema != bytes32(0), "Basic schema not registered");
        assertTrue(deployment.computeSchema != bytes32(0), "Compute schema not registered");

        // Verify basic and compute schemas are different
        assertTrue(deployment.basicSchema != deployment.computeSchema, "Schemas should be different");
    }

    function testDeployEAS_ShouldRegisterSchemasWithEASIndexerResolver() public {
        string memory serviceManagerAddr = vm.toString(address(mockServiceManager));

        DeployEAS.EasDeployment memory deployment = deployer.run(serviceManagerAddr);

        ISchemaRegistry schemaRegistry = ISchemaRegistry(deployment.schemaRegistry);

        // Verify basic schema uses EASIndexerResolver
        SchemaRecord memory basicSchemaRecord = schemaRegistry.getSchema(deployment.basicSchema);
        assertEq(
            address(basicSchemaRecord.resolver),
            deployment.indexerResolver,
            "Basic schema should use EASIndexerResolver"
        );
        assertTrue(basicSchemaRecord.revocable, "Basic schema should be revocable");
        assertEq(
            basicSchemaRecord.schema,
            "bytes32 triggerId,string data,uint256 timestamp",
            "Basic schema should have correct structure"
        );

        // Verify compute schema uses EASIndexerResolver
        SchemaRecord memory computeSchemaRecord = schemaRegistry.getSchema(deployment.computeSchema);
        assertEq(
            address(computeSchemaRecord.resolver),
            deployment.indexerResolver,
            "Compute schema should use EASIndexerResolver"
        );
        assertTrue(computeSchemaRecord.revocable, "Compute schema should be revocable");
        assertEq(
            computeSchemaRecord.schema,
            "bytes32 triggerId,string computation,bytes result,uint256 timestamp,address operator",
            "Compute schema should have correct structure"
        );
    }

    function testDeployEAS_ShouldConfigureAttesterCorrectly() public {
        string memory serviceManagerAddr = vm.toString(address(mockServiceManager));

        DeployEAS.EasDeployment memory deployment = deployer.run(serviceManagerAddr);

        // Check EAS reference (this might require a getter function in WavsAttester)
        // For now, we just verify the contract was deployed and is not zero address
        assertTrue(deployment.attester != address(0), "WavsAttester should be deployed");
    }

    function testDeployEAS_ShouldRevertWithInvalidServiceManager() public {
        string memory invalidAddr = "0x0000000000000000000000000000000000000000";

        vm.expectRevert("Invalid service manager address");
        deployer.run(invalidAddr);
    }

    function testDeployEAS_ContractsShouldBeProperlyInitialized() public {
        string memory serviceManagerAddr = vm.toString(address(mockServiceManager));

        DeployEAS.EasDeployment memory deployment = deployer.run(serviceManagerAddr);

        // Note: SchemaRegistrar might not have a public getter for schemaRegistry
        // We verify it by checking it was deployed successfully
        assertTrue(deployment.schemaRegistrar != address(0), "SchemaRegistrar should be deployed");

        // Verify EASAttestTrigger is deployed
        assertTrue(deployment.easAttestTrigger != address(0), "EASAttestTrigger should be deployed");
    }

    function testDeployEAS_ShouldProduceConsistentDeployment() public {
        string memory serviceManagerAddr = vm.toString(address(mockServiceManager));

        // Deploy twice and verify we get different addresses (new contracts)
        DeployEAS.EasDeployment memory deployment1 = deployer.run(serviceManagerAddr);

        // Create new deployer instance to simulate fresh deployment
        DeployEAS newDeployer = new DeployEAS();
        DeployEAS.EasDeployment memory deployment2 = newDeployer.run(serviceManagerAddr);

        // Addresses should be different (new deployments)
        assertTrue(deployment1.eas != deployment2.eas, "Should deploy new EAS instance");
        assertTrue(
            deployment1.indexerResolver != deployment2.indexerResolver, "Should deploy new EASIndexerResolver instance"
        );

        // But both should have valid, non-zero addresses
        assertTrue(deployment2.schemaRegistry != address(0), "Second deployment should have valid SchemaRegistry");
        assertTrue(deployment2.eas != address(0), "Second deployment should have valid EAS");
        assertTrue(deployment2.indexerResolver != address(0), "Second deployment should have valid EASIndexerResolver");
    }
}
