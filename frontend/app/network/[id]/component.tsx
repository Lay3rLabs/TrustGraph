'use client'

import { Link } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { Suspense } from 'react'

import { TableAddress } from '@/components/Address'
import { BreadcrumbRenderer } from '@/components/BreadcrumbRenderer'
import { Button } from '@/components/Button'
import { CreateAttestationModal } from '@/components/CreateAttestationModal'
import { ExportButtons } from '@/components/ExportButtons'
import { Markdown } from '@/components/Markdown'
import { RankRenderer } from '@/components/RankRenderer'
import { StatisticCard } from '@/components/StatisticCard'
import { Column, Table } from '@/components/Table'
import { NetworkEntry, useNetwork } from '@/hooks/useNetwork'
import { usePushBreadcrumb } from '@/hooks/usePushBreadcrumb'
import { Network, isTrustedSeed } from '@/lib/network'
import { formatBigNumber } from '@/lib/utils'

// Uses web2gl, which is not supported on the server
const NetworkGraph = dynamic(
  () => import('@/components/NetworkGraph').then((mod) => mod.NetworkGraph),
  {
    ssr: false,
  }
)

export const NetworkPage = ({ network }: { network: Network }) => {
  const router = useRouter()
  const pushBreadcrumb = usePushBreadcrumb()

  const {
    isLoading,
    error,
    merkleData,
    totalValue,
    totalParticipants,
    averageValue,
    medianValue,
    refresh,
  } = useNetwork()

  const { name, url, about, criteria } = network

  // Define table columns
  const columns: Column<NetworkEntry>[] = [
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
      render: (row) => (isTrustedSeed(network, row.account) ? '🌱' : ''),
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
    <div className="space-y-12">
      <div className="grid grid-cols-1 justify-start items-stretch lg:grid-cols-2 lg:items-start gap-12">
        <div className="flex flex-col items-start gap-4">
          <BreadcrumbRenderer className="mb-2" />

          <h1 className="text-4xl font-bold">{name}</h1>

          <a
            className="flex flex-row items-center gap-2 text-sm text-brand hover:text-brand/80 transition-colors"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Link className="w-4 h-4" />
            <span>{new URL(url).hostname}</span>
          </a>

          <h2 className="mt-2 -mb-3 font-bold">ABOUT NETWORK</h2>
          <p>{about}</p>

          <h2 className="mt-2 -mb-3 font-bold">CRITERIA</h2>
          <div className="break-words text-left">
            <Markdown>{criteria}</Markdown>
          </div>

          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-stretch mt-6">
            <CreateAttestationModal network={network} />

            <ExportButtons
              data={merkleData}
              filename={`TrustGraph_${name}_${new Date().toISOString()}`}
            />
          </div>
        </div>

        <div className="h-[66vh] lg:h-4/5">
          <Suspense fallback={null}>
            <NetworkGraph network={network} />
          </Suspense>
        </div>
      </div>

      <div className="border-y border-border py-12 space-y-6">
        <h2 className="font-bold">NETWORK STATISTICS</h2>
        <div className="flex flex-row gap-4 flex-wrap">
          <StatisticCard
            title="TOTAL MEMBERS"
            tooltip="The total number of participants in this TrustGraph network who have a TrustScore above this network's threshold."
            value={
              isLoading
                ? '...'
                : formatBigNumber(totalParticipants, undefined, true)
            }
          />
          <StatisticCard
            title="TOTAL NETWORK SCORE"
            tooltip="The sum of all Trust Scores across all network members, indicating overall network capacity and collective credibility."
            value={
              isLoading ? '...' : formatBigNumber(totalValue, undefined, true)
            }
          />
          <StatisticCard
            title="AVERAGE + MEDIAN TRUST SCORE"
            tooltip="These metrics show typical member Trust Scores in this network."
            value={`${formatBigNumber(
              Math.round(averageValue),
              undefined,
              true
            )} / ${formatBigNumber(medianValue, undefined, true)}`}
          />
          {/* <StatisticCard
            title="MEMBERS OVER THRESHOLD"
            tooltip="The percentage of network members who have achieved a minimum Trust Score threshold. You can use this threshold to inform governance eligibility decisions."
            value="43%"
          /> */}
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-row justify-between items-center">
          <h2 className="font-bold">NETWORK MEMBERS</h2>

          {/* Refresh Button */}
          {!isLoading && (
            <Button onClick={refresh} size="sm" disabled={isLoading}>
              <span className="text-xs">REFRESH</span>
            </Button>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="text-sm text-gray-900">
              ◉ LOADING NETWORK DATA ◉
            </div>
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

        {/* Merkle Table */}
        {!isLoading && merkleData.length > 0 && (
          <div className="overflow-x-auto">
            <Table
              columns={columns}
              data={merkleData}
              defaultSortDirection="asc"
              defaultSortColumn="rank"
              onRowClick={
                // Will be prefetched in the TableAddress component
                (row) => {
                  pushBreadcrumb()
                  router.push(`/account/${row.ensName || row.account}`)
                }
              }
              getRowKey={(row) => row.account}
            />
          </div>
        )}

        {/* No Data Message */}
        {!isLoading && (!merkleData || merkleData.length === 0) && !error && (
          <div className="text-center py-8 border border-gray-300 bg-white rounded-sm shadow-sm">
            <div className="text-sm text-gray-600">
              NO NETWORK DATA AVAILABLE
            </div>
            <div className="text-xs mt-2 text-gray-700">
              ◆ PARTICIPATE IN ATTESTATIONS TO APPEAR ON NETWORK ◆
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
