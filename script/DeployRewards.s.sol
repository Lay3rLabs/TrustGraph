// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {stdJson} from "forge-std/StdJson.sol";

import {Strings} from "@openzeppelin-contracts/utils/Strings.sol";
import {IWavsServiceManager} from "@wavs/interfaces/IWavsServiceManager.sol";

import {Common} from "script/Common.s.sol";

import {RewardDistributor} from "contracts/RewardDistributor.sol";
// TODO we don't need reward source NFT anymore?
import {RewardToken} from "contracts/RewardToken.sol";
import {RewardSourceNft} from "contracts/RewardSourceNft.sol";

/// @dev Deployment script for RewardDistributor contract
contract DeployScript is Common {
    using stdJson for string;

    string public root = vm.projectRoot();
    string public script_output_path =
        string.concat(root, "/.docker/rewards_deploy.json");

    /**
     * @dev Deploys the RewardDistributor contract and writes the results to a JSON file
     * @param serviceManagerAddr The address of the service manager
     */
    function run(string calldata serviceManagerAddr) public {
        address serviceManager = vm.parseAddress(serviceManagerAddr);

        vm.startBroadcast(_privateKey);

        // Create the distributor which handles WAVS stuff.
        RewardDistributor rewardDistributor = new RewardDistributor(
            IWavsServiceManager(serviceManager)
        );

        // Mint reward tokens for the distributor.
        RewardToken rewardToken = new RewardToken();
        rewardToken.mint{value: 1000 ether}(address(rewardDistributor));

        // Deploy the NFT contract
        RewardSourceNft nft = new RewardSourceNft();
        // Mint 3 NFTs to the deployer.
        address deployer = vm.addr(_privateKey);
        nft.mint(deployer, 1);
        nft.mint(deployer, 2);
        nft.mint(deployer, 3);

        vm.stopBroadcast();

        string memory _json = "json";
        _json.serialize(
            "reward_distributor",
            Strings.toChecksumHexString(address(rewardDistributor))
        );
        _json.serialize(
            "reward_token",
            Strings.toChecksumHexString(address(rewardToken))
        );
        string memory finalJson = _json.serialize(
            "reward_source_nft",
            Strings.toChecksumHexString(address(nft))
        );

        vm.writeFile(script_output_path, finalJson);
    }
}
