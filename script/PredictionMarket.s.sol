// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Common} from "script/Common.s.sol";

import {console} from "forge-std/console.sol";

import {ConditionalTokens} from "@lay3rlabs/conditional-tokens-contracts/ConditionalTokens.sol";
import {LMSRMarketMaker} from "@lay3rlabs/conditional-tokens-market-makers/LMSRMarketMaker.sol";
import {IERC20} from "forge-std/interfaces/IERC20.sol";

import {MockUSDC} from "contracts/tokens/MockUSDC.sol";
import {PredictionMarketController} from "contracts/prediction_market/PredictionMarketController.sol";

contract PredictionMarket is Common {
    function buyYes(
        string calldata controllerAddr,
        string calldata marketMakerAddr,
        string calldata conditionalTokensAddr,
        string calldata collateralTokenAddr
    ) public {
        address deployer = vm.addr(_privateKey);

        address controllerAddress = vm.parseAddress(controllerAddr);
        address marketMakerAddress = vm.parseAddress(marketMakerAddr);
        address collateralTokenAddress = vm.parseAddress(collateralTokenAddr);
        address conditionalTokensAddress = vm.parseAddress(
            conditionalTokensAddr
        );

        // buy with 1 collateral token
        int256 buying = 1e18;

        LMSRMarketMaker marketMaker = LMSRMarketMaker(marketMakerAddress);
        ConditionalTokens conditionalTokens = ConditionalTokens(
            conditionalTokensAddress
        );
        MockUSDC collateralToken = MockUSDC(collateralTokenAddress);

        // Add more detailed logging
        console.log("Controller address:", controllerAddress);
        console.log("Market maker address:", marketMakerAddress);
        console.log("Collateral token address:", collateralTokenAddress);
        console.log("Conditional tokens address:", conditionalTokensAddress);

        vm.startBroadcast(_privateKey);

        collateralToken.mint(deployer, uint256(buying));
        collateralToken.approve(address(marketMaker), uint256(buying));

        bytes32 conditionId = conditionalTokens.getConditionId(
            controllerAddress,
            bytes32(0),
            2
        );
        bytes32 collectionId = conditionalTokens.getCollectionId(
            bytes32(0),
            conditionId,
            2
        );
        uint256 positionId = conditionalTokens.getPositionId(
            IERC20(collateralTokenAddress),
            collectionId
        );
        console.log(
            "Collateral balance before:",
            collateralToken.balanceOf(deployer)
        );
        console.log(
            "Outcome share balance before:",
            conditionalTokens.balanceOf(deployer, positionId)
        );

        // buy all YES
        int256[] memory outcomeTokenAmounts = new int256[](2);
        outcomeTokenAmounts[0] = 0;
        outcomeTokenAmounts[1] = buying;
        int256 netCost = marketMaker.trade(outcomeTokenAmounts, buying);

        vm.stopBroadcast();

        console.log("Net cost:", netCost);
        console.log(
            "Collateral balance after:",
            collateralToken.balanceOf(deployer)
        );
        console.log(
            "Outcome share balance after:",
            conditionalTokens.balanceOf(deployer, positionId)
        );
    }

    function trigger(string calldata oracleControllerAddr) public {
        address oracleAddress = vm.parseAddress(oracleControllerAddr);

        PredictionMarketController oracle = PredictionMarketController(
            oracleAddress
        );

        vm.startBroadcast(_privateKey);

        // Add trigger (sends 0.1 ETH)
        oracle.trigger();

        vm.stopBroadcast();
    }

    function redeem(
        string calldata controllerAddr,
        string calldata collateralTokenAddr,
        string calldata conditionalTokensAddr
    ) public {
        address deployer = vm.addr(_privateKey);
        address controllerAddress = vm.parseAddress(controllerAddr);
        address collateralTokenAddress = vm.parseAddress(collateralTokenAddr);
        address conditionalTokensAddress = vm.parseAddress(
            conditionalTokensAddr
        );

        MockUSDC collateralToken = MockUSDC(collateralTokenAddress);
        ConditionalTokens conditionalTokens = ConditionalTokens(
            conditionalTokensAddress
        );

        // Add more detailed logging
        console.log("Controller address:", controllerAddress);
        console.log("Collateral token address:", collateralTokenAddress);
        console.log("Conditional tokens address:", conditionalTokensAddress);

        vm.startBroadcast(_privateKey);

        bytes32 conditionId = conditionalTokens.getConditionId(
            controllerAddress,
            bytes32(0),
            2
        );
        bytes32 collectionId = conditionalTokens.getCollectionId(
            bytes32(0),
            conditionId,
            2
        );
        uint256 positionId = conditionalTokens.getPositionId(
            IERC20(collateralTokenAddress),
            collectionId
        );
        console.log(
            "Collateral balance before:",
            collateralToken.balanceOf(deployer)
        );
        console.log(
            "Outcome share balance before:",
            conditionalTokens.balanceOf(deployer, positionId)
        );

        // redeem payout
        uint256[] memory indexSets = new uint256[](1);
        indexSets[0] = 2;
        conditionalTokens.redeemPositions(
            IERC20(collateralTokenAddress),
            bytes32(0),
            conditionId,
            indexSets
        );

        vm.stopBroadcast();

        console.log(
            "Collateral balance after:",
            collateralToken.balanceOf(deployer)
        );
        console.log(
            "Outcome share balance after:",
            conditionalTokens.balanceOf(deployer, positionId)
        );
    }

    function queryBalances(
        string calldata controllerAddr,
        string calldata collateralTokenAddr,
        string calldata conditionalTokensAddr,
        string calldata walletAddr
    ) public view {
        address controllerAddress = vm.parseAddress(controllerAddr);
        address collateralTokenAddress = vm.parseAddress(collateralTokenAddr);
        address conditionalTokensAddress = vm.parseAddress(
            conditionalTokensAddr
        );
        address walletAddress = vm.parseAddress(walletAddr);

        MockUSDC collateralToken = MockUSDC(collateralTokenAddress);
        ConditionalTokens conditionalTokens = ConditionalTokens(
            conditionalTokensAddress
        );

        bytes32 conditionId = conditionalTokens.getConditionId(
            controllerAddress,
            bytes32(0),
            2
        );
        bytes32 collectionId = conditionalTokens.getCollectionId(
            bytes32(0),
            conditionId,
            2
        );
        uint256 positionId = conditionalTokens.getPositionId(
            IERC20(collateralTokenAddress),
            collectionId
        );

        console.log(
            "Collateral balance:",
            collateralToken.balanceOf(walletAddress)
        );
        console.log(
            "Outcome share balance:",
            conditionalTokens.balanceOf(walletAddress, positionId)
        );
    }
}
