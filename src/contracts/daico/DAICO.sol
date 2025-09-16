// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {IDAICO} from "interfaces/IDAICO.sol";
import {LogisticVRGDA} from "@transmissions11/vrgda/LogisticVRGDA.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {toWadUnsafe} from "solmate/utils/SignedWadMath.sol";
import {DAICOVault} from "contracts/tokens/DAICOVault.sol";

/// @title DAICO
/// @notice Decentralized Autonomous Initial Coin Offering with VRGDA pricing
/// @dev Uses vault tokens for governance and refunds, project tokens vest over time
contract DAICO is IDAICO, LogisticVRGDA, ReentrancyGuard {
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

    /// @notice Initialize the DAICO contract
    /// @param _projectToken The project token to be distributed
    /// @param _treasury The treasury address
    /// @param _admin The admin address
    /// @param _maxSupply Maximum project tokens available for sale
    /// @param _targetPrice Target price for VRGDA (in wei per token)
    /// @param _priceDecayPercent Price decay percent (1e18 = 100%)
    /// @param _timeScale Time scale for logistic curve (in wad)
    /// @param _cliffDuration Vesting cliff duration in seconds
    /// @param _vestingDuration Total vesting duration in seconds
    /// @param _vaultName Name for the vault token
    /// @param _vaultSymbol Symbol for the vault token
    constructor(
        address _projectToken,
        address _treasury,
        address _admin,
        uint256 _maxSupply,
        int256 _targetPrice,
        int256 _priceDecayPercent,
        int256 _timeScale,
        uint256 _cliffDuration,
        uint256 _vestingDuration,
        string memory _vaultName,
        string memory _vaultSymbol
    ) LogisticVRGDA(_targetPrice, _priceDecayPercent, toWadUnsafe(_maxSupply / 1e18), _timeScale) {
        if (_projectToken == address(0)) revert ZeroAddress();
        if (_treasury == address(0)) revert ZeroAddress();
        if (_admin == address(0)) revert ZeroAddress();
        if (_maxSupply == 0) revert InvalidAmount();
        if (_vestingDuration < _cliffDuration) revert InvalidAmount();

        projectToken = IERC20(_projectToken);
        treasury = _treasury;
        admin = _admin;
        maxSupply = _maxSupply;
        saleStartTime = block.timestamp;
        cliffDuration = _cliffDuration;
        vestingDuration = _vestingDuration;
        lastVestingWithdrawal = block.timestamp;

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

        // Calculate ETH cost using VRGDA
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
    /// INTERNAL FUNCTIONS
    /// ================================================

    /// @notice Calculate price using VRGDA
    function _calculatePrice(uint256 amount) private view returns (uint256 totalPrice) {
        int256 timeSinceStart = toWadUnsafe(block.timestamp - saleStartTime);

        if (amount == 0) return 0;

        // Convert from wei-like units to whole tokens for VRGDA pricing
        uint256 tokensToPrice = amount / 1e18;
        uint256 currentTokensSold = totalSold / 1e18;

        if (tokensToPrice > 0) {
            // Price whole tokens
            for (uint256 i = 0; i < tokensToPrice; i++) {
                totalPrice += getVRGDAPrice(timeSinceStart, currentTokensSold + i);
            }
        }

        // Handle fractional token (remainder)
        uint256 remainder = amount % 1e18;
        if (remainder > 0) {
            uint256 nextTokenPrice = getVRGDAPrice(timeSinceStart, currentTokensSold + tokensToPrice);
            // Scale the price proportionally for the fractional amount
            totalPrice += (nextTokenPrice * remainder) / 1e18;
        }
    }

    /// @notice Calculate price at specific supply
    function _calculatePriceAtSupply(uint256 amount, uint256 currentSold) private view returns (uint256 totalPrice) {
        int256 timeSinceStart = toWadUnsafe(block.timestamp - saleStartTime);

        if (amount == 0) return 0;

        // Convert from wei-like units to whole tokens for VRGDA pricing
        uint256 tokensToPrice = amount / 1e18;
        uint256 currentTokensSold = currentSold / 1e18;

        if (tokensToPrice > 0) {
            // Price whole tokens
            for (uint256 i = 0; i < tokensToPrice; i++) {
                totalPrice += getVRGDAPrice(timeSinceStart, currentTokensSold + i);
            }
        }

        // Handle fractional token (remainder)
        uint256 remainder = amount % 1e18;
        if (remainder > 0) {
            uint256 nextTokenPrice = getVRGDAPrice(timeSinceStart, currentTokensSold + tokensToPrice);
            // Scale the price proportionally for the fractional amount
            totalPrice += (nextTokenPrice * remainder) / 1e18;
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
