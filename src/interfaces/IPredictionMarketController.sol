// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

interface IPredictionMarketController {
    /**
     * @notice Struct to store AVS output
     * @param lmsrMarketMaker Address of the LMSR market maker
     * @param conditionalTokens Address of the conditional tokens
     * @param result The result of the oracle AVS
     */
    struct PredictionMarketOracleAvsOutput {
        address lmsrMarketMaker;
        address conditionalTokens;
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
     * @param result The result of the oracle AVS
     * @param collateralAvailable The total amount of collateral available to be redeemed
     */
    event MarketResolved(
        address lmsrMarketMaker,
        address conditionalTokens,
        bool result,
        uint256 collateralAvailable
    );

    /**
     * @notice Event emitted when a LMSR market maker is created
     * @param creator Address of the creator
     * @param lmsrMarketMaker Address of the LMSR market maker
     * @param pmSystem Address of the conditional tokens
     * @param collateralToken Address of the collateral token
     * @param conditionIds Array of condition IDs
     * @param fee Fee
     * @param funding Funding
     */
    event LMSRMarketMakerCreation(
        address indexed creator,
        address lmsrMarketMaker,
        address pmSystem,
        address collateralToken,
        bytes32[] conditionIds,
        uint64 fee,
        uint256 funding
    );
}
