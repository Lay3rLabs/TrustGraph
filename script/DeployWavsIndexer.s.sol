// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {stdJson} from "forge-std/StdJson.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {ISchemaRegistry, SchemaRegistry} from "@ethereum-attestation-service/eas-contracts/contracts/SchemaRegistry.sol";
import {IEAS, EAS} from "@ethereum-attestation-service/eas-contracts/contracts/EAS.sol";
import {ISchemaResolver} from "@ethereum-attestation-service/eas-contracts/contracts/resolver/ISchemaResolver.sol";
import {WavsAttester} from "../src/contracts/eas/WavsAttester.sol";
import {SchemaRegistrar} from "../src/contracts/eas/SchemaRegistrar.sol";

import {EASIndexerResolver} from "../src/contracts/eas/resolvers/EASIndexerResolver.sol";
import {EASAttestTrigger} from "../src/contracts/eas/EASAttestTrigger.sol";
import {IWavsServiceManager} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceManager.sol";
import {IWavsServiceHandler} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceHandler.sol";
import {ITypes} from "../src/interfaces/ITypes.sol";
import {WavsIndexer} from "../src/contracts/wavs/WavsIndexer.sol";

import {Common} from "./Common.s.sol";

/// @title DeployWavsIndexer
/// @notice Deployment script for WavsIndexer contracts and WAVS integration
contract DeployWavsIndexer is Common {
    using stdJson for string;

    string public root = vm.projectRoot();
    string public script_output_path =
        string.concat(root, "/.docker/wavs_indexer_deploy.json");

    struct WavsIndexerDeployment {
        address wavsIndexer;
    }

    /// @notice Deploy WavsIndexer contract and WAVS integration
    /// @param wavsServiceManagerAddr The WAVS service manager address
    /// @return deployment The deployed contract addresses
    function run(
        string calldata wavsServiceManagerAddr
    ) public returns (WavsIndexerDeployment memory deployment) {
        vm.startBroadcast(_privateKey);

        address serviceManager = vm.parseAddress(wavsServiceManagerAddr);
        require(
            serviceManager != address(0),
            "Invalid service manager address"
        );

        console.log("Deploying WavsIndexer contract...");

        // 1. Deploy WavsIndexer
        WavsIndexer wavsIndexer = new WavsIndexer(
            IWavsServiceManager(serviceManager)
        );
        deployment.wavsIndexer = address(wavsIndexer);
        console.log("WavsIndexer deployed at:", deployment.wavsIndexer);

        vm.stopBroadcast();

        // Log deployment summary
        console.log("\n=== WavsIndexer Deployment Summary ===");
        console.log("WavsIndexer:", deployment.wavsIndexer);

        // Write to file
        string memory _json = "json";
        string memory finalJson = _json.serialize(
            "wavs_indexer",
            Strings.toChecksumHexString(address(wavsIndexer))
        );
        vm.writeFile(script_output_path, finalJson);
    }
}
