// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {stdJson} from "forge-std/StdJson.sol";
import {console} from "forge-std/console.sol";

import {Common} from "script/Common.s.sol";

import {MerkleVote} from "contracts/MerkleVote.sol";
import {MerkleGov} from "contracts/MerkleGov.sol";

/// @dev Script for querying MerkleGov and MerkleVote contract states
contract MerkleGovScript is Common {
    using stdJson for string;

    /// @dev Query MerkleVote contract state
    /// @param merkleVoteAddr Address of the MerkleVote contract
    function queryMerkleVoteState(string calldata merkleVoteAddr) public view {
        MerkleVote merkleVote = MerkleVote(vm.parseAddress(merkleVoteAddr));

        bytes32 root = merkleVote.root();
        bytes32 ipfsHash = merkleVote.ipfsHash();
        string memory ipfsHashCid = merkleVote.ipfsHashCid();
        address owner = merkleVote.owner();
        uint256 timelock = merkleVote.timelock();
        uint256 nextSnapshotId = merkleVote.nextSnapshotId();

        console.log("=== MerkleVote State ===");
        console.log("Owner:", owner);
        console.log("Timelock:", timelock, "seconds");
        console.log("");
        console.log("Current Root:");
        console.logBytes32(root);
        console.log("");
        console.log("Current IPFS Hash:");
        console.logBytes32(ipfsHash);
        console.log("");
        console.log("Current IPFS Hash CID:");
        console.log(ipfsHashCid);
        console.log("");
        console.log("Next Snapshot ID:", nextSnapshotId);

        // Check pending root
        (bytes32 pendingRoot, bytes32 pendingIpfsHash, uint256 validAt) = merkleVote.pendingRoot();
        if (validAt > 0) {
            console.log("");
            console.log("--- Pending Root ---");
            console.log("Pending Root:");
            console.logBytes32(pendingRoot);
            console.log("Pending IPFS Hash:");
            console.logBytes32(pendingIpfsHash);
            console.log("Valid At:", validAt);
            if (block.timestamp >= validAt) {
                console.log("Status: Ready to accept");
            } else {
                uint256 remaining = validAt - block.timestamp;
                console.log("Status: Waiting (", remaining, "seconds remaining)");
            }
        }
        console.log("========================");
    }

    /// @dev Query MerkleGov contract state
    /// @param merkleGovAddr Address of the MerkleGov contract
    function queryMerkleGovState(string calldata merkleGovAddr) public view {
        MerkleGov merkleGov = MerkleGov(payable(vm.parseAddress(merkleGovAddr)));

        string memory name = merkleGov.name();
        uint256 votingDelay = merkleGov.votingDelay();
        uint256 votingPeriod = merkleGov.votingPeriod();
        uint256 quorum = merkleGov.quorum();
        uint256 proposalThreshold = merkleGov.proposalThreshold();
        uint256 proposalCount = merkleGov.proposalCount();
        address admin = merkleGov.admin();
        address merkleVote = merkleGov.merkleVote();
        uint256 timelockDelay = merkleGov.timelockDelay();

        console.log("=== MerkleGov State ===");
        console.log("Name:", name);
        console.log("Admin:", admin);
        console.log("MerkleVote Contract:", merkleVote);
        console.log("");
        console.log("--- Governance Parameters ---");
        console.log("Voting Delay:", votingDelay, "blocks");
        console.log("Voting Period:", votingPeriod, "blocks");
        console.log("Quorum:", quorum);
        console.log("Proposal Threshold:", proposalThreshold);
        console.log("Timelock Delay:", timelockDelay, "seconds");
        console.log("");
        console.log("Total Proposals:", proposalCount);
        console.log("=======================");
    }

    /// @dev Query a specific proposal
    /// @param merkleGovAddr Address of the MerkleGov contract
    /// @param proposalId The proposal ID to query
    function queryProposal(string calldata merkleGovAddr, uint256 proposalId) public view {
        MerkleGov merkleGov = MerkleGov(payable(vm.parseAddress(merkleGovAddr)));

        (
            address proposer,
            uint256 startBlock,
            uint256 endBlock,
            uint256 forVotes,
            uint256 againstVotes,
            uint256 abstainVotes,
            bool cancelled,
            bool executed,
            uint256 eta,
            string memory description
        ) = merkleGov.getProposal(proposalId);

        MerkleGov.ProposalState state = merkleGov.state(proposalId);

        console.log("=== Proposal", proposalId, "===");
        console.log("Proposer:", proposer);
        console.log("Description:", description);
        console.log("");
        console.log("--- Voting Info ---");
        console.log("Start Block:", startBlock);
        console.log("End Block:", endBlock);
        console.log("For Votes:", forVotes);
        console.log("Against Votes:", againstVotes);
        console.log("Abstain Votes:", abstainVotes);
        console.log("");
        console.log("--- Status ---");
        console.log("State:", _getProposalStateString(state));
        console.log("Cancelled:", cancelled);
        console.log("Executed:", executed);
        if (eta > 0) {
            console.log("ETA:", eta);
            if (block.timestamp >= eta) {
                console.log("Ready for execution");
            } else {
                uint256 remaining = eta - block.timestamp;
                console.log("Time until executable:", remaining, "seconds");
            }
        }

        // Get proposal actions
        (address[] memory targets, uint256[] memory values, bytes[] memory calldatas) = merkleGov.getActions(proposalId);

        if (targets.length > 0) {
            console.log("");
            console.log("--- Actions ---");
            for (uint256 i = 0; i < targets.length; i++) {
                console.log("Action", i, ":");
                console.log("  Target:", targets[i]);
                console.log("  Value:", values[i]);
                console.log("  Calldata:");
                console.logBytes(calldatas[i]);
            }
        }
        console.log("===================");
    }

    /// @dev Query voting power for an account
    /// @param merkleVoteAddr Address of the MerkleVote contract
    /// @param account Address to check voting power for
    /// @param proposalId Proposal ID to check
    function queryVotingPower(string calldata merkleVoteAddr, string calldata account, uint256 proposalId)
        public
        view
    {
        MerkleVote merkleVote = MerkleVote(vm.parseAddress(merkleVoteAddr));
        address accountAddr = vm.parseAddress(account);

        uint256 verifiedPower = merkleVote.getVerifiedVotingPower(accountAddr, proposalId);
        bool hasVoted = merkleVote.hasVoted(accountAddr, proposalId);
        bytes32 rootUsed = merkleVote.votingRootUsed(accountAddr, proposalId);

        console.log("=== Voting Power Query ===");
        console.log("Account:", accountAddr);
        console.log("Proposal ID:", proposalId);
        console.log("Verified Voting Power:", verifiedPower);
        console.log("Has Voted with Current Root:", hasVoted);
        if (rootUsed != bytes32(0)) {
            console.log("Root Used for Vote:");
            console.logBytes32(rootUsed);
        }
        console.log("=========================");
    }

    /// @dev Query if an address is an updater
    /// @param merkleVoteAddr Address of the MerkleVote contract
    /// @param updater Address to check
    function queryUpdaterStatus(string calldata merkleVoteAddr, string calldata updater) public view {
        MerkleVote merkleVote = MerkleVote(vm.parseAddress(merkleVoteAddr));
        address updaterAddr = vm.parseAddress(updater);

        bool isUpdater = merkleVote.isUpdater(updaterAddr);
        address owner = merkleVote.owner();

        console.log("=== Updater Status ===");
        console.log("Address:", updaterAddr);
        console.log("Is Updater:", isUpdater);
        console.log("Is Owner:", updaterAddr == owner);
        console.log("=====================");
    }

    /// @dev Query a snapshot by ID
    /// @param merkleVoteAddr Address of the MerkleVote contract
    /// @param snapshotId The snapshot ID to query
    function querySnapshot(string calldata merkleVoteAddr, uint256 snapshotId) public view {
        MerkleVote merkleVote = MerkleVote(vm.parseAddress(merkleVoteAddr));

        (bytes32 root, bytes32 ipfsHash, uint256 blockNumber, uint256 timestamp) = merkleVote.snapshots(snapshotId);

        console.log("=== Snapshot", snapshotId, "===");
        console.log("Root:");
        console.logBytes32(root);
        console.log("");
        console.log("IPFS Hash:");
        console.logBytes32(ipfsHash);
        console.log("");
        console.log("Block Number:", blockNumber);
        console.log("Timestamp:", timestamp);
        console.log("===================");
    }

    /// @dev Query all active proposals
    /// @param merkleGovAddr Address of the MerkleGov contract
    function queryActiveProposals(string calldata merkleGovAddr) public view {
        MerkleGov merkleGov = MerkleGov(payable(vm.parseAddress(merkleGovAddr)));
        uint256 proposalCount = merkleGov.proposalCount();

        console.log("=== Active Proposals ===");

        if (proposalCount == 0) {
            console.log("No proposals created yet");
        } else {
            uint256 activeCount = 0;
            for (uint256 i = 1; i <= proposalCount; i++) {
                MerkleGov.ProposalState state = merkleGov.state(i);
                if (state == MerkleGov.ProposalState.Active) {
                    if (activeCount == 0) {
                        console.log("");
                        console.log("Active Proposals:");
                    }
                    activeCount++;

                    (
                        address proposer,
                        uint256 startBlock,
                        uint256 endBlock,
                        uint256 forVotes,
                        uint256 againstVotes,
                        uint256 abstainVotes,
                        ,
                        ,
                        ,
                        string memory description
                    ) = merkleGov.getProposal(i);

                    console.log("");
                    console.log("Proposal", i, ":");
                    console.log("  Proposer:", proposer);
                    console.log("  Description:", description);
                    console.log("  Voting ends at block:", endBlock);
                    console.log("  Current votes - For:", forVotes, "Against:", againstVotes, "Abstain:", abstainVotes);
                }
            }

            if (activeCount == 0) {
                console.log("No active proposals");
            } else {
                console.log("");
                console.log("Total active proposals:", activeCount);
            }
        }
        console.log("========================");
    }

    /// @dev Query if an account can propose
    /// @param merkleGovAddr Address of the MerkleGov contract
    /// @param merkleVoteAddr Address of the MerkleVote contract
    /// @param account Address to check
    /// @param votingPower The voting power to verify
    /// @param proof Merkle proof for the voting power
    function queryCanPropose(
        string calldata merkleGovAddr,
        string calldata merkleVoteAddr,
        string calldata account,
        uint256 votingPower,
        bytes32[] calldata proof
    ) public view {
        MerkleGov merkleGov = MerkleGov(payable(vm.parseAddress(merkleGovAddr)));
        address accountAddr = vm.parseAddress(account);
        address merkleVoteContract = vm.parseAddress(merkleVoteAddr);

        // Note: This is a view function, so we can't actually verify the proof
        // We can only check the threshold and other requirements
        uint256 proposalThreshold = merkleGov.proposalThreshold();

        console.log("=== Can Propose Check ===");
        console.log("Account:", accountAddr);
        console.log("Claimed Voting Power:", votingPower);
        console.log("Proposal Threshold:", proposalThreshold);
        console.log("Meets Threshold:", votingPower >= proposalThreshold);
        console.log("Proof Length:", proof.length);
        console.log("MerkleVote Contract:", merkleVoteContract);
        console.log("========================");
    }

    /// @dev Comprehensive query of all governance information
    /// @param merkleGovAddr Address of the MerkleGov contract
    /// @param merkleVoteAddr Address of the MerkleVote contract
    function queryAll(string calldata merkleGovAddr, string calldata merkleVoteAddr) public view {
        console.log("=== COMPREHENSIVE GOVERNANCE QUERY ===");
        console.log("");

        queryMerkleVoteState(merkleVoteAddr);
        console.log("");

        queryMerkleGovState(merkleGovAddr);
        console.log("");

        queryActiveProposals(merkleGovAddr);
        console.log("");

        // Query recent proposals if any exist
        MerkleGov merkleGov = MerkleGov(payable(vm.parseAddress(merkleGovAddr)));
        uint256 proposalCount = merkleGov.proposalCount();

        if (proposalCount > 0) {
            console.log("--- Recent Proposals ---");
            uint256 start = proposalCount > 3 ? proposalCount - 2 : 1;
            for (uint256 i = start; i <= proposalCount; i++) {
                console.log("");
                queryProposal(merkleGovAddr, i);
            }
        }

        console.log("=== END COMPREHENSIVE GOVERNANCE QUERY ===");
    }

    /// @dev Get the IPFS URI for the current merkle tree
    /// @param merkleVoteAddr Address of the MerkleVote contract
    function getIpfsUri(string calldata merkleVoteAddr) public view returns (string memory) {
        MerkleVote merkleVote = MerkleVote(vm.parseAddress(merkleVoteAddr));

        string memory ipfsHashCid = merkleVote.ipfsHashCid();
        string memory ipfsGatewayUrl = vm.envString("IPFS_GATEWAY_URL");
        string memory uri = string.concat(ipfsGatewayUrl, ipfsHashCid);

        console.log("IPFS URI:", uri);
        return uri;
    }

    /// @dev Helper function to convert ProposalState enum to string
    function _getProposalStateString(MerkleGov.ProposalState state) internal pure returns (string memory) {
        if (state == MerkleGov.ProposalState.Pending) return "Pending";
        if (state == MerkleGov.ProposalState.Active) return "Active";
        if (state == MerkleGov.ProposalState.Canceled) return "Canceled";
        if (state == MerkleGov.ProposalState.Defeated) return "Defeated";
        if (state == MerkleGov.ProposalState.Succeeded) return "Succeeded";
        if (state == MerkleGov.ProposalState.Queued) return "Queued";
        if (state == MerkleGov.ProposalState.Expired) return "Expired";
        if (state == MerkleGov.ProposalState.Executed) return "Executed";
        return "Unknown";
    }
}
