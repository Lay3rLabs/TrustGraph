"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, useBalance } from "wagmi";
import { useReadContract, useWriteContract } from "wagmi";
import {
  merkleGovModuleAbi,
  merkleGovModuleAddress,
  rewardDistributorAbi,
  rewardDistributorAddress,
  gnosisSafeAbi,
  gnosisSafeAddress,
} from "@/lib/contracts";

// Types matching the MerkleGovModule contract structs
export interface ProposalAction {
  target: string;
  value: string;
  data: string;
  operation: number; // Operation enum (0 = Call, 1 = DelegateCall)
  description?: string; // For UI purposes
}

export interface ProposalCore {
  id: bigint;
  proposer: string;
  startBlock: bigint;
  endBlock: bigint;
  forVotes: bigint;
  againstVotes: bigint;
  abstainVotes: bigint;
  executed: boolean;
  cancelled: boolean;
  merkleRoot: string;
  description?: string; // For UI purposes
  state: number; // ProposalState enum
}

export enum ProposalState {
  Pending = 0,
  Active = 1,
  Defeated = 2,
  Succeeded = 3,
  Executed = 4,
  Cancelled = 5,
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
  const [userVotingPower, setUserVotingPower] =
    useState<VotingPowerEntry | null>(null);

  // Read basic governance parameters from MerkleGovModule
  const { data: proposalCount } = useReadContract({
    address: merkleGovModuleAddress,
    abi: merkleGovModuleAbi,
    functionName: "proposalCount",
  });

  const { data: votingDelay } = useReadContract({
    address: merkleGovModuleAddress,
    abi: merkleGovModuleAbi,
    functionName: "votingDelay",
  });

  const { data: votingPeriod } = useReadContract({
    address: merkleGovModuleAddress,
    abi: merkleGovModuleAbi,
    functionName: "votingPeriod",
  });

  const { data: quorum } = useReadContract({
    address: merkleGovModuleAddress,
    abi: merkleGovModuleAbi,
    functionName: "quorum",
  });

  const { data: currentMerkleRoot } = useReadContract({
    address: merkleGovModuleAddress,
    abi: merkleGovModuleAbi,
    functionName: "currentMerkleRoot",
  });

  // Read IPFS hash from MerkleGovModule
  const { data: ipfsHashBytes, isLoading: isLoadingHash } = useReadContract({
    address: merkleGovModuleAddress,
    abi: merkleGovModuleAbi,
    functionName: "ipfsHash",
  });

  // Read IPFS hash from MerkleGovModule
  const { data: ipfsHashCid, isLoading: isLoadingHashCid } = useReadContract({
    address: merkleGovModuleAddress,
    abi: merkleGovModuleAbi,
    functionName: "ipfsHashCid",
  });
  // Get the Safe address from the module's target
  const { data: safeAddress } = useReadContract({
    address: merkleGovModuleAddress,
    abi: merkleGovModuleAbi,
    functionName: "target",
  });

  // Read Safe ETH balance using useBalance hook
  const { data: safeBalanceData } = useBalance({
    address: safeAddress as `0x${string}`,
  });

