// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Test.sol";
import "../src/contracts/Daico.sol";

contract DaicoTest is Test {
    Daico public daico;

    address public owner = address(0x123);
    address public contributor1 = address(0x2);
    address public contributor2 = address(0x3);
    address public contributor3 = address(0x4);

    uint256 public constant TOKEN_PRICE = 1e15; // 0.001 ETH per token
    uint256 public constant FUNDING_CAP = 100 ether;
    uint256 public constant FUNDING_GOAL = 10 ether;
    uint256 public constant CONTRIBUTION_DURATION = 30 days;

    event ContributionMade(address indexed contributor, uint256 amount, uint256 tokens);
    event TapChanged(uint256 oldTap, uint256 newTap);
    event Withdrawal(uint256 amount);
    event ProposalCreated(uint256 indexed proposalId, Daico.ProposalType proposalType, uint256 newTapValue);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool choice, uint256 weight);
    event ProposalExecuted(uint256 indexed proposalId, Daico.ProposalStatus result);
    event WithdrawModeActivated();
    event RefundClaimed(address indexed contributor, uint256 amount);

    function setUp() public {
        vm.prank(owner);
        daico = new Daico("DAICO Token", "DAICO", TOKEN_PRICE, FUNDING_CAP, FUNDING_GOAL, CONTRIBUTION_DURATION);
    }

    function testInitialState() public {
        assertEq(daico.name(), "DAICO Token");
        assertEq(daico.symbol(), "DAICO");
        assertEq(daico.tokenPrice(), TOKEN_PRICE);
        assertEq(daico.fundingCap(), FUNDING_CAP);
        assertEq(daico.fundingGoal(), FUNDING_GOAL);
        assertEq(daico.owner(), owner);
        assertEq(daico.tap(), 0);
        assertEq(daico.totalRaised(), 0);
        assertFalse(daico.isWithdrawMode());
        assertEq(daico.getCurrentPhase(), "Contribution");
    }

    function testContribution() public {
        uint256 contributionAmount = 5 ether;
        uint256 expectedTokens = (contributionAmount * 10 ** 18) / TOKEN_PRICE;

        vm.deal(contributor1, contributionAmount);

        vm.expectEmit(true, false, false, true);
        emit ContributionMade(contributor1, contributionAmount, expectedTokens);

        vm.prank(contributor1);
        daico.contribute{value: contributionAmount}();

        assertEq(daico.totalRaised(), contributionAmount);
        assertEq(daico.contributions(contributor1), contributionAmount);
        assertEq(daico.balanceOf(contributor1), expectedTokens);
        assertEq(address(daico).balance, contributionAmount);
    }

    function testContributionViaReceive() public {
        uint256 contributionAmount = 3 ether;
        uint256 expectedTokens = (contributionAmount * 10 ** 18) / TOKEN_PRICE;

        vm.deal(contributor1, contributionAmount);

        vm.expectEmit(true, false, false, true);
        emit ContributionMade(contributor1, contributionAmount, expectedTokens);

        vm.prank(contributor1);
        (bool success,) = address(daico).call{value: contributionAmount}("");
        assertTrue(success);

        assertEq(daico.totalRaised(), contributionAmount);
        assertEq(daico.balanceOf(contributor1), expectedTokens);
    }

    function testContributionFailsAfterPeriod() public {
        // Fast forward past contribution period
        vm.warp(block.timestamp + CONTRIBUTION_DURATION + 1);

        vm.deal(contributor1, 1 ether);

        vm.prank(contributor1);
        vm.expectRevert("Not in contribution period");
        daico.contribute{value: 1 ether}();
    }

    function testContributionFailsExceedingCap() public {
        vm.deal(contributor1, FUNDING_CAP + 1 ether);

        vm.prank(contributor1);
        vm.expectRevert("Would exceed funding cap");
        daico.contribute{value: FUNDING_CAP + 1 ether}();
    }

    function testRefundWhenGoalNotMet() public {
        uint256 contributionAmount = 5 ether; // Less than funding goal

        vm.deal(contributor1, contributionAmount);
        vm.prank(contributor1);
        daico.contribute{value: contributionAmount}();

        // Fast forward past contribution period
        vm.warp(block.timestamp + CONTRIBUTION_DURATION + 1);

        assertEq(daico.getCurrentPhase(), "Failed");
        assertFalse(daico.isFundingSuccessful());

        uint256 balanceBefore = contributor1.balance;

        vm.expectEmit(true, false, false, true);
        emit RefundClaimed(contributor1, contributionAmount);

        vm.prank(contributor1);
        daico.claimRefund();

        assertEq(contributor1.balance, balanceBefore + contributionAmount);
        assertEq(daico.balanceOf(contributor1), 0);
        assertEq(daico.contributions(contributor1), 0);
    }

    function testSuccessfulFunding() public {
        // Contribute enough to meet funding goal
        vm.deal(contributor1, FUNDING_GOAL);
        vm.prank(contributor1);
        daico.contribute{value: FUNDING_GOAL}();

        // Fast forward past contribution period
        vm.warp(block.timestamp + CONTRIBUTION_DURATION + 1);

        assertEq(daico.getCurrentPhase(), "Active");
        assertTrue(daico.isFundingSuccessful());
    }

    function testOwnerCanDecreaseTap() public {
        // Setup successful funding
        vm.deal(contributor1, FUNDING_GOAL);
        vm.prank(contributor1);
        daico.contribute{value: FUNDING_GOAL}();

        vm.warp(block.timestamp + CONTRIBUTION_DURATION + 1);

        // Owner sets initial tap
        uint256 initialTap = 1e15; // 0.001 ETH per second
        vm.prank(owner);
        daico.decreaseTap(initialTap);
        assertEq(daico.tap(), initialTap);

        // Owner decreases tap
        uint256 newTap = 5e14; // 0.0005 ETH per second

        vm.expectEmit(false, false, false, true);
        emit TapChanged(initialTap, newTap);

        vm.prank(owner);
        daico.decreaseTap(newTap);

        assertEq(daico.tap(), newTap);
    }

    function testOwnerCannotIncreaseTap() public {
        vm.deal(contributor1, FUNDING_GOAL);
        vm.prank(contributor1);
        daico.contribute{value: FUNDING_GOAL}();

        vm.warp(block.timestamp + CONTRIBUTION_DURATION + 1);

        uint256 initialTap = 1e15;
        vm.prank(owner);
        daico.decreaseTap(initialTap);

        uint256 higherTap = 2e15;
        vm.prank(owner);
        vm.expectRevert("Can only decrease tap or set initial tap");
        daico.decreaseTap(higherTap);
    }

    function testOwnerWithdrawal() public {
        // Setup successful funding
        vm.deal(contributor1, FUNDING_GOAL);
        vm.prank(contributor1);
        daico.contribute{value: FUNDING_GOAL}();

        vm.warp(block.timestamp + CONTRIBUTION_DURATION + 1);

        // Set tap rate
        uint256 tapRate = 1e15; // 0.001 ETH per second
        vm.prank(owner);
        daico.decreaseTap(tapRate);

        // Fast forward 1000 seconds
        vm.warp(block.timestamp + 1000);

        uint256 expectedWithdrawal = 1000 * tapRate;
        uint256 ownerBalanceBefore = owner.balance;

        vm.expectEmit(false, false, false, true);
        emit Withdrawal(expectedWithdrawal);

        vm.prank(owner);
        daico.withdraw();

        assertEq(owner.balance, ownerBalanceBefore + expectedWithdrawal);
    }

    function testCreateIncreaseTapProposal() public {
        // Setup successful funding with tokens distributed
        vm.deal(contributor1, FUNDING_GOAL);
        vm.prank(contributor1);
        daico.contribute{value: FUNDING_GOAL}();

        vm.warp(block.timestamp + CONTRIBUTION_DURATION + 1);

        // Set initial tap
        uint256 initialTap = 1e15;
        vm.prank(owner);
        daico.decreaseTap(initialTap);

        uint256 newTapValue = 2e15;

        vm.expectEmit(true, false, false, true);
        emit ProposalCreated(0, Daico.ProposalType.IncreaseTap, newTapValue);

        vm.prank(contributor1);
        daico.createProposal(Daico.ProposalType.IncreaseTap, newTapValue);

        (
            uint256 id,
            Daico.ProposalType proposalType,
            uint256 tapValue,
            uint256 startTime,
            uint256 endTime,
            uint256 yesVotes,
            uint256 noVotes,
            Daico.ProposalStatus status
        ) = daico.getProposal(0);

        assertEq(id, 0);
        assertEq(uint256(proposalType), uint256(Daico.ProposalType.IncreaseTap));
        assertEq(tapValue, newTapValue);
        assertEq(startTime, block.timestamp);
        assertEq(endTime, block.timestamp + 7 days);
        assertEq(yesVotes, 0);
        assertEq(noVotes, 0);
        assertEq(uint256(status), uint256(Daico.ProposalStatus.Active));
    }

    function testVoteOnProposal() public {
        // Setup successful funding with multiple contributors
        vm.deal(contributor1, 6 ether);
        vm.deal(contributor2, 4 ether);

        vm.prank(contributor1);
        daico.contribute{value: 6 ether}();

        vm.prank(contributor2);
        daico.contribute{value: 4 ether}();

        vm.warp(block.timestamp + CONTRIBUTION_DURATION + 1);

        // Set initial tap
        vm.prank(owner);
        daico.decreaseTap(1e15);

        // Create proposal
        vm.prank(contributor1);
        daico.createProposal(Daico.ProposalType.IncreaseTap, 2e15);

        uint256 contributor1Tokens = daico.balanceOf(contributor1);

        vm.expectEmit(true, true, false, true);
        emit VoteCast(0, contributor1, true, contributor1Tokens);

        vm.prank(contributor1);
        daico.vote(0, true);

        assertTrue(daico.hasVoted(0, contributor1));
        assertTrue(daico.getVoteChoice(0, contributor1));

        (,,,,, uint256 yesVotes,,) = daico.getProposal(0);
        assertEq(yesVotes, contributor1Tokens);
    }

    function testExecuteSuccessfulIncreaseTapProposal() public {
        // Setup with multiple contributors
        vm.deal(contributor1, 6 ether);
        vm.deal(contributor2, 4 ether);

        vm.prank(contributor1);
        daico.contribute{value: 6 ether}();

        vm.prank(contributor2);
        daico.contribute{value: 4 ether}();

        vm.warp(block.timestamp + CONTRIBUTION_DURATION + 1);

        uint256 initialTap = 1e15;
        uint256 newTapValue = 2e15;

        vm.prank(owner);
        daico.decreaseTap(initialTap);

        // Create proposal
        vm.prank(contributor1);
        daico.createProposal(Daico.ProposalType.IncreaseTap, newTapValue);

        // Vote yes with majority
        vm.prank(contributor1);
        daico.vote(0, true);

        vm.prank(contributor2);
        daico.vote(0, true);

        // Fast forward past voting period
        vm.warp(block.timestamp + 7 days + 1);

        vm.expectEmit(true, false, false, true);
        emit ProposalExecuted(0, Daico.ProposalStatus.Executed);

        vm.expectEmit(false, false, false, true);
        emit TapChanged(initialTap, newTapValue);

        daico.executeProposal(0);

        assertEq(daico.tap(), newTapValue);

        (,,,,,,, Daico.ProposalStatus status) = daico.getProposal(0);
        assertEq(uint256(status), uint256(Daico.ProposalStatus.Executed));
    }

    function testExecuteSuccessfulSelfDestructProposal() public {
        // Setup with contributors
        vm.deal(contributor1, 6 ether);
        vm.deal(contributor2, 4 ether);

        vm.prank(contributor1);
        daico.contribute{value: 6 ether}();

        vm.prank(contributor2);
        daico.contribute{value: 4 ether}();

        vm.warp(block.timestamp + CONTRIBUTION_DURATION + 1);

        // Create self-destruct proposal
        vm.prank(contributor1);
        daico.createProposal(Daico.ProposalType.SelfDestruct, 0);

        // Vote yes with majority
        vm.prank(contributor1);
        daico.vote(0, true);

        vm.prank(contributor2);
        daico.vote(0, true);

        // Fast forward past voting period
        vm.warp(block.timestamp + 7 days + 1);

        vm.expectEmit();
        emit WithdrawModeActivated();

        daico.executeProposal(0);

        assertTrue(daico.isWithdrawMode());
        assertEq(daico.getCurrentPhase(), "Withdraw");
    }

    function testWithdrawShareInWithdrawMode() public {
        // Setup with contributors
        vm.deal(contributor1, 6 ether);
        vm.deal(contributor2, 4 ether);

        vm.prank(contributor1);
        daico.contribute{value: 6 ether}();

        vm.prank(contributor2);
        daico.contribute{value: 4 ether}();

        vm.warp(block.timestamp + CONTRIBUTION_DURATION + 1);

        // Activate withdraw mode via self-destruct proposal
        vm.prank(contributor1);
        daico.createProposal(Daico.ProposalType.SelfDestruct, 0);

        vm.prank(contributor1);
        daico.vote(0, true);

        vm.prank(contributor2);
        daico.vote(0, true);

        vm.warp(block.timestamp + 7 days + 1);
        daico.executeProposal(0);

        // Withdraw share
        uint256 contributor1Tokens = daico.balanceOf(contributor1);
        uint256 totalTokens = daico.totalSupply();
        uint256 contractBalance = address(daico).balance;
        uint256 expectedShare = (contractBalance * contributor1Tokens) / totalTokens;

        uint256 balanceBefore = contributor1.balance;

        vm.prank(contributor1);
        daico.withdrawShare();

        assertEq(contributor1.balance, balanceBefore + expectedShare);
        assertEq(daico.balanceOf(contributor1), 0);
    }

    function testGetAvailableWithdrawal() public {
        // Setup successful funding
        vm.deal(contributor1, FUNDING_GOAL);
        vm.prank(contributor1);
        daico.contribute{value: FUNDING_GOAL}();

        vm.warp(block.timestamp + CONTRIBUTION_DURATION + 1);

        // Set tap rate
        uint256 tapRate = 1e15;
        vm.prank(owner);
        daico.decreaseTap(tapRate);

        // Fast forward 1000 seconds
        vm.warp(block.timestamp + 1000);

        uint256 expectedWithdrawal = 1000 * tapRate;
        assertEq(daico.getAvailableWithdrawal(), expectedWithdrawal);
    }

    function testRecoverToken() public {
        // This would require deploying a mock ERC20 token
        // For now, just test that the function exists and has proper access control
        vm.prank(contributor1);
        vm.expectRevert();
        daico.recoverToken(address(0x123));
    }
}
