"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { useReadContract, useWriteContract } from "wagmi";
import {
  rewardDistributorAbi,
  rewardDistributorAddress,
  enovaAbi,
} from "@/lib/contracts";
import { writeEthContractAndWait } from "@/lib/utils";

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
    sources?: Array<{
      name: string;
      metadata: { address: string };
    }>;
  };
}

interface PendingReward {
  account: string;
  reward: string;
  claimable: string;
  proof: string[];
}

interface RewardClaim {
  account: string;
  reward: string;
  claimable: string;
  claimed: string;
  timestamp: number;
  transactionHash: string;
}

// IPFS helpers  
const bytes32DigestToCid = async (bytes32: string): Promise<string> => {
  // Simplified CID conversion - in a real implementation, you'd use proper IPFS libraries
  return bytes32.slice(2); // Remove 0x prefix for now
};

const cidToUrl = (cid: string): string => {
  return `/api/ipfs/${cid}`;
};

export function useRewards() {
  const { address, isConnected } = useAccount();
  const { writeContract, isPending: isWriting } = useWriteContract();

  // Use the imported reward distributor address
  const contractAddress = rewardDistributorAddress;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentIpfsHash, setCurrentIpfsHash] = useState<string>("");
  const [merkleData, setMerkleData] = useState<MerkleTreeData | null>(null);
  const [pendingReward, setPendingReward] = useState<PendingReward | null>(
    null,
  );
  const [claimHistory, setClaimHistory] = useState<RewardClaim[]>([]);
  const [tokenSymbol, setTokenSymbol] = useState<string>("TOKEN");

  // Read merkle root from contract
  const { data: merkleRoot, isLoading: isLoadingRoot } = useReadContract({
    address: contractAddress,
    abi: rewardDistributorAbi,
    functionName: "root",
    query: { enabled: !!contractAddress },
  });

  // Read IPFS hash CID from contract
  const { data: ipfsHashCid, isLoading: isLoadingHash } = useReadContract({
    address: contractAddress,
    abi: rewardDistributorAbi,
    functionName: "ipfsHashCid",
    query: { enabled: !!contractAddress },
  });

  // Read claimed amount for connected user
  const { data: claimedAmount, refetch: refetchClaimed } = useReadContract({
    address: contractAddress,
    abi: rewardDistributorAbi,
    functionName: "claimed",
    args:
      address && merkleData?.metadata?.reward_token_address
        ? [address, merkleData.metadata.reward_token_address as `0x${string}`]
        : undefined,
    query: {
      enabled: !!address && !!merkleData?.metadata?.reward_token_address,
    },
  });

  // Fetch merkle data from IPFS
  useEffect(() => {
    const loadMerkleData = async () => {
      if (!ipfsHashCid || ipfsHashCid === "") {
        return;
      }

      try {
        setIsLoading(true);
        setCurrentIpfsHash(ipfsHashCid as string);

        // Fetch merkle tree data from IPFS via Next.js API route
        const ipfsUrl = cidToUrl(ipfsHashCid as string);
        console.log(`Fetching merkle data from: ${ipfsUrl}`);

        const response = await fetch(ipfsUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch IPFS data: ${response.status}`);
        }

        const data: MerkleTreeData = await response.json();
        setMerkleData(data);

        // Find pending reward for current user
        if (address && data.tree) {
          const userReward = data.tree.find(
            (reward) => reward.account.toLowerCase() === address.toLowerCase(),
          );
          setPendingReward(userReward || null);
        }
      } catch (err) {
        console.error("Error loading merkle data:", err);
        setError("Failed to load reward data from IPFS");
      } finally {
        setIsLoading(false);
      }
    };

    loadMerkleData();
  }, [ipfsHashCid, address]);

  // Fetch token symbol when we have reward token address
  useEffect(() => {
    const fetchTokenSymbol = async () => {
      if (!merkleData?.metadata?.reward_token_address) {
        return;
      }

      try {
        const response = await fetch(`/api/token-symbol/${merkleData.metadata.reward_token_address}`);
        if (response.ok) {
          const data = await response.json();
          setTokenSymbol(data.symbol || "TOKEN");
        }
      } catch (err) {
        console.error("Error fetching token symbol:", err);
        setTokenSymbol("TOKEN");
      }
    };

    fetchTokenSymbol();
  }, [merkleData?.metadata?.reward_token_address]);

  // Trigger reward update
  const triggerUpdate = useCallback(async () => {
    if (!isConnected || !contractAddress) {
      setError("Wallet not connected");
      return null;
    }

    try {
      setError(null);

      const { transactionHash } = await writeEthContractAndWait({
        address: contractAddress,
        abi: rewardDistributorAbi,
        functionName: "addTrigger",
      });

      console.log("Reward update triggered:", transactionHash);
      return transactionHash;
    } catch (err: any) {
      console.error("Error triggering reward update:", err);
      setError(`Failed to trigger update: ${err.message}`);
      return null;
    }
  }, [isConnected, contractAddress, writeContract]);

  // Claim rewards
  const claim = useCallback(async () => {
    if (
      !address ||
      !pendingReward ||
      !merkleData?.metadata?.reward_token_address ||
      !isConnected
    ) {
      setError("Missing requirements for claim");
      return null;
    }

    try {
      setError(null);

      const { transactionHash } = await writeEthContractAndWait({
        address: contractAddress,
        abi: rewardDistributorAbi,
        functionName: "claim",
        args: [
          address,
          merkleData.metadata.reward_token_address as `0x${string}`,
          BigInt(pendingReward.claimable),
          pendingReward.proof as `0x${string}`[],
        ],
      });

      // Add to claim history
      const newClaim: RewardClaim = {
        ...pendingReward,
        claimed: pendingReward.claimable,
        timestamp: Date.now(),
        transactionHash,
      };
      setClaimHistory((prev) => [...prev, newClaim]);

      // Refresh claimed amount
      await refetchClaimed();

      console.log("Rewards claimed:", transactionHash);
      return transactionHash;
    } catch (err: any) {
      console.error("Error claiming rewards:", err);
      setError(`Failed to claim rewards: ${err.message}`);
      return null;
    }
  }, [
    address,
    pendingReward,
    merkleData,
    isConnected,
    contractAddress,
    writeContract,
    refetchClaimed,
  ]);

  const refresh = useCallback(async () => {
    await refetchClaimed();
  }, [refetchClaimed]);

  return {
    // Loading states
    isLoading: isLoading || isLoadingRoot || isLoadingHash || isWriting,
    error,

    // Data
    merkleRoot: merkleRoot as string,
    currentIpfsHash,
    merkleData,
    pendingReward,
    claimedAmount: claimedAmount?.toString() || "0",
    claimHistory,
    tokenSymbol,

    // Actions
    claim,
    triggerUpdate,
    refresh,

    // Contract info
    contractAddress,
  };
}
