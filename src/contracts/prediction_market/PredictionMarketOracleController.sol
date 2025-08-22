// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {IWavsServiceHandler} from "@wavs/interfaces/IWavsServiceHandler.sol";
import {IWavsServiceManager} from "@wavs/interfaces/IWavsServiceManager.sol";
import {ConditionalTokens} from "@lay3rlabs/conditional-tokens-contracts/ConditionalTokens.sol";
import {LMSRMarketMaker} from "@lay3rlabs/conditional-tokens-market-makers/LMSRMarketMaker.sol";

import {IWavsTrigger2} from "interfaces/IWavsTrigger2.sol";
import {PredictionMarketFactory} from "./PredictionMarketFactory.sol";

// The contract responsible for triggering the oracle to resolve the market and handling the oracle output and instructing the market maker to resolve the market.
contract PredictionMarketOracleController is IWavsTrigger2, IWavsServiceHandler {
    // The factory that handles creating and resolving the market.
    PredictionMarketFactory public factory;

    mapping(TriggerId _triggerId => Trigger _trigger) public triggersById;

    IWavsServiceManager public serviceManager;
    TriggerId public nextTriggerId;

    constructor(address serviceManager_) {
        require(serviceManager_ != address(0), "Invalid service manager");

        factory = new PredictionMarketFactory();
        serviceManager = IWavsServiceManager(serviceManager_);
    }

    /**
     * @param envelope The envelope containing the data.
     * @param signatureData The signature data.
     */
    function handleSignedEnvelope(Envelope calldata envelope, SignatureData calldata signatureData) external override {
        serviceManager.validate(envelope, signatureData);

        DataWithId memory dataWithId = abi.decode(envelope.payload, (DataWithId));

        Trigger memory trigger = triggersById[dataWithId.triggerId];
        require(trigger.creator != address(0), "Trigger does not exist");

        AvsOutputData memory returnData = abi.decode(dataWithId.data, (AvsOutputData));

        // Tell factory to resolve the market
        factory.resolveMarket(
            LMSRMarketMaker(returnData.lmsrMarketMaker),
            ConditionalTokens(returnData.conditionalTokens),
            returnData.result
        );
    }

    /**
     * @dev Trigger the oracle AVS to resolve the market.
     * @return triggerId The ID of the trigger.
     */
    function addTrigger() external returns (TriggerId triggerId) {
        // require(msg.value == 0.1 ether, "Payment must be exactly 0.1 ETH");

        // Get the next trigger ID
        triggerId = nextTriggerId;
        nextTriggerId = TriggerId.wrap(TriggerId.unwrap(nextTriggerId) + 1);

        Trigger memory trigger = Trigger({creator: msg.sender, data: bytes("")});
        triggersById[triggerId] = trigger;

        TriggerInfo memory triggerInfo =
            TriggerInfo({triggerId: triggerId, creator: trigger.creator, data: trigger.data});

        emit NewTrigger(abi.encode(triggerInfo));
    }

    /// @inheritdoc IWavsTrigger2
    function getTrigger(TriggerId triggerId) external view override returns (TriggerInfo memory _triggerInfo) {
        Trigger storage _trigger = triggersById[triggerId];
        _triggerInfo = TriggerInfo({triggerId: triggerId, creator: _trigger.creator, data: _trigger.data});
    }
}
