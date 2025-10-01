'use client'

import type React from 'react'
import { useAccount, useConnect } from 'wagmi'
import { injected } from 'wagmi/connectors'

import { Button } from '@/components/ui/button'
import { useMerkle } from '@/hooks/useMerkle'

export default function NetworkPage() {
  const { isConnected } = useAccount()
  const { connect } = useConnect()

  const {
    isLoading,
    error,
    MerkleData,
    totalRewards,
    totalParticipants,
    refresh,
  } = useMerkle()

  const handleConnect = () => {
    try {
      connect({ connector: injected() })
    } catch (err) {
      console.error('Failed to connect wallet:', err)
    }
  }

  const formatAmount = (amount: string) => {
    return BigInt(amount || 0).toLocaleString()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {/*<div className="border-b border-gray-700 pb-4">
        <div className="ascii-art-title text-lg mb-2">
          Trust Graph Merkle Tree
        </div>
        <div className="system-message text-sm">◆ RANKED BY REPUTATION ◆</div>
      </div>*/}

      {/* Wallet Connection */}
      {!isConnected && (
        <div className="border border-gray-700 bg-black/10 p-6 rounded-sm text-center space-y-4">
          <div className="terminal-text text-lg">
            WALLET CONNECTION REQUIRED
          </div>
          <div className="terminal-dim text-sm">
            Connect your wallet to view the Merkle
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
              <div className="terminal-bright text-sm">
                ◉ LOADING MERKLE DATA ◉
              </div>
              <div className="terminal-dim text-xs mt-2">
                Fetching latest reputation scores from IPFS...
              </div>
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
          {!isLoading && MerkleData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-gray-700 bg-black/10 p-4 rounded-sm">
                <div className="space-y-2">
                  <div className="terminal-dim text-xs">MEMBERS</div>
                  <div className="terminal-bright text-2xl">
                    {totalParticipants}
                  </div>
                </div>
              </div>

              <div className="border border-gray-700 bg-black/10 p-4 rounded-sm">
                <div className="space-y-2">
                  <div className="terminal-dim text-xs">
                    TOTAL REPUTATION POINTS
                  </div>
                  <div className="terminal-bright text-2xl">
                    {formatAmount(totalRewards)}
                  </div>
                </div>
              </div>

              <div className="border border-gray-700 bg-black/10 p-4 rounded-sm">
                <div className="space-y-2">
                  <div className="terminal-dim text-xs">
                    AVERAGE TRUST SCORE
                  </div>
                  <div className="terminal-bright text-2xl">
                    {totalParticipants > 0
                      ? formatAmount(
                          (
                            BigInt(totalRewards) / BigInt(totalParticipants)
                          ).toString()
                        )
                      : '0'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Merkle Table */}
          {!isLoading && MerkleData && MerkleData.length > 0 && (
            <div className="border border-gray-700 bg-black/10 rounded-sm">
              <div className="border-b border-gray-700 p-4">
                <div className="ascii-art-title text-lg mb-1">
                  NETWORK MEMBERSHIP
                </div>
                <div className="terminal-dim text-sm">
                  ◢◤ Ranked by reputation ◢◤
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left p-4 terminal-dim text-xs">
                        RANK
                      </th>
                      <th className="text-left p-4 terminal-dim text-xs">
                        ACCOUNT
                      </th>
                      <th className="text-left p-4 terminal-dim text-xs">
                        SCORE
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {MerkleData.map((entry, index) => (
                      <tr
                        key={entry.account}
                        className={`border-b border-gray-700/50 ${
                          index < 3
                            ? 'bg-black/20'
                            : index < 10
                            ? 'bg-black/10'
                            : ''
                        }`}
                      >
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`text-sm ${
                                index === 0
                                  ? 'text-yellow-400'
                                  : index === 1
                                  ? 'text-gray-300'
                                  : index === 2
                                  ? 'text-amber-600'
                                  : 'terminal-text'
                              }`}
                            >
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
                            {formatAmount(entry.value)}
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
          {!isLoading && (!MerkleData || MerkleData.length === 0) && !error && (
            <div className="text-center py-8 border border-gray-700 bg-black/10 rounded-sm">
              <div className="terminal-dim text-sm">
                NO MERKLE DATA AVAILABLE
              </div>
              <div className="system-message text-xs mt-2">
                ◆ PARTICIPATE IN ATTESTATIONS TO APPEAR ON Merkle ◆
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
                <span className="terminal-command text-xs">REFRESH MERKLE</span>
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
