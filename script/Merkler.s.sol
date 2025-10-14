// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {stdJson} from "forge-std/StdJson.sol";
import {console} from "forge-std/console.sol";

import {Common} from "script/Common.s.sol";

import {MerkleSnapshot} from "contracts/merkle/MerkleSnapshot.sol";
import {RewardDistributor} from "contracts/rewards/RewardDistributor.sol";
import {TEST} from "contracts/tokens/TEST.sol";

/// @dev Combined script to update merkle tree and claim rewards
contract Merkler is Common {
    using stdJson for string;

    /// @dev Update merkle tree by adding a trigger
    /// @param merkleSnapshotAddr Address of the MerkleSnapshot contract
    function updateMerkle(string calldata merkleSnapshotAddr) public {
        vm.startBroadcast(_privateKey);
        MerkleSnapshot merkleSnapshot = MerkleSnapshot(payable(vm.parseAddress(merkleSnapshotAddr)));

        uint64 triggerId = merkleSnapshot.trigger();
        console.log("TriggerId", triggerId);
        vm.stopBroadcast();
    }

    /// @dev Claim rewards using merkle proof
    /// @param rewardDistributorAddr Address of the RewardDistributor contract
    /// @param rewardTokenAddr Address of the reward token (TEST) contract
    function claimRewards(string calldata rewardDistributorAddr, string calldata rewardTokenAddr) public {
        address rewardTokenAddress = vm.parseAddress(rewardTokenAddr);

        vm.startBroadcast(_privateKey);
        RewardDistributor rewardDistributor = RewardDistributor(payable(vm.parseAddress(rewardDistributorAddr)));

        string memory ipfsHashCid = rewardDistributor.ipfsHashCid();

        // access IPFS_GATEWAY_URL from env
        string memory ipfsGatewayUrl = vm.envString("IPFS_GATEWAY_URL");
        string memory url = string.concat(ipfsGatewayUrl, ipfsHashCid);

        // Get the claimer address first
        address claimer = vm.addr(_privateKey);

        console.log("Merkle data URL: ", url);
        console.log("Claiming rewards...");
        // console.log(string.concat("curl -s -X GET ", url, " | jq -c .tree[0]"));

        // Query for the merkle entry for this specific claimer
        string memory claimerStr = vm.toString(claimer);
        string memory entry = runCmd(
            string.concat("curl -s -X GET ", url, " | jq -c '.tree[] | select(.account == \"", claimerStr, "\")'")
        );

        // Check if entry was found
        if (bytes(entry).length == 0) {
            console.log("No rewards found for address:", claimer);
            vm.stopBroadcast();
            return;
        }

        // Extract the claimable amount and proof
        uint256 claimable = vm.parseJsonUint(entry, ".value");
        bytes32[] memory proof = vm.parseJsonBytes32Array(entry, ".proof");

        console.log("Claimer:", claimer);
        console.log("Claimable:", claimable);

        // Claim rewards with proof
        TEST rewardToken = TEST(rewardTokenAddress);
        uint256 balanceBefore = rewardToken.balanceOf(claimer);
        uint256 claimed = rewardDistributor.claim(claimer, claimable, proof);
        uint256 balanceAfter = rewardToken.balanceOf(claimer);

        console.log("Balance before:", balanceBefore);
        console.log("Balance after:", balanceAfter);
        console.log("Claimed:", claimed);

        vm.stopBroadcast();
    }

    /// @dev Combined function to update rewards and then claim them
    /// @param merkleSnapshotAddr Address of the MerkleSnapshot contract
    /// @param rewardDistributorAddr Address of the RewardDistributor contract
    /// @param rewardTokenAddr Address of the reward token (TEST) contract
    function updateAndClaimRewards(
        string calldata merkleSnapshotAddr,
        string calldata rewardDistributorAddr,
        string calldata rewardTokenAddr
    ) public {
        updateMerkle(merkleSnapshotAddr);
        claimRewards(rewardDistributorAddr, rewardTokenAddr);
    }

    /// @dev Query current contract state information
    /// @param rewardDistributorAddr Address of the RewardDistributor contract
    function queryContractState(string calldata rewardDistributorAddr) public view {
        RewardDistributor rewardDistributor = RewardDistributor(payable(vm.parseAddress(rewardDistributorAddr)));

        bytes32 root = rewardDistributor.root();
        bytes32 ipfsHash = rewardDistributor.ipfsHash();
        string memory ipfsHashCid = rewardDistributor.ipfsHashCid();

        console.log("=== Contract State ===");
        console.log("Current Root:");
        console.logBytes32(root);
        console.log("");
        console.log("Current IPFS Hash:");
        console.logBytes32(ipfsHash);
        console.log("");
        console.log("Current IPFS Hash CID:");
        console.log(ipfsHashCid);
        console.log("=====================");
    }

    /// @dev Get the IPFS URI for the current merkle tree
    /// @param rewardDistributorAddr Address of the RewardDistributor contract
    function getIpfsUri(string calldata rewardDistributorAddr) public view returns (string memory) {
        RewardDistributor rewardDistributor = RewardDistributor(payable(vm.parseAddress(rewardDistributorAddr)));

        string memory ipfsHashCid = rewardDistributor.ipfsHashCid();
        string memory ipfsGatewayUrl = vm.envString("IPFS_GATEWAY_URL");
        string memory uri = string.concat(ipfsGatewayUrl, ipfsHashCid);

        console.log("IPFS URI:", uri);
        return uri;
    }

    /// @dev Query claim status for an address
    /// @param rewardDistributorAddr Address of the RewardDistributor contract
    /// @param rewardTokenAddr Address of the reward token
    /// @param account Address to check claim status for
    function queryClaimStatus(
        string calldata rewardDistributorAddr,
        string calldata rewardTokenAddr,
        string calldata account
    ) public view {
        RewardDistributor rewardDistributor = RewardDistributor(payable(vm.parseAddress(rewardDistributorAddr)));

        address accountAddr = vm.parseAddress(account);
        address rewardTokenAddress = vm.parseAddress(rewardTokenAddr);

        uint256 claimedAmount = rewardDistributor.claimed(accountAddr, rewardTokenAddress);

        console.log("=== Claim Status ===");
        console.log("Account:", accountAddr);
        console.log("Reward Token:", rewardTokenAddress);
        console.log("Already Claimed:", claimedAmount);
        console.log("===================");
    }

    /// @dev Get current balance of reward tokens for an address
    /// @param rewardTokenAddr Address of the reward token
    /// @param account Address to check balance for
    function queryBalance(string calldata rewardTokenAddr, string calldata account) public view {
        address accountAddr = vm.parseAddress(account);
        address rewardTokenAddress = vm.parseAddress(rewardTokenAddr);

        TEST rewardToken = TEST(rewardTokenAddress);
        uint256 balance = rewardToken.balanceOf(accountAddr);

        console.log("=== Token Balance ===");
        console.log("Account:", accountAddr);
        console.log("Token:", rewardTokenAddress);
        console.log("Balance:", balance);
        console.log("====================");
    }

    /// @dev Comprehensive query of all relevant information
    /// @param rewardDistributorAddr Address of the RewardDistributor contract
    /// @param rewardTokenAddr Address of the reward token
    /// @param account Address to check information for
    function queryAll(string calldata rewardDistributorAddr, string calldata rewardTokenAddr, string calldata account)
        public
        view
    {
        console.log("=== COMPREHENSIVE QUERY ===");
        console.log("");

        queryContractState(rewardDistributorAddr);
        console.log("");

        getIpfsUri(rewardDistributorAddr);
        console.log("");

        queryBalance(rewardTokenAddr, account);
        console.log("");

        queryClaimStatus(rewardDistributorAddr, rewardTokenAddr, account);
        console.log("");

        console.log("=== END COMPREHENSIVE QUERY ===");
    }

    // Run a command and return the output by creating a temporary script with
    // the entire command and running it via bash. This gets around the limits
    // of FFI, such as not being able to pipe between two commands.
    function runCmd(string memory cmd) internal returns (string memory) {
        string memory script = string.concat(vm.projectRoot(), "/.ffirun.sh");
        // Save the cmd to a file
        vm.writeFile(script, cmd);
        // Run the cmd
        string[] memory exec = new string[](2);
        exec[0] = "bash";
        exec[1] = script;
        string memory result = string(vm.ffi(exec));
        // Delete the file
        vm.removeFile(script);
        // Return the result
        return result;
    }
}
