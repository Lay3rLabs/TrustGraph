// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {ISchemaRegistry, SchemaRegistry} from "@ethereum-attestation-service/eas-contracts/contracts/SchemaRegistry.sol";
import {IEAS, EAS} from "@ethereum-attestation-service/eas-contracts/contracts/EAS.sol";
import {ISchemaResolver} from "@ethereum-attestation-service/eas-contracts/contracts/resolver/ISchemaResolver.sol";
import {Attester} from "../src/contracts/Attester.sol";
import {SchemaRegistrar} from "../src/contracts/SchemaRegistrar.sol";

import {IndexerResolver} from "../src/contracts/IndexerResolver.sol";
import {Indexer} from "../src/contracts/Indexer.sol";
import {EASAttestTrigger} from "../src/contracts/Trigger.sol";
import {IWavsServiceManager} from "@wavs/interfaces/IWavsServiceManager.sol";
import {IWavsServiceHandler} from "@wavs/interfaces/IWavsServiceHandler.sol";
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
        address indexer;
        address indexerResolver;
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
    function run(
        string calldata wavsServiceManagerAddr
    ) public returns (EASDeployment memory deployment) {
        vm.startBroadcast(_privateKey);

        address serviceManager = vm.parseAddress(wavsServiceManagerAddr);
        require(
            serviceManager != address(0),
            "Invalid service manager address"
        );

        console.log("Deploying EAS contracts...");

        // 1. Deploy SchemaRegistry
        SchemaRegistry schemaRegistry = new SchemaRegistry();
        deployment.schemaRegistry = address(schemaRegistry);
        console.log("SchemaRegistry deployed at:", deployment.schemaRegistry);

        // 2. Deploy EAS
        EAS eas = new EAS(ISchemaRegistry(deployment.schemaRegistry));
        deployment.eas = address(eas);
        console.log("EAS deployed at:", deployment.eas);

        // 3. Deploy Indexer
        Indexer indexer = new Indexer(IEAS(deployment.eas));
        deployment.indexer = address(indexer);
        console.log("Indexer deployed at:", deployment.indexer);

        // 4. Deploy IndexerResolver
        IndexerResolver indexerResolver = new IndexerResolver(
            IEAS(deployment.eas),
            indexer
        );
        deployment.indexerResolver = address(indexerResolver);
        console.log("IndexerResolver deployed at:", deployment.indexerResolver);

        // 5. Deploy SchemaRegistrar
        SchemaRegistrar schemaRegistrar = new SchemaRegistrar(
            ISchemaRegistry(deployment.schemaRegistry)
        );
        deployment.schemaRegistrar = address(schemaRegistrar);
        console.log("SchemaRegistrar deployed at:", deployment.schemaRegistrar);

        // 6. Deploy Attester (main WAVS integration contract)
        Attester attester = new Attester(
            IEAS(deployment.eas),
            IWavsServiceManager(serviceManager)
        );
        deployment.attester = address(attester);
        console.log("Attester deployed at:", deployment.attester);

        // 7. Deploy EASAttestTrigger
        EASAttestTrigger easAttestTrigger = new EASAttestTrigger();
        deployment.easAttestTrigger = address(easAttestTrigger);
        console.log(
            "EASAttestTrigger deployed at:",
            deployment.easAttestTrigger
        );

        // 8. Register basic schemas
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
        console.log(
            "Compute Schema ID:",
            vm.toString(deployment.computeSchema)
        );

        // Statement schema for simple text statements
        deployment.statementSchema = schemaRegistrar.register(
            "string statement",
            ISchemaResolver(deployment.indexerResolver),
            true // revocable
        );
        console.log(
            "Statement Schema ID:",
            vm.toString(deployment.statementSchema)
        );

        // IsTrue schema for boolean truth assertions
        deployment.isTrueSchema = schemaRegistrar.register(
            "bool isTrue",
            ISchemaResolver(deployment.indexerResolver),
            true // revocable
        );
        console.log("IsTrue Schema ID:", vm.toString(deployment.isTrueSchema));

        // Like schema for simple like/dislike attestations
        deployment.likeSchema = schemaRegistrar.register(
            "bool like",
            ISchemaResolver(deployment.indexerResolver),
            true // revocable
        );
        console.log("Like Schema ID:", vm.toString(deployment.likeSchema));

        // Vouching schema for weighted endorsements
        deployment.vouchingSchema = schemaRegistrar.register(
            "uint256 weight",
            ISchemaResolver(deployment.indexerResolver),
            true // revocable
        );
        console.log(
            "Vouching Schema ID:",
            vm.toString(deployment.vouchingSchema)
        );

        vm.stopBroadcast();

        // Log deployment summary
        console.log("\n=== EAS Deployment Summary ===");
        console.log("SchemaRegistry:", deployment.schemaRegistry);
        console.log("EAS:", deployment.eas);
        console.log("Attester:", deployment.attester);
        console.log("SchemaRegistrar:", deployment.schemaRegistrar);
        console.log("Indexer:", deployment.indexer);
        console.log("IndexerResolver:", deployment.indexerResolver);
        console.log("EASAttestTrigger:", deployment.easAttestTrigger);
    }
}
