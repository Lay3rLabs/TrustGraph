// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// TODO maybe add roles instead of ownable...
// This contract is slop.
/**
 * @title DAICO - Decentralized Autonomous Initial Coin Offering
 * @dev Implementation based on Vitalik Buterin's 2018 DAICO proposal
 * @notice This contract combines ICO fundraising with minimalist DAO governance for fund management
 */
contract Daico is ERC20, Ownable, ReentrancyGuard {
    // ============ State Variables ============

    /// @notice Current tap rate in wei per second
    uint256 public tap;

    /// @notice Timestamp of last withdrawal
    uint256 public lastWithdrawn;

    /// @notice Total ETH raised during contribution period
    uint256 public totalRaised;

    /// @notice Token price in wei per token (with 18 decimals)
    uint256 public tokenPrice;

    /// @notice Maximum cap for fundraising in wei
    uint256 public fundingCap;

    /// @notice Minimum funding goal in wei
    uint256 public fundingGoal;

    /// @notice Contribution period start time
    uint256 public contributionStart;

    /// @notice Contribution period end time
    uint256 public contributionEnd;

    /// @notice Whether the contract is in withdraw mode (self-destructed)
    bool public isWithdrawMode;

    /// @notice Voting duration for proposals
    uint256 public constant VOTING_DURATION = 7 days;

    /// @notice Minimum quorum percentage (basis points, 1000 = 10%)
    uint256 public constant QUORUM_PERCENTAGE = 1000; // 10%

    // ============ Enums ============

    enum ProposalType {
        IncreaseTap,
        SelfDestruct
    }

    enum ProposalStatus {
        Active,
        Passed,
        Failed,
        Executed
    }

    // ============ Structs ============

    struct Proposal {
        uint256 id;
        ProposalType proposalType;
        uint256 newTapValue; // Only used for IncreaseTap proposals
        uint256 startTime;
        uint256 endTime;
        uint256 yesVotes;
        uint256 noVotes;
        ProposalStatus status;
        mapping(address => bool) hasVoted;
        mapping(address => bool) voteChoice; // true = yes, false = no
    }

    // ============ Storage ============

    /// @notice Mapping of proposal ID to proposal data
    mapping(uint256 => Proposal) public proposals;

    /// @notice Current proposal counter
    uint256 public proposalCounter;

    /// @notice Mapping to track contributor balances for refunds
    mapping(address => uint256) public contributions;

    // ============ Events ============

    event ContributionMade(address indexed contributor, uint256 amount, uint256 tokens);
    event TapChanged(uint256 oldTap, uint256 newTap);
    event Withdrawal(uint256 amount);
    event ProposalCreated(uint256 indexed proposalId, ProposalType proposalType, uint256 newTapValue);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool choice, uint256 weight);
    event ProposalExecuted(uint256 indexed proposalId, ProposalStatus result);
    event WithdrawModeActivated();
    event RefundClaimed(address indexed contributor, uint256 amount);

    // ============ Modifiers ============

    modifier onlyDuringContribution() {
        require(
            block.timestamp >= contributionStart && block.timestamp <= contributionEnd && !isWithdrawMode,
            "Not in contribution period"
        );
        _;
    }

    modifier onlyAfterContribution() {
        require(block.timestamp > contributionEnd, "Contribution period not ended");
        _;
    }

    modifier onlyInWithdrawMode() {
        require(isWithdrawMode, "Not in withdraw mode");
        _;
    }

    modifier onlyTokenHolder() {
        require(balanceOf(msg.sender) > 0, "Must hold tokens to vote");
        _;
    }

    // ============ Constructor ============

    /**
     * @dev Initialize the DAICO contract
     * @param _name Token name
     * @param _symbol Token symbol
     * @param _tokenPrice Price per token in wei
     * @param _fundingCap Maximum funding cap in wei
     * @param _fundingGoal Minimum funding goal in wei
     * @param _contributionDuration Duration of contribution period in seconds
     */
    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _tokenPrice,
        uint256 _fundingCap,
        uint256 _fundingGoal,
        uint256 _contributionDuration
    ) ERC20(_name, _symbol) Ownable(msg.sender) {
        require(_tokenPrice > 0, "Token price must be positive");
        require(_fundingCap > _fundingGoal, "Cap must be greater than goal");
        require(_contributionDuration > 0, "Duration must be positive");

        tokenPrice = _tokenPrice;
        fundingCap = _fundingCap;
        fundingGoal = _fundingGoal;
        contributionStart = block.timestamp;
        contributionEnd = block.timestamp + _contributionDuration;
        lastWithdrawn = contributionEnd; // Initialize to end of contribution period
    }

    // ============ Contribution Functions ============

    /**
     * @notice Contribute ETH to the DAICO and receive tokens
     */
    function contribute() external payable onlyDuringContribution nonReentrant {
        require(msg.value > 0, "Must contribute positive amount");
        require(totalRaised + msg.value <= fundingCap, "Would exceed funding cap");

        uint256 tokenAmount = (msg.value * 10 ** decimals()) / tokenPrice;

        totalRaised += msg.value;
        contributions[msg.sender] += msg.value;

        _mint(msg.sender, tokenAmount);

        emit ContributionMade(msg.sender, msg.value, tokenAmount);
    }

    /**
     * @notice Claim refund if funding goal not met
     */
    function claimRefund() external nonReentrant {
        require(block.timestamp > contributionEnd, "Contribution period not ended");
        require(totalRaised < fundingGoal, "Funding goal was met");
        require(contributions[msg.sender] > 0, "No contribution to refund");

        uint256 refundAmount = contributions[msg.sender];
        contributions[msg.sender] = 0;

        // Burn the tokens
        _burn(msg.sender, balanceOf(msg.sender));

        payable(msg.sender).transfer(refundAmount);

        emit RefundClaimed(msg.sender, refundAmount);
    }

    // ============ Tap Management ============

    /**
     * @notice Withdraw available funds based on current tap rate
     */
    function withdraw() external onlyOwner onlyAfterContribution nonReentrant {
        require(!isWithdrawMode, "Contract is in withdraw mode");
        require(totalRaised >= fundingGoal, "Funding goal not met");

        uint256 timeElapsed = block.timestamp - lastWithdrawn;
        uint256 withdrawAmount = timeElapsed * tap;

        if (withdrawAmount > address(this).balance) {
            withdrawAmount = address(this).balance;
        }

        if (withdrawAmount > 0) {
            lastWithdrawn = block.timestamp;
            payable(owner()).transfer(withdrawAmount);
            emit Withdrawal(withdrawAmount);
        }
    }

    /**
     * @notice Owner can voluntarily decrease the tap rate or set initial tap
     * @param _newTap New tap rate in wei per second
     */
    function decreaseTap(uint256 _newTap) external onlyOwner {
        require(_newTap < tap || tap == 0, "Can only decrease tap or set initial tap");

        // Withdraw any pending funds first (only if tap > 0)
        if (block.timestamp > contributionEnd && totalRaised >= fundingGoal && tap > 0) {
            uint256 timeElapsed = block.timestamp - lastWithdrawn;
            uint256 withdrawAmount = timeElapsed * tap;

            if (withdrawAmount > 0 && withdrawAmount <= address(this).balance) {
                lastWithdrawn = block.timestamp;
                payable(owner()).transfer(withdrawAmount);
                emit Withdrawal(withdrawAmount);
            }
        }

        uint256 oldTap = tap;
        tap = _newTap;

        // Update lastWithdrawn when setting tap for the first time
        if (oldTap == 0 && _newTap > 0) {
            lastWithdrawn = block.timestamp;
        }

        emit TapChanged(oldTap, _newTap);
    }

    // ============ Governance Functions ============

    /**
     * @notice Create a proposal to increase tap or self-destruct
     * @param _proposalType Type of proposal
     * @param _newTapValue New tap value (only for IncreaseTap proposals)
     */
    function createProposal(ProposalType _proposalType, uint256 _newTapValue)
        external
        onlyTokenHolder
        onlyAfterContribution
    {
        require(!isWithdrawMode, "Contract is in withdraw mode");

        if (_proposalType == ProposalType.IncreaseTap) {
            require(_newTapValue > tap, "New tap must be higher than current");
        }

        uint256 proposalId = proposalCounter++;
        Proposal storage proposal = proposals[proposalId];

        proposal.id = proposalId;
        proposal.proposalType = _proposalType;
        proposal.newTapValue = _newTapValue;
        proposal.startTime = block.timestamp;
        proposal.endTime = block.timestamp + VOTING_DURATION;
        proposal.status = ProposalStatus.Active;

        emit ProposalCreated(proposalId, _proposalType, _newTapValue);
    }

    /**
     * @notice Vote on an active proposal
     * @param _proposalId ID of the proposal
     * @param _choice true for yes, false for no
     */
    function vote(uint256 _proposalId, bool _choice) external onlyTokenHolder {
        Proposal storage proposal = proposals[_proposalId];

        require(proposal.status == ProposalStatus.Active, "Proposal not active");
        require(block.timestamp <= proposal.endTime, "Voting period ended");
        require(!proposal.hasVoted[msg.sender], "Already voted");

        uint256 voterWeight = balanceOf(msg.sender);
        proposal.hasVoted[msg.sender] = true;
        proposal.voteChoice[msg.sender] = _choice;

        if (_choice) {
            proposal.yesVotes += voterWeight;
        } else {
            proposal.noVotes += voterWeight;
        }

        emit VoteCast(_proposalId, msg.sender, _choice, voterWeight);
    }

    /**
     * @notice Execute a proposal after voting period ends
     * @param _proposalId ID of the proposal to execute
     */
    function executeProposal(uint256 _proposalId) external {
        Proposal storage proposal = proposals[_proposalId];

        require(proposal.status == ProposalStatus.Active, "Proposal not active");
        require(block.timestamp > proposal.endTime, "Voting period not ended");

        uint256 totalVotes = proposal.yesVotes + proposal.noVotes;
        uint256 requiredQuorum = (totalSupply() * QUORUM_PERCENTAGE) / 10000;

        if (totalVotes >= requiredQuorum) {
            // Calculate if proposal passes: (yes - no) / 6 > 0
            // This implements the formula from Vitalik's post
            int256 netVotes = int256(proposal.yesVotes) - int256(proposal.noVotes);
            int256 absentVotes = int256(totalSupply() - totalVotes);
            int256 score = netVotes - absentVotes / 6;

            if (score > 0) {
                proposal.status = ProposalStatus.Passed;

                if (proposal.proposalType == ProposalType.IncreaseTap) {
                    // Withdraw pending funds first
                    if (totalRaised >= fundingGoal) {
                        uint256 timeElapsed = block.timestamp - lastWithdrawn;
                        uint256 withdrawAmount = timeElapsed * tap;

                        if (withdrawAmount > 0 && withdrawAmount <= address(this).balance) {
                            lastWithdrawn = block.timestamp;
                            payable(owner()).transfer(withdrawAmount);
                            emit Withdrawal(withdrawAmount);
                        }
                    }

                    uint256 oldTap = tap;
                    tap = proposal.newTapValue;

                    proposal.status = ProposalStatus.Executed;
                    emit ProposalExecuted(_proposalId, proposal.status);
                    emit TapChanged(oldTap, proposal.newTapValue);
                } else if (proposal.proposalType == ProposalType.SelfDestruct) {
                    isWithdrawMode = true;
                    proposal.status = ProposalStatus.Executed;
                    emit ProposalExecuted(_proposalId, proposal.status);
                    emit WithdrawModeActivated();
                }
            } else {
                proposal.status = ProposalStatus.Failed;
                emit ProposalExecuted(_proposalId, proposal.status);
            }
        } else {
            proposal.status = ProposalStatus.Failed;
            emit ProposalExecuted(_proposalId, proposal.status);
        }
    }

    /**
     * @notice Withdraw proportional share of remaining funds (only in withdraw mode)
     */
    function withdrawShare() external onlyInWithdrawMode nonReentrant {
        uint256 userBalance = balanceOf(msg.sender);
        require(userBalance > 0, "No tokens to withdraw with");

        uint256 totalTokens = totalSupply();
        uint256 contractBalance = address(this).balance;
        uint256 userShare = (contractBalance * userBalance) / totalTokens;

        _burn(msg.sender, userBalance);

        if (userShare > 0) {
            payable(msg.sender).transfer(userShare);
        }

        emit RefundClaimed(msg.sender, userShare);
    }

    // ============ View Functions ============

    /**
     * @notice Get proposal details
     * @param _proposalId ID of the proposal
     */
    function getProposal(uint256 _proposalId)
        external
        view
        returns (
            uint256 id,
            ProposalType proposalType,
            uint256 newTapValue,
            uint256 startTime,
            uint256 endTime,
            uint256 yesVotes,
            uint256 noVotes,
            ProposalStatus status
        )
    {
        Proposal storage proposal = proposals[_proposalId];
        return (
            proposal.id,
            proposal.proposalType,
            proposal.newTapValue,
            proposal.startTime,
            proposal.endTime,
            proposal.yesVotes,
            proposal.noVotes,
            proposal.status
        );
    }

    /**
     * @notice Check if an address has voted on a proposal
     * @param _proposalId ID of the proposal
     * @param _voter Address to check
     */
    function hasVoted(uint256 _proposalId, address _voter) external view returns (bool) {
        return proposals[_proposalId].hasVoted[_voter];
    }

    /**
     * @notice Get vote choice for an address on a proposal
     * @param _proposalId ID of the proposal
     * @param _voter Address to check
     */
    function getVoteChoice(uint256 _proposalId, address _voter) external view returns (bool) {
        require(proposals[_proposalId].hasVoted[_voter], "Address has not voted");
        return proposals[_proposalId].voteChoice[_voter];
    }

    /**
     * @notice Calculate available withdrawal amount for owner
     */
    function getAvailableWithdrawal() external view returns (uint256) {
        if (isWithdrawMode || block.timestamp <= contributionEnd || totalRaised < fundingGoal) {
            return 0;
        }

        uint256 timeElapsed = block.timestamp - lastWithdrawn;
        uint256 withdrawAmount = timeElapsed * tap;

        if (withdrawAmount > address(this).balance) {
            return address(this).balance;
        }

        return withdrawAmount;
    }

    /**
     * @notice Check if funding goal was met
     */
    function isFundingSuccessful() external view returns (bool) {
        return totalRaised >= fundingGoal;
    }

    /**
     * @notice Get current contract phase
     */
    function getCurrentPhase() external view returns (string memory) {
        if (block.timestamp <= contributionEnd) {
            return "Contribution";
        } else if (totalRaised < fundingGoal) {
            return "Failed";
        } else if (isWithdrawMode) {
            return "Withdraw";
        } else {
            return "Active";
        }
    }

    // ============ Emergency Functions ============

    /**
     * @notice Emergency function to recover stuck tokens (not the main token)
     * @param _token Address of the token to recover
     */
    function recoverToken(address _token) external onlyOwner {
        require(_token != address(this), "Cannot recover main token");
        ERC20 token = ERC20(_token);
        uint256 balance = token.balanceOf(address(this));
        if (balance > 0) {
            token.transfer(owner(), balance);
        }
    }

    // ============ Receive Function ============

    /**
     * @notice Receive function to accept ETH contributions
     */
    receive() external payable {
        require(
            block.timestamp >= contributionStart && block.timestamp <= contributionEnd && !isWithdrawMode,
            "Not in contribution period"
        );
        require(msg.value > 0, "Must contribute positive amount");
        require(totalRaised + msg.value <= fundingCap, "Would exceed funding cap");

        uint256 tokenAmount = (msg.value * 10 ** decimals()) / tokenPrice;

        totalRaised += msg.value;
        contributions[msg.sender] += msg.value;

        _mint(msg.sender, tokenAmount);

        emit ContributionMade(msg.sender, msg.value, tokenAmount);
    }
}
