// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {stdJson} from "forge-std/StdJson.sol";

import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {IWavsServiceManager} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceManager.sol";

import {Common} from "script/Common.s.sol";

import {MerkleSnapshot} from "contracts/merkle/MerkleSnapshot.sol";
import {RewardDistributor} from "contracts/rewards/RewardDistributor.sol";
import {TEST} from "contracts/tokens/TEST.sol";

/// @dev Deployment script for MerklerSnapshot and RewardDistributor contracts
contract DeployScript is Common {
    using stdJson for string;

    string public root = vm.projectRoot();
    string public script_output_path = string.concat(root, "/.docker/merkler_deploy.json");

    /**
     * @dev Deploys the MerkleSnapshot contract (and potentially the RewardDistributor contract) and writes the results to a JSON file
     * @param serviceManagerAddr The address of the service manager
     * @param deployRewardDistributor Whether to deploy the RewardDistributor contract
     */
    function run(string calldata serviceManagerAddr, bool deployRewardDistributor) public {
        string memory _json = "json";

        address serviceManager = vm.parseAddress(serviceManagerAddr);

        vm.startBroadcast(_privateKey);

        // Create the merkle snapshot contract
        MerkleSnapshot merkleSnapshot = new MerkleSnapshot(IWavsServiceManager(serviceManager));

        if (deployRewardDistributor) {
            // Deploy TEST token.
            address deployer = vm.addr(_privateKey);
            TEST rewardToken = new TEST(
                deployer, // defaultAdmin
                deployer, // tokenBridge
                deployer, // pauser
                deployer // minter
            );

            // Create the distributor and add it as a hook to the merkle snapshot.
            RewardDistributor rewardDistributor = new RewardDistributor(address(rewardToken), address(merkleSnapshot));
            merkleSnapshot.addHook(rewardDistributor);

            // Mint tokens for the distributor to distribute.
            rewardToken.mint(address(rewardDistributor), 1000 ether);

            _json.serialize("reward_distributor", Strings.toChecksumHexString(address(rewardDistributor)));
            _json.serialize("reward_token", Strings.toChecksumHexString(address(rewardToken)));
        }

        string memory finalJson =
            _json.serialize("merkle_snapshot", Strings.toChecksumHexString(address(merkleSnapshot)));

        vm.stopBroadcast();

        vm.writeFile(script_output_path, finalJson);
    }
}
