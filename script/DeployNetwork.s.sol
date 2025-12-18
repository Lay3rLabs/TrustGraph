// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { stdJson } from 'forge-std/StdJson.sol';
import { console } from 'forge-std/console.sol';

import { Strings } from '@openzeppelin/contracts/utils/Strings.sol';
import {
  IWavsServiceManager
} from '@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceManager.sol';
import {
  ISchemaResolver
} from '@ethereum-attestation-service/eas-contracts/contracts/resolver/ISchemaResolver.sol';
import {
  IEAS
} from '@ethereum-attestation-service/eas-contracts/contracts/EAS.sol';

import { Common } from 'script/Common.s.sol';

import { MerkleSnapshot } from 'contracts/merkle/MerkleSnapshot.sol';
import {
  MerkleFundDistributor
} from 'contracts/merkle/MerkleFundDistributor.sol';
import { SchemaRegistrar } from 'contracts/eas/SchemaRegistrar.sol';
import {
  EASIndexerResolver
} from 'contracts/eas/resolvers/EASIndexerResolver.sol';

/// @dev Deployment script for network contracts
contract DeployScript is Common {
  using stdJson for string;

  string public root = vm.projectRoot();

  /**
   * @dev Deploys the contracts and writes the results to a JSON file
   * @param serviceManagerAddr The address of the service manager
   * @param easAddr The address of the EAS contract
   * @param schemaRegistrarAddr The address of the schema registrar contract
   * @param deployFundDistributor Whether to deploy the fund distributor contract
   * @param firstIndex The index of the first network to deploy
   * @param count How many networks to deploy
   */
  function run(
    string calldata serviceManagerAddr,
    string calldata easAddr,
    string calldata schemaRegistrarAddr,
    bool deployFundDistributor,
    uint256 firstIndex,
    uint256 count
  ) public {
    address serviceManager = vm.parseAddress(serviceManagerAddr);
    address eas = vm.parseAddress(easAddr);
    address schemaRegistrar = vm.parseAddress(schemaRegistrarAddr);

    vm.startBroadcast(_privateKey);

    for (uint256 i = firstIndex; i < firstIndex + count; i++) {
      string memory scriptOutputPath = string.concat(
        root,
        '/config/network_deploy_',
        Strings.toString(i),
        '.json'
      );

      string memory _contractsJson = string.concat(
        'contracts',
        Strings.toString(i)
      );
      string memory _schemasJson = string.concat(
        'schemas',
        Strings.toString(i)
      );

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

        _contractsJson.serialize(
          'fund_distributor',
          Strings.toChecksumHexString(address(merkleFundDistributor))
        );
      }

      EASIndexerResolver indexerResolver = new EASIndexerResolver(IEAS(eas));
      _contractsJson.serialize(
        'eas_indexer_resolver',
        Strings.toChecksumHexString(address(indexerResolver))
      );

      string memory finalContractsJson = _contractsJson.serialize(
        'merkle_snapshot',
        Strings.toChecksumHexString(address(merkleSnapshot))
      );

      // Vouching schema for weighted endorsements
      createSchema(
        _schemasJson,
        i,
        schemaRegistrar,
        address(indexerResolver),
        'vouching',
        'Vouch',
        'Weighted endorsement',
        'string comment,uint256 confidence',
        true
      );

      string memory finalSchemasJson = vm.serializeString(
        _schemasJson,
        '_',
        '_'
      );

      string memory rootJson = string.concat('root', Strings.toString(i));
      rootJson.serialize('contracts', finalContractsJson);
      rootJson = rootJson.serialize('schemas', finalSchemasJson);

      vm.writeFile(scriptOutputPath, rootJson);
    }

    vm.stopBroadcast();
  }

  /// @notice Create a new schema
  function createSchema(
    string memory schemasJson,
    uint256 index,
    address schemaRegistrar,
    address resolverAddr,
    string memory key,
    string memory name,
    string memory description,
    string memory schema,
    bool revocable
  ) public returns (bytes32) {
    string memory newSchemaJson = string.concat(
      key,
      '_',
      Strings.toString(index),
      '_schema_json'
    );

    bytes32 uid = SchemaRegistrar(schemaRegistrar).register(
      schema,
      ISchemaResolver(resolverAddr),
      revocable
    );
    console.log(key, 'schema ID:', vm.toString(uid));

    newSchemaJson.serialize('uid', vm.toString(uid));
    newSchemaJson.serialize('key', key);
    newSchemaJson.serialize('name', name);
    newSchemaJson.serialize('description', description);
    newSchemaJson.serialize('schema', schema);
    vm.serializeBool(newSchemaJson, 'revocable', revocable);
    newSchemaJson = newSchemaJson.serialize(
      'resolver',
      Strings.toChecksumHexString(resolverAddr)
    );

    // Add the new schema to the schemas JSON
    schemasJson.serialize(key, newSchemaJson);

    return uid;
  }
}
