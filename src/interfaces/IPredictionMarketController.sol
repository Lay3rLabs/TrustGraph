// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

interface IPredictionMarketController {
    /**
     * @notice Struct to store AVS output
     * @param lmsrMarketMaker Address of the LMSR market maker
     * @param conditionalTokens Address of the conditional tokens
     * @param questionId The question ID
     * @param result The result of the oracle AVS
     */
    struct PredictionMarketOracleOutput {
        address lmsrMarketMaker;
        address conditionalTokens;
        bytes32 questionId;
        bool result;
    }

    error MarketAlreadyResolved();
    error InvalidServiceManager();
    error TransferFailed();

    /**
     * @notice Event emitted when a new trigger is created
     */
    event NewTrigger();

    /**
     * @notice Event emitted when a market is resolved
     * @param lmsrMarketMaker Address of the LMSR market maker
     * @param conditionalTokens Address of the conditional tokens
     * @param questionId The question ID
     * @param result The result of the oracle AVS
     * @param redeemableCollateral The total amount of collateral available to be redeemed
     * @param unusedCollateral The amount of unused collateral that was withdrawn to the owner
     * @param collectedFees The amount of fees withdrawn from the market maker to the owner
     */
    event MarketResolved(
        address lmsrMarketMaker,
        address conditionalTokens,
        bytes32 questionId,
        bool result,
        uint256 redeemableCollateral,
        uint256 unusedCollateral,
        uint256 collectedFees
    );

    /**
     * @notice Event emitted when a LMSR market maker is created
     * @param creator Address of the creator
     * @param lmsrMarketMaker Address of the LMSR market maker
     * @param conditionalTokens Address of the conditional tokens
     * @param collateralToken Address of the collateral token
     * @param questionId The question ID
     * @param conditionIds Array of condition IDs
     * @param fee Fee
     * @param funding Funding
     */
    event LMSRMarketMakerCreation(
        address indexed creator,
        address lmsrMarketMaker,
        address conditionalTokens,
        address collateralToken,
        bytes32 questionId,
        bytes32[] conditionIds,
        uint64 fee,
        uint256 funding
    );

    /**
     * @notice Event emitted when fees are withdrawn from the market maker to the owner
     * @param lmsrMarketMaker Address of the LMSR market maker
     * @param collector Address of the collector
     * @param fees The amount of fees withdrawn from the market maker to the owner
     */
    event FeesWithdrawn(
        address lmsrMarketMaker,
        address collector,
        uint256 fees
    );
}
