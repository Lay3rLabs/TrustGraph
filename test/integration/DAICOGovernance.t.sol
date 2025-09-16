// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import {DAICO} from "../../src/contracts/daico/DAICO.sol";
import {DAICOVault} from "../../src/contracts/tokens/DAICOVault.sol";
import {IDAICO} from "../../src/interfaces/IDAICO.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";
import {IGovernor} from "@openzeppelin/contracts/governance/IGovernor.sol";
import {Governor} from "@openzeppelin/contracts/governance/Governor.sol";
import {GovernorSettings} from "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import {GovernorCountingSimple} from "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import {GovernorVotes} from "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import {GovernorVotesQuorumFraction} from
    "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {GovernorTimelockControl} from "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";

/// @title DAICO Governance Integration Tests
/// @notice Tests the integration between DAICO vault tokens and governance mechanisms
/// @dev Comprehensive testing of voting power, proposals, and governance actions
contract DAICOGovernanceTest is Test {
    // ============ Core Contracts ============
    DAICO public daico;
    DAICOVault public vaultToken;
    MockProjectToken public projectToken;
    DAICOGovernor public governor;
    TimelockController public timelock;

    // ============ Test Addresses ============
    address public admin = address(0x1);
    address public treasury = address(0x2);
    address public alice = address(0x3);
    address public bob = address(0x4);
    address public charlie = address(0x5);
    address public dave = address(0x6);
    address public eve = address(0x7);

    // ============ DAICO Parameters ============
    uint256 public constant TARGET_PRICE = 0.001 ether;
    int256 public constant DECAY_CONSTANT = 0.9e18;
    uint256 public constant PER_TIME_UNIT = 1000 * 1e18;
    uint256 public constant MAX_SUPPLY = 1_000_000 * 1e18;
    uint256 public constant CLIFF_DURATION = 30 days;
    uint256 public constant VESTING_DURATION = 180 days;

    // ============ Governance Parameters ============
    uint256 public constant VOTING_DELAY = 1; // 1 block
    uint256 public constant VOTING_PERIOD = 50400; // 1 week (assuming 12s blocks)
    uint256 public constant PROPOSAL_THRESHOLD = 10 * 1e18; // 10 vault tokens
    uint256 public constant QUORUM_PERCENTAGE = 4; // 4%
    uint256 public constant TIMELOCK_DELAY = 2 days;

    // ============ Events ============
    event ProposalCreated(
        uint256 proposalId,
        address proposer,
        address[] targets,
        uint256[] values,
        string[] signatures,
        bytes[] calldatas,
        uint256 voteStart,
        uint256 voteEnd,
        string description
    );
    event VoteCast(address indexed voter, uint256 proposalId, uint8 support, uint256 weight, string reason);
    event ProposalExecuted(uint256 proposalId);

    function setUp() public {
        // Label addresses
        vm.label(admin, "Admin");
        vm.label(treasury, "Treasury");
        vm.label(alice, "Alice");
        vm.label(bob, "Bob");
        vm.label(charlie, "Charlie");
        vm.label(dave, "Dave");
        vm.label(eve, "Eve");

        // Deploy project token
        projectToken = new MockProjectToken();

        // Deploy DAICO
        vm.startPrank(admin);
        daico = new DAICO(
            address(projectToken),
            treasury,
            admin,
            MAX_SUPPLY,
            int256(TARGET_PRICE),
            int256(DECAY_CONSTANT),
            int256(PER_TIME_UNIT),
            CLIFF_DURATION,
            VESTING_DURATION,
            "DAICO Vault Token",
            "DVT"
        );
        vaultToken = DAICOVault(daico.vaultToken());

        // Setup timelock
        address[] memory proposers = new address[](1);
        proposers[0] = address(0); // Anyone can propose through governor
        address[] memory executors = new address[](1);
        executors[0] = address(0); // Anyone can execute
        timelock = new TimelockController(TIMELOCK_DELAY, proposers, executors, admin);

        // Deploy governor
        governor = new DAICOGovernor(
            IVotes(address(vaultToken)), timelock, VOTING_DELAY, VOTING_PERIOD, PROPOSAL_THRESHOLD, QUORUM_PERCENTAGE
        );

        // Grant roles
        timelock.grantRole(timelock.PROPOSER_ROLE(), address(governor));
        timelock.grantRole(timelock.EXECUTOR_ROLE(), address(governor));
        timelock.grantRole(timelock.CANCELLER_ROLE(), admin);

        // Transfer tokens to DAICO
        projectToken.mint(address(daico), MAX_SUPPLY);

        vm.stopPrank();

        // Fund test accounts
        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
        vm.deal(charlie, 100 ether);
        vm.deal(dave, 100 ether);
        vm.deal(eve, 100 ether);
    }

    // ============ Helper Functions ============

    function setupContributorsWithDelegation() internal {
        // Alice contributes and delegates to herself
        vm.startPrank(alice);
        daico.contribute{value: 5 ether}(5000 * 1e18);
        vaultToken.delegate(alice);
        vm.stopPrank();

        // Bob contributes and delegates to himself
        vm.startPrank(bob);
        daico.contribute{value: 3 ether}(3000 * 1e18);
        vaultToken.delegate(bob);
        vm.stopPrank();

        // Charlie contributes and delegates to Alice (vote delegation)
        vm.startPrank(charlie);
        daico.contribute{value: 2 ether}(2000 * 1e18);
        vaultToken.delegate(alice);
        vm.stopPrank();

        // Dave contributes but doesn't delegate (no voting power)
        vm.startPrank(dave);
        daico.contribute{value: 1 ether}(1000 * 1e18);
        vm.stopPrank();

        // Eve contributes small amount for proposal threshold tests
        vm.startPrank(eve);
        daico.contribute{value: 0.02 ether}(20 * 1e18);
        vaultToken.delegate(eve);
        vm.stopPrank();
    }

    function createProposal(address proposer, string memory description) internal returns (uint256 proposalId) {
        address[] memory targets = new address[](1);
        targets[0] = address(daico);

        uint256[] memory values = new uint256[](1);
        values[0] = 0;

        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSignature("pauseSale()");

        vm.prank(proposer);
        proposalId = governor.propose(targets, values, calldatas, description);
    }

    // ============ Basic Governance Tests ============

    function test_VotingPowerFromContributions() public {
        setupContributorsWithDelegation();

        // Check voting power
        assertEq(vaultToken.getVotes(alice), 7 ether, "Alice should have her + Charlie's votes");
        assertEq(vaultToken.getVotes(bob), 3 ether, "Bob should have his votes");
        assertEq(vaultToken.getVotes(charlie), 0, "Charlie delegated, should have 0 votes");
        assertEq(vaultToken.getVotes(dave), 0, "Dave didn't delegate, should have 0 votes");
        assertEq(vaultToken.getVotes(eve), 0.02 ether, "Eve should have her votes");
    }

    function test_ProposalCreationWithVaultTokens() public {
        setupContributorsWithDelegation();

        // Alice has enough tokens to propose
        vm.roll(block.number + 1);
        uint256 proposalId = createProposal(alice, "Pause the sale for emergency");

        // Verify proposal state
        IGovernor.ProposalState state = governor.state(proposalId);
        assertEq(uint256(state), uint256(IGovernor.ProposalState.Pending), "Proposal should be pending");

        // Eve doesn't have enough tokens to propose
        vm.expectRevert("Governor: proposer votes below proposal threshold");
        createProposal(eve, "Should fail");
    }

    function test_VotingOnProposal() public {
        setupContributorsWithDelegation();

        vm.roll(block.number + 1);
        uint256 proposalId = createProposal(alice, "Test proposal");

        // Move to active voting period
        vm.roll(block.number + VOTING_DELAY + 1);

        // Alice votes for (has 7 ether worth of votes)
        vm.prank(alice);
        governor.castVote(proposalId, 1); // 1 = For

        // Bob votes against (has 3 ether worth of votes)
        vm.prank(bob);
        governor.castVoteWithReason(proposalId, 0, "I disagree"); // 0 = Against

        // Dave tries to vote but has no voting power
        vm.prank(dave);
        governor.castVote(proposalId, 1);

        // Check vote results
        (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes) = governor.proposalVotes(proposalId);
        assertEq(forVotes, 7 ether, "For votes should be Alice's voting power");
        assertEq(againstVotes, 3 ether, "Against votes should be Bob's voting power");
        assertEq(abstainVotes, 0, "No abstain votes");
    }

    function test_ProposalExecutionSuccess() public {
        setupContributorsWithDelegation();

        // Create proposal to pause sale
        vm.roll(block.number + 1);

        address[] memory targets = new address[](1);
        targets[0] = address(daico);

        uint256[] memory values = new uint256[](1);
        values[0] = 0;

        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSignature("pauseSale()");

        string memory description = "Pause sale for maintenance";

        // First, need to transfer admin rights to timelock
        vm.prank(admin);
        daico = new MockDAICOWithTimelock(
            address(projectToken),
            treasury,
            address(timelock), // timelock as admin
            MAX_SUPPLY,
            int256(TARGET_PRICE),
            int256(DECAY_CONSTANT),
            int256(PER_TIME_UNIT),
            CLIFF_DURATION,
            VESTING_DURATION,
            "DAICO Vault Token",
            "DVT"
        );
        vaultToken = DAICOVault(daico.vaultToken());
        projectToken.mint(address(daico), MAX_SUPPLY);

        // Setup contributors again with new contracts
        setupContributorsWithDelegation();

        vm.roll(block.number + 1);
        vm.prank(alice);
        uint256 proposalId = governor.propose(targets, values, calldatas, description);

        // Vote
        vm.roll(block.number + VOTING_DELAY + 1);

        vm.prank(alice);
        governor.castVote(proposalId, 1);

        vm.prank(bob);
        governor.castVote(proposalId, 1);

        // Move past voting period
        vm.roll(block.number + VOTING_DELAY + VOTING_PERIOD + 1);

        // Queue proposal
        vm.prank(alice);
        governor.queue(targets, values, calldatas, keccak256(bytes(description)));

        // Move past timelock delay
        vm.warp(block.timestamp + TIMELOCK_DELAY + 1);

        // Execute proposal
        vm.prank(alice);
        governor.execute(targets, values, calldatas, keccak256(bytes(description)));

        // Verify sale is paused
        assertTrue(daico.salePaused(), "Sale should be paused after governance action");
    }

    function test_QuorumRequirements() public {
        setupContributorsWithDelegation();

        vm.roll(block.number + 1);
        uint256 proposalId = createProposal(alice, "Test quorum");

        // Calculate quorum needed (4% of total supply that has been delegated)
        uint256 totalSupply = vaultToken.totalSupply();
        uint256 quorumNeeded = governor.quorum(block.number);

        console.log("Total supply:", totalSupply);
        console.log("Quorum needed:", quorumNeeded);

        // Move to voting period
        vm.roll(block.number + VOTING_DELAY + 1);

        // Only Eve votes (not enough for quorum)
        vm.prank(eve);
        governor.castVote(proposalId, 1);

        // Move past voting period
        vm.roll(block.number + VOTING_DELAY + VOTING_PERIOD + 1);

        // Proposal should be defeated due to lack of quorum
        IGovernor.ProposalState state = governor.state(proposalId);
        assertEq(uint256(state), uint256(IGovernor.ProposalState.Defeated), "Should be defeated without quorum");
    }

    // ============ Voting Power Changes Tests ============

    function test_VotingPowerAfterRefund() public {
        setupContributorsWithDelegation();

        uint256 aliceInitialVotes = vaultToken.getVotes(alice);

        // Alice refunds half her tokens
        vm.prank(alice);
        daico.refund(vaultToken.balanceOf(alice) / 2);

        // Check voting power decreased
        uint256 aliceNewVotes = vaultToken.getVotes(alice);
        assertLt(aliceNewVotes, aliceInitialVotes, "Voting power should decrease after refund");

        // Charlie's delegation to Alice means Alice still has Charlie's votes
        assertEq(aliceNewVotes, 2.5 ether + 2 ether, "Alice should have half her tokens + Charlie's");
    }

    function test_VotingPowerAfterClaim() public {
        setupContributorsWithDelegation();

        // Move past vesting period
        vm.warp(block.timestamp + VESTING_DURATION);

        uint256 aliceInitialVotes = vaultToken.getVotes(alice);

        // Alice claims project tokens with half her vault tokens
        vm.prank(alice);
        daico.claimProjectTokens(vaultToken.balanceOf(alice) / 2);

        // Check voting power decreased
        uint256 aliceNewVotes = vaultToken.getVotes(alice);
        assertLt(aliceNewVotes, aliceInitialVotes, "Voting power should decrease after claim");
    }

    function test_VotingPowerTransfer() public {
        setupContributorsWithDelegation();

        // Bob transfers half his vault tokens to Eve
        uint256 transferAmount = vaultToken.balanceOf(bob) / 2;

        vm.prank(bob);
        vaultToken.transfer(eve, transferAmount);

        // Eve needs to delegate to herself to get voting power
        vm.prank(eve);
        vaultToken.delegate(eve);

        // Check voting power changes
        assertEq(vaultToken.getVotes(bob), 1.5 ether, "Bob should have half his original votes");
        assertEq(vaultToken.getVotes(eve), 0.02 ether + 1.5 ether, "Eve should have her original + transferred");
    }

    function test_DelegationChangeDuringProposal() public {
        setupContributorsWithDelegation();

        vm.roll(block.number + 1);
        uint256 proposalId = createProposal(alice, "Test delegation change");

        // Record voting snapshot block
        uint256 voteStart = governor.proposalSnapshot(proposalId);

        // Move to voting period
        vm.roll(voteStart + 1);

        // Alice votes with her current power (includes Charlie's delegation)
        vm.prank(alice);
        governor.castVote(proposalId, 1);

        // Charlie changes delegation to Bob (shouldn't affect this proposal)
        vm.prank(charlie);
        vaultToken.delegate(bob);

        // Bob votes
        vm.prank(bob);
        governor.castVote(proposalId, 0);

        // Check votes - Charlie's delegation change shouldn't affect current proposal
        (uint256 againstVotes, uint256 forVotes,) = governor.proposalVotes(proposalId);
        assertEq(forVotes, 7 ether, "Alice should still have Charlie's delegated votes for this proposal");
        assertEq(againstVotes, 3 ether, "Bob shouldn't have Charlie's new delegation for this proposal");
    }

    // ============ Complex Governance Scenarios ============

    function test_EmergencyPauseGovernance() public {
        setupContributorsWithDelegation();

        // Deploy DAICO with timelock as admin
        vm.prank(admin);
        MockDAICOWithTimelock timelockDaico = new MockDAICOWithTimelock(
            address(projectToken),
            treasury,
            address(timelock), // timelock as admin
            MAX_SUPPLY,
            int256(TARGET_PRICE),
            int256(DECAY_CONSTANT),
            int256(PER_TIME_UNIT),
            CLIFF_DURATION,
            VESTING_DURATION,
            "DAICO Vault Token",
            "DVT"
        );

        // Simulate emergency: create and execute pause proposal
        address[] memory targets = new address[](1);
        targets[0] = address(timelockDaico);

        uint256[] memory values = new uint256[](1);
        values[0] = 0;

        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSignature("pauseSale()");

        // Use admin's canceller role for emergency action
        vm.startPrank(admin);
        timelock.schedule(
            targets[0], values[0], calldatas[0], bytes32(0), bytes32(uint256(uint160(admin))), TIMELOCK_DELAY
        );

        vm.warp(block.timestamp + TIMELOCK_DELAY);

        timelock.execute(targets[0], values[0], calldatas[0], bytes32(0), bytes32(uint256(uint160(admin))));
        vm.stopPrank();

        assertTrue(timelockDaico.salePaused(), "Sale should be paused through emergency governance");
    }

    function test_MultiActionProposal() public {
        setupContributorsWithDelegation();

        // Create DAICO with timelock control
        vm.prank(admin);
        MockDAICOWithTimelock timelockDaico = new MockDAICOWithTimelock(
            address(projectToken),
            treasury,
            admin,
            MAX_SUPPLY,
            int256(TARGET_PRICE),
            int256(DECAY_CONSTANT),
            int256(PER_TIME_UNIT),
            CLIFF_DURATION,
            VESTING_DURATION,
            "DAICO Vault Token",
            "DVT"
        );

        // Create proposal with multiple actions
        address[] memory targets = new address[](3);
        targets[0] = address(timelockDaico);
        targets[1] = address(timelockDaico);
        targets[2] = address(timelockDaico);

        uint256[] memory values = new uint256[](3);
        values[0] = 0;
        values[1] = 0;
        values[2] = 0;

        bytes[] memory calldatas = new bytes[](3);
        calldatas[0] = abi.encodeWithSignature("pauseSale()");
        calldatas[1] = abi.encodeWithSignature("unpauseSale()");
        calldatas[2] = abi.encodeWithSignature("endSale()");

        vm.roll(block.number + 1);
        vm.prank(alice);
        uint256 proposalId = governor.propose(targets, values, calldatas, "Maintenance: pause, unpause, then end sale");

        // Vote and execute
        vm.roll(block.number + VOTING_DELAY + 1);

        vm.prank(alice);
        governor.castVote(proposalId, 1);

        vm.roll(block.number + VOTING_DELAY + VOTING_PERIOD + 1);

        vm.prank(alice);
        governor.queue(targets, values, calldatas, keccak256(bytes("Maintenance: pause, unpause, then end sale")));

        vm.warp(block.timestamp + TIMELOCK_DELAY + 1);

        vm.prank(alice);
        governor.execute(targets, values, calldatas, keccak256(bytes("Maintenance: pause, unpause, then end sale")));

        // Verify final state
        assertTrue(timelockDaico.saleEnded(), "Sale should be ended");
        assertFalse(timelockDaico.salePaused(), "Sale should not be paused (unpaused then ended)");
    }

    function test_GovernanceWithVestingImpact() public {
        setupContributorsWithDelegation();

        // Initial proposal when everyone has full voting power
        vm.roll(block.number + 1);
        uint256 proposal1 = createProposal(alice, "Proposal during full voting power");

        // Some users claim tokens (reducing voting power)
        vm.warp(block.timestamp + VESTING_DURATION);

        vm.prank(alice);
        daico.claimProjectTokens(vaultToken.balanceOf(alice) / 3);

        vm.prank(bob);
        daico.refund(vaultToken.balanceOf(bob) / 2);

        // New proposal with reduced voting power
        vm.roll(block.number + 100);
        uint256 proposal2 = createProposal(alice, "Proposal with reduced voting power");

        // Compare quorum requirements
        uint256 quorum1 = governor.quorum(governor.proposalSnapshot(proposal1));
        uint256 quorum2 = governor.quorum(governor.proposalSnapshot(proposal2));

        assertLt(quorum2, quorum1, "Quorum should be lower after tokens are burned");
    }
}

