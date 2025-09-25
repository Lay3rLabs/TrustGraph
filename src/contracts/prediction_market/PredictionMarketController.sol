// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {IWavsServiceHandler} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceHandler.sol";
import {IWavsServiceManager} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceManager.sol";
import {ConditionalTokens} from "@lay3rlabs/conditional-tokens-contracts/ConditionalTokens.sol";
import {LMSRMarketMaker} from "@lay3rlabs/conditional-tokens-market-makers/LMSRMarketMaker.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC1155Receiver} from "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import {Whitelist} from "@lay3rlabs/conditional-tokens-market-makers/Whitelist.sol";
import {IERC20} from "forge-std/interfaces/IERC20.sol";

import {IPredictionMarketController} from "interfaces/IPredictionMarketController.sol";

// The contract responsible for triggering the oracle to resolve the market and handling the oracle output and instructing the market maker to resolve the market.
contract PredictionMarketController is
    IPredictionMarketController,
    IWavsServiceHandler,
    Ownable,
    IERC1155Receiver
{
    // The implementation master for the LMSR market maker that will be cloned.
    LMSRMarketMaker public implementationMaster;

    // The market maker that is currently being closed.
    address private _closingMarketMaker;

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

        PredictionMarketOracleOutput memory output = abi.decode(
            envelope.payload,
            (PredictionMarketOracleOutput)
        );

        // Prevent replay attacks.
        if (resolvedMarkets[output.lmsrMarketMaker]) {
            revert MarketAlreadyResolved();
        }

        _resolveMarket(
            LMSRMarketMaker(output.lmsrMarketMaker),
            ConditionalTokens(output.conditionalTokens),
            output.questionId,
            output.result
        );

        resolvedMarkets[output.lmsrMarketMaker] = true;
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
            questionId,
            conditionIds,
            fee,
            funding
        );
    }

    /**
     * @notice Withdraws the fees from the market maker and sends them to the owner.
     * @param lmsrMarketMaker The address of the LMSR market maker.
     * @return fees The amount of fees withdrawn.
     */
    function withdrawFees(
        address lmsrMarketMaker
    ) public returns (uint256 fees) {
        IERC20 collateralToken = LMSRMarketMaker(lmsrMarketMaker)
            .collateralToken();
        fees = LMSRMarketMaker(lmsrMarketMaker).withdrawFees();
        if (fees > 0) {
            address collector = owner();

            if (!collateralToken.transfer(collector, fees)) {
                revert TransferFailed();
            }

            emit FeesWithdrawn(lmsrMarketMaker, collector, fees);
        }
    }

    /**
     * @dev Handle the AVS oracle resolution event. This should close the market and payout the corresponding outcome tokens based on the result.
     */
    function _resolveMarket(
        LMSRMarketMaker lmsrMarketMaker,
        ConditionalTokens conditionalTokens,
        bytes32 questionId,
        bool result
    ) internal {
        // Close the market maker, which this controller owns.
        _closingMarketMaker = address(lmsrMarketMaker);
        lmsrMarketMaker.close();
        _closingMarketMaker = address(0);

        uint256[] memory payouts = new uint256[](2);
        // the first outcome slot is NO
        payouts[0] = result ? 0 : 1;
        // the second outcome slot is YES
        payouts[1] = result ? 1 : 0;

        // resolve the condition so people can redeem
        conditionalTokens.reportPayouts(questionId, payouts);

        IERC20 collateralToken = lmsrMarketMaker.collateralToken();

        // Redeem remaining unused collateral, and transfer the withdrawn collateral to the owner.

        uint256 prevCollateralBalance = collateralToken.balanceOf(
            address(this)
        );

        bytes32 conditionId = conditionalTokens.getConditionId(
            address(this),
            questionId,
            2
        );
        uint256[] memory indexSets = new uint256[](1);
        indexSets[0] = result ? 2 : 1;
        conditionalTokens.redeemPositions(
            collateralToken,
            bytes32(0),
            conditionId,
            indexSets
        );

        uint256 newCollateralBalance = collateralToken.balanceOf(address(this));

        // Transfer the withdrawn collateral to the owner.
        uint256 unusedCollateral = newCollateralBalance - prevCollateralBalance;
        if (unusedCollateral > 0) {
            if (!collateralToken.transfer(owner(), unusedCollateral)) {
                revert TransferFailed();
            }
        }

        // In a binary market, the total supply of either outcome is equal to the total amount of collateral held by the conditional tokens contract (after withdrawing unused collateral).
        uint256 redeemableCollateral = collateralToken.balanceOf(
            address(conditionalTokens)
        );

        // Withdraw fees from the market maker to the owner.
        uint256 collectedFees = withdrawFees(address(lmsrMarketMaker));

        emit MarketResolved(
            address(lmsrMarketMaker),
            address(conditionalTokens),
            questionId,
            result,
            redeemableCollateral,
            unusedCollateral,
            collectedFees
        );
    }

    // Allow us to receive conditional tokens when closing a market and redeem the unused collateral to send to the owner.

    function supportsInterface(
        bytes4 interfaceId
    ) external pure returns (bool) {
        return interfaceId == type(IERC1155Receiver).interfaceId;
    }

    function onERC1155Received(
        address operator,
        address /*from*/,
        uint256 /*id*/,
        uint256 /*value*/,
        bytes calldata /*data*/
    ) public view returns (bytes4) {
        if (
            operator == _closingMarketMaker && _closingMarketMaker != address(0)
        ) {
            return this.onERC1155Received.selector;
        }
        return 0x0;
    }

    function onERC1155BatchReceived(
        address _operator,
        address /*from*/,
        uint256[] calldata /*ids*/,
        uint256[] calldata /*values*/,
        bytes calldata /*data*/
    ) public view returns (bytes4) {
        if (
            _operator == _closingMarketMaker &&
            _closingMarketMaker != address(0)
        ) {
            return this.onERC1155BatchReceived.selector;
        }
        return 0x0;
    }
}
