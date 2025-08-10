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
import {VotingPower} from "../src/contracts/VotingPower.sol";
import {AttestationGovernor} from "../src/contracts/Governor.sol";
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
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
        address votingPower;
        address timelock;
        address governor;
        bytes32 basicSchema;
        bytes32 computeSchema;
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
        console.log(
            "Basic schema registered:",
            vm.toString(deployment.basicSchema)
        );

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

        // 9. Deploy VotingPower token
        console.log("Deploying governance contracts...");

        VotingPower votingPower = new VotingPower(
            "WAVS Governance Token",
            "WAVS",
            msg.sender, // Initial owner
            IWavsServiceManager(serviceManager)
        );
        deployment.votingPower = address(votingPower);
        console.log("VotingPower deployed at:", deployment.votingPower);

        // 10. Deploy TimelockController
        address[] memory proposers = new address[](1);
        address[] memory executors = new address[](1);
        proposers[0] = address(0); // Will be set to governor after deployment
        executors[0] = address(0); // Anyone can execute after delay

        TimelockController timelock = new TimelockController(
            2 days, // 2 day delay
            proposers,
            executors,
            msg.sender // Admin (can be renounced later)
        );
        deployment.timelock = address(timelock);
        console.log("TimelockController deployed at:", deployment.timelock);

        // 11. Deploy AttestationGovernor
        AttestationGovernor governor = new AttestationGovernor(
            votingPower,
            timelock
        );
        deployment.governor = address(governor);
        console.log("AttestationGovernor deployed at:", deployment.governor);

        // 12. Grant proposer role to governor
        bytes32 proposerRole = timelock.PROPOSER_ROLE();
        timelock.grantRole(proposerRole, deployment.governor);

        // Revoke proposer role from deployer
        timelock.revokeRole(proposerRole, msg.sender);
        console.log("Governor granted proposer role on timelock");

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
        console.log("VotingPower:", deployment.votingPower);
        console.log("TimelockController:", deployment.timelock);
        console.log("AttestationGovernor:", deployment.governor);
        console.log("Basic Schema ID:", vm.toString(deployment.basicSchema));
        console.log(
            "Compute Schema ID:",
            vm.toString(deployment.computeSchema)
        );
    }
}
