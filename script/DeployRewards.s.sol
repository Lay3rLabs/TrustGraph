// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {stdJson} from "forge-std/StdJson.sol";

import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {IWavsServiceManager} from "@wavs/interfaces/IWavsServiceManager.sol";

import {Common} from "script/Common.s.sol";

import {RewardDistributor} from "contracts/RewardDistributor.sol";
import {ENOVA} from "contracts/ERC20.sol";

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

        // Deploy ENOVA token and mint tokens for the distributor.
        address deployer = vm.addr(_privateKey);
        ENOVA rewardToken = new ENOVA(
            deployer, // defaultAdmin
            deployer, // tokenBridge
            deployer, // pauser
            deployer // minter
        );
        rewardToken.mint(address(rewardDistributor), 1000 ether);

        vm.stopBroadcast();

        string memory _json = "json";
        _json.serialize(
            "reward_distributor",
            Strings.toChecksumHexString(address(rewardDistributor))
        );
        string memory finalJson = _json.serialize(
            "reward_token",
            Strings.toChecksumHexString(address(rewardToken))
        );

        vm.writeFile(script_output_path, finalJson);
    }
}
