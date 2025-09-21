// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {IWavsServiceHandler} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceHandler.sol";
import {IWavsServiceManager} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceManager.sol";
import {ConditionalTokens} from "@lay3rlabs/conditional-tokens-contracts/ConditionalTokens.sol";
import {LMSRMarketMaker} from "@lay3rlabs/conditional-tokens-market-makers/LMSRMarketMaker.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Whitelist} from "@lay3rlabs/conditional-tokens-market-makers/Whitelist.sol";
import {IERC20} from "forge-std/interfaces/IERC20.sol";

import {IPredictionMarketController} from "interfaces/IPredictionMarketController.sol";

// The contract responsible for triggering the oracle to resolve the market and handling the oracle output and instructing the market maker to resolve the market.
contract PredictionMarketController is
    IPredictionMarketController,
    IWavsServiceHandler,
    Ownable
{
    // The implementation master for the LMSR market maker that will be cloned.
    LMSRMarketMaker public implementationMaster;

    IWavsServiceManager public serviceManager;

    // Store if a market is resolved to prevent replay attacks.
    mapping(address lmsrMarketMaker => bool resolved) public resolvedMarkets;

    constructor(address serviceManager_) Ownable(msg.sender) {
        if (serviceManager_ == address(0)) {
            revert InvalidServiceManager();
        }

        implementationMaster = new LMSRMarketMaker(address(this));
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

        _resolveMarket(
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

    function createConditionalTokenAndLMSRMarketMaker(
        string memory uri,
        bytes32 questionId,
        address collateralTokenAddress,
        uint64 fee,
        uint256 funding
    )
        external
        onlyOwner
        returns (
            ConditionalTokens conditionalTokens,
            LMSRMarketMaker lmsrMarketMaker
        )
    {
        IERC20 collateralToken = IERC20(collateralTokenAddress);

        conditionalTokens = new ConditionalTokens(uri);
        conditionalTokens.prepareCondition(address(this), questionId, 2);
        bytes32 conditionId = conditionalTokens.getConditionId(
            address(this),
            questionId,
            2
        );

        bytes32[] memory conditionIds = new bytes32[](1);
        conditionIds[0] = conditionId;

        lmsrMarketMaker = LMSRMarketMaker(
            Clones.clone(address(implementationMaster))
        );
        lmsrMarketMaker.initialize(
            conditionalTokens,
            collateralToken,
            conditionIds,
            fee,
            Whitelist(address(0))
        );

        // Transfer funding to this contract
        bool transferred = collateralToken.transferFrom(
            msg.sender,
            address(this),
            funding
        );
        if (!transferred) {
            revert TransferFailed();
        }

        // Approve the market maker to spend the funding from this
        collateralToken.approve(address(lmsrMarketMaker), funding);

        // Add funding to the market maker, which will spend the funds from this
        lmsrMarketMaker.changeFunding(int256(funding));

        // Resume the market maker
        lmsrMarketMaker.resume();

        emit LMSRMarketMakerCreation(
            msg.sender,
            address(lmsrMarketMaker),
            address(conditionalTokens),
            address(collateralToken),
            conditionIds,
            fee,
            funding
        );
    }

    /**
     * @dev Handle the AVS oracle resolution event. This should close the market and payout the corresponding outcome tokens based on the result.
     */
    function _resolveMarket(
        LMSRMarketMaker lmsrMarketMaker,
        ConditionalTokens conditionalTokens,
        bool result
    ) internal {
        // pause the market maker, which this factory owns
        lmsrMarketMaker.pause();

        uint256[] memory payouts = new uint256[](2);
        // the first outcome slot is NO
        payouts[0] = result ? 0 : 1;
        // the second outcome slot is YES
        payouts[1] = result ? 1 : 0;

        // resolve the token
        conditionalTokens.reportPayouts(bytes32(0), payouts);

        // In a binary market, the total supply of either outcome is equal to the total amount of collateral held by the conditional tokens contract.
        uint256 collateralAvailable = lmsrMarketMaker
            .collateralToken()
            .balanceOf(address(conditionalTokens));

        emit MarketResolved(
            address(lmsrMarketMaker),
            address(conditionalTokens),
            result,
            collateralAvailable
        );
    }
}
