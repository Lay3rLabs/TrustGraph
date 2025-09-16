// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {DAICOVault} from "../contracts/tokens/DAICOVault.sol";

/// @title IDAICO
/// @notice Interface for the Decentralized Autonomous Initial Coin Offering contract
/// @dev Implements a VRGDA-based sale with vault tokens for governance and refunds
interface IDAICO {
    /// ================================================
    /// TYPES
    /// ================================================

    /// @notice Vesting schedule for project tokens
    struct VestingSchedule {
        uint256 totalTokens; // Total project tokens that will vest
        uint256 startTime; // When vesting starts (contribution time)
        uint256 cliffDuration; // Cliff period duration
        uint256 vestingDuration; // Total vesting duration
        uint256 claimed; // Amount of project tokens already claimed
        uint256 ethContributed; // Total ETH contributed (for calculating unvested portion)
    }

    /// @notice Contribution record for tracking
    struct Contribution {
        address contributor;
        uint256 ethAmount;
        uint256 vaultTokensReceived;
        uint256 timestamp;
    }

    /// ================================================
    /// EVENTS
    /// ================================================

    /// @notice Emitted when ETH is contributed and vault tokens are minted
    event Contributed(
        address indexed contributor, uint256 ethAmount, uint256 vaultTokensMinted, uint256 projectTokensAllocated
    );

    /// @notice Emitted when vault tokens are redeemed for unvested ETH
    event Refunded(address indexed user, uint256 vaultTokensBurned, uint256 ethRefunded);

    /// @notice Emitted when vault tokens are exchanged for vested project tokens
    event TokensClaimed(address indexed user, uint256 vaultTokensBurned, uint256 projectTokensClaimed);

    /// @notice Emitted when ETH vests to the project treasury
    event VestedToTreasury(uint256 amount);

    /// @notice Emitted when sale is paused
    event SalePaused(address indexed by);

    /// @notice Emitted when sale is unpaused
    event SaleUnpaused(address indexed by);

    /// @notice Emitted when sale ends
    event SaleEnded(address indexed by);

    /// ================================================
    /// ERRORS
    /// ================================================

    error InvalidAmount();
    error InsufficientPayment();
    error ExceedsMaxSupply();
    error SaleNotActive();
    error SaleNotEnded();
    error NothingToClaim();
    error InsufficientVaultTokens();
    error StillInCliff();
    error Paused();
    error Unauthorized();
    error TransferFailed();
    error ZeroAddress();

    /// ================================================
    /// CONTRIBUTION FUNCTIONS
    /// ================================================

    /// @notice Contribute ETH and receive vault tokens
    /// @param projectTokenAmount The amount of project tokens to allocate
    /// @return vaultTokensIssued The amount of vault tokens minted
    function contribute(uint256 projectTokenAmount) external payable returns (uint256 vaultTokensIssued);

    /// @notice Get the current price for project tokens
    /// @param amount The amount of project tokens to price
    /// @return ethRequired The ETH required for the purchase
    function getCurrentPrice(uint256 amount) external view returns (uint256 ethRequired);

    /// @notice Get a price quote at a specific supply level
    /// @param amount The amount of tokens to price
    /// @param currentSold The supply level to calculate price at
    /// @return ethRequired The ETH required
    function getQuoteAtSupply(uint256 amount, uint256 currentSold) external view returns (uint256 ethRequired);

    /// ================================================
    /// REDEMPTION FUNCTIONS
    /// ================================================

    /// @notice Redeem vault tokens for unvested ETH (refund)
    /// @param vaultTokenAmount The amount of vault tokens to redeem
    /// @return ethRefunded The amount of ETH refunded
    function refund(uint256 vaultTokenAmount) external returns (uint256 ethRefunded);

    /// @notice Exchange vault tokens for vested project tokens
    /// @param vaultTokenAmount The amount of vault tokens to exchange
    /// @return projectTokensClaimed The amount of project tokens received
    function claimProjectTokens(uint256 vaultTokenAmount) external returns (uint256 projectTokensClaimed);

