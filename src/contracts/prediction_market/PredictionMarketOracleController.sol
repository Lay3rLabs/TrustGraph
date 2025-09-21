// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {IWavsServiceHandler} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceHandler.sol";
import {IWavsServiceManager} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceManager.sol";
import {ConditionalTokens} from "@lay3rlabs/conditional-tokens-contracts/ConditionalTokens.sol";
import {LMSRMarketMaker} from "@lay3rlabs/conditional-tokens-market-makers/LMSRMarketMaker.sol";

import {IPredictionMarketOracleController} from "interfaces/IPredictionMarketOracleController.sol";
import {PredictionMarketFactory} from "./PredictionMarketFactory.sol";

// The contract responsible for triggering the oracle to resolve the market and handling the oracle output and instructing the market maker to resolve the market.
contract PredictionMarketOracleController is
    IPredictionMarketOracleController,
    IWavsServiceHandler
{
    error MarketAlreadyResolved();

    // The factory that handles creating and resolving the market.
    PredictionMarketFactory public factory;

    IWavsServiceManager public serviceManager;

    // Store if a market is resolved to prevent replay attacks.
    mapping(address lmsrMarketMaker => bool resolved) public resolvedMarkets;

    constructor(address serviceManager_) {
        require(serviceManager_ != address(0), "Invalid service manager");

        factory = new PredictionMarketFactory();
        serviceManager = IWavsServiceManager(serviceManager_);
    }

    /**
     * @param envelope The envelope containing the data.
     * @param signatureData The signature data.
     */
    function handleSignedEnvelope(
        Envelope calldata envelope,
        SignatureData calldata signatureData
    ) external override {
        serviceManager.validate(envelope, signatureData);

        PredictionMarketOracleAvsOutput memory returnData = abi.decode(
            envelope.payload,
            (PredictionMarketOracleAvsOutput)
        );

        // Prevent replay attacks.
        if (resolvedMarkets[returnData.lmsrMarketMaker]) {
            revert MarketAlreadyResolved();
        }

        // Tell factory to resolve the market
        factory.resolveMarket(
            LMSRMarketMaker(returnData.lmsrMarketMaker),
            ConditionalTokens(returnData.conditionalTokens),
            returnData.result
        );

        resolvedMarkets[returnData.lmsrMarketMaker] = true;
    }

    /**
     * @dev Emit NewTrigger event.
     */
    function trigger() external {
        emit NewTrigger();
    }

    /**
     * @notice Get the service manager address
     * @return address The address of the service manager
     */
    function getServiceManager() external view returns (address) {
        return address(serviceManager);
    }
}
