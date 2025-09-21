// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Test} from "forge-std/Test.sol";
import {PredictionMarketOracleController} from "contracts/prediction_market/PredictionMarketOracleController.sol";
import {IPredictionMarketOracleController} from "interfaces/IPredictionMarketOracleController.sol";
import {ITypes} from "interfaces/ITypes.sol";
import {IWavsTrigger} from "interfaces/IWavsTrigger.sol";

contract PredictionMarketOracleControllerTest is Test {
    PredictionMarketOracleController public controller;

    function setUp() public {
        controller = new PredictionMarketOracleController(address(1));
    }

    function testTrigger() public {
        vm.expectEmit(true, true, true, true);
        emit IPredictionMarketOracleController.NewTrigger();
        controller.trigger();
    }
}
