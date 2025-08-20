// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {stdJson} from "forge-std/StdJson.sol";

import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {IWavsServiceManager} from "@wavs/interfaces/IWavsServiceManager.sol";

import {Common} from "script/Common.s.sol";

import {MerkleVote} from "contracts/MerkleVote.sol";
import {MerkleGov} from "contracts/MerkleGov.sol";

/// @dev Deployment script for MerkleGov and MerkleVote contracts
contract DeployScript is Common {
    using stdJson for string;

    string public root = vm.projectRoot();
    string public script_output_path = string.concat(root, "/.docker/merkle_gov_deploy.json");

    /**
     * @dev Deploys the MerkleVote and MerkleGov contracts and writes the results to a JSON file
     * @param serviceManagerAddr The address of the service manager
     * @param rewardDistributorAddr The address of the reward distributor (for owner/updater role)
     */
    function run(string calldata serviceManagerAddr, string calldata rewardDistributorAddr) public {
        address serviceManager = vm.parseAddress(serviceManagerAddr);
        address rewardDistributor = vm.parseAddress(rewardDistributorAddr);

        vm.startBroadcast(_privateKey);

        address deployer = vm.addr(_privateKey);

        // Deploy MerkleVote contract
        // Initial timelock of 1 hour for root updates
        uint256 initialTimelock = 1 hours;
        MerkleVote merkleVote = new MerkleVote(
            IWavsServiceManager(serviceManager),
            deployer, // initial owner
            initialTimelock
        );

        // Set the reward distributor as an updater for the merkle root
        // This allows the rewards component to update voting power
        merkleVote.setRootUpdater(rewardDistributor, true);

        // Deploy MerkleGov contract with reasonable defaults
        string memory govName = "Symbient DAO";
        uint256 votingDelay = 1; // 1 block delay before voting starts
        uint256 votingPeriod = 50400; // ~7 days at 12 second blocks
        uint256 quorum = 100e18; // 100 tokens worth of voting power for quorum
        uint256 proposalThreshold = 1e18; // 1 token worth of voting power to create proposal

        MerkleGov merkleGov = new MerkleGov(
            govName,
            votingDelay,
            votingPeriod,
            quorum,
            proposalThreshold,
            deployer, // admin
            address(merkleVote)
        );

        // For testnet/production, you might want to update these parameters
        // merkleGov.setQuorum(newQuorum);
        // merkleGov.setVotingDelay(newDelay);
        // merkleGov.setVotingPeriod(newPeriod);
        // merkleGov.setProposalThreshold(newThreshold);

        vm.stopBroadcast();

        // Write deployment addresses to JSON
        string memory _json = "json";
        _json.serialize("merkle_vote", Strings.toChecksumHexString(address(merkleVote)));
        _json.serialize("merkle_gov", Strings.toChecksumHexString(address(merkleGov)));
        _json.serialize("voting_delay", vm.toString(votingDelay));
        _json.serialize("voting_period", vm.toString(votingPeriod));
        _json.serialize("quorum", vm.toString(quorum));
        _json.serialize("proposal_threshold", vm.toString(proposalThreshold));
        _json.serialize("timelock", vm.toString(initialTimelock));
        string memory finalJson = _json.serialize("admin", Strings.toChecksumHexString(deployer));

        vm.writeFile(script_output_path, finalJson);
    }
}
