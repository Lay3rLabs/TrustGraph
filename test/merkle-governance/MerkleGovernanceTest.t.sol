// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test, console2} from "forge-std/Test.sol";
import {MerkleGov} from "../../src/contracts/MerkleGov.sol";
import {MerkleVote} from "../../src/contracts/MerkleVote.sol";
import {IWavsServiceManager} from "@wavs/interfaces/IWavsServiceManager.sol";
import {MerkleTreeHelper} from "./MerkleTreeHelper.sol";

contract MerkleGovernanceTest is Test {
    MerkleGov public merkleGov;
    MerkleVote public merkleVote;
    MerkleTreeHelper public merkleHelper;

    // Test accounts from the provided merkle tree
    address constant ACCOUNT_1 = 0x976EA74026E726554dB657fA54763abd0C3a0aa9;
    address constant ACCOUNT_2 = 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65;
    address constant ACCOUNT_3 = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;
    address constant ACCOUNT_4 = 0x90F79bf6EB2c4f870365E785982E1f101E93b906;
    address constant ACCOUNT_5 = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC;

    // Reward token from merkle tree
    address constant REWARD_TOKEN = 0xC2D2C588647fc4d6f0fcccc98630684ef95296cE;

    // Merkle tree data (will be generated)
    bytes32 public merkleRoot;
    bytes32 constant IPFS_HASH = 0x192600e2ca69b1890e46242366d4e9bfdf9e92ed0e612a3ff57b5f0195d46fa5;

    // Governance parameters
    uint256 constant QUORUM_BASIS_POINTS = 1000; // 10%
    uint256 constant VOTING_DELAY = 1 days;
    uint256 constant VOTING_PERIOD = 3 days;
    uint256 constant TIMELOCK_DELAY = 2 days;
    uint256 constant PROPOSAL_THRESHOLD = 1e18; // 1 token minimum

    // Merkle proofs for test accounts (from provided tree)
    bytes32[] account1Proof;
    bytes32[] account2Proof;
    bytes32[] account3Proof;
    bytes32[] account4Proof;
    bytes32[] account5Proof;

    // Voting powers (claimable amounts from tree)
    uint256 constant ACCOUNT_1_POWER = 14942181248356228630;
    uint256 constant ACCOUNT_2_POWER = 17284218194836532874;
    uint256 constant ACCOUNT_3_POWER = 496807458496960460485;
    uint256 constant ACCOUNT_4_POWER = 50980656248531230906;
    uint256 constant ACCOUNT_5_POWER = 191595471241126134639;

    address admin;
    address mockServiceManager;

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        uint256 snapshotId,
        uint256 startTime,
        uint256 endTime,
        uint256 proposerVotingPower,
        string description
    );

    event VoteCast(address indexed voter, uint256 indexed proposalId, uint8 support, uint256 votingPower);

    function setUp() public {
        admin = address(this);
        mockServiceManager = address(0x1234); // Mock address for service manager

        // Deploy helper contract
        merkleHelper = new MerkleTreeHelper();

        // Deploy MerkleVote contract
        merkleVote = new MerkleVote(
            IWavsServiceManager(mockServiceManager),
            admin,
            0 // No timelock for testing
        );

        // Deploy MerkleGov contract
        merkleGov = new MerkleGov(
            merkleVote, admin, QUORUM_BASIS_POINTS, VOTING_DELAY, VOTING_PERIOD, TIMELOCK_DELAY, PROPOSAL_THRESHOLD
        );

        // Set up merkle tree and proofs
        _setupMerkleTree();

        // Set the merkle root in MerkleVote
        merkleVote.setRoot(merkleRoot, IPFS_HASH);
    }

    function _setupMerkleTree() internal {
        // Create account data array
        MerkleTreeHelper.AccountData[] memory accounts = new MerkleTreeHelper.AccountData[](5);

        accounts[0] =
            MerkleTreeHelper.AccountData({account: ACCOUNT_1, rewardToken: REWARD_TOKEN, votingPower: ACCOUNT_1_POWER});

        accounts[1] =
            MerkleTreeHelper.AccountData({account: ACCOUNT_2, rewardToken: REWARD_TOKEN, votingPower: ACCOUNT_2_POWER});

        accounts[2] =
            MerkleTreeHelper.AccountData({account: ACCOUNT_3, rewardToken: REWARD_TOKEN, votingPower: ACCOUNT_3_POWER});

        accounts[3] =
            MerkleTreeHelper.AccountData({account: ACCOUNT_4, rewardToken: REWARD_TOKEN, votingPower: ACCOUNT_4_POWER});

        accounts[4] =
            MerkleTreeHelper.AccountData({account: ACCOUNT_5, rewardToken: REWARD_TOKEN, votingPower: ACCOUNT_5_POWER});

        // Build merkle tree
        (bytes32 root,) = merkleHelper.buildMerkleTree(accounts);
        merkleRoot = root;

        // Generate proofs for each account
        account1Proof = merkleHelper.generateProof(accounts, 0);
        account2Proof = merkleHelper.generateProof(accounts, 1);
        account3Proof = merkleHelper.generateProof(accounts, 2);
        account4Proof = merkleHelper.generateProof(accounts, 3);
        account5Proof = merkleHelper.generateProof(accounts, 4);
    }

    function testProposalCreation() public {
        // Create proposal actions
        MerkleGov.ProposalAction[] memory actions = new MerkleGov.ProposalAction[](1);
        actions[0] = MerkleGov.ProposalAction({
            target: address(0x1111),
            value: 0,
            data: abi.encodeWithSignature("test()"),
            description: "Test action"
        });

        string memory description = "Test Proposal #1";

        // Account 3 has the most voting power, use them to create proposal
        vm.startPrank(ACCOUNT_3);

        vm.expectEmit(true, true, false, true);
        emit ProposalCreated(
            1,
            ACCOUNT_3,
            0,
            block.timestamp + VOTING_DELAY,
            block.timestamp + VOTING_DELAY + VOTING_PERIOD,
            ACCOUNT_3_POWER,
            description
        );

        uint256 proposalId = merkleGov.propose(
            actions,
            description,
            0, // snapshot ID
            REWARD_TOKEN,
            ACCOUNT_3_POWER,
            account3Proof
        );

        vm.stopPrank();

        assertEq(proposalId, 1, "Proposal ID should be 1");

        // Check proposal state
        MerkleGov.ProposalState state = merkleGov.state(proposalId);
        assertEq(uint256(state), uint256(MerkleGov.ProposalState.Pending), "Proposal should be pending");

        // Verify proposal details
        MerkleGov.ProposalCore memory proposal = merkleGov.getProposal(proposalId);
        assertEq(proposal.proposer, ACCOUNT_3, "Proposer should be ACCOUNT_3");
        assertEq(proposal.description, description, "Description should match");
    }

    function testVotingFlow() public {
        // First create a proposal
        MerkleGov.ProposalAction[] memory actions = new MerkleGov.ProposalAction[](1);
        actions[0] = MerkleGov.ProposalAction({
            target: address(0x1111),
            value: 0,
            data: abi.encodeWithSignature("test()"),
            description: "Test action"
        });

        vm.prank(ACCOUNT_3);
        uint256 proposalId =
            merkleGov.propose(actions, "Test Proposal for Voting", 0, REWARD_TOKEN, ACCOUNT_3_POWER, account3Proof);

        // Warp to voting period
        vm.warp(block.timestamp + VOTING_DELAY + 1);

        // Verify proposal is now active
        assertEq(
            uint256(merkleGov.state(proposalId)), uint256(MerkleGov.ProposalState.Active), "Proposal should be active"
        );

        // Account 1 votes FOR
        vm.prank(ACCOUNT_1);
        vm.expectEmit(true, true, false, true);
        emit VoteCast(ACCOUNT_1, proposalId, 1, ACCOUNT_1_POWER);
        merkleGov.castVote(proposalId, 1, REWARD_TOKEN, ACCOUNT_1_POWER, account1Proof);

        // Account 2 votes FOR
        vm.prank(ACCOUNT_2);
        merkleGov.castVote(proposalId, 1, REWARD_TOKEN, ACCOUNT_2_POWER, account2Proof);

        // Account 4 votes AGAINST
        vm.prank(ACCOUNT_4);
        merkleGov.castVote(proposalId, 0, REWARD_TOKEN, ACCOUNT_4_POWER, account4Proof);

        // Check vote tallies
        MerkleGov.ProposalCore memory proposal = merkleGov.getProposal(proposalId);
        assertEq(proposal.forVotes, ACCOUNT_1_POWER + ACCOUNT_2_POWER, "For votes should match");
        assertEq(proposal.againstVotes, ACCOUNT_4_POWER, "Against votes should match");
        assertEq(proposal.abstainVotes, 0, "Abstain votes should be 0");

        // Check individual vote records
        (bool hasVoted, MerkleGov.VoteType support, uint256 votingPower) = merkleGov.getVote(proposalId, ACCOUNT_1);
        assertTrue(hasVoted, "Account 1 should have voted");
        assertEq(uint256(support), 1, "Account 1 should have voted FOR");
        assertEq(votingPower, ACCOUNT_1_POWER, "Account 1 voting power should match");
    }

    function testVoteOnMultipleProposals() public {
        // Create two proposals
        MerkleGov.ProposalAction[] memory actions = new MerkleGov.ProposalAction[](1);
        actions[0] = MerkleGov.ProposalAction({
            target: address(0x1111),
            value: 0,
            data: abi.encodeWithSignature("test()"),
            description: "Test action"
        });

        // Create first proposal
        vm.prank(ACCOUNT_3);
        uint256 proposalId1 =
            merkleGov.propose(actions, "First Proposal", 0, REWARD_TOKEN, ACCOUNT_3_POWER, account3Proof);

        // Create second proposal (Account 5 creates this one)
        vm.prank(ACCOUNT_5);
        uint256 proposalId2 =
            merkleGov.propose(actions, "Second Proposal", 0, REWARD_TOKEN, ACCOUNT_5_POWER, account5Proof);

        // Warp to voting period
        vm.warp(block.timestamp + VOTING_DELAY + 1);

        // Account 1 votes on both proposals with the same proof
        vm.startPrank(ACCOUNT_1);

        // Vote on first proposal
        merkleGov.castVote(proposalId1, 1, REWARD_TOKEN, ACCOUNT_1_POWER, account1Proof);

        // Vote on second proposal with same proof (should work)
        merkleGov.castVote(proposalId2, 0, REWARD_TOKEN, ACCOUNT_1_POWER, account1Proof);

        vm.stopPrank();

        // Verify votes were recorded for both proposals
        (bool hasVoted1,,) = merkleGov.getVote(proposalId1, ACCOUNT_1);
        assertTrue(hasVoted1, "Should have voted on proposal 1");

        (bool hasVoted2,,) = merkleGov.getVote(proposalId2, ACCOUNT_1);
        assertTrue(hasVoted2, "Should have voted on proposal 2");

        // Check vote tallies
        MerkleGov.ProposalCore memory proposal1 = merkleGov.getProposal(proposalId1);
        assertEq(proposal1.forVotes, ACCOUNT_1_POWER, "Proposal 1 should have FOR votes");

        MerkleGov.ProposalCore memory proposal2 = merkleGov.getProposal(proposalId2);
        assertEq(proposal2.againstVotes, ACCOUNT_1_POWER, "Proposal 2 should have AGAINST votes");
    }

    function testCannotVoteTwiceOnSameProposal() public {
        // Create a proposal
        MerkleGov.ProposalAction[] memory actions = new MerkleGov.ProposalAction[](1);
        actions[0] = MerkleGov.ProposalAction({
            target: address(0x1111),
            value: 0,
            data: abi.encodeWithSignature("test()"),
            description: "Test action"
        });

        vm.prank(ACCOUNT_3);
        uint256 proposalId =
            merkleGov.propose(actions, "Test Proposal", 0, REWARD_TOKEN, ACCOUNT_3_POWER, account3Proof);

        // Warp to voting period
        vm.warp(block.timestamp + VOTING_DELAY + 1);

        // First vote should succeed
        vm.startPrank(ACCOUNT_1);
        merkleGov.castVote(proposalId, 1, REWARD_TOKEN, ACCOUNT_1_POWER, account1Proof);

        // Second vote should fail
        vm.expectRevert("MerkleGov: already voted");
        merkleGov.castVote(proposalId, 0, REWARD_TOKEN, ACCOUNT_1_POWER, account1Proof);
        vm.stopPrank();
    }

    function testProposalSucceedsWithQuorum() public {
        // Create a proposal
        MerkleGov.ProposalAction[] memory actions = new MerkleGov.ProposalAction[](1);
        actions[0] = MerkleGov.ProposalAction({
            target: address(0x1111),
            value: 0,
            data: abi.encodeWithSignature("test()"),
            description: "Test action"
        });

        vm.prank(ACCOUNT_3);
        uint256 proposalId =
            merkleGov.propose(actions, "Test Proposal", 0, REWARD_TOKEN, ACCOUNT_3_POWER, account3Proof);

        // Warp to voting period
        vm.warp(block.timestamp + VOTING_DELAY + 1);

        // Vote with enough power to pass
        vm.prank(ACCOUNT_3);
        merkleGov.castVote(proposalId, 1, REWARD_TOKEN, ACCOUNT_3_POWER, account3Proof);

        vm.prank(ACCOUNT_5);
        merkleGov.castVote(proposalId, 1, REWARD_TOKEN, ACCOUNT_5_POWER, account5Proof);

        // Warp past voting period
        vm.warp(block.timestamp + VOTING_PERIOD + 1);

        // Check proposal succeeded
        assertEq(
            uint256(merkleGov.state(proposalId)),
            uint256(MerkleGov.ProposalState.Succeeded),
            "Proposal should have succeeded"
        );
    }

    function testProposalFailsWithoutQuorum() public {
        // Create a proposal
        MerkleGov.ProposalAction[] memory actions = new MerkleGov.ProposalAction[](1);
        actions[0] = MerkleGov.ProposalAction({
            target: address(0x1111),
            value: 0,
            data: abi.encodeWithSignature("test()"),
            description: "Test action"
        });

        vm.prank(ACCOUNT_3);
        uint256 proposalId =
            merkleGov.propose(actions, "Test Proposal", 0, REWARD_TOKEN, ACCOUNT_3_POWER, account3Proof);

        // Warp to voting period but don't vote
        vm.warp(block.timestamp + VOTING_DELAY + 1);

        // Warp past voting period
        vm.warp(block.timestamp + VOTING_PERIOD + 1);

        // Check proposal failed due to no quorum
        assertEq(
            uint256(merkleGov.state(proposalId)),
            uint256(MerkleGov.ProposalState.Defeated),
            "Proposal should be defeated"
        );
    }

    function testVotingAfterRootChange() public {
        // Create a proposal
        MerkleGov.ProposalAction[] memory actions = new MerkleGov.ProposalAction[](1);
        actions[0] = MerkleGov.ProposalAction({
            target: address(0x1111),
            value: 0,
            data: abi.encodeWithSignature("test()"),
            description: "Test action"
        });

        vm.prank(ACCOUNT_3);
        uint256 proposalId =
            merkleGov.propose(actions, "Test Proposal", 0, REWARD_TOKEN, ACCOUNT_3_POWER, account3Proof);

        // Warp to voting period
        vm.warp(block.timestamp + VOTING_DELAY + 1);

        // Vote once
        vm.prank(ACCOUNT_1);
        merkleGov.castVote(proposalId, 1, REWARD_TOKEN, ACCOUNT_1_POWER, account1Proof);

        // Change the merkle root (this simulates a new distribution)
        // Create new account data with different voting power
        MerkleTreeHelper.AccountData[] memory newAccounts = new MerkleTreeHelper.AccountData[](2);
        newAccounts[0] = MerkleTreeHelper.AccountData({
            account: ACCOUNT_2,
            rewardToken: REWARD_TOKEN,
            votingPower: 1000 // Different voting power
        });
        newAccounts[1] =
            MerkleTreeHelper.AccountData({account: ACCOUNT_4, rewardToken: REWARD_TOKEN, votingPower: 2000});

        (bytes32 newRoot,) = merkleHelper.buildMerkleTree(newAccounts);
        merkleVote.setRoot(newRoot, bytes32(0));

        // After root change, Account 1 can vote again on the same proposal (different root)
        // But the old proof won't work anymore
        vm.prank(ACCOUNT_2);
        vm.expectRevert("INVALID_PROOF");
        merkleGov.castVote(proposalId, 1, REWARD_TOKEN, ACCOUNT_2_POWER, account2Proof);

        // Account 1 could vote again with a valid proof for the new root
        // Generate new proof for Account 2 with new voting power
        bytes32[] memory newProof = merkleHelper.generateProof(newAccounts, 0);
        vm.prank(ACCOUNT_2);
        merkleGov.castVote(proposalId, 1, REWARD_TOKEN, 1000, newProof);

        // Verify the new vote was recorded
        MerkleGov.ProposalCore memory proposal = merkleGov.getProposal(proposalId);
        assertEq(proposal.forVotes, ACCOUNT_1_POWER + 1000, "Should have both votes");
    }

    function testDebugMerkleProof() public {
        // Test direct merkle proof verification
        console2.log("Testing merkle proof for ACCOUNT_1");
        console2.log("Account:", ACCOUNT_1);
        console2.log("Reward Token:", REWARD_TOKEN);
        console2.log("Voting Power:", ACCOUNT_1_POWER);
        console2.log("Merkle Root:", uint256(merkleRoot));

        // Test the leaf generation
        bytes32 expectedLeaf = merkleHelper.generateLeaf(ACCOUNT_1, REWARD_TOKEN, ACCOUNT_1_POWER);
        console2.log("Expected Leaf:", uint256(expectedLeaf));

        // Test proof verification directly
        bool isValid = merkleHelper.verifyProof(merkleRoot, ACCOUNT_1, REWARD_TOKEN, ACCOUNT_1_POWER, account1Proof);

        assertTrue(isValid, "Direct merkle proof verification should pass");

        // Now test through MerkleVote contract
        // First, let's verify for a high proposalId that won't interfere
        uint256 testProposalId = 999999;

        vm.prank(ACCOUNT_1);
        bool verified =
            merkleVote.verifyVotingPower(ACCOUNT_1, testProposalId, REWARD_TOKEN, ACCOUNT_1_POWER, account1Proof);

        assertTrue(verified, "MerkleVote verification should pass");

        // Check that the voting power was recorded
        uint256 recordedPower = merkleVote.getVerifiedVotingPower(ACCOUNT_1, testProposalId);
        assertEq(recordedPower, ACCOUNT_1_POWER, "Voting power should be recorded");
    }

    function testMsgSenderBehavior() public {
        // Create a proposal first
        MerkleGov.ProposalAction[] memory actions = new MerkleGov.ProposalAction[](1);
        actions[0] = MerkleGov.ProposalAction({
            target: address(0x1111),
            value: 0,
            data: abi.encodeWithSignature("test()"),
            description: "Test action"
        });

        vm.prank(ACCOUNT_3);
        uint256 proposalId =
            merkleGov.propose(actions, "Test Proposal", 0, REWARD_TOKEN, ACCOUNT_3_POWER, account3Proof);

        // Warp to voting period
        vm.warp(block.timestamp + VOTING_DELAY + 1);

        // Log the addresses for debugging
        console2.log("ACCOUNT_1 address:", ACCOUNT_1);
        console2.log("MerkleGov address:", address(merkleGov));

        // Test direct call to castVote
        vm.prank(ACCOUNT_1);
        merkleGov.castVote(proposalId, 1, REWARD_TOKEN, ACCOUNT_1_POWER, account1Proof);

        // Verify the vote was recorded
        (bool hasVoted, MerkleGov.VoteType support, uint256 votingPower) = merkleGov.getVote(proposalId, ACCOUNT_1);
        assertTrue(hasVoted, "Account 1 should have voted");
        assertEq(uint256(support), 1, "Should have voted FOR");
        assertEq(votingPower, ACCOUNT_1_POWER, "Voting power should match");
    }
}
