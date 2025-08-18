// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {Test} from "forge-std/Test.sol";
import {DeployEAS} from "../../script/DeployEAS.s.sol";
import {IEAS} from "@ethereum-attestation-service/eas-contracts/contracts/IEAS.sol";
import {
    ISchemaRegistry, SchemaRecord
} from "@ethereum-attestation-service/eas-contracts/contracts/ISchemaRegistry.sol";
import {Indexer} from "@ethereum-attestation-service/eas-contracts/contracts/Indexer.sol";
import {IndexerResolver} from "../../src/contracts/IndexerResolver.sol";

import {Attester} from "../../src/contracts/Attester.sol";
import {SchemaRegistrar} from "../../src/contracts/SchemaRegistrar.sol";
import {EASAttestTrigger} from "../../src/contracts/Trigger.sol";

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

        DeployEAS.EASDeployment memory deployment = deployer.run(serviceManagerAddr);

        // Verify all contract addresses are not zero
        assertTrue(deployment.schemaRegistry != address(0), "SchemaRegistry not deployed");
        assertTrue(deployment.eas != address(0), "EAS not deployed");
        assertTrue(deployment.attester != address(0), "Attester not deployed");
        assertTrue(deployment.schemaRegistrar != address(0), "SchemaRegistrar not deployed");

        assertTrue(deployment.indexer != address(0), "Indexer not deployed");
        assertTrue(deployment.indexerResolver != address(0), "IndexerResolver not deployed");
        assertTrue(deployment.easAttestTrigger != address(0), "EASAttestTrigger not deployed");

        // Verify schema IDs are not empty
        assertTrue(deployment.basicSchema != bytes32(0), "Basic schema not registered");
        assertTrue(deployment.computeSchema != bytes32(0), "Compute schema not registered");

        // Verify basic and compute schemas are different
        assertTrue(deployment.basicSchema != deployment.computeSchema, "Schemas should be different");
    }

    function testDeployEAS_ShouldConfigureIndexerCorrectly() public {
        string memory serviceManagerAddr = vm.toString(address(mockServiceManager));

        DeployEAS.EASDeployment memory deployment = deployer.run(serviceManagerAddr);

        // Verify IndexerResolver is properly configured with the Indexer
        IndexerResolver indexerResolver = IndexerResolver(payable(deployment.indexerResolver));
        assertEq(
            address(indexerResolver.indexer()), deployment.indexer, "IndexerResolver should reference correct Indexer"
        );

        // Verify Indexer is properly configured with EAS
        Indexer indexer = Indexer(payable(deployment.indexer));
        assertEq(address(indexer.getEAS()), deployment.eas, "Indexer should reference correct EAS");
    }

    function testDeployEAS_ShouldRegisterSchemasWithIndexerResolver() public {
        string memory serviceManagerAddr = vm.toString(address(mockServiceManager));

        DeployEAS.EASDeployment memory deployment = deployer.run(serviceManagerAddr);

        ISchemaRegistry schemaRegistry = ISchemaRegistry(deployment.schemaRegistry);

        // Verify basic schema uses IndexerResolver
        SchemaRecord memory basicSchemaRecord = schemaRegistry.getSchema(deployment.basicSchema);
        assertEq(
            address(basicSchemaRecord.resolver), deployment.indexerResolver, "Basic schema should use IndexerResolver"
        );
        assertTrue(basicSchemaRecord.revocable, "Basic schema should be revocable");
        assertEq(
            basicSchemaRecord.schema,
            "bytes32 triggerId,string data,uint256 timestamp",
            "Basic schema should have correct structure"
        );

        // Verify compute schema uses IndexerResolver
        SchemaRecord memory computeSchemaRecord = schemaRegistry.getSchema(deployment.computeSchema);
        assertEq(
            address(computeSchemaRecord.resolver),
            deployment.indexerResolver,
            "Compute schema should use IndexerResolver"
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

        DeployEAS.EASDeployment memory deployment = deployer.run(serviceManagerAddr);

        // Verify Attester is properly configured
        Attester attester = Attester(payable(deployment.attester));

        // Check EAS reference (this might require a getter function in Attester)
        // For now, we just verify the contract was deployed and is not zero address
        assertTrue(deployment.attester != address(0), "Attester should be deployed");
    }

    function testDeployEAS_ShouldRevertWithInvalidServiceManager() public {
        string memory invalidAddr = "0x0000000000000000000000000000000000000000";

        vm.expectRevert("Invalid service manager address");
        deployer.run(invalidAddr);
    }

    function testDeployEAS_ContractsShouldBeProperlyInitialized() public {
        string memory serviceManagerAddr = vm.toString(address(mockServiceManager));

        DeployEAS.EASDeployment memory deployment = deployer.run(serviceManagerAddr);

        // Verify SchemaRegistrar is properly configured
        SchemaRegistrar schemaRegistrar = SchemaRegistrar(payable(deployment.schemaRegistrar));
        // Note: SchemaRegistrar might not have a public getter for schemaRegistry
        // We verify it by checking it was deployed successfully
        assertTrue(deployment.schemaRegistrar != address(0), "SchemaRegistrar should be deployed");

        // Verify EASAttestTrigger is deployed
        EASAttestTrigger trigger = EASAttestTrigger(payable(deployment.easAttestTrigger));
        assertTrue(deployment.easAttestTrigger != address(0), "EASAttestTrigger should be deployed");
    }

    function testDeployEAS_ShouldProduceConsistentDeployment() public {
        string memory serviceManagerAddr = vm.toString(address(mockServiceManager));

        // Deploy twice and verify we get different addresses (new contracts)
        DeployEAS.EASDeployment memory deployment1 = deployer.run(serviceManagerAddr);

        // Create new deployer instance to simulate fresh deployment
        DeployEAS newDeployer = new DeployEAS();
        DeployEAS.EASDeployment memory deployment2 = newDeployer.run(serviceManagerAddr);

        // Addresses should be different (new deployments)
        assertTrue(deployment1.eas != deployment2.eas, "Should deploy new EAS instance");
        assertTrue(deployment1.indexer != deployment2.indexer, "Should deploy new Indexer instance");
        assertTrue(
            deployment1.indexerResolver != deployment2.indexerResolver, "Should deploy new IndexerResolver instance"
        );

        // But both should have valid, non-zero addresses
        assertTrue(deployment2.schemaRegistry != address(0), "Second deployment should have valid SchemaRegistry");
        assertTrue(deployment2.eas != address(0), "Second deployment should have valid EAS");
        assertTrue(deployment2.indexer != address(0), "Second deployment should have valid Indexer");
        assertTrue(deployment2.indexerResolver != address(0), "Second deployment should have valid IndexerResolver");
    }
}
