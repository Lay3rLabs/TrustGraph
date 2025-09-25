// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {stdJson} from "forge-std/StdJson.sol";
import {console} from "forge-std/console.sol";

import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {ConditionalTokens} from "@lay3rlabs/conditional-tokens-contracts/ConditionalTokens.sol";
import {LMSRMarketMaker} from "@lay3rlabs/conditional-tokens-market-makers/LMSRMarketMaker.sol";
import {IERC20} from "forge-std/interfaces/IERC20.sol";

import {Common} from "script/Common.s.sol";

import {PredictionMarketController} from "contracts/prediction_market/PredictionMarketController.sol";
import {MockUSDC} from "contracts/tokens/MockUSDC.sol";

/// @dev Deployment script for Prediction Market contracts
contract DeployScript is Common {
    using stdJson for string;

    string public root = vm.projectRoot();
    string public script_output_path =
        string.concat(root, "/.docker/prediction_market_deploy.json");

    /**
     * @dev Deploys the Prediction Market contracts and creates an initial market
     * @param serviceManagerAddr The address of the service manager
     * @param collateralTokenAddr The address of the collateral token (if 0, a new MockUSDC will be deployed)
     */
    function run(
        string calldata serviceManagerAddr,
        string calldata collateralTokenAddr
    ) public {
        address serviceManager = vm.parseAddress(serviceManagerAddr);
        address collateralToken = vm.parseAddress(collateralTokenAddr);
        address deployer = vm.addr(_privateKey);

        // Market parameters
        uint64 fee = 1e16; // 1% fee
        uint256 funding = 100e6; // 100 collateral tokens
        string memory uri = ""; // Market metadata URI
        bytes32 questionId = bytes32(0);

        vm.startBroadcast(_privateKey);

        // Deploy the controller.
        PredictionMarketController controller = new PredictionMarketController(
            serviceManager
        );

        // Deploy and mint fake collateral token if no address provided.
        bool createMockUSDC = collateralToken == address(0);
        if (createMockUSDC) {
            // Deploy collateral token for the market
            collateralToken = address(new MockUSDC());

            // Mint collateral tokens to deployer
            MockUSDC(collateralToken).mint(deployer, funding * 10);
        }

        // Approve controller to spend collateral tokens
        IERC20(collateralToken).approve(address(controller), funding);

        // Create the conditional tokens and market maker
        (
            ConditionalTokens conditionalTokens,
            LMSRMarketMaker lmsrMarketMaker
        ) = controller.createConditionalTokenAndLMSRMarketMaker(
                uri,
                questionId,
                address(collateralToken),
                fee,
                funding
            );

        vm.stopBroadcast();

        // Log deployment info
        console.log(
            "PredictionMarketController deployed at:",
            address(controller)
        );
        if (createMockUSDC) {
            console.log(
                "MockUSDC collateral token deployed at:",
                address(collateralToken)
            );
        } else {
            console.log("Collateral token provided:", address(collateralToken));
        }
        console.log(
            "ConditionalTokens deployed at:",
            address(conditionalTokens)
        );
        console.log("LMSRMarketMaker deployed at:", address(lmsrMarketMaker));
        console.log("Market funded with:", funding / 1e18, "tokens");
        console.log("Market fee:", fee / 1e16, "%");

        // Write deployment info to JSON
        string memory _json = "json";
        _json.serialize(
            "controller",
            Strings.toChecksumHexString(address(controller))
        );
        _json.serialize(
            "collateral_token",
            Strings.toChecksumHexString(address(collateralToken))
        );
        _json.serialize(
            "conditional_tokens",
            Strings.toChecksumHexString(address(conditionalTokens))
        );
        _json.serialize(
            "market_maker",
            Strings.toChecksumHexString(address(lmsrMarketMaker))
        );
        _json.serialize("initial_funding", funding);
        _json.serialize("fee_percentage", fee);
        _json.serialize("question_id", vm.toString(questionId));
        string memory finalJson = _json.serialize("market_uri", uri);

        vm.writeFile(script_output_path, finalJson);
    }
}
