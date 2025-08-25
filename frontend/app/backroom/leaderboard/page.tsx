"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useAccount, useConnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { Button } from "@/components/ui/button";
import { useLeaderboard } from "@/hooks/useLeaderboard";

export default function LeaderboardPage() {
  const { isConnected } = useAccount();
  const { connect } = useConnect();

  const {
    isLoading,
    error,
    leaderboardData,
    totalRewards,
    totalParticipants,
    tokenSymbol,
    refresh,
  } = useLeaderboard();

  const handleConnect = () => {
    try {
      connect({ connector: injected() });
    } catch (err) {
      console.error("Failed to connect wallet:", err);
    }
  };

  const formatAmount = (amount: string) => {
    if (!amount || amount === "0") return "0";
    const value = BigInt(amount);
    const formatted = Number(value) / Math.pow(10, 18);
    return formatted.toFixed(6);
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-700 pb-4">
        <div className="ascii-art-title text-lg mb-2">REWARD LEADERBOARD</div>
        <div className="system-message text-sm">
          ◆ TOP CONTRIBUTORS • RANKED BY REWARDS • COLLECTIVE IMPACT ◆
        </div>
      </div>

      {/* Wallet Connection */}
      {!isConnected && (
        <div className="border border-gray-700 bg-black/10 p-6 rounded-sm text-center space-y-4">
          <div className="terminal-text text-lg">
            WALLET CONNECTION REQUIRED
          </div>
          <div className="terminal-dim text-sm">
            Connect your wallet to view the leaderboard
          </div>
          <Button
            onClick={handleConnect}
            className="mobile-terminal-btn !px-6 !py-2"
          >
            <span className="terminal-command text-xs">CONNECT WALLET</span>
          </Button>
        </div>
      )}

      {isConnected && (
        <>
          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-8">
              <div className="terminal-bright text-sm">◉ LOADING LEADERBOARD DATA ◉</div>
              <div className="terminal-dim text-xs mt-2">Fetching reward distribution from IPFS...</div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="border border-red-700 bg-red-900/10 p-4 rounded-sm">
              <div className="error-text text-sm">⚠️ {error}</div>
              <Button
                onClick={refresh}
                className="mt-3 mobile-terminal-btn !px-4 !py-2"
              >
                <span className="text-xs">RETRY</span>
              </Button>
            </div>
          )}

          {/* Statistics */}
          {!isLoading && leaderboardData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-gray-700 bg-black/10 p-4 rounded-sm">
                <div className="space-y-2">
                  <div className="terminal-dim text-xs">TOTAL PARTICIPANTS</div>
                  <div className="terminal-bright text-2xl">{totalParticipants}</div>
                  <div className="terminal-dim text-xs">Accounts in reward pool</div>
                </div>
              </div>
              
              <div className="border border-gray-700 bg-black/10 p-4 rounded-sm">
                <div className="space-y-2">
                  <div className="terminal-dim text-xs">TOTAL REWARDS</div>
                  <div className="terminal-bright text-2xl">{formatAmount(totalRewards)}</div>
                  <div className="terminal-dim text-xs">{tokenSymbol} distributed</div>
                </div>
              </div>
              
              <div className="border border-gray-700 bg-black/10 p-4 rounded-sm">
                <div className="space-y-2">
                  <div className="terminal-dim text-xs">AVERAGE REWARD</div>
                  <div className="terminal-bright text-2xl">
                    {totalParticipants > 0 ? formatAmount((BigInt(totalRewards) / BigInt(totalParticipants)).toString()) : "0"}
                  </div>
                  <div className="terminal-dim text-xs">{tokenSymbol} per participant</div>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard Table */}
          {!isLoading && leaderboardData && leaderboardData.length > 0 && (
            <div className="border border-gray-700 bg-black/10 rounded-sm">
              <div className="border-b border-gray-700 p-4">
                <div className="ascii-art-title text-lg mb-1">TOP CONTRIBUTORS</div>
                <div className="terminal-dim text-sm">
                  ◢◤ Ranked by total reward allocation ◢◤
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left p-4 terminal-dim text-xs">RANK</th>
                      <th className="text-left p-4 terminal-dim text-xs">ACCOUNT</th>
                      <th className="text-left p-4 terminal-dim text-xs">AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardData.map((entry, index) => (
                      <tr 
                        key={entry.account} 
                        className={`border-b border-gray-700/50 ${
                          index < 3 ? 'bg-black/20' : index < 10 ? 'bg-black/10' : ''
                        }`}
                      >
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <span className={`text-sm ${
                              index === 0 ? 'text-yellow-400' :
                              index === 1 ? 'text-gray-300' :
                              index === 2 ? 'text-amber-600' :
                              'terminal-text'
                            }`}>
                              #{index + 1}
                            </span>
                            {index < 3 && (
                              <span className="text-xs">
                                {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="terminal-text text-sm font-mono break-all">
                            {entry.account}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="terminal-bright text-sm">
                            {formatAmount(entry.claimable)} {tokenSymbol}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* No Data Message */}
          {!isLoading && (!leaderboardData || leaderboardData.length === 0) && !error && (
            <div className="text-center py-8 border border-gray-700 bg-black/10 rounded-sm">
              <div className="terminal-dim text-sm">NO LEADERBOARD DATA AVAILABLE</div>
              <div className="system-message text-xs mt-2">
                ◆ PARTICIPATE IN ATTESTATIONS TO APPEAR ON LEADERBOARD ◆
              </div>
            </div>
          )}

          {/* Refresh Button */}
          {!isLoading && (
            <div className="flex justify-center pt-4">
              <Button
                onClick={refresh}
                className="mobile-terminal-btn !px-6 !py-2"
                disabled={isLoading}
              >
                <span className="terminal-command text-xs">REFRESH LEADERBOARD</span>
              </Button>
            </div>
          )}
        </>
      )}

      {/* Footer */}
      <div className="border-t border-gray-700 pt-4 mt-8">
        <div className="system-message text-center text-sm">
          ∞ MERIT RECOGNIZED • CONTRIBUTION REWARDED • COLLECTIVE GROWTH ∞
        </div>
      </div>
    </div>
  );
}