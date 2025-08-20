"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { useReadContract, useWriteContract } from "wagmi";
import {
  merkleGovAbi,
  merkleGovAddress,
  merkleVoteAbi,
  merkleVoteAddress,
} from "@/lib/contracts";

// Types matching the contract structs
export interface ProposalAction {
  target: string;
  value: string;
  data: string;
  description: string;
}

export interface ProposalCore {
  id: bigint;
  proposer: string;
  snapshotId: bigint;
  startTime: bigint;
  endTime: bigint;
  eta: bigint;
  forVotes: bigint;
  againstVotes: bigint;
  abstainVotes: bigint;
  description: string;
  state: number; // ProposalState enum
}

export interface VotingSnapshot {
  root: string;
  ipfsHash: string;
  blockNumber: bigint;
  timestamp: bigint;
}

export enum ProposalState {
  Pending = 0,
  Active = 1,
  Succeeded = 2,
  Defeated = 3,
  Queued = 4,
  Executed = 5,
  Cancelled = 6,
}

export enum VoteType {
  Against = 0,
  For = 1,
  Abstain = 2,
}

// IPFS helpers (reused from useRewards)
const cidToUrl = (cid: string): string => {
  return `/api/ipfs/${cid}`;
};

interface MerkleTreeData {
  tree: Array<{
    account: string;
    reward: string;
    claimable: string;
    proof: string[];
  }>;
  metadata: {
    reward_token_address: string;
    total_rewards: string;
  };
}

interface VotingPowerEntry {
  account: string;
  reward: string;
  claimable: string;
  proof: string[];
}

