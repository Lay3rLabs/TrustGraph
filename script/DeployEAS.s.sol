// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {
    ISchemaRegistry, SchemaRegistry
} from "@ethereum-attestation-service/eas-contracts/contracts/SchemaRegistry.sol";
import {IEAS, EAS} from "@ethereum-attestation-service/eas-contracts/contracts/EAS.sol";
import {ISchemaResolver} from "@ethereum-attestation-service/eas-contracts/contracts/resolver/ISchemaResolver.sol";
import {WavsAttester} from "../src/contracts/eas/WavsAttester.sol";
import {SchemaRegistrar} from "../src/contracts/eas/SchemaRegistrar.sol";

import {EASIndexerResolver} from "../src/contracts/eas/resolvers/EASIndexerResolver.sol";
import {PayableEASIndexerResolver} from "../src/contracts/eas/resolvers/PayableEASIndexerResolver.sol";
import {AttesterEASIndexerResolver} from "../src/contracts/eas/resolvers/AttesterEASIndexerResolver.sol";
import {EASAttestTrigger} from "../src/contracts/misc/Trigger.sol";
import {IWavsServiceManager} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceManager.sol";
import {IWavsServiceHandler} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceHandler.sol";
import {ITypes} from "../src/interfaces/ITypes.sol";

import {Common} from "./Common.s.sol";

