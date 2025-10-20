'use client'

import { useRouter } from 'next/navigation'
import type React from 'react'
import { useMemo } from 'react'

import { TableAddress } from '@/components/Address'
import { Button } from '@/components/Button'
import { CreateAttestationModal } from '@/components/CreateAttestationModal'
import { ExportButtons } from '@/components/ExportButtons'
import { InfoTooltip } from '@/components/InfoTooltip'
import { RankRenderer } from '@/components/RankRenderer'
import { Column, Table } from '@/components/Table'
import { NetworkEntry, useNetwork } from '@/hooks/useNetwork'
import { EXAMPLE_NETWORK, isTrustedSeed } from '@/lib/network'
import { formatBigNumber } from '@/lib/utils'

export default function NetworkPage() {
  const router = useRouter()

  const {
    isLoading,
    error,
    merkleData,
    totalValue,
    totalParticipants,
    refresh,
  } = useNetwork()

  // Add rank to merkle data for display
  const merkleDataWithRank = useMemo(() => {
    if (!merkleData) return []
    return merkleData.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }))
  }, [merkleData])

  // Define table columns
  const columns: Column<NetworkEntry & { rank: number }>[] = [
    {
      key: 'rank',
      header: 'RANK',
      tooltip:
        "Member's position in this network ranked by Trust Score. Rank is recalculated as new attestations are made.",
      sortable: true,
      accessor: (row) => row.rank,
      render: (row) => <RankRenderer rank={row.rank} />,
    },
    {
      key: 'account',
      header: 'ACCOUNT',
      tooltip: 'The wallet address or ENS name of this network member.',
      sortable: false,
      render: (row) => <TableAddress address={row.account} showNavIcon />,
    },
    {
      key: 'seed',
      header: 'SEED',
      tooltip:
        'Indicates if this member is part of the initial seed group that bootstrapped this network. Seed member influence is designed to diminish as the network grows.',
      sortable: false,
      render: (row) =>
        isTrustedSeed(EXAMPLE_NETWORK, row.account) ? '🌱' : '',
    },
    {
      key: 'received',
      header: 'RECEIVED',
      tooltip:
        'The number of attestations this member has received from other participants in this network.',
      sortable: true,
      accessor: (row) => row.received || 0,
      render: (row) => (
        <div className="text-sm text-gray-800">{row.received || 0}</div>
      ),
    },
    {
      key: 'sent',
      header: 'SENT',
      tooltip:
        'The number of attestations this member has given to other participants, indicating their level of engagement in building network trust.',
      sortable: true,
      accessor: (row) => row.sent || 0,
      render: (row) => (
        <div className="text-sm text-gray-800">{row.sent || 0}</div>
      ),
    },
    {
      key: 'score',
      header: 'SCORE',
      tooltip:
        "This member's calculated Trust Score using a PageRank-style algorithm. Higher scores indicate stronger endorsement from trusted peers in the network.",
      sortable: true,
      accessor: (row) => Number(BigInt(row.value || '0')),
      render: (row) => (
        <div className="text-sm text-gray-900">
          {formatBigNumber(row.value, undefined, true)}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-700 pb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-lg">TRUST NETWORK</div>
          <CreateAttestationModal network={EXAMPLE_NETWORK} />
        </div>
        <div className="text-sm">◆ RANKED BY REPUTATION ◆</div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="text-sm text-gray-900">◉ LOADING NETWORK DATA ◉</div>
          <div className="text-xs mt-2 text-gray-600">
            Fetching latest TrustGraph data...
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="border border-red-500 bg-red-50 p-4 rounded-sm">
          <div className="error-text text-sm text-red-700">⚠️ {error}</div>
          <Button onClick={refresh} className="mt-3 !px-4 !py-2">
            <span className="text-xs">RETRY</span>
          </Button>
        </div>
      )}

      {/* Statistics */}
      {!isLoading && merkleData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-300 bg-white p-4 rounded-sm shadow-sm">
            <div className="space-y-2">
              <div className="text-xs text-gray-600 flex items-center gap-1">
                MEMBERS
                <InfoTooltip title="The number of people belonging to this network." />
              </div>
              <div className="text-2xl text-gray-900">{totalParticipants}</div>
            </div>
          </div>

          <div className="border border-gray-300 bg-white p-4 rounded-sm shadow-sm">
            <div className="space-y-2">
              <div className="text-xs text-gray-600 flex items-center gap-1">
                TOTAL NETWORK SCORE
                <InfoTooltip title="The sum of all trust scores in the network." />
              </div>
              <div className="text-2xl text-gray-900">
                {formatBigNumber(totalValue, undefined, true)}
              </div>
            </div>
          </div>

          <div className="border border-gray-300 bg-white p-4 rounded-sm shadow-sm">
            <div className="space-y-2">
              <div className="text-xs text-gray-600 flex items-center gap-1">
                AVERAGE TRUST SCORE
                <InfoTooltip title="The average trust score across the network." />
              </div>
              <div className="text-2xl text-gray-900">
                {totalParticipants > 0
                  ? formatBigNumber(
                      BigInt(totalValue) / BigInt(totalParticipants),
                      undefined,
                      true
                    )
                  : '0'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Merkle Table */}
      {!isLoading && merkleData && merkleData.length > 0 && (
        <div className="border border-gray-300 bg-white rounded-sm shadow-sm">
          <div className="border-b border-gray-300 p-4">
            <div className="text-lg mb-1 text-gray-900">NETWORK MEMBERSHIP</div>
            <div className="text-sm text-gray-600">
              ◢◤ Ranked by reputation ◢◤
            </div>
          </div>

          <div className="overflow-x-auto px-4 py-2">
            <Table
              columns={columns}
              data={merkleDataWithRank}
              defaultSortColumn="rank"
              defaultSortDirection="asc"
              onRowClick={
                // Will be prefetched in the TableAddress component
                (row) => router.push(`/account/${row.account}`)
              }
              getRowKey={(row) => row.account}
              rowClickTitle="Click to view account profile"
            />
          </div>
          <div className="flex justify-center gap-4 pt-3 pb-4 border-t border-gray-200">
            <ExportButtons
              data={merkleDataWithRank}
              filename={`TrustGraph_${
                EXAMPLE_NETWORK.name
              }_${new Date().toISOString()}`}
            />
          </div>
        </div>
      )}

      {/* No Data Message */}
      {!isLoading && (!merkleData || merkleData.length === 0) && !error && (
        <div className="text-center py-8 border border-gray-300 bg-white rounded-sm shadow-sm">
          <div className="text-sm text-gray-600">NO NETWORK DATA AVAILABLE</div>
          <div className="text-xs mt-2 text-gray-700">
            ◆ PARTICIPATE IN ATTESTATIONS TO APPEAR ON NETWORK ◆
          </div>
        </div>
      )}

      {/* Refresh Button */}
      {!isLoading && (
        <div className="flex justify-center pt-4">
          <Button
            onClick={refresh}
            className="!px-6 !py-2"
            disabled={isLoading}
          >
            <span className="text-xs">REFRESH NETWORK</span>
          </Button>
        </div>
      )}
    </div>
  )
}
