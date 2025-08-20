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
     * @param fundingAmount The amount of ETH to fund the MerkleGov contract with (in wei)
     */
    function run(string calldata serviceManagerAddr, string calldata rewardDistributorAddr, uint256 fundingAmount)
        public
    {
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
        uint256 quorumBasisPoints = 1000; // 10% quorum (1000 basis points = 10%)
        uint256 votingDelay = 1; // 1 block delay before voting starts
        uint256 votingPeriod = 50400; // ~7 days at 12 second blocks
        uint256 timelockDelay = 2 days; // 2 days timelock for execution
        uint256 proposalThreshold = 1e18; // 1 token worth of voting power to create proposal

        MerkleGov merkleGov = new MerkleGov(
            merkleVote,
            deployer, // admin
            quorumBasisPoints,
            votingDelay,
            votingPeriod,
            timelockDelay,
            proposalThreshold
        );

        // Fund the MerkleGov contract with ETH if specified
        if (fundingAmount > 0) {
            payable(address(merkleGov)).transfer(fundingAmount);
            console.log("Funded MerkleGov with", fundingAmount, "wei");
        }

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
        _json.serialize("quorum_basis_points", vm.toString(quorumBasisPoints));
        _json.serialize("proposal_threshold", vm.toString(proposalThreshold));
        _json.serialize("merkle_vote_timelock", vm.toString(initialTimelock));
        _json.serialize("gov_timelock_delay", vm.toString(timelockDelay));
        _json.serialize("funded_amount_wei", vm.toString(fundingAmount));
        string memory finalJson = _json.serialize("admin", Strings.toChecksumHexString(deployer));

        vm.writeFile(script_output_path, finalJson);
    }

    /**
     * @dev Alternative run function with default funding (0.1 ETH)
     * @param serviceManagerAddr The address of the service manager
     * @param rewardDistributorAddr The address of the reward distributor (for owner/updater role)
     */
    function run(string calldata serviceManagerAddr, string calldata rewardDistributorAddr) public {
        // Default funding amount of 0.1 ETH
        uint256 defaultFunding = 0.1 ether;
        run(serviceManagerAddr, rewardDistributorAddr, defaultFunding);
    }
}
