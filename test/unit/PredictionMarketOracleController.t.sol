// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Test} from "forge-std/Test.sol";
import {PredictionMarketOracleController} from "contracts/prediction_market/PredictionMarketOracleController.sol";
import {ITypes} from "interfaces/ITypes.sol";
import {IWavsTrigger} from "interfaces/IWavsTrigger.sol";

contract PredictionMarketOracleControllerTest is Test {
    PredictionMarketOracleController public controller;

    function setUp() public {
        controller = new PredictionMarketOracleController(address(1));
    }

    function testTrigger() public {
        controller.addTrigger();

        ITypes.TriggerId triggerId = ITypes.TriggerId.wrap(1);
        IWavsTrigger.TriggerInfo memory trigger = controller.getTrigger(triggerId);

        // assertEq(trigger.creator, address(this));
        assertEq(trigger.data, bytes(""));
        assertEq(ITypes.TriggerId.unwrap(trigger.triggerId), ITypes.TriggerId.unwrap(triggerId));
    }
}
