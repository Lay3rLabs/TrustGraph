// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {IWavsServiceManager} from "@wavs/interfaces/IWavsServiceManager.sol";
import {VotingPower} from "../src/contracts/VotingPower.sol";
import {AttestationGovernor} from "../src/contracts/Governor.sol";
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {Common} from "./Common.s.sol";

/// @title DeployGovernance
/// @notice Deployment script for governance contracts
contract DeployGovernance is Common {
    struct GovernanceDeployment {
        address votingPower;
        address timelock;
        address governor;
    }

    /// @notice Deploy governance contracts
    /// @param wavsServiceManagerAddr The WAVS service manager address
    /// @return deployment The deployed contract addresses
    function run(string calldata wavsServiceManagerAddr) public returns (GovernanceDeployment memory deployment) {
        vm.startBroadcast(_privateKey);

        address serviceManager = vm.parseAddress(wavsServiceManagerAddr);
        require(serviceManager != address(0), "Invalid service manager address");

        console.log("Deploying governance contracts...");

        // 1. Deploy VotingPower token
        VotingPower votingPower = new VotingPower(
            "WAVS Governance Token",
            "WAVS",
            msg.sender, // Initial owner
            IWavsServiceManager(serviceManager)
        );
        deployment.votingPower = address(votingPower);
        console.log("VotingPower deployed at:", deployment.votingPower);

        // 2. Deploy TimelockController
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

        // 3. Deploy AttestationGovernor
        AttestationGovernor governor = new AttestationGovernor(votingPower, timelock);
        deployment.governor = address(governor);
        console.log("AttestationGovernor deployed at:", deployment.governor);

        // 4. Grant proposer role to governor
        bytes32 proposerRole = timelock.PROPOSER_ROLE();
        timelock.grantRole(proposerRole, deployment.governor);

        // Revoke proposer role from deployer
        timelock.revokeRole(proposerRole, msg.sender);
        console.log("Governor granted proposer role on timelock");

        vm.stopBroadcast();

        // Log deployment summary
        console.log("\n=== Governance Deployment Summary ===");
        console.log("VotingPower:", deployment.votingPower);
        console.log("TimelockController:", deployment.timelock);
        console.log("AttestationGovernor:", deployment.governor);
    }
}
