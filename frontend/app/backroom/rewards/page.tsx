"use client";

import type React from "react";
import { useState, useCallback } from "react";
import { useAccount, useConnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { Button } from "@/components/ui/button";
import { RewardsCard } from "@/components/RewardsCard";
import { useRewards } from "@/hooks/useRewards";

export default function RewardsPage() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    isLoading,
    error,
    merkleRoot,
    currentIpfsHash,
    merkleData,
    pendingReward,
    claimedAmount,
    claimHistory,
    tokenSymbol,
    rewardBalance,
    claim,
    triggerUpdate,
    refresh,
    contractAddress,
  } = useRewards();

  const handleConnect = useCallback(() => {
    try {
      connect({ connector: injected() });
    } catch (err) {
      console.error("Failed to connect wallet:", err);
    }
  }, [connect]);

  const handleClaim = useCallback(async () => {
    setSuccessMessage(null);
    const hash = await claim();
    if (hash) {
      setSuccessMessage(`Rewards claimed successfully! Transaction: ${hash}`);
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  }, [claim]);

  const handleTriggerUpdate = useCallback(async () => {
    setSuccessMessage(null);
    const hash = await triggerUpdate();
    if (hash) {
      setSuccessMessage(`Update triggered! Check back in a few minutes to see if there are any updates. Transaction: ${hash}`);
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  }, [triggerUpdate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      {/*<div className="border-b border-gray-700 pb-4">
        <div className="ascii-art-title text-lg mb-2">REWARD DISTRIBUTION SYSTEM</div>
        <div className="system-message text-sm">
          ◆ EARN REWARDS • CLAIM TOKENS • TRACK PARTICIPATION ◆
        </div>
      </div>*/}

      {/* Success Message */}
      {successMessage && (
        <div className="border border-green-700 bg-green-900/10 p-3 rounded-sm">
          <div className="text-green-400 text-sm">✓ {successMessage}</div>
        </div>
      )}

      {/* Wallet Connection */}
      {!isConnected && (
        <div className="border border-gray-700 bg-black/10 p-6 rounded-sm text-center space-y-4">
          <div className="terminal-text text-lg">
            WALLET CONNECTION REQUIRED
          </div>
          <div className="terminal-dim text-sm">
            Connect your wallet to view and claim rewards
          </div>
          <Button
            onClick={handleConnect}
            className="mobile-terminal-btn !px-6 !py-2"
          >
            <span className="terminal-command text-xs">CONNECT WALLET</span>
          </Button>
        </div>
      )}

      {/* Rewards Card */}
      {isConnected && (
        <RewardsCard
          merkleRoot={merkleRoot}
          currentIpfsHash={currentIpfsHash}
          pendingReward={pendingReward}
          claimedAmount={claimedAmount}
          merkleData={merkleData}
          tokenSymbol={tokenSymbol}
          rewardBalance={rewardBalance}
          contractAddress={contractAddress}
          onClaim={handleClaim}
          onTriggerUpdate={handleTriggerUpdate}
          isLoading={isLoading}
          error={error}
        />
      )}

      {/* Claim History */}
      {isConnected && claimHistory.length > 0 && (
        <div className="border border-gray-700 bg-black/10 p-6 rounded-sm space-y-4">
          <div className="border-b border-gray-700 pb-3">
            <div className="ascii-art-title text-lg mb-1">CLAIM HISTORY</div>
            <div className="terminal-dim text-sm">
              ◢◤ Your reward claim transactions ◢◤
            </div>
          </div>

          <div className="space-y-3">
            {claimHistory.map((claim, index) => (
              <div
                key={claim.transactionHash}
                className="border border-gray-700 p-4 rounded-sm"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <div className="terminal-dim text-xs">
                      CLAIM #{index + 1}
                    </div>
                    <div className="terminal-text text-sm">
                      {new Date(claim.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="terminal-dim text-xs">AMOUNT CLAIMED</div>
                    <div className="terminal-text text-sm">
                      {(Number(claim.claimed) / Math.pow(10, 18)).toFixed(6)}{" "}
                      {tokenSymbol}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="terminal-dim text-xs">TRANSACTION</div>
                    <div className="terminal-text text-sm font-mono break-all">
                      {claim.transactionHash}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="terminal-dim text-xs">STATUS</div>
                    <div className="text-green-400 text-sm">✓ CONFIRMED</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      {isConnected && (
        <div className="border border-gray-700 bg-black/10 p-6 rounded-sm">
          <div className="terminal-bright text-sm mb-3">HOW REWARDS WORK</div>
          <div className="space-y-2 text-sm terminal-dim">
            <div>
              • Rewards are calculated based on your attestation activity
            </div>
            <div>
              • Merkle tree data is stored on IPFS and updated periodically
            </div>
            <div>• Trigger updates to refresh the reward calculations</div>
            <div>
              • Claims are processed on-chain through the RewardDistributor
              contract
            </div>
            <div>
              • You can only claim rewards that haven't been claimed yet
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-700 pt-4 mt-8">
        <div className="system-message text-center text-sm">
          ∞ PARTICIPATION REWARDED • CONTRIBUTION RECOGNIZED • VALUE DISTRIBUTED
          ∞
        </div>
      </div>
    </div>
  );
}
