// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { stdJson } from 'forge-std/StdJson.sol';

import { Strings } from '@openzeppelin/contracts/utils/Strings.sol';
import {
  IWavsServiceManager
} from '@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceManager.sol';

import { Common } from 'script/Common.s.sol';

import { MerkleSnapshot } from 'contracts/merkle/MerkleSnapshot.sol';
import {
  MerkleFundDistributor
} from 'contracts/merkle/MerkleFundDistributor.sol';

/// @dev Deployment script for MerklerSnapshot and MerkleFundDistributor contracts
contract DeployScript is Common {
  using stdJson for string;

  string public root = vm.projectRoot();
  string public script_output_path =
    string.concat(root, '/.docker/merkler_deploy.json');

  /**
   * @dev Deploys the MerkleSnapshot and MerkleFundDistributor contracts and writes the results to a JSON file
   * @param serviceManagerAddr The address of the service manager
   * @param deployFundDistributor Whether to deploy the fund distributor contract
   */
  function run(
    string calldata serviceManagerAddr,
    bool deployFundDistributor
  ) public {
    string memory _json = 'json';

    address serviceManager = vm.parseAddress(serviceManagerAddr);

    vm.startBroadcast(_privateKey);

    // Create the merkle snapshot contract
    MerkleSnapshot merkleSnapshot = new MerkleSnapshot(
      IWavsServiceManager(serviceManager)
    );

    address deployer = vm.addr(_privateKey);

    // Create the distributor.
    if (deployFundDistributor) {
      MerkleFundDistributor merkleFundDistributor = new MerkleFundDistributor(
        deployer, // owner
        address(merkleSnapshot), // merkle snapshot
        deployer, // fee recipient
        3e16, // 3% fee
        false // disable allowlist
      );

      _json.serialize(
        'fund_distributor',
        Strings.toChecksumHexString(address(merkleFundDistributor))
      );
    }

    string memory finalJson = _json.serialize(
      'merkle_snapshot',
      Strings.toChecksumHexString(address(merkleSnapshot))
    );

    vm.stopBroadcast();

    vm.writeFile(script_output_path, finalJson);
  }
}
