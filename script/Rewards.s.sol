// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {stdJson} from "forge-std/StdJson.sol";
import {console} from "forge-std/console.sol";

import {Common} from "script/Common.s.sol";

import {RewardDistributor} from "contracts/RewardDistributor.sol";
import {ENOVA} from "contracts/ERC20.sol";
import {ITypes} from "interfaces/ITypes.sol";

/// @dev Combined script to update and claim rewards
contract Rewards is Common {
    using stdJson for string;

    /// @dev Update rewards by adding a trigger
    /// @param rewardDistributorAddr Address of the RewardDistributor contract
    function updateRewards(string calldata rewardDistributorAddr) public {
        vm.startBroadcast(_privateKey);
        RewardDistributor rewardDistributor = RewardDistributor(
            payable(vm.parseAddress(rewardDistributorAddr))
        );

        rewardDistributor.addTrigger();
        ITypes.TriggerId triggerId = rewardDistributor.nextTriggerId();
        console.log("TriggerId", ITypes.TriggerId.unwrap(triggerId));
        vm.stopBroadcast();
    }

    /// @dev Claim rewards using merkle proof
    /// @param rewardDistributorAddr Address of the RewardDistributor contract
    /// @param rewardTokenAddr Address of the reward token (ENOVA) contract
    function claimRewards(
        string calldata rewardDistributorAddr,
        string calldata rewardTokenAddr
    ) public {
        address rewardTokenAddress = vm.parseAddress(rewardTokenAddr);

        vm.startBroadcast(_privateKey);
        RewardDistributor rewardDistributor = RewardDistributor(
            payable(vm.parseAddress(rewardDistributorAddr))
        );

        ITypes.TriggerId triggerId = rewardDistributor.nextTriggerId();
        console.log(
            "Fetching data for TriggerId",
            ITypes.TriggerId.unwrap(triggerId)
        );

        bytes memory data = rewardDistributor.getData(triggerId);

        ITypes.AvsOutput memory avsOutput = abi.decode(
            data,
            (ITypes.AvsOutput)
        );

        bytes32 root = rewardDistributor.root();
        bytes32 ipfsHash = rewardDistributor.ipfsHash();
        string memory ipfsHashCid = rewardDistributor.ipfsHashCid();

        if (root == avsOutput.root && ipfsHash == avsOutput.ipfsHashData) {
            console.log(
                "Trigger executed successfully, root and ipfsHash match. This means the last rewards update occurred due to a manual trigger."
            );
            console.log("");
            console.log("--------------------------------");
            console.log("root:");
            console.logBytes32(root);
            console.log("");
            console.log("ipfsHash:");
            console.logBytes32(ipfsHash);
            console.log("ipfsHashCid:");
            console.log(ipfsHashCid);
            console.log("--------------------------------");
            console.log("");
        } else {
            console.log(
                "Trigger failed, root or ipfsHash mismatch. This will happen if the last rewards update occurred due to a cron schedule and not a manual trigger."
            );
            console.log("");
            console.log("--------------------------------");
            console.log("");
            console.log("contract root:");
            console.logBytes32(root);
            console.log("");
            console.log("contract ipfsHash:");
            console.logBytes32(ipfsHash);
            console.log("contract ipfsHashCid:");
            console.log(ipfsHashCid);
            console.log("");
            console.log("--------------------------------");
            console.log("");
            console.log("avsOutput.root:");
            console.logBytes32(avsOutput.root);
            console.log("");
            console.log("avsOutput.ipfsHashData:");
            console.logBytes32(avsOutput.ipfsHashData);
            console.log("");
            console.log("avsOutput.ipfsHash:");
            console.log(avsOutput.ipfsHash);
            console.log("");
            console.log("--------------------------------");
            console.log("");
        }

        // access IPFS_GATEWAY_URL from env
        string memory ipfsGatewayUrl = vm.envString("IPFS_GATEWAY_URL");
        string memory url = string.concat(ipfsGatewayUrl, ipfsHashCid);

        console.log("Merkle data URL: ", url);
        console.log("Claiming rewards...");

        // Query for the merkle entry
        string memory entry = runCmd(
            string.concat("curl -s ", url, " | jq -c .tree[0]")
        );

        // Extract the claimable amount and proof
        uint256 claimable = vm.parseJsonUint(entry, ".claimable");
        bytes32[] memory proof = vm.parseJsonBytes32Array(entry, ".proof");

        console.log("Claimable:", claimable);

        // Claim rewards with proof
        address claimer = vm.addr(_privateKey);
        ENOVA rewardToken = ENOVA(rewardTokenAddress);
        uint256 balanceBefore = rewardToken.balanceOf(claimer);
        uint256 claimed = rewardDistributor.claim(
            claimer,
            rewardTokenAddress,
            claimable,
            proof
        );
        uint256 balanceAfter = rewardToken.balanceOf(claimer);

        console.log("Balance before:", balanceBefore);
        console.log("Balance after:", balanceAfter);
        console.log("Claimed:", claimed);

        vm.stopBroadcast();
    }

    /// @dev Combined function to update rewards and then claim them
    /// @param rewardDistributorAddr Address of the RewardDistributor contract
    /// @param rewardTokenAddr Address of the reward token (ENOVA) contract
    function updateAndClaimRewards(
        string calldata rewardDistributorAddr,
        string calldata rewardTokenAddr
    ) public {
        updateRewards(rewardDistributorAddr);
        claimRewards(rewardDistributorAddr, rewardTokenAddr);
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
