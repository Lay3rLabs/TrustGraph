// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {stdJson} from "forge-std/StdJson.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {ISchemaRegistry, SchemaRegistry} from "@ethereum-attestation-service/eas-contracts/contracts/SchemaRegistry.sol";
import {IEAS, EAS} from "@ethereum-attestation-service/eas-contracts/contracts/EAS.sol";
import {ISchemaResolver} from "@ethereum-attestation-service/eas-contracts/contracts/resolver/ISchemaResolver.sol";
import {Attester} from "../src/contracts/Attester.sol";
import {SchemaRegistrar} from "../src/contracts/SchemaRegistrar.sol";

import {EASIndexerResolver} from "../src/contracts/EASIndexerResolver.sol";
import {EASAttestTrigger} from "../src/contracts/Trigger.sol";
import {IWavsServiceManager} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceManager.sol";
import {IWavsServiceHandler} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceHandler.sol";
import {ITypes} from "../src/interfaces/ITypes.sol";
import {UniversalIndexer} from "../src/contracts/UniversalIndexer.sol";

import {Common} from "./Common.s.sol";

/// @title DeployUniversalIndexer
/// @notice Deployment script for UniversalIndexer contracts and WAVS integration
contract DeployUniversalIndexer is Common {
    using stdJson for string;

    string public root = vm.projectRoot();
    string public script_output_path =
        string.concat(root, "/.docker/universal_indexer_deploy.json");

    struct UniversalIndexerDeployment {
        address universalIndexer;
    }

    /// @notice Deploy UniversalIndexer contract and WAVS integration
    /// @param wavsServiceManagerAddr The WAVS service manager address
    /// @return deployment The deployed contract addresses
    function run(
        string calldata wavsServiceManagerAddr
    ) public returns (UniversalIndexerDeployment memory deployment) {
        vm.startBroadcast(_privateKey);

        address serviceManager = vm.parseAddress(wavsServiceManagerAddr);
        require(
            serviceManager != address(0),
            "Invalid service manager address"
        );

        console.log("Deploying UniversalIndexer contract...");

        // 1. Deploy UniversalIndexer
        UniversalIndexer universalIndexer = new UniversalIndexer(
            IWavsServiceManager(serviceManager)
        );
        deployment.universalIndexer = address(universalIndexer);
        console.log(
            "UniversalIndexer deployed at:",
            deployment.universalIndexer
        );

        vm.stopBroadcast();

        // Log deployment summary
        console.log("\n=== UniversalIndexer Deployment Summary ===");
        console.log("UniversalIndexer:", deployment.universalIndexer);

        // Write to file
        string memory _json = "json";
        string memory finalJson = _json.serialize(
            "universal_indexer",
            Strings.toChecksumHexString(address(universalIndexer))
        );
        vm.writeFile(script_output_path, finalJson);
    }
}
