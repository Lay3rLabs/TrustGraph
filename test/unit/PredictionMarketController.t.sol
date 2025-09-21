// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Test} from "forge-std/Test.sol";
import {PredictionMarketController} from "contracts/prediction_market/PredictionMarketController.sol";
import {IPredictionMarketController} from "interfaces/IPredictionMarketController.sol";

contract PredictionMarketControllerTest is Test {
    PredictionMarketController public controller;

    function setUp() public {
        controller = new PredictionMarketController(address(1));
    }

    function testTrigger() public {
        vm.expectEmit(true, true, true, true);
        emit IPredictionMarketController.NewTrigger();
        controller.trigger();
    }
}