  // Fetch merkle data from IPFS
  useEffect(() => {
    const loadMerkleData = async () => {
      if (
        !ipfsHashCid ||
        isLoadingHashCid ||
        ipfsHashCid ===
          "0000000000000000000000000000000000000000000000000000000000000000"
      ) {
        return;
      }

      try {
        setIsLoading(true);

        // Convert hex to base58 CID if needed, or use hex directly
        const ipfsUrl = cidToUrl(ipfsHashCid);
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
          console.log("No address or tree data:", {
            address,
            treeLength: data.tree?.length,
          });
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

  // Get a single proposal with its actions
  const getProposal = useCallback(
    async (
      proposalId: number,
    ): Promise<{ core: ProposalCore; actions: ProposalAction[] } | null> => {
      try {
        console.log(`Getting proposal ${proposalId}`);
        // This is a simplified implementation. In production, you'd use a subgraph or multicall
        // For now, we'll return a placeholder structure
        return {
          core: {
            id: BigInt(proposalId),
            proposer: "0x0000000000000000000000000000000000000000",
            startBlock: BigInt(0),
            endBlock: BigInt(0),
            forVotes: BigInt(0),
            againstVotes: BigInt(0),
            abstainVotes: BigInt(0),
            executed: false,
            cancelled: false,
            merkleRoot:
              "0x0000000000000000000000000000000000000000000000000000000000000000",
            description: "Proposal data not loaded",
            state: 0,
          },
          actions: [],
        };
      } catch (err) {
        console.error(`Error getting proposal ${proposalId}:`, err);
        return null;
      }
    },
    [],
  );

  // Get all proposals (by querying from 1 to proposalCount)
  const getAllProposals = useCallback(async (): Promise<
    { core: ProposalCore; actions: ProposalAction[] }[]
  > => {
    try {
      console.log(`Getting all ${proposalCount} proposals`);
      // This is a simplified implementation. In production, you'd use a subgraph
      const proposals: { core: ProposalCore; actions: ProposalAction[] }[] = [];

      // Return empty for now since we can't easily do multiple contract calls
      // In a real implementation, you'd use wagmi's multicall or a subgraph
      console.log(
        "Proposal listing not yet implemented - use subgraph or multicall for production",
      );
      return proposals;
    } catch (err) {
      console.error("Error getting all proposals:", err);
      return [];
    }
  }, [proposalCount]);

  // Create proposal using MerkleGovModule
  const createProposal = useCallback(
    async (actions: ProposalAction[], description: string) => {
      if (!isConnected || !address) {
        setError("Wallet not connected");
        return null;
      }

      if (
        !currentMerkleRoot ||
        currentMerkleRoot ===
          "0x0000000000000000000000000000000000000000000000000000000000000000"
      ) {
        setError("No merkle root set. Governance not initialized.");
        return null;
      }

      try {
        setError(null);

        // Convert actions to the format expected by MerkleGovModule
        const targets = actions.map((action) => action.target as `0x${string}`);
        const values = actions.map((action) => BigInt(action.value || "0"));
        const calldatas = actions.map((action) => action.data as `0x${string}`);
        const operations = actions.map((action) => action.operation || 0); // Default to Call operation

        console.log("Creating proposal with:", {
          targets,
          values,
          calldatas,
          operations,
          description,
        });

        const hash = await writeContract({
          address: merkleGovModuleAddress,
          abi: merkleGovModuleAbi,
          functionName: "propose",
          args: [targets, values, calldatas, operations, description],
        });

        console.log("Proposal created with hash:", hash);
        return hash;
      } catch (err: any) {
        console.error("Error creating proposal:", err);
        setError(
          `Failed to create proposal: ${err.message || err.shortMessage || "Unknown error"}`,
        );
        return null;
      }
    },
    [isConnected, address, currentMerkleRoot, writeContract],
  );

  // Cast vote with merkle proof
  const castVote = useCallback(
    async (proposalId: number, support: VoteType) => {
      if (!isConnected || !address) {
        setError("Wallet not connected");
        return null;
      }

      if (!userVotingPower || !merkleData?.metadata?.reward_token_address) {
        setError(
          "No voting power found. Please check if you have governance tokens.",
        );
        return null;
      }

      try {
        setError(null);

        console.log("Casting vote with:", {
          proposalId: BigInt(proposalId),
          voteType: support,
          votingPower: userVotingPower.claimable,
          rewardToken: merkleData.metadata.reward_token_address,
          proof: userVotingPower.proof,
        });

        const hash = await writeContract({
          address: merkleGovModuleAddress,
          abi: merkleGovModuleAbi,
          functionName: "castVote",
          args: [
            BigInt(proposalId),
            support,
            BigInt(userVotingPower.claimable),
            merkleData.metadata.reward_token_address as `0x${string}`,
            userVotingPower.proof as `0x${string}`[],
          ],
        });

        console.log("Vote cast:", hash);
        return hash;
      } catch (err: any) {
        console.error("Error casting vote:", err);
        setError(
          `Failed to cast vote: ${err.message || err.shortMessage || "Unknown error"}`,
        );
        return null;
      }
    },
    [isConnected, address, userVotingPower, merkleData, writeContract],
  );

  // No queuing in MerkleGovModule - proposals go directly from Succeeded to executable
  const queueProposal = useCallback(async (proposalId: number) => {
    console.log(
      "Queue not supported in MerkleGovModule - proposals are directly executable when succeeded",
    );
    return null;
  }, []);

  // Execute proposal
  const executeProposal = useCallback(
    async (proposalId: number) => {
      if (!isConnected) {
        setError("Wallet not connected");
        return null;
      }

      try {
        setError(null);

        const hash = await writeContract({
          address: merkleGovModuleAddress,
          abi: merkleGovModuleAbi,
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
    },
    [isConnected, writeContract],
  );

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
      case ProposalState.Defeated:
        return "Defeated";
      case ProposalState.Succeeded:
        return "Succeeded";
      case ProposalState.Executed:
        return "Executed";
      case ProposalState.Cancelled:
        return "Cancelled";
      default:
        return "Unknown";
    }
  };

  const canCreateProposal = (): boolean => {
    // In MerkleGovModule, anyone can create a proposal if merkle root is set
    return (
      currentMerkleRoot !== undefined &&
      currentMerkleRoot !==
        "0x0000000000000000000000000000000000000000000000000000000000000000"
    );
  };

  return {
    // Loading states
    isLoading: isLoading || isLoadingHash || isWriting,
    error,

    // Governance parameters
    proposalCounter: proposalCount ? Number(proposalCount) : 0,
    proposalThreshold: "0", // No threshold in MerkleGovModule
    votingDelay: votingDelay ? Number(votingDelay) : 0,
    votingPeriod: votingPeriod ? Number(votingPeriod) : 0,
    quorumBasisPoints: quorum ? Number(quorum) * 100 : 0, // Convert to basis points
    safeBalance: safeBalanceData?.value
      ? safeBalanceData.value.toString()
      : "0",
    safeAddress: safeAddress as string,

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
    merkleGovAddress: merkleGovModuleAddress,
    merkleVoteAddress: merkleGovModuleAddress, // Same contract now
    safeAddress: safeAddress as string,
  };
}