/// @title DeployEAS
/// @notice Deployment script for EAS contracts and WAVS EAS integration
contract DeployEAS is Common {
    struct EASDeployment {
        address schemaRegistry;
        address eas;
        address attester;
        address schemaRegistrar;
        address indexerResolver;
        address payableIndexerResolver;
        address attesterIndexerResolver;
        address easAttestTrigger;
        bytes32 basicSchema;
        bytes32 computeSchema;
        bytes32 statementSchema;
        bytes32 isTrueSchema;
        bytes32 likeSchema;
        bytes32 vouchingSchema;
    }

    /// @notice Deploy EAS contracts and WAVS integration
    /// @param wavsServiceManagerAddr The WAVS service manager address
    /// @return deployment The deployed contract addresses
    function run(string calldata wavsServiceManagerAddr) public returns (EASDeployment memory deployment) {
        vm.startBroadcast(_privateKey);

        address serviceManager = vm.parseAddress(wavsServiceManagerAddr);
        require(serviceManager != address(0), "Invalid service manager address");

        console.log("Deploying EAS contracts...");

        // 1. Deploy SchemaRegistry
        SchemaRegistry schemaRegistry = new SchemaRegistry();
        deployment.schemaRegistry = address(schemaRegistry);
        console.log("SchemaRegistry deployed at:", deployment.schemaRegistry);

        // 2. Deploy EAS
        EAS eas = new EAS(ISchemaRegistry(deployment.schemaRegistry));
        deployment.eas = address(eas);
        console.log("EAS deployed at:", deployment.eas);

        // 3. Deploy EASIndexerResolver
        EASIndexerResolver indexerResolver = new EASIndexerResolver(IEAS(deployment.eas));
        deployment.indexerResolver = address(indexerResolver);
        console.log("EASIndexerResolver deployed at:", deployment.indexerResolver);

        // 4. Deploy PayableEASIndexerResolver (0.001 ETH target value)
        PayableEASIndexerResolver payableIndexerResolver = new PayableEASIndexerResolver(
            IEAS(deployment.eas),
            0.001 ether, // Target value for attestations
            msg.sender // Owner (deployer)
        );
        deployment.payableIndexerResolver = address(payableIndexerResolver);
        console.log("PayableEASIndexerResolver deployed at:", deployment.payableIndexerResolver);

        // 5. Deploy SchemaRegistrar
        SchemaRegistrar schemaRegistrar = new SchemaRegistrar(ISchemaRegistry(deployment.schemaRegistry));
        deployment.schemaRegistrar = address(schemaRegistrar);
        console.log("SchemaRegistrar deployed at:", deployment.schemaRegistrar);

        // 6. Deploy WavsAttester (main WAVS integration contract)
        WavsAttester attester = new WavsAttester(IEAS(deployment.eas), IWavsServiceManager(serviceManager));
        deployment.attester = address(attester);
        console.log("WavsAttester deployed at:", deployment.attester);

        // 7. Deploy AttesterEASIndexerResolver (targets WavsAttester)
        AttesterEASIndexerResolver attesterIndexerResolver = new AttesterEASIndexerResolver(
            IEAS(deployment.eas),
            deployment.attester, // Target the WavsAttester contract
            msg.sender // Owner (deployer)
        );
        deployment.attesterIndexerResolver = address(attesterIndexerResolver);
        console.log("AttesterEASIndexerResolver deployed at:", deployment.attesterIndexerResolver);

        // 8. Deploy EASAttestTrigger
        EASAttestTrigger easAttestTrigger = new EASAttestTrigger();
        deployment.easAttestTrigger = address(easAttestTrigger);
        console.log("EASAttestTrigger deployed at:", deployment.easAttestTrigger);

        // 9. Register basic schemas
        console.log("Registering schemas...");

        // Basic attestation schema for general data (with indexing)
        deployment.basicSchema = schemaRegistrar.register(
            "bytes32 triggerId,string data,uint256 timestamp",
            ISchemaResolver(deployment.indexerResolver),
            true // revocable
        );
        console.log("Basic Schema ID:", vm.toString(deployment.basicSchema));

        // Compute result schema for computation results (with indexing)
        deployment.computeSchema = schemaRegistrar.register(
            "bytes32 triggerId,string computation,bytes result,uint256 timestamp,address operator",
            ISchemaResolver(deployment.indexerResolver),
            true // revocable
        );
        console.log("Compute Schema ID:", vm.toString(deployment.computeSchema));

        // Statement schema for simple text statements
        // This resolver requires payment
        deployment.statementSchema = schemaRegistrar.register(
            "string statement",
            ISchemaResolver(deployment.payableIndexerResolver),
            true // revocable
        );
        console.log("Statement Schema ID:", vm.toString(deployment.statementSchema));

        // IsTrue schema for boolean truth assertions
        deployment.isTrueSchema = schemaRegistrar.register(
            "bool isTrue",
            ISchemaResolver(deployment.indexerResolver),
            true // revocable
        );
        console.log("IsTrue Schema ID:", vm.toString(deployment.isTrueSchema));

        // Like schema for simple like/dislike attestations
        // Only the WavsAttester can attest to this schema
        deployment.likeSchema = schemaRegistrar.register(
            "bool like",
            ISchemaResolver(deployment.attesterIndexerResolver),
            true // revocable
        );
        console.log("Like Schema ID:", vm.toString(deployment.likeSchema));

        // Vouching schema for weighted endorsements
        deployment.vouchingSchema = schemaRegistrar.register(
            "uint256 weight",
            ISchemaResolver(deployment.indexerResolver),
            true // revocable
        );
        console.log("Vouching Schema ID:", vm.toString(deployment.vouchingSchema));

        vm.stopBroadcast();

        // Log deployment summary
        console.log("\n=== EAS Deployment Summary ===");
        console.log("SchemaRegistry:", deployment.schemaRegistry);
        console.log("EAS:", deployment.eas);
        console.log("WavsAttester:", deployment.attester);
        console.log("SchemaRegistrar:", deployment.schemaRegistrar);
        console.log("EASIndexerResolver:", deployment.indexerResolver);
        console.log("PayableEASIndexerResolver:", deployment.payableIndexerResolver);
        console.log("AttesterEASIndexerResolver:", deployment.attesterIndexerResolver);
        console.log("EASAttestTrigger:", deployment.easAttestTrigger);
    }
}
