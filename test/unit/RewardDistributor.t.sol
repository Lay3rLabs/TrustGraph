// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test} from "forge-std/Test.sol";
import {RewardDistributor} from "contracts/RewardDistributor.sol";
import {ITypes} from "interfaces/ITypes.sol";
import {IWavsServiceManager} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceManager.sol";

contract RewardDistributorTest is Test {
    RewardDistributor public rewardDistributor;

    function setUp() public {
        rewardDistributor = new RewardDistributor(IWavsServiceManager(address(0)));
    }

    function testTrigger() public {
        rewardDistributor.addTrigger();

        ITypes.TriggerId triggerId = ITypes.TriggerId.wrap(1);
        ITypes.TriggerInfo memory trigger = rewardDistributor.getTrigger(triggerId);

        assertEq(trigger.creator, address(this));
        assertEq(trigger.data, abi.encodePacked(triggerId));
        assertEq(ITypes.TriggerId.unwrap(trigger.triggerId), ITypes.TriggerId.unwrap(triggerId));
    }
}
