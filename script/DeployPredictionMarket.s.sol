// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {stdJson} from "forge-std/StdJson.sol";
import {console} from "forge-std/console.sol";

import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {IWavsServiceManager} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceManager.sol";
import {ConditionalTokens} from "@lay3rlabs/conditional-tokens-contracts/ConditionalTokens.sol";
import {LMSRMarketMaker} from "@lay3rlabs/conditional-tokens-market-makers/LMSRMarketMaker.sol";

import {Common} from "script/Common.s.sol";

import {PredictionMarketOracleController} from "contracts/prediction_market/PredictionMarketOracleController.sol";
import {PredictionMarketFactory} from "contracts/prediction_market/PredictionMarketFactory.sol";
import {MockUSDC} from "contracts/tokens/MockUSDC.sol";

/// @dev Deployment script for Prediction Market contracts
contract DeployScript is Common {
    using stdJson for string;

    string public root = vm.projectRoot();
    string public script_output_path = string.concat(root, "/.docker/prediction_market_deploy.json");

    /**
     * @dev Deploys the Prediction Market contracts and creates an initial market
     * @param serviceManagerAddr The address of the service manager
     */
    function run(string calldata serviceManagerAddr) public {
        address serviceManager = vm.parseAddress(serviceManagerAddr);
        address deployer = vm.addr(_privateKey);

        // Market parameters
        uint64 fee = 5e16; // 5% fee
        uint256 funding = 1_000e18; // 1,000 collateral tokens
        string memory uri = "ipfs://QmXxx"; // Placeholder URI for market metadata
        bytes32 questionId = bytes32(0);

        vm.startBroadcast(_privateKey);

        // Deploy the oracle controller which also deploys the factory
        PredictionMarketOracleController oracleController = new PredictionMarketOracleController(serviceManager);
        PredictionMarketFactory factory = oracleController.factory();

        // Deploy collateral token for the market
        MockUSDC collateralToken = new MockUSDC();

        // Mint collateral tokens to deployer
        collateralToken.mint(deployer, funding * 10);

        // Approve factory to spend collateral tokens
        collateralToken.approve(address(factory), funding);

        // Create the conditional tokens and market maker
        (ConditionalTokens conditionalTokens, LMSRMarketMaker lmsrMarketMaker) =
            factory.createConditionalTokenAndLMSRMarketMaker(uri, questionId, address(collateralToken), fee, funding);

        vm.stopBroadcast();

        // Log deployment info
        console.log("PredictionMarketOracleController deployed at:", address(oracleController));
        console.log("PredictionMarketFactory deployed at:", address(factory));
        console.log("MockUSDC collateral token deployed at:", address(collateralToken));
        console.log("ConditionalTokens deployed at:", address(conditionalTokens));
        console.log("LMSRMarketMaker deployed at:", address(lmsrMarketMaker));
        console.log("Market funded with:", funding / 1e18, "tokens");
        console.log("Market fee:", fee / 1e16, "%");

        // Write deployment info to JSON
        string memory _json = "json";
        _json.serialize("service_manager", Strings.toChecksumHexString(serviceManager));
        _json.serialize("oracle_controller", Strings.toChecksumHexString(address(oracleController)));
        _json.serialize("factory", Strings.toChecksumHexString(address(factory)));
        _json.serialize("collateral_token", Strings.toChecksumHexString(address(collateralToken)));
        _json.serialize("conditional_tokens", Strings.toChecksumHexString(address(conditionalTokens)));
        _json.serialize("market_maker", Strings.toChecksumHexString(address(lmsrMarketMaker)));
        _json.serialize("initial_funding", funding);
        _json.serialize("fee_percentage", fee);
        _json.serialize("question_id", vm.toString(questionId));
        string memory finalJson = _json.serialize("market_uri", uri);

        vm.writeFile(script_output_path, finalJson);
    }
}