    /// @notice Calculate refund amount for vault tokens
    /// @param account The account to calculate for
    /// @param vaultTokenAmount The amount of vault tokens to redeem
    /// @return ethRefund The ETH that would be refunded
    function calculateRefund(address account, uint256 vaultTokenAmount) external view returns (uint256 ethRefund);

    /// @notice Calculate claimable project tokens for vault tokens
    /// @param account The account to calculate for
    /// @param vaultTokenAmount The amount of vault tokens to exchange
    /// @return projectTokens The project tokens that could be claimed
    function calculateClaimableTokens(address account, uint256 vaultTokenAmount)
        external
        view
        returns (uint256 projectTokens);

    /// ================================================
    /// VESTING FUNCTIONS
    /// ================================================

    /// @notice Get vesting schedule for an address
    /// @param account The account to check
    /// @return schedule The vesting schedule
    function getVestingSchedule(address account) external view returns (VestingSchedule memory schedule);

    /// @notice Get the amount of ETH that has vested to the project
    /// @param account The account to check
    /// @return vestedAmount The amount of ETH vested (not refundable)
    function getVestedETH(address account) external view returns (uint256 vestedAmount);

    /// @notice Get the amount of ETH that hasn't vested yet
    /// @param account The account to check
    /// @return unvestedAmount The amount of ETH that can still be refunded
    function getUnvestedETH(address account) external view returns (uint256 unvestedAmount);

    /// @notice Withdraw vested ETH to treasury
    /// @return amount The amount withdrawn
    function withdrawVestedToTreasury() external returns (uint256 amount);

    /// ================================================
    /// ADMIN FUNCTIONS
    /// ================================================

    /// @notice Pause the token sale
    function pauseSale() external;

    /// @notice Unpause the token sale
    function unpauseSale() external;

    /// @notice End the sale permanently
    function endSale() external;

    /// ================================================
    /// VIEW FUNCTIONS
    /// ================================================

    /// @notice Check if the sale is active
    /// @return active Whether the sale is active
    function saleActive() external view returns (bool active);

    /// @notice Check if the sale has ended
    /// @return ended Whether the sale has ended
    function saleEnded() external view returns (bool ended);

    /// @notice Check if the sale is paused
    /// @return paused Whether the sale is paused
    function salePaused() external view returns (bool paused);

    /// @notice Get total project tokens sold
    /// @return sold The total number of tokens sold
    function totalSold() external view returns (uint256 sold);

    /// @notice Get total ETH raised
    /// @return raised The total ETH raised
    function totalRaised() external view returns (uint256 raised);

    /// @notice Get total ETH vested to the project
    /// @return vested The total ETH vested
    function totalVested() external view returns (uint256 vested);

    /// @notice Get maximum token supply for sale
    /// @return supply The maximum supply
    function maxSupply() external view returns (uint256 supply);

    /// @notice Get contribution history for an address
    /// @param account The account to query
    /// @return contributions The contribution history
    function getContributionHistory(address account) external view returns (Contribution[] memory contributions);

    /// @notice Get the vault token contract address
    /// @return vaultToken The vault token contract
    function vaultToken() external view returns (DAICOVault vaultToken);

    /// @notice Get the project token contract address
    /// @return projectToken The project token contract
    function projectToken() external view returns (IERC20 projectToken);

    /// @notice Get the treasury address
    /// @return treasury The treasury address
    function treasury() external view returns (address treasury);

    /// @notice Get the sale start timestamp
    /// @return timestamp The sale start timestamp
    function saleStartTime() external view returns (uint256 timestamp);

    /// @notice Get vesting cliff duration
    /// @return cliff The cliff duration in seconds
    function cliffDuration() external view returns (uint256 cliff);

    /// @notice Get vesting duration
    /// @return duration The total vesting duration in seconds
    function vestingDuration() external view returns (uint256 duration);

    /// @notice Get vault tokens to project tokens exchange rate
    /// @param account The account to check
    /// @return rate The exchange rate (project tokens per vault token)
    function getExchangeRate(address account) external view returns (uint256 rate);
}
