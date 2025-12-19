// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { stdJson } from 'forge-std/StdJson.sol';
import { console } from 'forge-std/console.sol';
import { Strings } from '@openzeppelin/contracts/utils/Strings.sol';

import { Common } from 'script/Common.s.sol';

// Safe contracts
import { GnosisSafe } from '@gnosis.pm/safe-contracts/GnosisSafe.sol';
import { Enum } from '@gnosis.pm/safe-contracts/common/Enum.sol';
import {
  GnosisSafeProxyFactory
} from '@gnosis.pm/safe-contracts/proxies/GnosisSafeProxyFactory.sol';

// Our modules
import {
  SignerSyncManagerModule
} from 'contracts/zodiac/SignerSyncManagerModule.sol';

// WAVS interfaces
import {
  IWavsServiceManager
} from '@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceManager.sol';

/// @dev Deployment script for Gnosis Safe with SignerSyncManagerModule
contract DeployScript is Common {
  using stdJson for string;

  string public root = vm.projectRoot();

  /**
   * @dev Deploys a Safe with SignerSyncManagerModule and auto-enables it
   * @param serviceManagerAddr The address of the WAVS service manager
   * @param fundingAmount The amount of Wei to fund the Safe with
   * @param env The environment suffix for the deployment file name
   * @param firstIndex The index of the first network to deploy
   * @param count How many networks to deploy
   */
  function run(
    string calldata serviceManagerAddr,
    uint256 fundingAmount,
    string calldata env,
    uint256 firstIndex,
    uint256 count
  ) public {
    // Parse WAVS service manager address
    IWavsServiceManager serviceManager = IWavsServiceManager(
      vm.parseAddress(serviceManagerAddr)
    );
    address deployer = vm.addr(_privateKey);

    vm.startBroadcast(_privateKey);

    for (uint256 i = firstIndex; i < firstIndex + count; i++) {
      string memory scriptOutputPath = string.concat(
        root,
        '/config/safe_zodiac_signer_sync_deploy_',
        env,
        '_',
        Strings.toString(i),
        '.json'
      );

      // Deploy Safe singleton and factory
      GnosisSafe safeSingleton = new GnosisSafe();
      GnosisSafeProxyFactory safeFactory = new GnosisSafeProxyFactory();

      // Setup with single signer (deployer) and threshold of 1
      address[] memory initialSigners = new address[](1);
      initialSigners[0] = deployer;
      uint256 threshold = 1;

      // Create Safe setup data
      bytes memory setupData = abi.encodeWithSignature(
        'setup(address[],uint256,address,bytes,address,address,uint256,address)',
        initialSigners,
        threshold,
        address(0), // to (for optional delegate call)
        '', // data (for optional delegate call)
        address(0), // fallback handler
        address(0), // payment token
        0, // payment
        address(0) // payment receiver
      );

      // Deploy Safe proxy with unique nonce
      address safeProxy = address(
        safeFactory.createProxyWithNonce(
          address(safeSingleton),
          setupData,
          uint256(
            keccak256(abi.encodePacked('SafeZodiacSignerSync', block.timestamp))
          )
        )
      );

      // Deploy Signer Sync Manager Module
      SignerSyncManagerModule signerSyncModule = new SignerSyncManagerModule(
        deployer,
        safeProxy,
        safeProxy,
        serviceManager
      );

      // Enable module on the Safe
      GnosisSafe safe = GnosisSafe(payable(safeProxy));
      bytes memory enableSignerModuleData = abi.encodeWithSignature(
        'enableModule(address)',
        address(signerSyncModule)
      );

      // For single signer with threshold 1, we can use a pre-approved signature
      // v=1 means the signature is approved by the signer (owner)
      // Create approved hash signature format: r=signer, s=0, v=1
      // This works because the signer is an owner and we're marking it as pre-approved
      bytes memory signature = abi.encodePacked(
        uint256(uint160(deployer)), // r = signer address padded to 32 bytes
        uint256(0), // s = 0 for approved hash
        uint8(1) // v = 1 for approved hash
      );

      // Enable Signer Manager Module
      bool moduleEnabled = safe.execTransaction(
        address(safe),
        0,
        enableSignerModuleData,
        Enum.Operation.Call,
        0,
        0,
        0,
        address(0),
        payable(0),
        signature
      );
      if (!moduleEnabled) {
        revert('Failed to enable Signer Manager Module');
      }

      // Fund the Safe with ETH
      if (fundingAmount > 0) {
        (bool fundingSuccess, ) = safeProxy.call{ value: fundingAmount }('');
        require(fundingSuccess, 'Failed to fund Safe');
      }

      // Write deployment results to JSON
      string memory rootJson = string.concat('json', Strings.toString(i));
      rootJson.serialize(
        'safe_factory',
        Strings.toChecksumHexString(address(safeFactory))
      );
      rootJson.serialize(
        'safe_singleton',
        Strings.toChecksumHexString(address(safeSingleton))
      );
      rootJson.serialize('safe_proxy', Strings.toChecksumHexString(safeProxy));
      rootJson.serialize(
        'signer_sync_manager',
        Strings.toChecksumHexString(address(signerSyncModule))
      );
      rootJson = vm.serializeUint(rootJson, 'funding_amount', fundingAmount);

      vm.writeFile(scriptOutputPath, rootJson);

      // Log success
      console.log(
        '================================================================================'
      );
      console.log(
        'SAFE ZODIAC SIGNER SYNC DEPLOYED',
        string.concat(' [index=', Strings.toString(i), ']')
      );
      console.log(
        '================================================================================'
      );
      console.log('');
      console.log('Safe:', Strings.toChecksumHexString(safeProxy));
      console.log(
        'Signer Sync Manager:',
        Strings.toChecksumHexString(address(signerSyncModule))
      );
      console.log('Funding:', fundingAmount / 1 ether, 'ETH');
      console.log(
        '================================================================================'
      );
    }

    vm.stopBroadcast();
  }
}
