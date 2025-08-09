// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Test} from "forge-std/Test.sol";
import {console} from "forge-std/console.sol";
import {VotingPower} from "../src/contracts/VotingPower.sol";
import {AttestationGovernor} from "../src/contracts/Governor.sol";
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";
import {IGovernor} from "@openzeppelin/contracts/governance/IGovernor.sol";

contract VotingPowerGovernorCompatibilityTest is Test {
    VotingPower public votingPower;
    AttestationGovernor public governor;
    TimelockController public timelock;

    address public owner;
    address public voter1;
    address public voter2;
    address public voter3;

    // Governor settings
    uint256 public constant VOTING_DELAY = 1 days;
    uint256 public constant VOTING_PERIOD = 1 weeks;
    uint256 public constant QUORUM_PERCENTAGE = 4; // 4%

    // Voting power distribution
    uint256 public constant TOTAL_SUPPLY = 1000000e18;
    uint256 public constant VOTER1_POWER = 400000e18; // 40%
    uint256 public constant VOTER2_POWER = 300000e18; // 30%
    uint256 public constant VOTER3_POWER = 300000e18; // 30%

    function setUp() public {
        // Set up test accounts
        owner = makeAddr("owner");
        voter1 = makeAddr("voter1");
        voter2 = makeAddr("voter2");
        voter3 = makeAddr("voter3");

        vm.startPrank(owner);

        // Deploy VotingPower contract
        votingPower = new VotingPower("Governance Token", "GOV", owner);

        // Deploy TimelockController
        address[] memory proposers = new address[](1);
        address[] memory executors = new address[](1);
        proposers[0] = address(0); // Will be set to governor after deployment
        executors[0] = address(0); // Anyone can execute

        timelock = new TimelockController(
            2 days, // min delay
            proposers,
            executors,
            owner // admin
        );

        // Deploy Governor
        governor = new AttestationGovernor(
            IVotes(address(votingPower)),
            timelock
        );

        // Grant proposer role to governor
        timelock.grantRole(timelock.PROPOSER_ROLE(), address(governor));

        // Revoke admin role from owner (governance should control timelock)
        timelock.revokeRole(timelock.DEFAULT_ADMIN_ROLE(), owner);

        // Distribute initial voting power
        votingPower.mint(voter1, VOTER1_POWER);
        votingPower.mint(voter2, VOTER2_POWER);
        votingPower.mint(voter3, VOTER3_POWER);

        vm.stopPrank();

        // Self-delegate to activate voting power
        vm.prank(voter1);
        votingPower.delegate(voter1);

        vm.prank(voter2);
        votingPower.delegate(voter2);

        vm.prank(voter3);
        votingPower.delegate(voter3);
    }

    function testVotingPowerImplementsIVotes() public view {
        // Test that VotingPower implements IVotes interface correctly
        IVotes votes = IVotes(address(votingPower));

        // Check that all IVotes functions are callable
        assertEq(votes.getVotes(voter1), VOTER1_POWER);
        assertEq(votes.delegates(voter1), voter1);

        // Check total supply tracking
        assertEq(votingPower.totalSupply(), TOTAL_SUPPLY);
    }

    function testGovernorIntegration() public {
        // Test that Governor works with VotingPower
        assertEq(address(governor.token()), address(votingPower));
        assertEq(governor.votingDelay(), VOTING_DELAY);
        assertEq(governor.votingPeriod(), VOTING_PERIOD);

        // Test quorum calculation - need to use a block number after voting power was established
        vm.roll(block.number + 1);
        uint256 expectedQuorum = (TOTAL_SUPPLY * QUORUM_PERCENTAGE) / 100;
        assertEq(governor.quorum(block.number - 1), expectedQuorum);
    }

    function testDelegationAndVotingPower() public {
        // Test delegation functionality
        assertEq(votingPower.getVotes(voter1), VOTER1_POWER);
        assertEq(votingPower.getVotes(voter2), VOTER2_POWER);
        assertEq(votingPower.getVotes(voter3), VOTER3_POWER);

        // Test delegation change
        vm.prank(voter2);
        votingPower.delegate(voter1);

        // voter1 should now have voter2's power as well
        assertEq(votingPower.getVotes(voter1), VOTER1_POWER + VOTER2_POWER);
        assertEq(votingPower.getVotes(voter2), 0);
    }

    function testProposalCreationAndVoting() public {
        // Create a simple proposal
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);

        targets[0] = address(votingPower);
        values[0] = 0;
        calldatas[0] = abi.encodeWithSignature(
            "mint(address,uint256)",
            voter1,
            1000e18
        );

        string memory description = "Proposal to mint 1000 tokens to voter1";

        // Create proposal
        vm.prank(voter1);
        uint256 proposalId = governor.propose(
            targets,
            values,
            calldatas,
            description
        );

        // Fast forward past voting delay
        vm.roll(block.number + VOTING_DELAY + 1);

        // Check proposal state
        assertEq(
            uint8(governor.state(proposalId)),
            uint8(IGovernor.ProposalState.Active)
        );

        // Vote on proposal
        vm.prank(voter1);
        governor.castVote(proposalId, 1); // Vote "For"

        vm.prank(voter2);
        governor.castVote(proposalId, 1); // Vote "For"

        // Check vote counts
        (
            uint256 againstVotes,
            uint256 forVotes,
            uint256 abstainVotes
        ) = governor.proposalVotes(proposalId);
        assertEq(forVotes, VOTER1_POWER + VOTER2_POWER);
        assertEq(againstVotes, 0);
        assertEq(abstainVotes, 0);
    }

    function testQuorumReached() public {
        // Create a proposal
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);

        targets[0] = address(votingPower);
        values[0] = 0;
        calldatas[0] = abi.encodeWithSignature(
            "mint(address,uint256)",
            voter1,
            1000e18
        );

        vm.prank(voter1);
        uint256 proposalId = governor.propose(
            targets,
            values,
            calldatas,
            "Test proposal for quorum"
        );

        vm.roll(block.number + VOTING_DELAY + 1);

        // Vote with enough power to reach quorum (40% > 4% quorum)
        vm.prank(voter1);
        governor.castVote(proposalId, 1);

        // Fast forward past voting period
        vm.roll(block.number + VOTING_PERIOD + 1);

        // Proposal should succeed
        assertEq(
            uint8(governor.state(proposalId)),
            uint8(IGovernor.ProposalState.Succeeded)
        );
    }

    function testQuorumNotReached() public {
        // Create a proposal
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);

        targets[0] = address(votingPower);
        values[0] = 0;
        calldatas[0] = abi.encodeWithSignature(
            "mint(address,uint256)",
            voter1,
            1000e18
        );

        vm.prank(voter1);
        uint256 proposalId = governor.propose(
            targets,
            values,
            calldatas,
            "Test proposal without quorum"
        );

        vm.roll(block.number + VOTING_DELAY + 1);

        // Create a voter with insufficient power (less than 4% quorum)
        address smallVoter = makeAddr("smallVoter");
        vm.prank(owner);
        votingPower.mint(smallVoter, 1000e18); // Only 0.1% of total supply

        vm.prank(smallVoter);
        votingPower.delegate(smallVoter);

        vm.prank(smallVoter);
        governor.castVote(proposalId, 1);

        // Fast forward past voting period
        vm.roll(block.number + VOTING_PERIOD + 1);

        // Proposal should be defeated due to lack of quorum
        assertEq(
            uint8(governor.state(proposalId)),
            uint8(IGovernor.ProposalState.Defeated)
        );
    }

    function testVotingPowerBalanceAndVotes() public view {
        // Test that balance and votes are tracked correctly
        assertEq(votingPower.balanceOf(voter1), VOTER1_POWER);
        assertEq(votingPower.getVotes(voter1), VOTER1_POWER);

        (uint256 balance, uint256 votes, address delegatedTo) = votingPower
            .getVotingStats(voter1);
        assertEq(balance, VOTER1_POWER);
        assertEq(votes, VOTER1_POWER);
        assertEq(delegatedTo, voter1);
    }

    function testMintAndBurnAffectVotingPower() public {
        uint256 initialVotes = votingPower.getVotes(voter1);
        uint256 mintAmount = 10000e18;

        // Mint tokens
        vm.prank(owner);
        votingPower.mint(voter1, mintAmount);

        // Voting power should increase
        assertEq(votingPower.getVotes(voter1), initialVotes + mintAmount);

        // Burn tokens
        vm.prank(owner);
        votingPower.burn(voter1, mintAmount);

        // Voting power should return to original
        assertEq(votingPower.getVotes(voter1), initialVotes);
    }

    function testBatchMintFunction() public {
        address[] memory recipients = new address[](2);
        uint256[] memory amounts = new uint256[](2);

        recipients[0] = makeAddr("newVoter1");
        recipients[1] = makeAddr("newVoter2");
        amounts[0] = 5000e18;
        amounts[1] = 10000e18;

        vm.startPrank(owner);
        votingPower.batchMint(recipients, amounts);
        vm.stopPrank();

        assertEq(votingPower.balanceOf(recipients[0]), amounts[0]);
        assertEq(votingPower.balanceOf(recipients[1]), amounts[1]);
    }

    function testInitialDistributionOnlyOnce() public {
        // Create a new VotingPower contract to test initial distribution
        vm.startPrank(owner);
        VotingPower newVotingPower = new VotingPower(
            "Test Token",
            "TEST",
            owner
        );

        address[] memory holders = new address[](2);
        uint256[] memory amounts = new uint256[](2);

        holders[0] = voter1;
        holders[1] = voter2;
        amounts[0] = 1000e18;
        amounts[1] = 2000e18;

        newVotingPower.initialDistribution(holders, amounts);

        assertEq(newVotingPower.balanceOf(voter1), 1000e18);
        assertEq(newVotingPower.balanceOf(voter2), 2000e18);
        assertEq(newVotingPower.totalSupply(), 3000e18);

        // Should revert if called again
        vm.expectRevert("VotingPower: initial distribution already completed");
        newVotingPower.initialDistribution(holders, amounts);
        vm.stopPrank();
    }
}
