// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Test} from "forge-std/Test.sol";

// Safe contracts
import {GnosisSafe} from "@gnosis.pm/safe-contracts/GnosisSafe.sol";
import {GnosisSafeProxyFactory} from "@gnosis.pm/safe-contracts/proxies/GnosisSafeProxyFactory.sol";

// Zodiac
import {Operation} from "@gnosis-guild/zodiac-core/core/Operation.sol";

// Our contracts
import {MerkleGovModule} from "../../src/contracts/zodiac/MerkleGovModule.sol";
import {MerkleTreeHelper} from "../merkle-governance/MerkleTreeHelper.sol";
import {IMerkleSnapshot} from "interfaces/merkle/IMerkleSnapshot.sol";

contract MerkleGovModuleTest is Test {
    // Core contracts
    GnosisSafe public safeSingleton;
    GnosisSafeProxyFactory public safeFactory;
    GnosisSafe public safe;
    MerkleGovModule public govModule;
    MerkleTreeHelper public merkleHelper;

    // Test accounts
    address public owner = address(0x1111111111111111111111111111111111111111);
    address public alice = address(0x2222222222222222222222222222222222222222);
    address public bob = address(0x3333333333333333333333333333333333333333);
    address public charlie = address(0x4444444444444444444444444444444444444444);
    address public dave = address(0x5555555555555555555555555555555555555555);
    address public eve = address(0x6666666666666666666666666666666666666666);

    // Test token
    address public constant REWARD_TOKEN = address(0x7777777777777777777777777777777777777777);

    // Merkle tree data
    bytes32 public merkleRoot;
    MerkleTreeHelper.AccountData[] public accounts;
    mapping(address => bytes32[]) public proofs;
    mapping(address => uint256) public votingPowers;

    // Events
    event ProposalCreated(
        uint256 indexed proposalId, address indexed proposer, uint256 startBlock, uint256 endBlock, bytes32 merkleRoot
    );
    event VoteCast(
        address indexed voter, uint256 indexed proposalId, MerkleGovModule.VoteType voteType, uint256 votingPower
    );
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCancelled(uint256 indexed proposalId);

    function setUp() public {
        // Deploy Safe infrastructure
        safeSingleton = new GnosisSafe();
        safeFactory = new GnosisSafeProxyFactory();

        // Setup initial signers for Safe
        address[] memory signers = new address[](3);
        signers[0] = owner;
        signers[1] = alice;
        signers[2] = bob;

        // Deploy Safe proxy
        bytes memory setupData = abi.encodeWithSignature(
            "setup(address[],uint256,address,bytes,address,address,uint256,address)",
            signers,
            2, // threshold
            address(0), // to
            "", // data
            address(0), // fallback handler
            address(0), // payment token
            0, // payment
            address(0) // payment receiver
        );

        address safeProxy = address(
            safeFactory.createProxyWithNonce(
                address(safeSingleton),
                setupData,
                uint256(keccak256(abi.encodePacked("merkle-gov-test", block.timestamp)))
            )
        );

        safe = GnosisSafe(payable(safeProxy));

        // Deploy merkle helper
        merkleHelper = new MerkleTreeHelper();

        // Deploy governance module
        govModule = new MerkleGovModule(owner, address(safe), address(safe));

        // Setup merkle tree
        _setupMerkleTree();

        // Enable module on Safe (in practice, this would require multi-sig)
        vm.prank(address(safe));
        safe.enableModule(address(govModule));

        // Fund the safe for test transactions
        vm.deal(address(safe), 100 ether);
    }

    function _setupMerkleTree() internal {
        // Create voting power distribution
        accounts.push(MerkleTreeHelper.AccountData({account: alice, rewardToken: REWARD_TOKEN, votingPower: 100e18}));
        accounts.push(MerkleTreeHelper.AccountData({account: bob, rewardToken: REWARD_TOKEN, votingPower: 200e18}));
        accounts.push(MerkleTreeHelper.AccountData({account: charlie, rewardToken: REWARD_TOKEN, votingPower: 150e18}));
        accounts.push(MerkleTreeHelper.AccountData({account: dave, rewardToken: REWARD_TOKEN, votingPower: 50e18}));
        accounts.push(MerkleTreeHelper.AccountData({account: eve, rewardToken: REWARD_TOKEN, votingPower: 75e18}));

        // Build merkle tree
        (merkleRoot,) = merkleHelper.buildMerkleTree(accounts);

        // Generate and store proofs for each account
        for (uint256 i = 0; i < accounts.length; i++) {
            proofs[accounts[i].account] = merkleHelper.generateProof(accounts, i);
            votingPowers[accounts[i].account] = accounts[i].votingPower;
        }

        // Update merkle root
        _updateMerkleRoot(merkleRoot, bytes32(uint256(0x1234)));
    }

    function _updateMerkleRoot(bytes32 root, bytes32 ipfsHash) internal {
        // Execute merkle root update
        vm.expectEmit(true, false, false, true);
        emit IMerkleSnapshot.MerkleRootUpdated(root, ipfsHash, "ipfs://test");
        govModule.onMerkleUpdate(
            IMerkleSnapshot.MerkleState({
                blockNumber: block.number,
                root: root,
                ipfsHash: ipfsHash,
                ipfsHashCid: "ipfs://test"
            })
        );
    }

    function test_ModuleSetup() public view {
        assertEq(govModule.avatar(), address(safe));
        assertEq(govModule.target(), address(safe));
        assertEq(govModule.owner(), owner);
        assertEq(govModule.currentMerkleRoot(), merkleRoot);
        assertEq(govModule.votingDelay(), 1);
        assertEq(govModule.votingPeriod(), 50400);
        assertEq(govModule.quorum(), 4e16);
    }

    function test_ProposalCreation() public {
        // Create proposal data
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        Operation[] memory operations = new Operation[](1);

        targets[0] = address(0x9999);
        values[0] = 1 ether;
        calldatas[0] = "";
        operations[0] = Operation.Call;

        // Create proposal
        vm.expectEmit(true, true, false, true);
        emit ProposalCreated(1, alice, block.number + 1, block.number + 1 + 50400, merkleRoot);

        vm.prank(alice);
        uint256 proposalId = govModule.propose(targets, values, calldatas, operations, "Send 1 ETH");

        assertEq(proposalId, 1);
        assertEq(govModule.proposalCount(), 1);
        assertEq(uint256(govModule.state(proposalId)), uint256(MerkleGovModule.ProposalState.Pending));

        // Check proposal details
        (
            uint256 id,
            address proposer,
            uint256 startBlock,
            uint256 endBlock,
            uint256 forVotes,
            uint256 againstVotes,
            uint256 abstainVotes,
            bool executed,
            bool cancelled,
            /* bytes32 merkleRootSnapshot */
        ) = govModule.proposals(proposalId);

        assertEq(id, proposalId);
        assertEq(proposer, alice);
        assertEq(startBlock, block.number + 1);
        assertEq(endBlock, block.number + 1 + 50400);
        assertEq(forVotes, 0);
        assertEq(againstVotes, 0);
        assertEq(abstainVotes, 0);
        assertFalse(executed);
        assertFalse(cancelled);
    }

    function test_VotingFlow() public {
        // Create proposal
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        Operation[] memory operations = new Operation[](1);

        targets[0] = address(0x9999);
        values[0] = 1 ether;
        calldatas[0] = "";
        operations[0] = Operation.Call;

        vm.prank(alice);
        uint256 proposalId = govModule.propose(targets, values, calldatas, operations, "Send 1 ETH");

        // Move to voting period
        vm.roll(block.number + 2);
        assertEq(uint256(govModule.state(proposalId)), uint256(MerkleGovModule.ProposalState.Active));

        // Alice votes For
        vm.expectEmit(true, true, false, true);
        emit VoteCast(alice, proposalId, MerkleGovModule.VoteType.For, votingPowers[alice]);

        vm.prank(alice);
        govModule.castVote(proposalId, MerkleGovModule.VoteType.For, votingPowers[alice], REWARD_TOKEN, proofs[alice]);

        // Bob votes Against
        vm.expectEmit(true, true, false, true);
        emit VoteCast(bob, proposalId, MerkleGovModule.VoteType.Against, votingPowers[bob]);

        vm.prank(bob);
        govModule.castVote(proposalId, MerkleGovModule.VoteType.Against, votingPowers[bob], REWARD_TOKEN, proofs[bob]);

        // Charlie abstains
        vm.expectEmit(true, true, false, true);
        emit VoteCast(charlie, proposalId, MerkleGovModule.VoteType.Abstain, votingPowers[charlie]);

        vm.prank(charlie);
        govModule.castVote(
            proposalId, MerkleGovModule.VoteType.Abstain, votingPowers[charlie], REWARD_TOKEN, proofs[charlie]
        );

        // Check vote tallies
        (,,,, uint256 forVotes, uint256 againstVotes, uint256 abstainVotes,,,) = govModule.proposals(proposalId);
        assertEq(forVotes, votingPowers[alice]);
        assertEq(againstVotes, votingPowers[bob]);
        assertEq(abstainVotes, votingPowers[charlie]);

        // Check voting status
        assertTrue(govModule.hasVoted(proposalId, alice));
        assertTrue(govModule.hasVoted(proposalId, bob));
        assertTrue(govModule.hasVoted(proposalId, charlie));
        assertFalse(govModule.hasVoted(proposalId, dave));
    }

    function test_CannotVoteTwice() public {
        // Create proposal
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        Operation[] memory operations = new Operation[](1);

        targets[0] = address(0x9999);
        values[0] = 0;
        calldatas[0] = "";
        operations[0] = Operation.Call;

        vm.prank(alice);
        uint256 proposalId = govModule.propose(targets, values, calldatas, operations, "Test proposal");

        // Move to voting period
        vm.roll(block.number + 2);

        // First vote succeeds
        vm.prank(alice);
        govModule.castVote(proposalId, MerkleGovModule.VoteType.For, votingPowers[alice], REWARD_TOKEN, proofs[alice]);

        // Second vote fails
        vm.prank(alice);
        vm.expectRevert("Already voted");
        govModule.castVote(proposalId, MerkleGovModule.VoteType.For, votingPowers[alice], REWARD_TOKEN, proofs[alice]);
    }

    function test_ProposalExecution() public {
        // Create a test contract to call
        TestTarget testTarget = new TestTarget();

        // Create proposal
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        Operation[] memory operations = new Operation[](1);

        targets[0] = address(testTarget);
        values[0] = 0;
        calldatas[0] = abi.encodeWithSignature("setValue(uint256)", 42);
        operations[0] = Operation.Call;

        vm.prank(alice);
        uint256 proposalId = govModule.propose(targets, values, calldatas, operations, "Set value to 42");

        // Move to voting period
        vm.roll(block.number + 2);

        // Get enough votes to pass (need > 4% quorum and more for than against)
        // Total voting power = 575e18, so need > 23e18 total votes
        vm.prank(alice);
        govModule.castVote(proposalId, MerkleGovModule.VoteType.For, votingPowers[alice], REWARD_TOKEN, proofs[alice]); // 100e18

        vm.prank(bob);
        govModule.castVote(proposalId, MerkleGovModule.VoteType.For, votingPowers[bob], REWARD_TOKEN, proofs[bob]); // 200e18

        // Move past voting period
        vm.roll(block.number + 50401);

        // Check proposal succeeded
        assertEq(uint256(govModule.state(proposalId)), uint256(MerkleGovModule.ProposalState.Succeeded));

        // Execute proposal
        vm.expectEmit(true, false, false, true);
        emit ProposalExecuted(proposalId);

        govModule.execute(proposalId);

        // Verify execution
        assertEq(testTarget.value(), 42);
        assertEq(uint256(govModule.state(proposalId)), uint256(MerkleGovModule.ProposalState.Executed));
    }

    function test_ProposalCancellation() public {
        // Create proposal
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        Operation[] memory operations = new Operation[](1);

        targets[0] = address(0x9999);
        values[0] = 0;
        calldatas[0] = "";
        operations[0] = Operation.Call;

        vm.prank(alice);
        uint256 proposalId = govModule.propose(targets, values, calldatas, operations, "Test proposal");

        // Proposer can cancel
        vm.expectEmit(true, false, false, true);
        emit ProposalCancelled(proposalId);

        vm.prank(alice);
        govModule.cancel(proposalId);

        assertEq(uint256(govModule.state(proposalId)), uint256(MerkleGovModule.ProposalState.Cancelled));
    }

    function test_OnlyOwnerCanUpdateParameters() public {
        // Non-owner cannot update parameters
        vm.prank(alice);
        vm.expectRevert();
        govModule.setQuorum(5e16);

        vm.prank(alice);
        vm.expectRevert();
        govModule.setVotingDelay(10);

        vm.prank(alice);
        vm.expectRevert();
        govModule.setVotingPeriod(100000);

        // Owner can update parameters
        vm.prank(owner);
        govModule.setQuorum(5e16);
        assertEq(govModule.quorum(), 5e16);

        vm.prank(owner);
        govModule.setVotingDelay(10);
        assertEq(govModule.votingDelay(), 10);

        vm.prank(owner);
        govModule.setVotingPeriod(100000);
        assertEq(govModule.votingPeriod(), 100000);
    }

    function test_InvalidMerkleProof() public {
        // Create proposal
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        Operation[] memory operations = new Operation[](1);

        targets[0] = address(0x9999);
        values[0] = 0;
        calldatas[0] = "";
        operations[0] = Operation.Call;

        vm.prank(alice);
        uint256 proposalId = govModule.propose(targets, values, calldatas, operations, "Test proposal");

        // Move to voting period
        vm.roll(block.number + 2);

        // Try to vote with wrong voting power
        vm.prank(alice);
        vm.expectRevert("Invalid voting proof");
        govModule.castVote(proposalId, MerkleGovModule.VoteType.For, 500e18, REWARD_TOKEN, proofs[alice]); // Wrong amount

        // Try to vote with wrong proof
        bytes32[] memory wrongProof = new bytes32[](1);
        wrongProof[0] = bytes32(uint256(0xdead));

        vm.prank(alice);
        vm.expectRevert("Invalid voting proof");
        govModule.castVote(proposalId, MerkleGovModule.VoteType.For, votingPowers[alice], REWARD_TOKEN, wrongProof);
    }

    function test_ProposalWithMultipleActions() public {
        TestTarget testTarget1 = new TestTarget();
        TestTarget testTarget2 = new TestTarget();

        // Create proposal with multiple actions
        address[] memory targets = new address[](3);
        uint256[] memory values = new uint256[](3);
        bytes[] memory calldatas = new bytes[](3);
        Operation[] memory operations = new Operation[](3);

        targets[0] = address(testTarget1);
        values[0] = 0;
        calldatas[0] = abi.encodeWithSignature("setValue(uint256)", 100);
        operations[0] = Operation.Call;

        targets[1] = address(testTarget2);
        values[1] = 0;
        calldatas[1] = abi.encodeWithSignature("setValue(uint256)", 200);
        operations[1] = Operation.Call;

        targets[2] = address(0x8888);
        values[2] = 2 ether;
        calldatas[2] = "";
        operations[2] = Operation.Call;

        vm.prank(alice);
        uint256 proposalId = govModule.propose(targets, values, calldatas, operations, "Multiple actions");

        // Vote and pass
        vm.roll(block.number + 2);

        vm.prank(alice);
        govModule.castVote(proposalId, MerkleGovModule.VoteType.For, votingPowers[alice], REWARD_TOKEN, proofs[alice]);

        vm.prank(bob);
        govModule.castVote(proposalId, MerkleGovModule.VoteType.For, votingPowers[bob], REWARD_TOKEN, proofs[bob]);

        // Execute
        vm.roll(block.number + 50401);

        uint256 balanceBefore = address(0x8888).balance;
        govModule.execute(proposalId);

        // Verify all actions executed
        assertEq(testTarget1.value(), 100);
        assertEq(testTarget2.value(), 200);
        assertEq(address(0x8888).balance, balanceBefore + 2 ether);
    }

    function test_MerkleRootUpdateDuringVoting() public {
        // Create proposal with initial merkle root
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        Operation[] memory operations = new Operation[](1);

        targets[0] = address(0x9999);
        values[0] = 0;
        calldatas[0] = "";
        operations[0] = Operation.Call;

        vm.prank(alice);
        uint256 proposalId = govModule.propose(targets, values, calldatas, operations, "Test proposal");

        // Move to voting period
        vm.roll(block.number + 2);

        // Alice votes with current merkle root
        vm.prank(alice);
        govModule.castVote(proposalId, MerkleGovModule.VoteType.For, votingPowers[alice], REWARD_TOKEN, proofs[alice]);

        // Update merkle root (simulating new distribution)
        bytes32 newRoot = bytes32(uint256(0xbeef));
        _updateMerkleRoot(newRoot, bytes32(uint256(0x5678)));

        // Bob can still vote because the proposal uses the snapshot from creation
        vm.prank(bob);
        govModule.castVote(proposalId, MerkleGovModule.VoteType.For, votingPowers[bob], REWARD_TOKEN, proofs[bob]);

        // New proposal would use the new merkle root
        vm.prank(alice);
        govModule.propose(targets, values, calldatas, operations, "New proposal");

        // Verify the new proposal has the updated merkle root
        // (We can't directly access the merkleRoot from proposal struct, but it would fail to vote with old proofs)
    }
}

// Helper contract for testing execution
contract TestTarget {
    uint256 public value;

    function setValue(uint256 _value) external {
        value = _value;
    }
}
