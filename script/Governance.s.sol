// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {AttestationGovernor} from "contracts/governance/Governor.sol";
import {VotingPower} from "contracts/governance/VotingPower.sol";
import {IGovernor} from "@openzeppelin/contracts/governance/IGovernor.sol";
import {Common} from "script/Common.s.sol";
import {console} from "forge-std/console.sol";

/// @title Governance
/// @notice Comprehensive script for governance operations and queries
/// @dev Provides functions for voting power management, proposal lifecycle, and governance queries
contract Governance is Common {
    // ============================================================
    // VOTING POWER QUERY FUNCTIONS
    // ============================================================

    /// @notice Query voting power statistics for an account
    /// @param votingPowerAddr Address of the VotingPower contract
    /// @param account Account to query (hex string)
    function queryVotingPower(string calldata votingPowerAddr, string calldata account) public view {
        VotingPower votingPower = VotingPower(vm.parseAddress(votingPowerAddr));
        address accountAddr = vm.parseAddress(account);

        console.log("=== Voting Power Query ===");
        console.log("Contract:", votingPowerAddr);
        console.log("Account:", account);
        console.log("");

        try votingPower.getVotingStats(accountAddr) returns (uint256 balance, uint256 votes, address delegatedTo) {
            console.log("Token Balance:", balance);
            console.log("Current Voting Power:", votes);
            console.log("Delegated To:", vm.toString(delegatedTo));

            // Check if self-delegated
            if (delegatedTo == accountAddr) {
                console.log("Status: Self-delegated (can vote with full balance)");
            } else if (delegatedTo == address(0)) {
                console.log("Status: No delegation (cannot vote)");
            } else {
                console.log("Status: Delegated to another address");
            }
        } catch {
            console.log("ERROR: Unable to retrieve voting statistics");
        }

        // Additional token info
        try votingPower.name() returns (string memory name) {
            console.log("Token Name:", name);
        } catch {}

        try votingPower.symbol() returns (string memory symbol) {
            console.log("Token Symbol:", symbol);
        } catch {}

        try votingPower.totalSupply() returns (uint256 totalSupply) {
            console.log("Total Supply:", totalSupply);
        } catch {}
    }

    /// @notice Query voting power for multiple accounts
    /// @param votingPowerAddr Address of the VotingPower contract
    /// @param accounts Array of account addresses (hex strings)
    function queryMultipleVotingPower(string calldata votingPowerAddr, string[] calldata accounts) public view {
        console.log("=== Multiple Accounts Voting Power Query ===");
        console.log("Contract:", votingPowerAddr);
        console.log("Number of accounts:", accounts.length);
        console.log("");

        for (uint256 i = 0; i < accounts.length; i++) {
            console.log("--- Account", i + 1, "---");
            queryVotingPower(votingPowerAddr, accounts[i]);
            console.log("");
        }
    }

    /// @notice Query voting power at a specific block
    /// @param votingPowerAddr Address of the VotingPower contract
    /// @param account Account to query
    /// @param blockNumber Block number for historical query
    function queryVotingPowerAt(string calldata votingPowerAddr, string calldata account, uint256 blockNumber)
        public
        view
    {
        VotingPower votingPower = VotingPower(vm.parseAddress(votingPowerAddr));
        address accountAddr = vm.parseAddress(account);

        console.log("=== Historical Voting Power Query ===");
        console.log("Contract:", votingPowerAddr);
        console.log("Account:", account);
        console.log("Block Number:", blockNumber);
        console.log("Current Block:", block.number);
        console.log("");

        try votingPower.getPastVotes(accountAddr, blockNumber) returns (uint256 pastVotes) {
            console.log("Voting Power at Block", blockNumber, ":", pastVotes);
        } catch {
            console.log("ERROR: Unable to retrieve historical voting power");
            console.log("Note: Block number might be too recent or invalid");
        }
    }

    // ============================================================
    // GOVERNANCE STATE QUERY FUNCTIONS
    // ============================================================

    /// @notice Query governance contract settings and state
    /// @param governorAddr Address of the AttestationGovernor contract
    function queryGovernanceState(string calldata governorAddr) public view {
        AttestationGovernor governor = AttestationGovernor(payable(vm.parseAddress(governorAddr)));

        console.log("=== Governance State ===");
        console.log("Governor Address:", governorAddr);
        console.log("");

        try governor.name() returns (string memory name) {
            console.log("Governor Name:", name);
        } catch {}

        try governor.version() returns (string memory version) {
            console.log("Version:", version);
        } catch {}

        try governor.votingDelay() returns (uint256 delay) {
            console.log("Voting Delay:", delay, "blocks");
        } catch {}

        try governor.votingPeriod() returns (uint256 period) {
            console.log("Voting Period:", period, "blocks");
        } catch {}

        try governor.proposalThreshold() returns (uint256 threshold) {
            console.log("Proposal Threshold:", threshold, "tokens");
        } catch {}

        try governor.quorum(block.number - 1) returns (uint256 quorumVotes) {
            console.log("Current Quorum:", quorumVotes, "votes");
        } catch {}

        console.log("Current Block:", block.number);
        console.log("Clock Mode:", governor.CLOCK_MODE());
    }

    /// @notice Query specific proposal details
    /// @param governorAddr Address of the AttestationGovernor contract
    /// @param proposalId Proposal ID to query
    function queryProposal(string calldata governorAddr, uint256 proposalId) public view {
        AttestationGovernor governor = AttestationGovernor(payable(vm.parseAddress(governorAddr)));

        console.log("=== Proposal Query ===");
        console.log("Governor Address:", governorAddr);
        console.log("Proposal ID:", proposalId);
        console.log("");

        try governor.state(proposalId) returns (IGovernor.ProposalState state) {
            console.log("State:", _stateToString(state));
        } catch {
            console.log("ERROR: Proposal not found or invalid ID");
            return;
        }

        try governor.proposalSnapshot(proposalId) returns (uint256 snapshot) {
            console.log("Snapshot Block:", snapshot);
        } catch {}

        try governor.proposalDeadline(proposalId) returns (uint256 deadline) {
            console.log("Deadline Block:", deadline);
        } catch {}

        try governor.proposalVotes(proposalId) returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes) {
            console.log("Votes Against:", againstVotes);
            console.log("Votes For:", forVotes);
            console.log("Votes Abstain:", abstainVotes);
            console.log("Total Votes Cast:", againstVotes + forVotes + abstainVotes);
        } catch {}

        try governor.quorum(governor.proposalSnapshot(proposalId)) returns (uint256 quorumNeeded) {
            console.log("Quorum Required:", quorumNeeded);
        } catch {}
    }

    /// @notice Check if an account has voted on a proposal
    /// @param governorAddr Address of the AttestationGovernor contract
    /// @param proposalId Proposal ID to check
    /// @param voter Voter address to check
    function checkVote(string calldata governorAddr, uint256 proposalId, string calldata voter) public view {
        AttestationGovernor governor = AttestationGovernor(payable(vm.parseAddress(governorAddr)));
        address voterAddr = vm.parseAddress(voter);

        console.log("=== Vote Check ===");
        console.log("Governor Address:", governorAddr);
        console.log("Proposal ID:", proposalId);
        console.log("Voter:", voter);
        console.log("");

        try governor.hasVoted(proposalId, voterAddr) returns (bool hasVoted) {
            if (hasVoted) {
                console.log("Status: HAS VOTED");
                // Try to get vote details if available
                try governor.proposalVotes(proposalId) returns (
                    uint256, /* againstVotes */ uint256, /* forVotes */ uint256 /* abstainVotes */
                ) {
                    // Note: OpenZeppelin doesn't expose individual vote details by default
                    console.log("Note: Cannot retrieve specific vote choice with standard interface");
                } catch {}
            } else {
                console.log("Status: HAS NOT VOTED");
            }
        } catch {
            console.log("ERROR: Unable to check vote status");
        }
    }

    // ============================================================
    // PROPOSAL MANAGEMENT FUNCTIONS
    // ============================================================

    /// @notice Create a new governance proposal
    /// @param governorAddr Address of the AttestationGovernor contract
    /// @param targets Array of target contract addresses
    /// @param values Array of values (ETH amounts) for each call
    /// @param calldatas Array of calldata for each function call
    /// @param description Description of the proposal
    function createProposal(
        string calldata governorAddr,
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata calldatas,
        string calldata description
    ) public {
        vm.startBroadcast(_privateKey);

        AttestationGovernor governor = AttestationGovernor(payable(vm.parseAddress(governorAddr)));

        console.log("=== Creating Proposal ===");
        console.log("Governor Address:", governorAddr);
        console.log("Description:", description);
        console.log("Number of actions:", targets.length);
        console.log("");

        try governor.propose(targets, values, calldatas, description) returns (uint256 proposalId) {
            console.log("SUCCESS: Proposal created!");
            console.log("Proposal ID:", proposalId);
            console.log("Voting starts at block:", governor.proposalSnapshot(proposalId));
            console.log("Voting ends at block:", governor.proposalDeadline(proposalId));
        } catch Error(string memory reason) {
            console.log("ERROR: Failed to create proposal");
            console.log("Reason:", reason);
        }

        vm.stopBroadcast();
    }

    /// @notice Vote on a proposal
    /// @param governorAddr Address of the AttestationGovernor contract
    /// @param proposalId Proposal ID to vote on
    /// @param support Vote choice: 0=Against, 1=For, 2=Abstain
    /// @param reason Optional reason for the vote
    function vote(string calldata governorAddr, uint256 proposalId, uint8 support, string calldata reason) public {
        vm.startBroadcast(_privateKey);

        AttestationGovernor governor = AttestationGovernor(payable(vm.parseAddress(governorAddr)));

        console.log("=== Casting Vote ===");
        console.log("Governor Address:", governorAddr);
        console.log("Proposal ID:", proposalId);
        console.log("Vote:", _supportToString(support));
        if (bytes(reason).length > 0) {
            console.log("Reason:", reason);
        }
        console.log("");

        try governor.castVoteWithReason(proposalId, support, reason) returns (uint256 weight) {
            console.log("SUCCESS: Vote cast!");
            console.log("Vote weight:", weight);
        } catch Error(string memory err) {
            console.log("ERROR: Failed to cast vote");
            console.log("Reason:", err);
        }

        vm.stopBroadcast();
    }

    /// @notice Vote on a proposal without reason
    /// @param governorAddr Address of the AttestationGovernor contract
    /// @param proposalId Proposal ID to vote on
    /// @param support Vote choice: 0=Against, 1=For, 2=Abstain
    function vote(string calldata governorAddr, uint256 proposalId, uint8 support) public {
        this.vote(governorAddr, proposalId, support, "");
    }

    // ============================================================
    // DELEGATION FUNCTIONS
    // ============================================================

    /// @notice Delegate voting power to another address
    /// @param votingPowerAddr Address of the VotingPower contract
    /// @param delegatee Address to delegate to (use own address for self-delegation)
    function delegate(string calldata votingPowerAddr, string calldata delegatee) public {
        vm.startBroadcast(_privateKey);

        VotingPower votingPower = VotingPower(vm.parseAddress(votingPowerAddr));
        address delegateeAddr = vm.parseAddress(delegatee);

        console.log("=== Delegating Voting Power ===");
        console.log("VotingPower Address:", votingPowerAddr);
        console.log("Delegating to:", delegatee);
        console.log("");

        try votingPower.delegate(delegateeAddr) {
            console.log("SUCCESS: Voting power delegated!");

            // Show updated stats
            address broadcaster = vm.addr(_privateKey);
            (uint256 balance, uint256 votes, address currentDelegate) = votingPower.getVotingStats(broadcaster);

            console.log("Your token balance:", balance);
            console.log("Your current voting power:", votes);
            console.log("Currently delegated to:", vm.toString(currentDelegate));
        } catch Error(string memory reason) {
            console.log("ERROR: Failed to delegate");
            console.log("Reason:", reason);
        }

        vm.stopBroadcast();
    }

    /// @notice Self-delegate to enable voting with own tokens
    /// @param votingPowerAddr Address of the VotingPower contract
    function selfDelegate(string calldata votingPowerAddr) public {
        address self = vm.addr(_privateKey);
        this.delegate(votingPowerAddr, vm.toString(self));
    }

    // ============================================================
    // UTILITY FUNCTIONS
    // ============================================================

    /// @notice Convert proposal state enum to string
    /// @param state The proposal state
    /// @return String representation of the state
    function _stateToString(IGovernor.ProposalState state) internal pure returns (string memory) {
        if (state == IGovernor.ProposalState.Pending) return "Pending";
        if (state == IGovernor.ProposalState.Active) return "Active";
        if (state == IGovernor.ProposalState.Canceled) return "Canceled";
        if (state == IGovernor.ProposalState.Defeated) return "Defeated";
        if (state == IGovernor.ProposalState.Succeeded) return "Succeeded";
        if (state == IGovernor.ProposalState.Queued) return "Queued";
        if (state == IGovernor.ProposalState.Expired) return "Expired";
        if (state == IGovernor.ProposalState.Executed) return "Executed";
        return "Unknown";
    }

    /// @notice Convert support value to string
    /// @param support The support value (0=Against, 1=For, 2=Abstain)
    /// @return String representation of the support
    function _supportToString(uint8 support) internal pure returns (string memory) {
        if (support == 0) return "Against";
        if (support == 1) return "For";
        if (support == 2) return "Abstain";
        return "Invalid";
    }

    /// @notice Get proposal ID from transaction targets, values, calldatas, and description
    /// @param governorAddr Address of the AttestationGovernor contract
    /// @param targets Array of target addresses
    /// @param values Array of values
    /// @param calldatas Array of calldatas
    /// @param description Proposal description
    function getProposalId(
        string calldata governorAddr,
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata calldatas,
        string calldata description
    ) public pure returns (uint256) {
        AttestationGovernor governor = AttestationGovernor(payable(vm.parseAddress(governorAddr)));

        return governor.hashProposal(targets, values, calldatas, keccak256(bytes(description)));
    }

    /// @notice Show current account's governance participation status
    /// @param votingPowerAddr Address of the VotingPower contract
    /// @param governorAddr Address of the AttestationGovernor contract
    function showMyGovernanceStatus(string calldata votingPowerAddr, string calldata governorAddr) public view  {
        address myAddress = vm.addr(_privateKey);
        string memory myAddressStr = vm.toString(myAddress);

        console.log("=== My Governance Status ===");
        console.log("Address:", myAddressStr);
        console.log("");

        this.queryVotingPower(votingPowerAddr, myAddressStr);
        console.log("");
        queryGovernanceState(governorAddr);
    }
}
