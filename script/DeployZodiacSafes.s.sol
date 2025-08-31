// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {stdJson} from "forge-std/StdJson.sol";
import {console} from "forge-std/console.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

import {Common} from "script/Common.s.sol";

// Safe contracts
import {GnosisSafe} from "@gnosis.pm/safe-contracts/GnosisSafe.sol";
import {Enum} from "@gnosis.pm/safe-contracts/common/Enum.sol";
import {GnosisSafeProxyFactory} from "@gnosis.pm/safe-contracts/proxies/GnosisSafeProxyFactory.sol";

// Our modules
import {MerkleGovModule} from "contracts/zodiac/MerkleGovModule.sol";
import {SignerManagerModule} from "contracts/zodiac/SignerManagerModule.sol";
import {WavsModule} from "contracts/zodiac/WavsModule.sol";

// WAVS interfaces
import {IWavsServiceManager} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceManager.sol";

/// @dev Deployment script for Zodiac-enabled Safe setup with auto-enabled modules
contract DeployZodiacSafes is Common {
    using stdJson for string;

    string public root = vm.projectRoot();
    string public script_output_path = string.concat(root, "/.docker/zodiac_safes_deploy.json");

    struct SafeDeployment {
        address safe;
        address merkleGovModule;
        address signerModule;
        address wavsModule;
        address[] initialSigners;
        uint256 threshold;
        bool modulesEnabled;
        uint256 fundingAmount;
    }

    /**
     * @dev Deploys two Safes with Zodiac modules and auto-enables them
     * @notice Safe 1 gets SignerManagerModule and MerkleGovModule, Safe 2 gets WavsModule
     * @param serviceManagerAddr The address of the WAVS service manager
     */
    function run(string calldata serviceManagerAddr) public {
        address deployer = vm.addr(_privateKey);

        vm.startBroadcast(_privateKey);

        // Parse WAVS service manager address
        IWavsServiceManager serviceManager = IWavsServiceManager(vm.parseAddress(serviceManagerAddr));

        // Deploy Safe singleton and factory (if needed)
        GnosisSafe safeSingleton = new GnosisSafe();
        GnosisSafeProxyFactory safeFactory = new GnosisSafeProxyFactory();

        // Deploy first Safe with SignerManagerModule and MerkleGovModule
        SafeDeployment memory safe1 =
            deployZodiacSafeWithSignerAndMerkle(safeSingleton, safeFactory, deployer, serviceManager, "Safe1");

        // Deploy second Safe with WavsModule
        SafeDeployment memory safe2 =
            deployZodiacSafeWithWavs(safeSingleton, safeFactory, deployer, serviceManager, "Safe2");

        vm.stopBroadcast();

        // Write deployment results to JSON
        writeDeploymentResults(safe1, safe2, address(safeSingleton), address(safeFactory));
    }

    function deployZodiacSafeWithSignerAndMerkle(
        GnosisSafe safeSingleton,
        GnosisSafeProxyFactory safeFactory,
        address deployer,
        IWavsServiceManager serviceManager,
        string memory safeName
    ) internal returns (SafeDeployment memory deployment) {
        // Setup with single signer (deployer) and threshold of 1 for easy module enablement
        address[] memory initialSigners = new address[](1);
        initialSigners[0] = deployer;
        uint256 threshold = 1;

        // Create Safe setup data
        bytes memory setupData = abi.encodeWithSignature(
            "setup(address[],uint256,address,bytes,address,address,uint256,address)",
            initialSigners,
            threshold,
            address(0), // to (for optional delegate call)
            "", // data (for optional delegate call)
            address(0), // fallback handler
            address(0), // payment token
            0, // payment
            address(0) // payment receiver
        );

        // Deploy Safe proxy with unique nonce
        address safeProxy = address(
            safeFactory.createProxyWithNonce(
                address(safeSingleton), setupData, uint256(keccak256(abi.encodePacked(safeName, block.timestamp)))
            )
        );

        // Deploy Merkle Gov Module
        MerkleGovModule merkleGovModule = new MerkleGovModule(deployer, safeProxy, safeProxy, serviceManager);

        // Deploy Signer Manager Module
        SignerManagerModule signerModule = new SignerManagerModule(deployer, safeProxy, safeProxy, serviceManager);

        // Enable modules on the Safe
        // Since we have threshold of 1 and deployer is the signer, we can execute directly
        GnosisSafe safe = GnosisSafe(payable(safeProxy));

        // Prepare module enablement transactions
        bytes memory enableMerkleGovModuleData =
            abi.encodeWithSignature("enableModule(address)", address(merkleGovModule));
        bytes memory enableSignerModuleData = abi.encodeWithSignature("enableModule(address)", address(signerModule));

        // Execute module enablement as the Safe (threshold is 1, deployer can execute)
        bytes memory signature = generateSignature(deployer, safe, address(safe), enableMerkleGovModuleData);

        // Enable Merkle Gov Module
        bool success1 = safe.execTransaction(
            address(safe), // to
            0, // value
            enableMerkleGovModuleData, // data
            Enum.Operation.Call, // operation
            0, // safeTxGas
            0, // baseGas
            0, // gasPrice
            address(0), // gasToken
            payable(0), // refundReceiver
            signature // signatures
        );

        // Enable Signer Manager Module
        signature = generateSignature(deployer, safe, address(safe), enableSignerModuleData);
        bool success2 = safe.execTransaction(
            address(safe), // to
            0, // value
            enableSignerModuleData, // data
            Enum.Operation.Call, // operation
            0, // safeTxGas
            0, // baseGas
            0, // gasPrice
            address(0), // gasToken
            payable(0), // refundReceiver
            signature // signatures
        );

        // Fund the Safe with ETH
        uint256 fundingAmount = 2 ether;
        (bool fundingSuccess,) = safeProxy.call{value: fundingAmount}("");
        require(fundingSuccess, "Failed to fund Safe");

        deployment = SafeDeployment({
            safe: safeProxy,
            merkleGovModule: address(merkleGovModule),
            signerModule: address(signerModule),
            wavsModule: address(0), // No WavsModule for Safe 1
            initialSigners: initialSigners,
            threshold: threshold,
            modulesEnabled: success1 && success2,
            fundingAmount: fundingAmount
        });

        // Log the deployment and enablement status
        if (deployment.modulesEnabled) {
            emit Safe1ModulesEnabled(safeProxy, address(merkleGovModule), address(signerModule));
        }

        return deployment;
    }

    function deployZodiacSafeWithWavs(
        GnosisSafe safeSingleton,
        GnosisSafeProxyFactory safeFactory,
        address deployer,
        IWavsServiceManager serviceManager,
        string memory safeName
    ) internal returns (SafeDeployment memory deployment) {
        // Setup with single signer (deployer) and threshold of 1 for easy module enablement
        address[] memory initialSigners = new address[](1);
        initialSigners[0] = deployer;
        uint256 threshold = 1;

        // Create Safe setup data
        bytes memory setupData = abi.encodeWithSignature(
            "setup(address[],uint256,address,bytes,address,address,uint256,address)",
            initialSigners,
            threshold,
            address(0), // to (for optional delegate call)
            "", // data (for optional delegate call)
            address(0), // fallback handler
            address(0), // payment token
            0, // payment
            address(0) // payment receiver
        );

        // Deploy Safe proxy with unique nonce
        address safeProxy = address(
            safeFactory.createProxyWithNonce(
                address(safeSingleton), setupData, uint256(keccak256(abi.encodePacked(safeName, block.timestamp)))
            )
        );

        // Deploy WAVS Module
        // Parameters: owner, avatar, target, serviceManager, strictNonceOrdering
        WavsModule wavsModule = new WavsModule(
            deployer, // owner
            safeProxy, // avatar (the Safe)
            safeProxy, // target (the Safe)
            serviceManager, // WAVS service manager
            false // strictNonceOrdering (false for flexibility)
        );

        // Enable the WavsModule on the Safe
        GnosisSafe safe = GnosisSafe(payable(safeProxy));

        // Prepare module enablement transaction
        bytes memory enableWavsModuleData = abi.encodeWithSignature("enableModule(address)", address(wavsModule));

        // Execute module enablement as the Safe (threshold is 1, deployer can execute)
        bytes memory signature = generateSignature(deployer, safe, address(safe), enableWavsModuleData);

        // Enable WAVS Module
        bool success = safe.execTransaction(
            address(safe), // to
            0, // value
            enableWavsModuleData, // data
            Enum.Operation.Call, // operation
            0, // safeTxGas
            0, // baseGas
            0, // gasPrice
            address(0), // gasToken
            payable(0), // refundReceiver
            signature // signatures
        );

        // Fund the Safe with ETH
        uint256 fundingAmount = 2 ether;
        (bool fundingSuccess,) = safeProxy.call{value: fundingAmount}("");
        require(fundingSuccess, "Failed to fund Safe");

        deployment = SafeDeployment({
            safe: safeProxy,
            merkleGovModule: address(0), // No MerkleGovModule for Safe 2
            signerModule: address(0), // No SignerModule for Safe 2
            wavsModule: address(wavsModule),
            initialSigners: initialSigners,
            threshold: threshold,
            modulesEnabled: success,
            fundingAmount: fundingAmount
        });

        // Log the deployment and enablement status
        if (deployment.modulesEnabled) {
            emit Safe2ModulesEnabled(safeProxy, address(wavsModule));
        }

        return deployment;
    }

    /// @notice Generate a signature for Safe transaction execution
    /// @dev Creates an approved hash signature (v=1) for single signer execution
    function generateSignature(address signer, GnosisSafe safe, address to, bytes memory data)
        internal
        view
        returns (bytes memory)
    {
        // For single signer with threshold 1, we can use a pre-approved signature
        // v=1 means the signature is approved by the signer (owner)
        bytes32 dataHash = safe.getTransactionHash(
            to, // to
            0, // value
            data, // data
            Enum.Operation.Call, // operation
            0, // safeTxGas
            0, // baseGas
            0, // gasPrice
            address(0), // gasToken
            payable(0), // refundReceiver
            safe.nonce() // nonce
        );

        // Create approved hash signature format: r=signer, s=0, v=1
        // This works because the signer is an owner and we're marking it as pre-approved
        bytes memory signature = abi.encodePacked(
            uint256(uint160(signer)), // r = signer address padded to 32 bytes
            uint256(0), // s = 0 for approved hash
            uint8(1) // v = 1 for approved hash
        );

        return signature;
    }

    function writeDeploymentResults(
        SafeDeployment memory safe1,
        SafeDeployment memory safe2,
        address safeSingleton,
        address safeFactory
    ) internal {
        string memory jsonKey = "deployment";

        // Add deployment note
        vm.serializeString(
            jsonKey,
            "deployment_note",
            "Safe 1 has SignerManagerModule and MerkleGovModule. Safe 2 has WavsModule. Both deployed with single signer for easy setup."
        );

        // Safe 1 data
        vm.serializeString(jsonKey, "safe1_address", Strings.toHexString(safe1.safe));
        vm.serializeString(jsonKey, "safe1_merkle_gov_module", Strings.toHexString(safe1.merkleGovModule));
        vm.serializeString(jsonKey, "safe1_signer_module", Strings.toHexString(safe1.signerModule));
        vm.serializeUint(jsonKey, "safe1_threshold", safe1.threshold);
        vm.serializeBool(jsonKey, "safe1_modules_enabled", safe1.modulesEnabled);
        vm.serializeUint(jsonKey, "safe1_funding_amount", safe1.fundingAmount);

        // Safe 2 data
        vm.serializeString(jsonKey, "safe2_address", Strings.toHexString(safe2.safe));
        vm.serializeString(jsonKey, "safe2_wavs_module", Strings.toHexString(safe2.wavsModule));
        vm.serializeUint(jsonKey, "safe2_threshold", safe2.threshold);
        vm.serializeBool(jsonKey, "safe2_modules_enabled", safe2.modulesEnabled);
        vm.serializeUint(jsonKey, "safe2_funding_amount", safe2.fundingAmount);

        // Factory data
        vm.serializeString(jsonKey, "safe_singleton", Strings.toHexString(safeSingleton));
        string memory finalJson = vm.serializeString(jsonKey, "safe_factory", Strings.toHexString(safeFactory));

        // Write to file
        vm.writeFile(script_output_path, finalJson);

        // Log success message
        console.log("================================================================================");
        console.log("ZODIAC SAFES DEPLOYED AND CONFIGURED");
        console.log("================================================================================");
        console.log("");
        console.log("Safe 1 (SignerManager + MerkleGov):");
        console.log("  Address:", safe1.safe);
        console.log("  Balance:", safe1.fundingAmount / 1 ether, "ETH");
        console.log("  Merkle Gov Module:", safe1.merkleGovModule, safe1.modulesEnabled ? "(ENABLED)" : "(NOT ENABLED)");
        console.log("  Signer Module:", safe1.signerModule, safe1.modulesEnabled ? "(ENABLED)" : "(NOT ENABLED)");
        console.log("");
        console.log("Safe 2 (WAVS Module):");
        console.log("  Address:", safe2.safe);
        console.log("  Balance:", safe2.fundingAmount / 1 ether, "ETH");
        console.log("  WAVS Module:", safe2.wavsModule, safe2.modulesEnabled ? "(ENABLED)" : "(NOT ENABLED)");
        console.log("");
        console.log("Module Capabilities:");
        console.log("- Safe 1: Can add/remove signers and execute governance proposals via Merkle proofs");
        console.log("- Safe 2: Can execute arbitrary transactions received through the WAVS service");
        console.log("");
        console.log("Next Steps:");
        console.log("1. Each Safe has been funded with 2 ETH and modules are enabled!");
        console.log("2. For Safe 1: Use SignerManagerModule.addSigner() to add more signers");
        console.log("3. For Safe 1: Use SignerManagerModule.changeThreshold() to update threshold");
        console.log("4. For Safe 2: Submit transaction payloads through WAVS service for execution");
        console.log("");
        console.log("Example: Add a new signer to Safe 1 with threshold 2:");
        console.log("  signerModule.addSigner(newSignerAddress, 2);");
        console.log("");
        console.log("Example: Execute transactions on Safe 2 via WAVS:");
        console.log("  Submit TransactionPayload to WAVS service with proper signatures");
        console.log("================================================================================");
    }

    // Events for logging
    event Safe1ModulesEnabled(address indexed safe, address indexed merkleGovModule, address indexed signerModule);
    event Safe2ModulesEnabled(address indexed safe, address indexed wavsModule);
}
