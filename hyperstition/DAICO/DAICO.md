# DAICO

In 2018, Vitalik wrote a [blog post](https://ethresear.ch/t/explanation-of-daicos/465) about DAICOs, a better way to do ICOs, designed to counter some of the bad behavior emerging out of ICOs of the 2017 era.

This paper serves to outline the approach we'll take with the EN0VA DAICO.

**Our goals:**
- To create a more equitable and sustainable funding model for projects.
- To ensure that contributors and early backers have a vested interest in the success of the project.
- To provide a more transparent and democratic way of managing project funds.
- To ensure that the project team has a vested interest in the success of the project.

**How it works (high level):**
- Project creates a DAICO contract, funds it with project tokens, and configures a sale mechanism (bonding curve, dutch auction, etc.)
- Users put funds in in the DAICO contract, get $NFT cards representing their contribution share
- DAICO vests funds to project, project vests project tokens to DAICO contributors
- At any point they can burn their $vTokens for their share of what's left of the DAICO treasury, or exchange them to claim vested project tokens
- Two governance actions are supported, voting to increase the `tap` rate and voting to dissolve the DAICO entirely and return everyone their funds.
- If project fails to meet minimum fundraising goals after a certain period, contributors can withdraw their funds.

Funds from the DAICO are put in a liquidity pool, which can be used to provide liquidity for the project's token.

The project is getting vested LP tokens.

You lock them for weight in the DAO.

## EN0VA DAICO Spec

In his original post, Vitalik stated "Once the contribution period ends, the ability to contribute ETH stops, and the initial token balances are set; from there on the tokens can become tradeable."

We aim to diverge from this slightly. Namely, tokens will be vested *bi-directionally*. This allows for existing projects to leverage a DAICO mechanic for raising additional funds. [why else?]

EN0VA DAICO will be based on the tokenized vault standard `ERC-4626`, allowing for unvested tokens in the vault to earn yield in low-risk strategies for maximum capital efficiency. The tokenized vault standard did not exist when Vitalik was writing his initial post.

## Pricing

There are a number of options for pricing tokens during the DAICO:
- Fixed Price
- Dynamic Price (Dutch Auction, Bonding Curves, etc.)

For the EN0VA DAICO, we will use a VRGDA (Variable Rate Gradual Dutch Auction), see [this post](https://www.paradigm.xyz/2022/08/vrgda).

## DAICO Implementation

We should potentially consider options to add additional taps?

Maybe the team should be able to change tap address? So if a new gauge system is introduced, it can be swapped out for a new one.

## Parameters

`tap`: the rate at which tokens are tapped from the vault by the project. (wei/second)
`tapAddress`: the address of the project that will receive the tapped tokens (can be updated by the project).
`minRaise`: the minimum amount of tokens that must be raised for the DAICO to succeed. (wei)

## Design Considerations

### Core Principles
1. **Simplicity First**: One contribution asset, clear pricing, minimal governance
2. **ERC4626 Native**: Leverage vault standard for deposits, withdrawals, and share accounting
3. **Aligned Incentives**: Tap mechanism ensures project can't run away with funds

### Key Design Decisions

#### Single Asset Treasury (one asset per DAICO contract)
- Accept only one asset (e.g., USDC or ETH) to avoid pricing complexity
- No need for oracles or cross-asset valuations
- Simpler accounting and refund mechanics

#### VRGDA Pricing Mechanism
- Variable Rate Gradual Dutch Auction for continuous, self-regulating fundraising
- Price automatically adjusts based on actual vs target sales rate
- Increases price when demand is high (ahead of schedule)
- Decreases price when demand is low (behind schedule)
- No need for manual price adjustments or fixed windows

#### Governance Minimalism
- Only two governance actions: increase tap rate and dissolve
- Use vToken holdings as voting power (no snapshots needed)
- Simple majority with quorum for decisions
- Project team has the ability to change `tapAddress`

#### Simple Vesting
- Project tokens vest linearly to vToken holders
- No complex cliff or revocation logic initially
- Tap rate provides natural vesting for project funds

#### Yield strategies
- Funds in the DAICO can be used to generate yield through low-risk DeFi protocols, yield is paid out to vToken holders. (Phase 2)

## Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";

/**
 * @title IDAICO
 * @notice Interface for Decentralized Autonomous Initial Coin Offering (DAICO) contracts
 * @dev Extends ERC4626 for tokenized vault functionality with yield-earning capabilities
 */
interface IDAICO is IERC4626 {
    // ============ Enums ============

    enum ProposalType {
        INCREASE_TAP,
        DISSOLVE
    }

    enum ProposalStatus {
        ACTIVE,
        SUCCEEDED,
        EXECUTED,
        DEFEATED
    }

    // ============ Structs ============

    struct Config {
        address projectToken; // The EN0 token being distributed
        uint256 projectTokenSupply; // Total project tokens in DAICO
        uint256 tapRate; // Wei per second that can be withdrawn
        address tapRecipient; // Address receiving tap withdrawals
        uint256 minRaise; // Minimum amount for refundable crowdsale
        uint256 raiseDeadline; // Deadline for meeting minRaise (timestamp)
        uint256 vestingDuration; // Linear vesting period for project tokens
        // VRGDA Parameters
        int256 targetPrice; // Starting price per token in contribution asset
        int256 priceDecayPercent; // Rate of price decay (in basis points per unit)
        int256 perTimeUnit; // Target tokens to sell per time unit
    }

    struct Proposal {
        ProposalType proposalType;
        uint256 value; // New tap rate if INCREASE_TAP
        uint256 endBlock;
        uint256 forVotes;
        uint256 againstVotes;
        ProposalStatus status;
    }

    // ============ Events ============

    event TapWithdrawn(uint256 amount);
    event TapRateUpdated(uint256 newRate);
    event TapRecipientUpdated(address indexed oldRecipient, address indexed newRecipient);
    event ProjectTokensClaimed(address indexed holder, uint256 amount);
    event ProposalCreated(uint256 indexed proposalId, ProposalType proposalType);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed proposalId);
    event DAICODissolved();
    event Refunded(address indexed contributor, uint256 amount);

    // ============ Core Functions ============
    // Note: deposit() and redeem() from ERC4626 handle contributions and treasury claims

    /**
     * @notice Get spot price for next token
     * @return price The spot price for the next token
     */
    function getSpotPrice() external view returns (uint256 price);

    /**
     * @notice Claim vested project tokens based on vToken holdings
     * @return amount The amount of project tokens claimed
     */
    function claimProjectTokens() external returns (uint256 amount);

    /**
     * @notice Get claimable project tokens for an address
     * @param account The address to check
     * @return amount The claimable amount
     */
    function getClaimableProjectTokens(address account) external view returns (uint256 amount);

    /**
     * @notice Withdraw available funds according to tap rate (only tapRecipient)
     */
    function withdrawTap() external;

    /**
     * @notice Get the amount available to withdraw via tap
     * @return amount The amount available
     */
    function getAvailableTap() external view returns (uint256 amount);

    /**
     * @notice Update the tap recipient address (only current tapRecipient)
     * @param newRecipient The new address to receive tap withdrawals
     */
    function updateTapRecipient(address newRecipient) external;

    // ============ Refund Functions ============

    /**
     * @notice Refund contribution if minRaise not met after deadline
     * @dev Burns sender's vTokens and returns proportional contribution
     * @return amount The amount of contribution asset refunded
     */
    function refund() external returns (uint256 amount);

    /**
     * @notice Check if refunds are available (minRaise not met and past deadline)
     * @return Whether refunds can be claimed
     */
    function isRefundable() external view returns (bool);

    // ============ Governance Functions ============

    /**
     * @notice Create a governance proposal
     * @param proposalType The type of proposal
     * @param value The new tap rate (only for INCREASE_TAP)
     * @return proposalId The ID of the created proposal
     */
    function createProposal(ProposalType proposalType, uint256 value)
        external
        returns (uint256 proposalId);

    /**
     * @notice Vote on a proposal
     * @param proposalId The ID of the proposal
     * @param support Whether to vote for or against
     */
    function vote(uint256 proposalId, bool support) external;

    /**
     * @notice Execute a successful proposal
     * @param proposalId The ID of the proposal to execute
     */
    function executeProposal(uint256 proposalId) external;

    // ============ View Functions ============

    /**
     * @notice Get the DAICO configuration
     * @return The current configuration
     */
    function config() external view returns (Config memory);

    /**
     * @notice Get proposal details
     * @param proposalId The proposal ID
     * @return The proposal details
     */
    function getProposal(uint256 proposalId) external view returns (Proposal memory);

    /**
     * @notice Check if minimum raise has been met
     * @return Whether minimum has been met
     */
    function isMinRaiseMet() external view returns (bool);

    /**
     * @notice Check if the DAICO has been dissolved
     * @return Whether the DAICO is dissolved
     */
    function isDissolved() external view returns (bool);

    /**
     * @notice Get the last tap withdrawal timestamp
     * @return The timestamp of last tap withdrawal
     */
    function lastTapWithdrawal() external view returns (uint256);

    /**
     * @notice Check if address has voted on a proposal
     * @param proposalId The proposal ID
     * @param voter The voter address
     * @return Whether the address has voted
     */
    function hasVoted(uint256 proposalId, address voter) external view returns (bool);

    /**
     * @notice Get total tokens sold so far
     * @return The total number of tokens sold
     */
    function totalSold() external view returns (uint256);

    /**
     * @notice Get the VRGDA sale start time
     * @return The timestamp when VRGDA sales started
     */
    function saleStartTime() external view returns (uint256);

}
```

## Implementation Notes

### VRGDA Mechanics
The VRGDA price at any time is calculated as:
```
p(t) = p0 * (1 - k)^(f(t) - totalSold)
```
Where:
- `p0` = target price
- `k` = price decay percent
- `f(t)` = expected tokens sold by time t (perTimeUnit * time elapsed)
- `totalSold` = actual tokens sold

This creates a self-balancing mechanism where:
- If selling faster than target → price increases exponentially
- If selling slower than target → price decreases exponentially
- Natural price discovery without manual intervention

### ERC4626 Integration with VRGDA
- `deposit(assets, receiver)` - Contributors deposit, receive vTokens based on VRGDA price
- `redeem(shares, receiver, owner)` - Burn vTokens to claim proportional treasury
- `totalAssets()` - Returns total contribution asset in treasury minus withdrawn tap
- `convertToShares()` - Uses VRGDA pricing to determine vTokens minted
- `convertToAssets()` - Standard proportional calculation for redemptions

### Governance Flow
1. Any vToken holder can create a proposal (with minimum threshold)
2. Voting period is fixed (e.g., 7 days)
3. Votes are weighted by vToken balance at proposal creation
4. Simple majority with 10% quorum for tap increase
5. Supermajority (67%) with 20% quorum for dissolution

### Project Token Distribution
- Linear vesting over `vestingDuration` starting from contribution
- Claimable amount = (vTokens / totalVTokens) * projectTokenSupply * (time elapsed / vestingDuration)
- Unclaimed tokens remain in contract until claimed

### Advantages of VRGDA for DAICOs

1. **Self-Regulating**: No need for manual price adjustments or sale phases
2. **Continuous Funding**: Works perfectly with ongoing contribution model
3. **Market Responsive**: Price reflects actual demand in real-time
4. **Predictable for Project**: Steady funding rate aligned with development needs
5. **Fair for Contributors**: Early supporters get better prices, but latecomers aren't priced out
6. **Anti-Manipulation**: Exponential pricing makes it expensive to corner the market

## Open Question

- One big DAICO? Or phased approach?
- If we go with a phased approach where do the tokens sit that are set asside for that? How do we make sure they are earmarked in a credible way?
- How does the DAICO relate to the option drop? To participate you must accumulate points? Or maybe the option drop is a secondary mechanic?
- Where do funds from the tap go? Project multisig initially?
