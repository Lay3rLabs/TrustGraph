// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {stdJson} from "forge-std/StdJson.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

import {Common} from "script/Common.s.sol";

// Safe contracts
import {GnosisSafe} from "@gnosis.pm/safe-contracts/GnosisSafe.sol";
import {GnosisSafeProxyFactory} from "@gnosis.pm/safe-contracts/proxies/GnosisSafeProxyFactory.sol";

// Our modules
import {BasicZodiacModule} from "contracts/modules/BasicZodiacModule.sol";
import {SignerManagerModule} from "contracts/modules/SignerManagerModule.sol";

/// @dev Deployment script for Zodiac-enabled Safe setup
contract DeployZodiacSafes is Common {
    using stdJson for string;

    string public root = vm.projectRoot();
    string public script_output_path = string.concat(root, "/.docker/zodiac_safes_deploy.json");

    struct SafeDeployment {
        address safe;
        address basicModule;
        address signerModule;
        address[] initialSigners;
        uint256 threshold;
    }

    /**
     * @dev Deploys two Safes with Zodiac modules and writes the results to a JSON file
     */
    function run() public {
        address deployer = vm.addr(_privateKey);

        vm.startBroadcast(_privateKey);

        // Deploy Safe singleton and factory (if needed)
        GnosisSafe safeSingleton = new GnosisSafe();
        GnosisSafeProxyFactory safeFactory = new GnosisSafeProxyFactory();

        // Setup initial signers for both Safes
        address[] memory safe1Signers = new address[](3);
        safe1Signers[0] = deployer;
        safe1Signers[1] = address(0x1111111111111111111111111111111111111111);
        safe1Signers[2] = address(0x2222222222222222222222222222222222222222);

        address[] memory safe2Signers = new address[](2);
        safe2Signers[0] = deployer;
        safe2Signers[1] = address(0x3333333333333333333333333333333333333333);

        // Deploy first Safe with modules
        SafeDeployment memory safe1 = deployZodiacSafe(
            safeSingleton,
            safeFactory,
            safe1Signers,
            2, // threshold
            deployer,
            "Safe1"
        );

        // Deploy second Safe with modules
        SafeDeployment memory safe2 = deployZodiacSafe(
            safeSingleton,
            safeFactory,
            safe2Signers,
            2, // threshold
            deployer,
            "Safe2"
        );

        vm.stopBroadcast();

        // Write deployment results to JSON
        writeDeploymentResults(safe1, safe2, address(safeSingleton), address(safeFactory));
    }

    function deployZodiacSafe(
        GnosisSafe safeSingleton,
        GnosisSafeProxyFactory safeFactory,
        address[] memory signers,
        uint256 threshold,
        address moduleOwner,
        string memory safeName
    ) internal returns (SafeDeployment memory deployment) {
        // Create Safe setup data
        bytes memory setupData = abi.encodeWithSignature(
            "setup(address[],uint256,address,bytes,address,address,uint256,address)",
            signers,
            threshold,
            address(0), // to (for optional delegate call)
            "", // data (for optional delegate call)
            address(0), // fallback handler
            address(0), // payment token
            0, // payment
            address(0) // payment receiver
        );

        // Deploy Safe proxy
        address safeProxy = address(
            safeFactory.createProxyWithNonce(
                address(safeSingleton), setupData, uint256(keccak256(abi.encodePacked(safeName, block.timestamp)))
            )
        );

        // Deploy Basic Zodiac Module
        BasicZodiacModule basicModule = new BasicZodiacModule(moduleOwner, safeProxy, safeProxy);

        // Deploy Signer Manager Module
        SignerManagerModule signerModule = new SignerManagerModule(moduleOwner, safeProxy, safeProxy);

        // Enable modules on the Safe
        // Note: This would require the Safe to execute these transactions
        // In a real deployment, you'd need to create and execute Safe transactions
        // For now, we'll just deploy and return the addresses

        deployment = SafeDeployment({
            safe: safeProxy,
            basicModule: address(basicModule),
            signerModule: address(signerModule),
            initialSigners: signers,
            threshold: threshold
        });

        return deployment;
    }

    function writeDeploymentResults(
        SafeDeployment memory safe1,
        SafeDeployment memory safe2,
        address safeSingleton,
        address safeFactory
    ) internal {
        string memory _json = "json";

        // Safe 1 data
        _json.serialize("safe1_address", Strings.toHexString(safe1.safe));
        _json.serialize("safe1_basic_module", Strings.toHexString(safe1.basicModule));
        _json.serialize("safe1_signer_module", Strings.toHexString(safe1.signerModule));
        _json.serialize("safe1_threshold", safe1.threshold);

        // Safe 2 data
        _json.serialize("safe2_address", Strings.toHexString(safe2.safe));
        _json.serialize("safe2_basic_module", Strings.toHexString(safe2.basicModule));
        _json.serialize("safe2_signer_module", Strings.toHexString(safe2.signerModule));
        _json.serialize("safe2_threshold", safe2.threshold);

        // Factory data
        _json.serialize("safe_singleton", Strings.toHexString(safeSingleton));
        string memory finalJson = _json.serialize("safe_factory", Strings.toHexString(safeFactory));

        vm.writeFile(script_output_path, finalJson);
    }
}
