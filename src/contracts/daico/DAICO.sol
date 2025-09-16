// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {IDAICO} from "interfaces/IDAICO.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {DAICOVault} from "contracts/tokens/DAICOVault.sol";

/// @title DAICO
/// @notice Decentralized Autonomous Initial Coin Offering with Time-Weighted Polynomial Bonding Curve
/// @dev Uses vault tokens for governance and refunds, project tokens vest over time
///
/// The pricing mechanism uses a polynomial bonding curve with time-based adjustments:
/// - Base price follows a polynomial curve: P(s) = a0 + a1*s + a2*s² + a3*s³
/// - Time adjustment multiplies base price based on sales pace vs target
/// - This creates VRGDA-like behavior while being gas efficient and continuous
contract DAICO is IDAICO, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// ================================================
    /// IMMUTABLES
    /// ================================================

    /// @notice The vault token (governance token)
    DAICOVault public immutable override vaultToken;

    /// @notice The project token being distributed
    IERC20 public immutable override projectToken;

    /// @notice Treasury address for vested funds
    address public immutable override treasury;

    /// @notice Admin address
    address public immutable admin;

    /// @notice Sale start timestamp
    uint256 public immutable override saleStartTime;

    /// @notice Maximum supply of project tokens for sale
    uint256 public immutable override maxSupply;

    /// @notice Vesting cliff duration
    uint256 public immutable override cliffDuration;

    /// @notice Total vesting duration
    uint256 public immutable override vestingDuration;

    /// ================================================
    /// PRICING PARAMETERS (IMMUTABLES)
    /// ================================================

    /// @notice Target sale velocity (tokens per second, scaled by 1e18)
    /// @dev Used to determine if sales are ahead/behind schedule
    uint256 public immutable targetVelocity;

    /// @notice Pace adjustment factor (scaled by 1e18)
    /// @dev Controls how strongly price reacts to being ahead/behind schedule
    /// @dev Higher values = stronger price adjustments
    uint256 public immutable paceAdjustmentFactor;

    /// @notice Polynomial coefficient a0 (constant term, scaled by 1e18)
    /// @dev Base price when no tokens have been sold
    uint256 public immutable a0;

    /// @notice Polynomial coefficient a1 (linear term, scaled by 1e36)
    /// @dev Controls linear price growth
    uint256 public immutable a1;

    /// @notice Polynomial coefficient a2 (quadratic term, scaled by 1e54)
    /// @dev Controls quadratic price growth
    uint256 public immutable a2;

    /// @notice Polynomial coefficient a3 (cubic term, scaled by 1e72)
    /// @dev Controls cubic price growth
    uint256 public immutable a3;

    /// ================================================
    /// STATE VARIABLES
    /// ================================================

    /// @notice Total project tokens sold
    uint256 public override totalSold;

    /// @notice Total ETH raised
    uint256 public override totalRaised;

    /// @notice Total ETH vested to project
    uint256 public override totalVested;

    /// @notice Whether the sale has ended
    bool public override saleEnded;

    /// @notice Whether the sale is paused
    bool public override salePaused;

    /// @notice Vesting schedules per user
    mapping(address => VestingSchedule) private vestingSchedules;

    /// @notice Contribution history per user
    mapping(address => Contribution[]) private contributionHistory;

    /// @notice Last vesting withdrawal timestamp
    uint256 private lastVestingWithdrawal;

    /// ================================================
    /// MODIFIERS
    /// ================================================

    modifier notPaused() {
        if (salePaused) revert Paused();
        _;
    }

    modifier onlySaleActive() {
        if (saleEnded || salePaused) revert SaleNotActive();
        _;
    }

    modifier onlyAdmin() virtual {
        if (msg.sender != admin) revert Unauthorized();
        _;
    }

    /// ================================================
    /// CONSTRUCTOR
    /// ================================================

    /// @notice Initialize the DAICO contract with polynomial bonding curve pricing
    /// @param _projectToken The project token to be distributed
    /// @param _treasury The treasury address
    /// @param _admin The admin address
    /// @param _maxSupply Maximum project tokens available for sale
    /// @param _targetVelocity Target sale rate (tokens per second, scaled by 1e18)
    /// @param _paceAdjustmentFactor How strongly to adjust price based on pace (scaled by 1e18)
    /// @param _polynomialCoefficients Array of [a0, a1, a2, a3] polynomial coefficients
    /// @param _cliffDuration Vesting cliff duration in seconds
    /// @param _vestingDuration Total vesting duration in seconds
    /// @param _vaultName Name for the vault token
    /// @param _vaultSymbol Symbol for the vault token
    constructor(
        address _projectToken,
        address _treasury,
        address _admin,
        uint256 _maxSupply,
        uint256 _targetVelocity,
        uint256 _paceAdjustmentFactor,
        uint256[4] memory _polynomialCoefficients,
        uint256 _cliffDuration,
        uint256 _vestingDuration,
        string memory _vaultName,
        string memory _vaultSymbol
    ) {
        if (_projectToken == address(0)) revert ZeroAddress();
        if (_treasury == address(0)) revert ZeroAddress();
        if (_admin == address(0)) revert ZeroAddress();
        if (_maxSupply == 0) revert InvalidAmount();
        if (_targetVelocity == 0) revert InvalidAmount();
        if (_vestingDuration < _cliffDuration) revert InvalidAmount();

        projectToken = IERC20(_projectToken);
        treasury = _treasury;
        admin = _admin;
        maxSupply = _maxSupply;
        saleStartTime = block.timestamp;
        cliffDuration = _cliffDuration;
        vestingDuration = _vestingDuration;
        lastVestingWithdrawal = block.timestamp;

        // Set pricing parameters
        targetVelocity = _targetVelocity;
        paceAdjustmentFactor = _paceAdjustmentFactor;
        a0 = _polynomialCoefficients[0];
        a1 = _polynomialCoefficients[1];
        a2 = _polynomialCoefficients[2];
        a3 = _polynomialCoefficients[3];

        // Deploy vault token
        vaultToken = new DAICOVault(address(this), _vaultName, _vaultSymbol);
    }

    /// ================================================
    /// CONTRIBUTION FUNCTIONS
    /// ================================================

    /// @inheritdoc IDAICO
    function contribute(uint256 projectTokenAmount)
        external
        payable
        override
        nonReentrant
        notPaused
        onlySaleActive
        returns (uint256 vaultTokensIssued)
    {
        if (projectTokenAmount == 0) revert InvalidAmount();
        if (totalSold + projectTokenAmount > maxSupply) revert ExceedsMaxSupply();

        // Calculate ETH cost using polynomial bonding curve
        uint256 ethRequired = _calculatePrice(projectTokenAmount);
        if (msg.value < ethRequired) revert InsufficientPayment();

        // Update state
        totalSold += projectTokenAmount;
        totalRaised += ethRequired;

        // Vault tokens are 1:1 with ETH contributed
        vaultTokensIssued = ethRequired;

        // Mint vault tokens to contributor
        vaultToken.mint(msg.sender, vaultTokensIssued);

        // Update or create vesting schedule
        _updateVestingSchedule(msg.sender, projectTokenAmount, ethRequired);

        // Record contribution
        contributionHistory[msg.sender].push(
            Contribution({
                contributor: msg.sender,
                ethAmount: ethRequired,
                vaultTokensReceived: vaultTokensIssued,
                timestamp: block.timestamp
            })
        );

        // Project tokens are pre-funded to this contract

        // Refund excess ETH if any
        if (msg.value > ethRequired) {
            (bool success,) = msg.sender.call{value: msg.value - ethRequired}("");
            if (!success) revert TransferFailed();
        }

        emit Contributed(msg.sender, ethRequired, vaultTokensIssued, projectTokenAmount);
    }

    /// @inheritdoc IDAICO
    function getCurrentPrice(uint256 amount) external view override returns (uint256) {
        if (saleEnded || salePaused) return 0;
        return _calculatePrice(amount);
    }

    /// @inheritdoc IDAICO
    function getQuoteAtSupply(uint256 amount, uint256 currentSold) external view override returns (uint256) {
        return _calculatePriceAtSupply(amount, currentSold);
    }

    /// ================================================
    /// REDEMPTION FUNCTIONS
    /// ================================================

    /// @inheritdoc IDAICO
    function refund(uint256 vaultTokenAmount) external override nonReentrant returns (uint256 ethRefunded) {
        if (vaultTokenAmount == 0) revert InvalidAmount();
        if (vaultToken.balanceOf(msg.sender) < vaultTokenAmount) revert InsufficientVaultTokens();

        VestingSchedule storage schedule = vestingSchedules[msg.sender];
        if (schedule.ethContributed == 0) revert NothingToClaim();

        // Calculate unvested ETH proportion
        uint256 unvestedETH = _calculateUnvestedETH(schedule);

        // Calculate refund based on vault token proportion
        uint256 userTotalVaultTokens = schedule.ethContributed; // Vault tokens are 1:1 with ETH
        ethRefunded = (unvestedETH * vaultTokenAmount) / userTotalVaultTokens;

        // Update schedule - reduce proportionally
        uint256 tokenReduction = (schedule.totalTokens * vaultTokenAmount) / userTotalVaultTokens;
        schedule.totalTokens -= tokenReduction;
        schedule.ethContributed -= ethRefunded;

        // Burn vault tokens
        vaultToken.burnFrom(msg.sender, vaultTokenAmount);

        // Send ETH refund
        (bool success,) = msg.sender.call{value: ethRefunded}("");
        if (!success) revert TransferFailed();

        emit Refunded(msg.sender, vaultTokenAmount, ethRefunded);
    }

    /// @inheritdoc IDAICO
    function claimProjectTokens(uint256 vaultTokenAmount)
        external
        override
        nonReentrant
        returns (uint256 projectTokensClaimed)
    {
        if (vaultTokenAmount == 0) revert InvalidAmount();
        if (vaultToken.balanceOf(msg.sender) < vaultTokenAmount) revert InsufficientVaultTokens();

        VestingSchedule storage schedule = vestingSchedules[msg.sender];
        if (schedule.totalTokens == 0) revert NothingToClaim();

        // Check cliff
        if (block.timestamp < schedule.startTime + schedule.cliffDuration) {
            revert StillInCliff();
        }

        // Calculate vested project tokens available
        uint256 vestedTokens = _calculateVestedTokens(schedule);
        uint256 claimableTokens = vestedTokens - schedule.claimed;

        if (claimableTokens == 0) revert NothingToClaim();

        // Calculate how many project tokens this vault token amount represents
        uint256 userTotalVaultTokens = schedule.ethContributed;
        projectTokensClaimed = (claimableTokens * vaultTokenAmount) / userTotalVaultTokens;

        if (projectTokensClaimed > claimableTokens) {
            projectTokensClaimed = claimableTokens;
        }

        // Update claimed amount
        schedule.claimed += projectTokensClaimed;

        // Burn vault tokens
        vaultToken.burnFrom(msg.sender, vaultTokenAmount);

        // Transfer project tokens to user
        projectToken.safeTransfer(msg.sender, projectTokensClaimed);

        emit TokensClaimed(msg.sender, vaultTokenAmount, projectTokensClaimed);
    }

    /// @inheritdoc IDAICO
    function calculateRefund(address account, uint256 vaultTokenAmount)
        external
        view
        override
        returns (uint256 ethRefund)
    {
        if (vaultTokenAmount == 0) return 0;

        VestingSchedule memory schedule = vestingSchedules[account];
        if (schedule.ethContributed == 0) return 0;

        uint256 unvestedETH = _calculateUnvestedETH(schedule);
        uint256 userTotalVaultTokens = schedule.ethContributed;

        ethRefund = (unvestedETH * vaultTokenAmount) / userTotalVaultTokens;
    }

    /// @inheritdoc IDAICO
    function calculateClaimableTokens(address account, uint256 vaultTokenAmount)
        external
        view
        override
        returns (uint256 projectTokens)
    {
        if (vaultTokenAmount == 0) return 0;

        VestingSchedule memory schedule = vestingSchedules[account];
        if (schedule.totalTokens == 0) return 0;
        if (block.timestamp < schedule.startTime + schedule.cliffDuration) return 0;

        uint256 vestedTokens = _calculateVestedTokens(schedule);
        uint256 claimableTokens = vestedTokens - schedule.claimed;
        uint256 userTotalVaultTokens = schedule.ethContributed;

        projectTokens = (claimableTokens * vaultTokenAmount) / userTotalVaultTokens;
    }

    /// ================================================
    /// VESTING FUNCTIONS
    /// ================================================

    /// @inheritdoc IDAICO
    function getVestingSchedule(address account) external view override returns (VestingSchedule memory) {
        return vestingSchedules[account];
    }

    /// @inheritdoc IDAICO
    function getVestedETH(address account) external view override returns (uint256) {
        VestingSchedule memory schedule = vestingSchedules[account];
        if (schedule.ethContributed == 0) return 0;
        return _calculateVestedETH(schedule);
    }

    /// @inheritdoc IDAICO
    function getUnvestedETH(address account) external view override returns (uint256) {
        VestingSchedule memory schedule = vestingSchedules[account];
        if (schedule.ethContributed == 0) return 0;
        return _calculateUnvestedETH(schedule);
    }

    /// @inheritdoc IDAICO
    function withdrawVestedToTreasury() external override onlyAdmin returns (uint256 amount) {
        // Calculate total vested ETH since last withdrawal
        uint256 currentTime = block.timestamp;
        uint256 timeSinceLastWithdrawal = currentTime - lastVestingWithdrawal;

        // Simple linear vesting of raised funds
        if (currentTime >= saleStartTime + vestingDuration) {
            // All funds are vested
            amount = address(this).balance;
        } else if (currentTime >= saleStartTime + cliffDuration) {
            // Calculate vested portion
            uint256 totalVestingTime = currentTime - saleStartTime;
            uint256 vestedPortion = (totalRaised * totalVestingTime) / vestingDuration;
            amount = vestedPortion - totalVested;

            if (amount > address(this).balance) {
                amount = address(this).balance;
            }
        } else {
            // Still in cliff
            return 0;
        }

        if (amount > 0) {
            totalVested += amount;
            lastVestingWithdrawal = currentTime;

            (bool success,) = treasury.call{value: amount}("");
            if (!success) revert TransferFailed();

            emit VestedToTreasury(amount);
        }
    }

    /// ================================================
    /// ADMIN FUNCTIONS
    /// ================================================

    /// @inheritdoc IDAICO
    function pauseSale() external override onlyAdmin {
        salePaused = true;
        emit SalePaused(msg.sender);
    }

    /// @inheritdoc IDAICO
    function unpauseSale() external override onlyAdmin {
        salePaused = false;
        emit SaleUnpaused(msg.sender);
    }

    /// @inheritdoc IDAICO
    function endSale() external override onlyAdmin {
        saleEnded = true;
        emit SaleEnded(msg.sender);
    }

    /// ================================================
    /// VIEW FUNCTIONS
    /// ================================================

    /// @inheritdoc IDAICO
    function saleActive() external view override returns (bool) {
        return !saleEnded;
    }

    /// @inheritdoc IDAICO
    function getContributionHistory(address account) external view override returns (Contribution[] memory) {
        return contributionHistory[account];
    }

    /// @inheritdoc IDAICO
    function getExchangeRate(address account) external view override returns (uint256) {
        VestingSchedule memory schedule = vestingSchedules[account];
        if (schedule.ethContributed == 0) return 0;

        // Project tokens per vault token (vault tokens are 1:1 with ETH)
        return (schedule.totalTokens * 1e18) / schedule.ethContributed;
    }

    /// ================================================
    /// PRICING FUNCTIONS (Time-Weighted Polynomial Bonding Curve)
    /// ================================================

    /// @notice Calculate price using Time-Weighted Polynomial Bonding Curve
    /// @dev Implements a polynomial bonding curve with time-based adjustments
    ///
    /// The pricing mechanism consists of two parts:
    /// 1. Base Price: Integral of polynomial P(s) = a0 + a1*s + a2*s² + a3*s³
    /// 2. Time Multiplier: Adjusts price based on sales velocity vs target
    ///
    /// This creates VRGDA-like behavior:
    /// - Selling ahead of schedule → higher multiplier → higher price
    /// - Selling behind schedule → lower multiplier → lower price
    ///
    /// @param amount The amount of project tokens to price
    /// @return totalPrice The total ETH cost for the tokens
    function _calculatePrice(uint256 amount) private view returns (uint256 totalPrice) {
        if (amount == 0) return 0;

        uint256 start = totalSold;
        uint256 end = totalSold + amount;

        // Calculate base price using polynomial integral
        uint256 baseCost = _integratePolynomial(start, end);

        // Calculate time-based multiplier
        uint256 multiplier = _calculateTimeMultiplier();

        // Apply time adjustment to base cost
        totalPrice = (baseCost * multiplier) / 1e18;
    }

    /// @notice Calculate price at a specific supply level
    /// @param amount The amount of tokens to price
    /// @param currentSold The supply level to calculate price at
    /// @return totalPrice The total ETH cost
    function _calculatePriceAtSupply(uint256 amount, uint256 currentSold) private view returns (uint256 totalPrice) {
        if (amount == 0) return 0;

        uint256 start = currentSold;
        uint256 end = currentSold + amount;

        // Calculate base price using polynomial integral
        uint256 baseCost = _integratePolynomial(start, end);

        // Calculate time-based multiplier
        uint256 multiplier = _calculateTimeMultiplier();

        // Apply time adjustment to base cost
        totalPrice = (baseCost * multiplier) / 1e18;
    }

    /// @notice Integrate the polynomial from start to end supply
    /// @dev Calculates ∫[start,end] (a0 + a1*s + a2*s² + a3*s³) ds
    ///
    /// The integral evaluates to:
    /// [a0*s + a1*s²/2 + a2*s³/3 + a3*s⁴/4] evaluated from start to end
    ///
    /// @param start Starting supply point (in wei units)
    /// @param end Ending supply point (in wei units)
    /// @return cost The integrated cost between start and end
    function _integratePolynomial(uint256 start, uint256 end) private view returns (uint256 cost) {
        // Convert to whole token units for cleaner calculations
        uint256 s1 = start / 1e18;
        uint256 s2 = end / 1e18;

        // Calculate powers
        uint256 s1_2 = s1 * s1;
        uint256 s1_3 = s1_2 * s1;
        uint256 s1_4 = s1_3 * s1;

        uint256 s2_2 = s2 * s2;
        uint256 s2_3 = s2_2 * s2;
        uint256 s2_4 = s2_3 * s2;

        // Integral of a0 term: a0 * (s2 - s1)
        uint256 term0 = a0 * (s2 - s1);

        // Integral of a1 term: a1/2 * (s2² - s1²)
        // Note: a1 is scaled by 1e36, so we divide by 2e18 to maintain scaling
        uint256 term1 = (a1 * (s2_2 - s1_2)) / (2 * 1e18);

        // Integral of a2 term: a2/3 * (s2³ - s1³)
        // Note: a2 is scaled by 1e54, so we divide by 3e36 to maintain scaling
        uint256 term2 = (a2 * (s2_3 - s1_3)) / (3 * 1e36);

        // Integral of a3 term: a3/4 * (s2⁴ - s1⁴)
        // Note: a3 is scaled by 1e72, so we divide by 4e54 to maintain scaling
        uint256 term3 = (a3 * (s2_4 - s1_4)) / (4 * 1e54);

        // Sum all terms
        cost = term0 + term1 + term2 + term3;

        // Handle fractional tokens
        uint256 fractionalTokens = (end - start) % 1e18;
        if (fractionalTokens > 0) {
            // Calculate spot price at end point and scale by fraction
            uint256 spotPrice = _calculateSpotPrice(end);
            cost += (spotPrice * fractionalTokens) / 1e18;
        }
    }

    /// @notice Calculate the spot price at a given supply level
    /// @dev Evaluates the polynomial P(s) = a0 + a1*s + a2*s² + a3*s³
    /// @param supply The supply level to evaluate at (in wei units)
    /// @return price The spot price at the given supply
    function _calculateSpotPrice(uint256 supply) private view returns (uint256 price) {
        uint256 s = supply / 1e18; // Convert to whole tokens

        // Calculate polynomial: a0 + a1*s + a2*s² + a3*s³
        uint256 s_2 = s * s;
        uint256 s_3 = s_2 * s;

        price = a0;
        price += (a1 * s) / 1e18;
        price += (a2 * s_2) / 1e36;
        price += (a3 * s_3) / 1e54;
    }

    /// @notice Calculate the time-based price multiplier
    /// @dev Adjusts price based on actual vs target sales velocity
    ///
    /// The multiplier uses an exponential adjustment:
    /// - If selling faster than target: multiplier > 1 (higher prices)
    /// - If selling slower than target: multiplier < 1 (lower prices)
    /// - If exactly on target: multiplier = 1 (no adjustment)
    ///
    /// @return multiplier The price multiplier (scaled by 1e18)
    function _calculateTimeMultiplier() private view returns (uint256 multiplier) {
        uint256 timeElapsed = block.timestamp - saleStartTime;
        if (timeElapsed == 0) return 1e18; // No adjustment at start

        // Calculate expected vs actual sales
        uint256 expectedSold = (targetVelocity * timeElapsed) / 1e18;

        if (totalSold > expectedSold) {
            // Selling ahead of schedule - increase price
            uint256 aheadBy = totalSold - expectedSold;
            uint256 percentAhead = (aheadBy * 1e18) / (expectedSold + 1); // +1 to avoid division by zero

            // Exponential increase: e^(paceAdjustmentFactor * percentAhead)
            // Approximation: 1 + factor * percent + (factor * percent)² / 2
            uint256 adjustment = (paceAdjustmentFactor * percentAhead) / 1e18;
            uint256 adjustmentSquared = (adjustment * adjustment) / 1e18;

            multiplier = 1e18 + adjustment + adjustmentSquared / 2;
        } else {
            // Selling behind schedule - decrease price
            uint256 behindBy = expectedSold - totalSold;
            uint256 percentBehind = (behindBy * 1e18) / (expectedSold + 1);

            // Exponential decrease: e^(-paceAdjustmentFactor * percentBehind)
            // Approximation: 1 - factor * percent + (factor * percent)² / 2
            uint256 adjustment = (paceAdjustmentFactor * percentBehind) / 1e18;
            uint256 adjustmentSquared = (adjustment * adjustment) / 1e18;

            // Ensure we don't go below a minimum multiplier (e.g., 0.1x)
            uint256 decrease = adjustment - adjustmentSquared / 2;
            if (decrease >= 9e17) {
                multiplier = 1e17; // Minimum 0.1x multiplier
            } else {
                multiplier = 1e18 - decrease;
            }
        }
    }

    /// @notice Update vesting schedule for a contributor
    function _updateVestingSchedule(address user, uint256 tokenAmount, uint256 ethAmount) private {
        VestingSchedule storage schedule = vestingSchedules[user];

        if (schedule.totalTokens == 0) {
            // Create new schedule
            schedule.totalTokens = tokenAmount;
            schedule.startTime = block.timestamp;
            schedule.cliffDuration = cliffDuration;
            schedule.vestingDuration = vestingDuration;
            schedule.ethContributed = ethAmount;
        } else {
            // Add to existing schedule
            schedule.totalTokens += tokenAmount;
            schedule.ethContributed += ethAmount;
            // Keep original start time and durations
        }
    }

    /// @notice Calculate vested project tokens
    function _calculateVestedTokens(VestingSchedule memory schedule) private view returns (uint256) {
        if (block.timestamp < schedule.startTime + schedule.cliffDuration) {
            return 0;
        }

        if (block.timestamp >= schedule.startTime + schedule.vestingDuration) {
            return schedule.totalTokens;
        }

        uint256 timeVested = block.timestamp - schedule.startTime;
        return (schedule.totalTokens * timeVested) / schedule.vestingDuration;
    }

    /// @notice Calculate vested ETH
    function _calculateVestedETH(VestingSchedule memory schedule) private view returns (uint256) {
        if (block.timestamp < schedule.startTime + schedule.cliffDuration) {
            return 0;
        }

        if (block.timestamp >= schedule.startTime + schedule.vestingDuration) {
            return schedule.ethContributed;
        }

        uint256 timeVested = block.timestamp - schedule.startTime;
        return (schedule.ethContributed * timeVested) / schedule.vestingDuration;
    }

    /// @notice Calculate unvested ETH
    function _calculateUnvestedETH(VestingSchedule memory schedule) private view returns (uint256) {
        uint256 vestedETH = _calculateVestedETH(schedule);
        return schedule.ethContributed - vestedETH;
    }

    /// @notice Receive ETH - reverts to prevent accidental sends
    receive() external payable {
        revert("Use contribute function");
    }
}
