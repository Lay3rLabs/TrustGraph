// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

interface IPredictionMarketOracleController {
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
}