export function useGovernance() {
  const { address, isConnected } = useAccount();
  const { writeContract, isPending: isWriting } = useWriteContract();

  // Local state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [merkleData, setMerkleData] = useState<MerkleTreeData | null>(null);
  const [userVotingPower, setUserVotingPower] = useState<VotingPowerEntry | null>(null);

  // Read basic governance parameters
  const { data: proposalCounter } = useReadContract({
    address: merkleGovAddress,
    abi: merkleGovAbi,
    functionName: "proposalCounter",
  });

  const { data: proposalThreshold } = useReadContract({
    address: merkleGovAddress,
    abi: merkleGovAbi,
    functionName: "proposalThreshold",
  });

  const { data: votingDelay } = useReadContract({
    address: merkleGovAddress,
    abi: merkleGovAbi,
    functionName: "votingDelay",
  });

  const { data: votingPeriod } = useReadContract({
    address: merkleGovAddress,
    abi: merkleGovAbi,
    functionName: "votingPeriod",
  });

  const { data: quorumBasisPoints } = useReadContract({
    address: merkleGovAddress,
    abi: merkleGovAbi,
    functionName: "quorumBasisPoints",
  });

  // Read IPFS hash CID from MerkleVote contract
  const { data: ipfsHashCid, isLoading: isLoadingHash } = useReadContract({
    address: merkleVoteAddress,
    abi: merkleVoteAbi,
    functionName: "ipfsHashCid",
  });

  // Fetch merkle data from IPFS (similar to rewards)
  useEffect(() => {
    const loadMerkleData = async () => {
      if (!ipfsHashCid || ipfsHashCid === "") {
        return;
      }

      try {
        setIsLoading(true);

        const ipfsUrl = cidToUrl(ipfsHashCid as string);
        console.log(`Fetching governance merkle data from: ${ipfsUrl}`);

        const response = await fetch(ipfsUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch IPFS data: ${response.status}`);
        }

        const data: MerkleTreeData = await response.json();
        setMerkleData(data);

        // Find voting power for current user
        if (address && data.tree) {
          const userPower = data.tree.find(
            (entry) => entry.account.toLowerCase() === address.toLowerCase(),
          );
          console.log("Found user voting power:", userPower);
          setUserVotingPower(userPower || null);
        } else {
          console.log("No address or tree data:", { address, treeLength: data.tree?.length });
        }
      } catch (err) {
        console.error("Error loading governance merkle data:", err);
        setError("Failed to load governance data from IPFS");
      } finally {
        setIsLoading(false);
      }
    };

    loadMerkleData();
  }, [ipfsHashCid, address]);

  // Note: For now, we'll return empty arrays since we need to implement proper contract reading
  // In a production app, you'd use wagmi's useReadContract with proper multicall or individual calls
  const getProposal = useCallback(async (proposalId: number): Promise<{ core: ProposalCore; actions: ProposalAction[] } | null> => {
    // TODO: Implement proper contract reading
    // This would require individual wagmi useReadContract calls for getProposal and getActions
    console.log(`Getting proposal ${proposalId} - not implemented yet`);
    return null;
  }, []);

  // Get all proposals (by querying from 1 to proposalCounter)
  const getAllProposals = useCallback(async (): Promise<{ core: ProposalCore; actions: ProposalAction[] }[]> => {
    // TODO: Implement proper proposal fetching
    // For now return empty array - this would require individual contract calls or a subgraph
    console.log(`Getting all proposals - not implemented yet`);
    return [];
  }, []);

  // Create proposal
  const createProposal = useCallback(async (
    actions: ProposalAction[],
    description: string,
    snapshotId: number = 0
  ) => {
    if (!isConnected || !address) {
      setError("Wallet not connected");
      return null;
    }

    if (!userVotingPower || !merkleData?.metadata?.reward_token_address) {
      setError("No voting power found. Please check if you have governance tokens.");
      return null;
    }

    try {
      setError(null);

      // Convert actions to the format expected by the contract
      const contractActions = actions.map(action => ({
        target: action.target as `0x${string}`,
        value: BigInt(action.value || "0"),
        data: action.data as `0x${string}`,
        description: action.description,
      }));

      console.log("Creating proposal with:", {
        actions: contractActions,
        description,
        snapshotId: BigInt(snapshotId),
        rewardToken: merkleData.metadata.reward_token_address,
        votingPower: userVotingPower.claimable,
        proof: userVotingPower.proof,
      });

      // Validate proof format
      if (!Array.isArray(userVotingPower.proof) || userVotingPower.proof.length === 0) {
        throw new Error("Invalid proof format - expected non-empty array");
      }

      console.log("Making writeContract call...");
      console.log("Contract address:", merkleGovAddress);
      console.log("Function args:", [
        contractActions,
        description,
        BigInt(snapshotId),
        merkleData.metadata.reward_token_address as `0x${string}`,
        BigInt(userVotingPower.claimable),
        userVotingPower.proof as `0x${string}`[],
      ]);
      
      const hash = await writeContract({
        address: merkleGovAddress,
        abi: merkleGovAbi,
        functionName: "propose",
        args: [
          contractActions,
          description,
          BigInt(snapshotId),
          merkleData.metadata.reward_token_address as `0x${string}`,
          BigInt(userVotingPower.claimable),
          userVotingPower.proof as `0x${string}`[],
        ],
      });

      console.log("writeContract returned:", hash, "type:", typeof hash);
      
      if (!hash) {
        throw new Error("writeContract returned falsy value");
      }
      
      return hash;
    } catch (err: any) {
      console.error("Error creating proposal:", err);
      setError(`Failed to create proposal: ${err.message || err.shortMessage || "Unknown error"}`);
      return null;
    }
  }, [
    isConnected,
    address,
    userVotingPower,
    merkleData,
    writeContract,
    merkleGovAddress,
  ]);

  // Cast vote
  const castVote = useCallback(async (
    proposalId: number,
    support: VoteType
  ) => {
    if (!isConnected || !address) {
      setError("Wallet not connected");
      return null;
    }

    if (!userVotingPower || !merkleData?.metadata?.reward_token_address) {
      setError("No voting power found. Please check if you have governance tokens.");
      return null;
    }

    try {
      setError(null);

      console.log("Casting vote with:", {
        proposalId: BigInt(proposalId),
        support,
        rewardToken: merkleData.metadata.reward_token_address,
        votingPower: userVotingPower.claimable,
        proof: userVotingPower.proof,
      });

      const hash = await writeContract({
        address: merkleGovAddress,
        abi: merkleGovAbi,
        functionName: "castVote",
        args: [
          BigInt(proposalId),
          support,
          merkleData.metadata.reward_token_address as `0x${string}`,
          BigInt(userVotingPower.claimable),
          userVotingPower.proof as `0x${string}`[],
        ],
      });

      console.log("Vote cast:", hash);
      return hash;
    } catch (err: any) {
      console.error("Error casting vote:", err);
      setError(`Failed to cast vote: ${err.message || err.shortMessage || "Unknown error"}`);
      return null;
    }
  }, [
    isConnected,
    address,
    userVotingPower,
    merkleData,
    writeContract,
    merkleGovAddress,
  ]);

  // Queue proposal
  const queueProposal = useCallback(async (proposalId: number) => {
    if (!isConnected) {
      setError("Wallet not connected");
      return null;
    }

    try {
      setError(null);

      const hash = await writeContract({
        address: merkleGovAddress,
        abi: merkleGovAbi,
        functionName: "queue",
        args: [BigInt(proposalId)],
      });

      console.log("Proposal queued:", hash);
      return hash;
    } catch (err: any) {
      console.error("Error queuing proposal:", err);
      setError(`Failed to queue proposal: ${err.message}`);
      return null;
    }
  }, [isConnected, writeContract]);

  // Execute proposal
  const executeProposal = useCallback(async (proposalId: number) => {
    if (!isConnected) {
      setError("Wallet not connected");
      return null;
    }

    try {
      setError(null);

      const hash = await writeContract({
        address: merkleGovAddress,
        abi: merkleGovAbi,
        functionName: "execute",
        args: [BigInt(proposalId)],
      });

      console.log("Proposal executed:", hash);
      return hash;
    } catch (err: any) {
      console.error("Error executing proposal:", err);
      setError(`Failed to execute proposal: ${err.message}`);
      return null;
    }
  }, [isConnected, writeContract]);

  // Helper functions
  const formatVotingPower = (amount: string | undefined) => {
    if (!amount || amount === "0") return "0";
    const value = BigInt(amount);
    const formatted = Number(value) / Math.pow(10, 18);
    return formatted.toFixed(6);
  };

  const getProposalStateText = (state: number): string => {
    switch (state) {
      case ProposalState.Pending:
        return "Pending";
      case ProposalState.Active:
        return "Active";
      case ProposalState.Succeeded:
        return "Succeeded";
      case ProposalState.Defeated:
        return "Defeated";
      case ProposalState.Queued:
        return "Queued";
      case ProposalState.Executed:
        return "Executed";
      case ProposalState.Cancelled:
        return "Cancelled";
      default:
        return "Unknown";
    }
  };

  const canCreateProposal = (): boolean => {
    if (!userVotingPower || !proposalThreshold) return false;
    return BigInt(userVotingPower.claimable) >= (proposalThreshold as bigint);
  };

  return {
    // Loading states
    isLoading: isLoading || isLoadingHash || isWriting,
    error,

    // Governance parameters
    proposalCounter: proposalCounter ? Number(proposalCounter) : 0,
    proposalThreshold: proposalThreshold ? proposalThreshold.toString() : "0",
    votingDelay: votingDelay ? Number(votingDelay) : 0,
    votingPeriod: votingPeriod ? Number(votingPeriod) : 0,
    quorumBasisPoints: quorumBasisPoints ? Number(quorumBasisPoints) : 0,

    // User data
    userVotingPower,
    merkleData,
    canCreateProposal: canCreateProposal(),

    // Actions
    createProposal,
    castVote,
    queueProposal,
    executeProposal,
    getAllProposals,
    getProposal,

    // Utilities
    formatVotingPower,
    getProposalStateText,

    // Contract addresses
    merkleGovAddress,
    merkleVoteAddress,
  };
}