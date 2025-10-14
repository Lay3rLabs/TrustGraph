'use client'

import { useRouter } from 'next/navigation'
import type React from 'react'
import { useState, useMemo } from 'react'
import { useAccount, useConnect } from 'wagmi'
import { injected } from 'wagmi/connectors'

import { CreateAttestationModal } from '@/components/CreateAttestationModal'
import { TableAddress } from '@/components/ui/address'
import { Button } from '@/components/ui/button'
import { ExportButtons } from '@/components/ui/export-buttons'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import { useNetwork } from '@/hooks/useNetwork'
import { TRUSTED_SEEDS } from '@/lib/config'

type SortColumn = 'rank' | 'received' | 'sent' | 'score'
type SortDirection = 'asc' | 'desc'

export default function NetworkPage() {
  const router = useRouter()
  const { isConnected } = useAccount()
  const { connect } = useConnect()

  // Sorting state
  const [sortColumn, setSortColumn] = useState<SortColumn>('score')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

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

  // Handle column header clicks
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection(
        ['score', 'received', 'sent'].includes(column) ? 'desc' : 'asc'
      ) // Default to desc for score/received/sent, asc for others
    }
  }

  // Sort the data
  const sortedMerkleData = useMemo(() => {
    if (!MerkleData) return []

    const sorted = [...MerkleData].sort((a, b) => {
      let aValue: number, bValue: number

      switch (sortColumn) {
        case 'rank':
          aValue = MerkleData.indexOf(a) + 1
          bValue = MerkleData.indexOf(b) + 1
          break
        case 'received':
          aValue = parseInt(a.received || '0')
          bValue = parseInt(b.received || '0')
          break
        case 'sent':
          aValue = parseInt(a.sent || '0')
          bValue = parseInt(b.sent || '0')
          break
        case 'score':
          aValue = Number(BigInt(a.value || '0'))
          bValue = Number(BigInt(b.value || '0'))
          break
        default:
          return 0
      }

      if (sortDirection === 'asc') {
        return aValue - bValue
      } else {
        return bValue - aValue
      }
    })

    return sorted
  }, [MerkleData, sortColumn, sortDirection])

  // Helper function to render sort indicator
  const getSortIndicator = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <span className="text-gray-400 ml-1">↕</span>
    }
    return sortDirection === 'asc' ? (
      <span className="text-gray-900 ml-1">↑</span>
    ) : (
      <span className="text-gray-900 ml-1">↓</span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-700 pb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="ascii-art-title text-lg">TRUST NETWORK</div>
          <CreateAttestationModal />
        </div>
        <div className="system-message text-sm">◆ RANKED BY REPUTATION ◆</div>
      </div>

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
                  <th
                    className="text-left p-4 terminal-dim text-xs text-gray-600 cursor-pointer hover:text-gray-900 transition-colors select-none"
                    onClick={() => handleSort('rank')}
                  >
                    <div className="flex items-center">
                      RANK
                      {getSortIndicator('rank')}
                    </div>
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
                  <th
                    className="text-left p-4 terminal-dim text-xs text-gray-600 cursor-pointer hover:text-gray-900 transition-colors select-none"
                    onClick={() => handleSort('received')}
                  >
                    <div className="flex items-center gap-1">
                      RECEIVED
                      <InfoTooltip content="The number of attestations an entity has received." />
                      {getSortIndicator('received')}
                    </div>
                  </th>
                  <th
                    className="text-left p-4 terminal-dim text-xs text-gray-600 cursor-pointer hover:text-gray-900 transition-colors select-none"
                    onClick={() => handleSort('sent')}
                  >
                    <div className="flex items-center gap-1">
                      SENT
                      <InfoTooltip content="The number of attestations an entity has given out." />
                      {getSortIndicator('sent')}
                    </div>
                  </th>
                  <th
                    className="text-left p-4 terminal-dim text-xs text-gray-600 cursor-pointer hover:text-gray-900 transition-colors select-none"
                    onClick={() => handleSort('score')}
                  >
                    <div className="flex items-center gap-1">
                      SCORE
                      <InfoTooltip content="The TrustScore for a particular account, based on reputation in the network. Attestations from members with higher reputations carry more weight." />
                      {getSortIndicator('score')}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedMerkleData.map((entry, index) => {
                  // Find original index for rank calculation
                  const originalIndex = MerkleData.findIndex(
                    (item) => item.account === entry.account
                  )
                  return (
                    <tr
                      key={entry.account}
                      className={`border-b border-gray-200 cursor-pointer transition-colors ${
                        originalIndex < 3
                          ? 'bg-gray-50 hover:bg-gray-100'
                          : originalIndex < 10
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
                              originalIndex === 0
                                ? 'text-yellow-600'
                                : originalIndex === 1
                                ? 'text-gray-500'
                                : originalIndex === 2
                                ? 'text-amber-700'
                                : 'text-gray-800'
                            }`}
                          >
                            #{originalIndex + 1}
                          </span>
                          {originalIndex < 3 && (
                            <span className="text-xs">
                              {originalIndex === 0
                                ? '🥇'
                                : originalIndex === 1
                                ? '🥈'
                                : '🥉'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <TableAddress
                          address={entry.account}
                          onClick={(address) =>
                            router.push(`/network/${address}`)
                          }
                        />
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
                  )
                })}
              </tbody>
            </table>
          </div>
          <ExportButtons
            data={sortedMerkleData}
            filename="trust-graph-network"
          />
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
            <span className="terminal-command text-xs">REFRESH NETWORK</span>
          </Button>
        </div>
      )}
    </div>
  )
}