// ============ Mock Contracts ============

contract MockProjectToken is ERC20 {
    constructor() ERC20("Mock Project Token", "MPT") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract MockDAICOWithTimelock is DAICO {
    address public adminOverride;

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
    )
        DAICO(
            _projectToken,
            _treasury,
            _admin,
            _maxSupply,
            _targetPrice,
            _priceDecayPercent,
            _timeScale,
            _cliffDuration,
            _vestingDuration,
            _vaultName,
            _vaultSymbol
        )
    {
        adminOverride = _admin;
    }

    modifier onlyAdmin() override {
        if (msg.sender != adminOverride) revert Unauthorized();
        _;
    }
}

contract DAICOGovernor is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl
{
    constructor(
        IVotes _token,
        TimelockController _timelock,
        uint256 _votingDelay,
        uint256 _votingPeriod,
        uint256 _proposalThreshold,
        uint256 _quorumPercentage
    )
        Governor("DAICO Governor")
        GovernorSettings(uint48(_votingDelay), uint32(_votingPeriod), _proposalThreshold)
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(_quorumPercentage)
        GovernorTimelockControl(_timelock)
    {}

    // Required overrides

    function votingDelay() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingDelay();
    }

    function votingPeriod() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingPeriod();
    }

    function quorum(uint256 blockNumber)
        public
        view
        override(Governor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }

    function state(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    function proposalNeedsQueuing(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (bool)
    {
        return super.proposalNeedsQueuing(proposalId);
    }

    function _queueOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint48) {
        return super._queueOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _executeOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor() internal view override(Governor, GovernorTimelockControl) returns (address) {
        return super._executor();
    }
}
