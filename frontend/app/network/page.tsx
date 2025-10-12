'use client'

import { useRouter } from 'next/navigation'
import type React from 'react'
import { useAccount, useConnect } from 'wagmi'
import { injected } from 'wagmi/connectors'

import { Button } from '@/components/ui/button'
import { ExportButtons } from '@/components/ui/export-buttons'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import { useNetwork } from '@/hooks/useNetwork'
import { TRUSTED_SEEDS } from '@/lib/config'

export default function NetworkPage() {
  const router = useRouter()
  const { isConnected } = useAccount()
  const { connect } = useConnect()

  const {
    isLoading,
    error,
    MerkleData,
    totalRewards,
    totalParticipants,
    refresh,
  } = useNetwork()

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
        <div className="border border-gray-300 bg-white p-6 rounded-sm text-center space-y-4 shadow-sm">
          <div className="terminal-text text-lg text-gray-900">
            WALLET CONNECTION REQUIRED
          </div>
          <div className="terminal-dim text-sm text-gray-600">
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
              <div className="terminal-bright text-sm text-gray-900">
                ◉ LOADING NETWORK DATA ◉
              </div>
              <div className="terminal-dim text-xs mt-2 text-gray-600">
                Fetching latest TrustGraph data...
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="border border-red-500 bg-red-50 p-4 rounded-sm">
              <div className="error-text text-sm text-red-700">⚠️ {error}</div>
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
              <div className="border border-gray-300 bg-white p-4 rounded-sm shadow-sm">
                <div className="space-y-2">
                  <div className="terminal-dim text-xs text-gray-600 flex items-center gap-1">
                    MEMBERS
                    <InfoTooltip content="The number of people belonging to this network." />
                  </div>
                  <div className="terminal-bright text-2xl text-gray-900">
                    {totalParticipants}
                  </div>
                </div>
              </div>

              <div className="border border-gray-300 bg-white p-4 rounded-sm shadow-sm">
                <div className="space-y-2">
                  <div className="terminal-dim text-xs text-gray-600 flex items-center gap-1">
                    TOTAL NETWORK SCORE
                    <InfoTooltip content="The sum of all trust scores in the network." />
                  </div>
                  <div className="terminal-bright text-2xl text-gray-900">
                    {formatAmount(totalRewards)}
                  </div>
                </div>
              </div>

              <div className="border border-gray-300 bg-white p-4 rounded-sm shadow-sm">
                <div className="space-y-2">
                  <div className="terminal-dim text-xs text-gray-600 flex items-center gap-1">
                    AVERAGE TRUST SCORE
                    <InfoTooltip content="The average trust score across the network." />
                  </div>
                  <div className="terminal-bright text-2xl text-gray-900">
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
            <div className="border border-gray-300 bg-white rounded-sm shadow-sm">
              <div className="border-b border-gray-300 p-4">
                <div className="ascii-art-title text-lg mb-1 text-gray-900">
                  NETWORK MEMBERSHIP
                </div>
                <div className="terminal-dim text-sm text-gray-600">
                  ◢◤ Ranked by reputation ◢◤
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="text-left p-4 terminal-dim text-xs text-gray-600">
                        RANK
                      </th>
                      <th className="text-left p-4 terminal-dim text-xs text-gray-600">
                        ACCOUNT
                      </th>
                      <th className="text-left p-4 terminal-dim text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          SEED
                          <InfoTooltip content="Seed members carry additional weight with their attestations." />
                        </div>
                      </th>
                      <th className="text-left p-4 terminal-dim text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          RECEIVED
                          <InfoTooltip content="The number of attestations an entity has received." />
                        </div>
                      </th>
                      <th className="text-left p-4 terminal-dim text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          SENT
                          <InfoTooltip content="The number of attestations an entity has given out." />
                        </div>
                      </th>
                      <th className="text-left p-4 terminal-dim text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          SCORE
                          <InfoTooltip content="The TrustScore for a particular account, based on reputation in the network. Attestations from members with higher reputations carry more weight." />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {MerkleData.map((entry, index) => (
                      <tr
                        key={entry.account}
                        className={`border-b border-gray-200 cursor-pointer transition-colors ${
                          index < 3
                            ? 'bg-gray-50 hover:bg-gray-100'
                            : index < 10
                            ? 'bg-gray-50 hover:bg-gray-100'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => router.push(`/network/${entry.account}`)}
                        title="Click to view account profile"
                      >
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`text-sm font-semibold ${
                                index === 0
                                  ? 'text-yellow-600'
                                  : index === 1
                                  ? 'text-gray-500'
                                  : index === 2
                                  ? 'text-amber-700'
                                  : 'text-gray-800'
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
                          <div className="terminal-text text-sm font-mono break-all text-gray-800">
                            {entry.account}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="terminal-text text-sm text-gray-800">
                            {TRUSTED_SEEDS.includes(entry.account) ? '⚡' : '-'}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="terminal-text text-sm text-gray-800">
                            {entry.received}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="terminal-text text-sm text-gray-800">
                            {entry.sent}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="terminal-bright text-sm text-gray-900">
                            {formatAmount(entry.value)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ExportButtons data={MerkleData} filename="trust-graph-network" />
            </div>
          )}

          {/* No Data Message */}
          {!isLoading && (!MerkleData || MerkleData.length === 0) && !error && (
            <div className="text-center py-8 border border-gray-300 bg-white rounded-sm shadow-sm">
              <div className="terminal-dim text-sm text-gray-600">
                NO NETWORK DATA AVAILABLE
              </div>
              <div className="system-message text-xs mt-2 text-gray-700">
                ◆ PARTICIPATE IN ATTESTATIONS TO APPEAR ON NETWORK ◆
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
                <span className="terminal-command text-xs">
                  REFRESH NETWORK
                </span>
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
