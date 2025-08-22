// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Common} from "script/Common.s.sol";
import {console} from "forge-std/console.sol";

import {PredictionMarketOracleController} from "contracts/prediction_market/PredictionMarketOracleController.sol";
import {IWavsTrigger2} from "interfaces/IWavsTrigger2.sol";
import {ITypes} from "interfaces/ITypes.sol";

// forge script ./script/Trigger.s.sol ${ORACLE_CONTROLLER_ADDRESS} ${MARKET_MAKER_ADDRESS} ${CONDITIONAL_TOKENS_ADDRESS} --sig "run(string,string,string)" --rpc-url http://localhost:8545 --broadcast
contract TriggerScript is Common {
    function run(string calldata oracleControllerAddr) public {
        address oracleAddress = vm.parseAddress(oracleControllerAddr);

        PredictionMarketOracleController oracle = PredictionMarketOracleController(oracleAddress);

        vm.startBroadcast(_privateKey);

        // Add trigger (sends 0.1 ETH)
        ITypes.TriggerId triggerId = oracle.addTrigger();

        vm.stopBroadcast();

        uint64 tid = ITypes.TriggerId.unwrap(triggerId);
        console.log("Trigger ID:", tid);
    }
}
