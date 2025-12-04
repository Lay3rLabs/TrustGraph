// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {stdJson} from "forge-std/StdJson.sol";

import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {
    IWavsServiceManager
} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceManager.sol";

import {Common} from "script/Common.s.sol";

import {MerkleSnapshot} from "contracts/merkle/MerkleSnapshot.sol";
import {
    MerkleFundDistributor
} from "contracts/merkle/MerkleFundDistributor.sol";
import {TEST} from "contracts/tokens/TEST.sol";

/// @dev Deployment script for MerklerSnapshot and MerkleFundDistributor contracts
contract DeployScript is Common {
    using stdJson for string;

    string public root = vm.projectRoot();
    string public script_output_path =
        string.concat(root, "/.docker/merkler_deploy.json");

    /**
     * @dev Deploys the MerkleSnapshot contract (and potentially the MerkleFundDistributor contract) and writes the results to a JSON file
     * @param serviceManagerAddr The address of the service manager
     * @param deployMerkleFundDistributor Whether to deploy the MerkleFundDistributor contract
     */
    function run(
        string calldata serviceManagerAddr,
        bool deployMerkleFundDistributor
    ) public {
        string memory _json = "json";

        address serviceManager = vm.parseAddress(serviceManagerAddr);

        vm.startBroadcast(_privateKey);

        // Create the merkle snapshot contract
        MerkleSnapshot merkleSnapshot = new MerkleSnapshot(
            IWavsServiceManager(serviceManager)
        );

        if (deployMerkleFundDistributor) {
            // Deploy TEST token.
            address deployer = vm.addr(_privateKey);
            TEST testToken = new TEST(
                deployer, // defaultAdmin
                deployer, // tokenBridge
                deployer, // pauser
                deployer // minter
            );

            // Create the distributor and add it as a hook to the merkle snapshot.
            MerkleFundDistributor merkleFundDistributor = new MerkleFundDistributor(
                    deployer, // owner
                    address(merkleSnapshot), // merkle snapshot
                    deployer, // fee recipient
                    3e16, // 3% fee
                    false // disable allowlist
                );

            // Mint tokens for the distributor to distribute.
            testToken.mint(address(merkleFundDistributor), 1000 ether);

            _json.serialize(
                "fund_distributor",
                Strings.toChecksumHexString(address(merkleFundDistributor))
            );
            _json.serialize(
                "token",
                Strings.toChecksumHexString(address(testToken))
            );
        }

        string memory finalJson = _json.serialize(
            "merkle_snapshot",
            Strings.toChecksumHexString(address(merkleSnapshot))
        );

        vm.stopBroadcast();

        vm.writeFile(script_output_path, finalJson);
    }
}
