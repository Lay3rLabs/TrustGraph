// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Common} from "script/Common.s.sol";

import {console} from "forge-std/console.sol";
import {IERC20} from "forge-std/interfaces/IERC20.sol";

import {ConditionalTokens} from "@lay3rlabs/conditional-tokens-contracts/ConditionalTokens.sol";
import {LMSRMarketMaker} from "@lay3rlabs/conditional-tokens-market-makers/LMSRMarketMaker.sol";

import {ERC20Mintable} from "contracts/prediction_market/ERC20Mintable.sol";

// forge script ./script/BuyYes.s.sol --sig "run(string, string, string)" --rpc-url http://localhost:8545 --broadcast
contract BuyYesPredictionMarket is Common {
    address private factoryAddress;
    address private marketMakerAddress;
    address private conditionalTokensAddress;
    address private collateralTokenAddress;

    function run(
        string calldata factoryAddr,
        string calldata marketMakerAddr,
        string calldata conditionalTokensAddr,
        string calldata collateralTokenAddr
    ) public {
        address deployer = vm.addr(_privateKey);

        factoryAddress = vm.parseAddress(factoryAddr);
        marketMakerAddress = vm.parseAddress(marketMakerAddr);
        collateralTokenAddress = vm.parseAddress(collateralTokenAddr);
        conditionalTokensAddress = vm.parseAddress(conditionalTokensAddr);

        // buy with 1 collateral token
        int256 buying = 1e18;

        LMSRMarketMaker marketMaker = LMSRMarketMaker(marketMakerAddress);
        ConditionalTokens conditionalTokens = ConditionalTokens(conditionalTokensAddress);
        ERC20Mintable collateralToken = ERC20Mintable(collateralTokenAddress);

        // Add more detailed logging
        console.log("Factory address:", factoryAddress);
        console.log("Market maker address:", marketMakerAddress);
        console.log("Collateral token address:", collateralTokenAddress);
        console.log("Conditional tokens address:", conditionalTokensAddress);

        vm.startBroadcast(_privateKey);

        collateralToken.mint(deployer, uint256(buying));
        collateralToken.approve(address(marketMaker), uint256(buying));

        bytes32 conditionId = conditionalTokens.getConditionId(factoryAddress, bytes32(0), 2);
        bytes32 collectionId = conditionalTokens.getCollectionId(bytes32(0), conditionId, 2);
        uint256 positionId = conditionalTokens.getPositionId(IERC20(collateralTokenAddress), collectionId);
        console.log("Collateral balance before:", collateralToken.balanceOf(deployer));
        console.log("Outcome share balance before:", conditionalTokens.balanceOf(deployer, positionId));

        // buy all YES
        int256[] memory outcomeTokenAmounts = new int256[](2);
        outcomeTokenAmounts[0] = 0;
        outcomeTokenAmounts[1] = buying;
        int256 netCost = marketMaker.trade(outcomeTokenAmounts, buying);

        vm.stopBroadcast();

        console.log("Net cost:", netCost);
        console.log("Collateral balance after:", collateralToken.balanceOf(deployer));
        console.log("Outcome share balance after:", conditionalTokens.balanceOf(deployer, positionId));
    }
}
