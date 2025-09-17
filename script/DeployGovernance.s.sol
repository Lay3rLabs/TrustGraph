// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {stdJson} from "forge-std/StdJson.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {console} from "forge-std/console.sol";
import {IWavsServiceManager} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceManager.sol";
import {VotingPower} from "../src/contracts/governance/VotingPower.sol";
import {AttestationGovernor} from "../src/contracts/governance/Governor.sol";
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {Common} from "./Common.s.sol";

/// @title DeployGovernance
/// @notice Deployment script for governance contracts
contract DeployGovernance is Common {
    using stdJson for string;

    string public root = vm.projectRoot();
    string public script_output_path = string.concat(root, "/.docker/governance_deploy.json");

    /// @notice Deploy governance contracts
    /// @param wavsServiceManagerAddr The WAVS service manager address
    function run(string calldata wavsServiceManagerAddr) public {
        address deployer = vm.addr(_privateKey);
        vm.startBroadcast(_privateKey);

        address serviceManager = vm.parseAddress(wavsServiceManagerAddr);
        require(serviceManager != address(0), "Invalid service manager address");

        console.log("Deploying governance contracts...");

        string memory _json = "json";

        // 1. Deploy VotingPower token
        VotingPower votingPower = new VotingPower(
            "WAVS Governance Token",
            "WAVS",
            deployer, // Initial owner
            IWavsServiceManager(serviceManager)
        );
        _json.serialize("voting_power", Strings.toChecksumHexString(address(votingPower)));
        console.log("VotingPower deployed at:", address(votingPower));

        // 2. Deploy TimelockController
        address[] memory proposers = new address[](1);
        address[] memory executors = new address[](1);
        proposers[0] = address(0); // Will be set to governor after deployment
        executors[0] = address(0); // Anyone can execute after delay

        TimelockController timelock = new TimelockController(
            2 days, // 2 day delay
            proposers,
            executors,
            deployer // Admin (can be renounced later)
        );
        _json.serialize("timelock", Strings.toChecksumHexString(address(timelock)));
        console.log("TimelockController deployed at:", address(timelock));

        // 3. Deploy AttestationGovernor
        AttestationGovernor governor = new AttestationGovernor(votingPower, timelock);
        string memory finalJson = _json.serialize("governor", Strings.toChecksumHexString(address(governor)));
        console.log("AttestationGovernor deployed at:", address(governor));

        // 4. Grant proposer role to governor
        bytes32 proposerRole = timelock.PROPOSER_ROLE();
        timelock.grantRole(proposerRole, address(governor));

        console.log("Governor granted proposer role on timelock");

        vm.writeFile(script_output_path, finalJson);

        vm.stopBroadcast();

        // Log deployment summary
        console.log("\n=== Governance Deployment Summary ===");
        console.log("VotingPower:", address(votingPower));
        console.log("TimelockController:", address(timelock));
        console.log("AttestationGovernor:", address(governor));
    }
}
