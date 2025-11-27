// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {stdJson} from "forge-std/StdJson.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {console} from "forge-std/console.sol";
import {IWavsServiceManager} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceManager.sol";
import {IHats} from "hats-protocol/Interfaces/IHats.sol";
import {HatsModuleFactory} from "@hats-module/src/HatsModuleFactory.sol";
import {Hats} from "hats-protocol/Hats.sol";

import {HatsWavsEligibilityModule} from "../src/contracts/hats/HatsWavsEligibilityModule.sol";
import {HatsWavsToggleModule} from "../src/contracts/hats/HatsWavsToggleModule.sol";
import {HatsWavsHatter} from "../src/contracts/hats/HatsWavsHatter.sol";
import {HatsWavsMinter} from "../src/contracts/hats/HatsWavsMinter.sol";

import {Common} from "./Common.s.sol";

/// @title DeployHats
/// @notice Deployment script for Hats Protocol WAVS AVS integration
contract DeployHats is Common {
    using stdJson for string;

    string public constant VERSION = "0.1.0";

    string public root = vm.projectRoot();
    string public script_output_path = string.concat(root, "/.docker/hats_deploy.json");

    /// @notice Deploy Hats contracts and WAVS integration
    /// @param wavsServiceManagerAddr The WAVS service manager address
    function run(string calldata wavsServiceManagerAddr) public {
        vm.startBroadcast(_privateKey);

        address serviceManager = vm.parseAddress(wavsServiceManagerAddr);
        require(serviceManager != address(0), "Invalid service manager address");

        console.log("Deploying Hats Protocol WAVS contracts...");

        string memory _json = "json";

        // Get or deploy Hats Protocol
        address hatsAddr = getOrDeployHatsProtocol();
        _json.serialize("hats_protocol", Strings.toChecksumHexString(hatsAddr));

        // Get or deploy Hats Module Factory
        address moduleFactoryAddr = getOrDeployHatsModuleFactory(hatsAddr);
        _json.serialize("module_factory", Strings.toChecksumHexString(moduleFactoryAddr));

        IHats hats = IHats(hatsAddr);

        // Deploy implementation contracts
        console.log("Deploying implementation contracts...");

        HatsWavsEligibilityModule eligibilityImpl =
            new HatsWavsEligibilityModule(hats, IWavsServiceManager(serviceManager), VERSION);
        _json.serialize("eligibility_module_impl", Strings.toChecksumHexString(address(eligibilityImpl)));
        console.log("HatsWavsEligibilityModule impl deployed at:", address(eligibilityImpl));

        HatsWavsToggleModule toggleImpl = new HatsWavsToggleModule(hats, IWavsServiceManager(serviceManager), VERSION);
        _json.serialize("toggle_module_impl", Strings.toChecksumHexString(address(toggleImpl)));
        console.log("HatsWavsToggleModule impl deployed at:", address(toggleImpl));

        HatsWavsHatter hatterImpl = new HatsWavsHatter(hats, IWavsServiceManager(serviceManager), VERSION);
        _json.serialize("hatter_impl", Strings.toChecksumHexString(address(hatterImpl)));
        console.log("HatsWavsHatter impl deployed at:", address(hatterImpl));

        HatsWavsMinter minterImpl = new HatsWavsMinter(hats, IWavsServiceManager(serviceManager), VERSION);
        _json.serialize("minter_impl", Strings.toChecksumHexString(address(minterImpl)));
        console.log("HatsWavsMinter impl deployed at:", address(minterImpl));

        // Deploy module instances via factory
        console.log("Deploying module instances via factory...");
        HatsModuleFactory moduleFactory = HatsModuleFactory(moduleFactoryAddr);

        address eligibilityModule = moduleFactory.createHatsModule(
            address(eligibilityImpl),
            0, // hatId (0 means no hat associated)
            abi.encode(""),
            abi.encode(address(0)),
            0 // saltNonce
        );
        _json.serialize("eligibility_module", Strings.toChecksumHexString(eligibilityModule));
        console.log("HatsWavsEligibilityModule instance deployed at:", eligibilityModule);

        address toggleModule =
            moduleFactory.createHatsModule(address(toggleImpl), 0, abi.encode(""), abi.encode(address(0)), 0);
        _json.serialize("toggle_module", Strings.toChecksumHexString(toggleModule));
        console.log("HatsWavsToggleModule instance deployed at:", toggleModule);

        address hatter =
            moduleFactory.createHatsModule(address(hatterImpl), 0, abi.encode(""), abi.encode(address(0)), 0);
        _json.serialize("hatter", Strings.toChecksumHexString(hatter));
        console.log("HatsWavsHatter instance deployed at:", hatter);

        address minter =
            moduleFactory.createHatsModule(address(minterImpl), 0, abi.encode(""), abi.encode(address(0)), 0);
        string memory finalJson = _json.serialize("minter", Strings.toChecksumHexString(minter));
        console.log("HatsWavsMinter instance deployed at:", minter);

        vm.stopBroadcast();

        vm.writeFile(script_output_path, finalJson);

        // Log deployment summary
        console.log("\n=== Hats Protocol WAVS Deployment Summary ===");
        console.log("Hats Protocol:", hatsAddr);
        console.log("Module Factory:", moduleFactoryAddr);
        console.log("Eligibility Module (impl):", address(eligibilityImpl));
        console.log("Eligibility Module (instance):", eligibilityModule);
        console.log("Toggle Module (impl):", address(toggleImpl));
        console.log("Toggle Module (instance):", toggleModule);
        console.log("Hatter (impl):", address(hatterImpl));
        console.log("Hatter (instance):", hatter);
        console.log("Minter (impl):", address(minterImpl));
        console.log("Minter (instance):", minter);
    }

    /// @notice Get or deploy the Hats Protocol contract
    /// @return hatsAddr The address of the Hats Protocol contract
    function getOrDeployHatsProtocol() internal returns (address hatsAddr) {
        hatsAddr = vm.envOr("HATS_PROTOCOL_ADDRESS", address(0));

        if (hatsAddr == address(0)) {
            console.log("Hats Protocol address not set, deploying new instance...");

            Hats hatsProtocol = new Hats("Hats Protocol Local", "https://app.hatsprotocol.xyz/trees/");

            hatsAddr = address(hatsProtocol);
            console.log("Deployed new Hats Protocol at:", hatsAddr);
        } else {
            console.log("Using existing Hats Protocol at:", hatsAddr);
        }
    }

    /// @notice Get or deploy the Hats Module Factory contract
    /// @param _hatsAddr The address of the Hats Protocol contract
    /// @return factoryAddr The address of the Hats Module Factory contract
    function getOrDeployHatsModuleFactory(address _hatsAddr) internal returns (address factoryAddr) {
        factoryAddr = vm.envOr("HATS_MODULE_FACTORY_ADDRESS", address(0));

        if (factoryAddr == address(0)) {
            console.log("Hats Module Factory address not set, deploying new instance...");

            HatsModuleFactory factory = new HatsModuleFactory(IHats(_hatsAddr), "1.0.0");

            factoryAddr = address(factory);
            console.log("Deployed new Hats Module Factory at:", factoryAddr);
        } else {
            console.log("Using existing Hats Module Factory at:", factoryAddr);
        }
    }
}
