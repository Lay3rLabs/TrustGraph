"use client";

import type React from "react";
import { Button } from "@/components/ui/button";

interface RewardsCardProps {
  merkleRoot?: string;
  currentIpfsHash?: string;
  pendingReward?: {
    account: string;
    reward: string;
    claimable: string;
    proof: string[];
  } | null;
  claimedAmount?: string;
  merkleData?: {
    metadata: {
      reward_token_address: string;
      total_rewards: string;
    };
  } | null;
  tokenSymbol?: string;
  contractAddress?: string;
  onClaim?: () => void;
  onTriggerUpdate?: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export function RewardsCard({
  merkleRoot,
  currentIpfsHash,
  pendingReward,
  claimedAmount = "0",
  merkleData,
  tokenSymbol = "TOKEN",
  contractAddress,
  onClaim,
  onTriggerUpdate,
  isLoading = false,
  error,
}: RewardsCardProps) {
  const formatAmount = (amount: string | undefined) => {
    if (!amount || amount === "0") return "0";
    // Convert from wei to ether (assuming 18 decimals)
    const value = BigInt(amount);
    const formatted = Number(value) / Math.pow(10, 18);
    return formatted.toFixed(6);
  };

  const hasClaimableRewards =
    pendingReward && Number(pendingReward.claimable) > Number(claimedAmount);

  return (
    <div className="border border-gray-700 bg-black/10 p-6 rounded-sm space-y-4">
      {/* Header */}
      <div className="border-b border-gray-700 pb-3">
        <div className="ascii-art-title text-lg mb-1">REWARD DISTRIBUTION</div>
        <div className="terminal-dim text-sm">
          ◢◤ On-chain reward claims and distribution tracking ◢◤
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-4">
          <div className="terminal-bright text-sm">◉ LOADING REWARD DATA ◉</div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="border border-red-700 bg-red-900/10 p-3 rounded-sm">
          <div className="error-text text-sm">⚠️ {error}</div>
        </div>
      )}

      {/* Contract Info */}
      {!isLoading && (
        <div className="space-y-4">
          {contractAddress && (
            <div className="space-y-2">
              <div className="terminal-dim text-xs">CONTRACT ADDRESS</div>
              <div className="terminal-text text-sm font-mono break-all">
                {contractAddress}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="terminal-dim text-xs">MERKLE ROOT</div>
            <div className="terminal-text text-sm font-mono break-all">
              {merkleRoot || "Not set"}
            </div>
          </div>

          <div className="space-y-2">
            <div className="terminal-dim text-xs">IPFS DATA HASH</div>
            <div className="terminal-text text-sm font-mono break-all">
              {currentIpfsHash || "Not available"}
            </div>
          </div>
        </div>
      )}

      {/* Reward Pool Info */}
      {merkleData && (
        <div className="border-t border-gray-700 pt-4 space-y-3">
          <div className="terminal-bright text-sm">REWARD POOL STATUS</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="terminal-dim text-xs">TOTAL REWARDS</div>
              <div className="terminal-text text-sm">
                {formatAmount(merkleData.metadata.total_rewards)} {tokenSymbol}
              </div>
            </div>
            <div className="space-y-2">
              <div className="terminal-dim text-xs">REWARD TOKEN</div>
              <div className="terminal-text text-sm font-mono break-all">
                {merkleData.metadata.reward_token_address}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Rewards */}
      <div className="border-t border-gray-700 pt-4 space-y-3">
        <div className="terminal-bright text-sm">YOUR REWARDS</div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="terminal-dim text-xs">TOTAL EARNED</div>
            <div className="terminal-text text-lg">
              {pendingReward ? formatAmount(pendingReward.claimable) : "0"}{" "}
              {tokenSymbol}
            </div>
          </div>

          <div className="space-y-2">
            <div className="terminal-dim text-xs">CLAIMABLE</div>
            <div className="terminal-text text-lg">
              {pendingReward ? formatAmount((BigInt(pendingReward.claimable) - BigInt(claimedAmount)).toString()) : "0"}{" "}
              {tokenSymbol}
            </div>
          </div>

          <div className="space-y-2">
            <div className="terminal-dim text-xs">ALREADY CLAIMED</div>
            <div className="terminal-text text-lg">
              {formatAmount(claimedAmount)} {tokenSymbol}
            </div>
          </div>
        </div>

        {/* Claim Status */}
        {pendingReward && (
          <div className="space-y-2">
            <div className="terminal-dim text-xs">CLAIM STATUS</div>
            <div
              className={`text-sm ${hasClaimableRewards ? "text-green-400" : "text-yellow-400"}`}
            >
              {hasClaimableRewards
                ? "✓ Rewards available for claim"
                : "◯ No pending rewards"}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="border-t border-gray-700 pt-4 flex flex-col sm:flex-row gap-3">
        {hasClaimableRewards && onClaim && (
          <Button
            onClick={onClaim}
            disabled={isLoading}
            className="mobile-terminal-btn !px-4 !py-2 flex-1"
          >
            <span className="terminal-command text-xs">
              CLAIM {formatAmount(pendingReward?.claimable)} {tokenSymbol}
            </span>
          </Button>
        )}

        {onTriggerUpdate && (
          <Button
            onClick={onTriggerUpdate}
            disabled={isLoading}
            variant="outline"
            className="border-gray-700 text-gray-400 hover:bg-gray-900/20 flex-1"
          >
            <span className="text-xs">TRIGGER UPDATE</span>
          </Button>
        )}
      </div>

      {/* No Rewards Message */}
      {!isLoading && !pendingReward && !error && (
        <div className="text-center py-6 border-t border-gray-700">
          <div className="terminal-dim text-sm">NO REWARDS AVAILABLE</div>
          <div className="system-message text-xs mt-2">
            ◆ PARTICIPATE IN ATTESTATIONS TO EARN REWARDS ◆
          </div>
        </div>
      )}
    </div>
  );
}
