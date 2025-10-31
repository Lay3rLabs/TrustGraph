'use client'

import { Check, Link, ListFilter } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

import { TableAddress } from '@/components/Address'
import { BreadcrumbRenderer } from '@/components/BreadcrumbRenderer'
import { Button, ButtonLink } from '@/components/Button'
import { CreateAttestationModal } from '@/components/CreateAttestationModal'
import { Dropdown } from '@/components/Dropdown'
import { ExportButton } from '@/components/ExportButton'
import { Markdown } from '@/components/Markdown'
import { StatisticCard } from '@/components/StatisticCard'
import { Column, Table } from '@/components/Table'
import { NetworkEntry, useNetwork } from '@/hooks/useNetwork'
import { usePageRankComputerModule } from '@/hooks/usePageRankComputer'
import { usePushBreadcrumb } from '@/hooks/usePushBreadcrumb'
import { Network, isTrustedSeed } from '@/lib/network'
import { formatBigNumber } from '@/lib/utils'
import { PageRankGraphComputer } from '@/lib/wasm/pagerank/pagerank'

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
  const pagerankModule = usePageRankComputerModule()

  const {
    isLoading,
    error,
    attestationsData,
    accountData: networkData,
    totalValue,
    totalParticipants,
    averageValue,
    medianValue,
    refresh,
    isValueValidated,
  } = useNetwork()

  const [dampingFactor, setDampingFactor] = useState(0.85)
  const [trustMultiplier, setTrustMultiplier] = useState(3)
  const [trustShare, setTrustShare] = useState(1)
  const [trustDecay, setTrustDecay] = useState(0.8)

  const [computer, setComputer] = useState<PageRankGraphComputer | null>(null)
  useEffect(() => {
    if (!pagerankModule || !attestationsData) {
      return
    }

    const computer = new pagerankModule.PageRankGraphComputer(false)
    attestationsData.forEach((attestation) => {
      computer.addEdge(
        attestation.attester,
        attestation.recipient,
        Number(attestation.decodedData?.confidence || 0)
      )
    })
    setComputer(computer)

    return () => computer.free()
  }, [pagerankModule, attestationsData])

  useEffect(() => {
    if (!pagerankModule || !computer) {
      return
    }

    try {
      const scores = computer.calculatePagerank(
        new pagerankModule.PageRankConfig(
          dampingFactor,
          100,
          1e-6,
          0,
          100,
          new pagerankModule.TrustConfig(
            network.trustedSeeds,
            trustMultiplier,
            trustShare,
            trustDecay
          )
        )
      )
      const points = computer.distributePoints(scores, 10_000n)
      console.log('local points:', points)
      // Array.from(points.entries())
      //   .sort((a, b) => Number(b[1] - a[1]))
      //   .forEach(([address, points], index) => {
      //     console.log(`#${index + 1} ${address}: ${points}`)
      //   })
    } catch (error) {
      console.error('error running pagerank computation', error)
    }
  }, [
    pagerankModule,
    attestationsData,
    dampingFactor,
    trustMultiplier,
    trustShare,
    trustDecay,
  ])

  const { name, link, about, callToAction, criteria } = network

  // Define table columns
  const columns: Column<NetworkEntry>[] = [
    {
      key: 'rank',
      header: 'RANK',
      tooltip:
        "Member's position in this network ranked by Trust Score. Rank is recalculated as new attestations are made.",
      sortable: true,
      accessor: (row) => row.rank,
      render: (row) => `#${row.rank}`,
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
      key: 'validated',
      header: 'VALIDATED',
      tooltip:
        'Indicates if this member has attained a significant TrustScore in the network.',
      sortable: false,
      render: (row) =>
        isValueValidated(row.value) ? <Check className="w-4 h-4" /> : '',
    },
    {
      key: 'received',
      header: 'RECEIVED',
      tooltip:
        'The number of attestations this member has received from other participants in this network.',
      sortable: true,
      accessor: (row) => row.received || 0,
      render: (row) => formatBigNumber(row.received || 0, undefined, true),
    },
    {
      key: 'sent',
      header: 'SENT',
      tooltip:
        'The number of attestations this member has given to other participants, indicating their level of engagement in building network trust.',
      sortable: true,
      accessor: (row) => row.sent || 0,
      render: (row) => formatBigNumber(row.sent || 0, undefined, true),
    },
    {
      key: 'score',
      header: 'SCORE',
      tooltip:
        "This member's calculated Trust Score using a PageRank-style algorithm. Higher scores indicate stronger endorsement from trusted peers in the network.",
      sortable: true,
      accessor: (row) => Number(BigInt(row.value || '0')),
      render: (row) => formatBigNumber(row.value, undefined, true),
    },
  ]

  const [filterMode, setFilterMode] = useState<'all' | 'validated'>('all')

  const filteredNetworkData =
    filterMode === 'validated'
      ? networkData.filter((row) => isValueValidated(row.value))
      : networkData

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 justify-start items-stretch lg:grid-cols-2 lg:items-start gap-12">
        <div className="flex flex-col items-start gap-4">
          <BreadcrumbRenderer className="mb-2" />

          <h1 className="text-4xl font-bold">{name}</h1>

          {link && (
            <p className="text-sm flex flex-row items-center gap-2 flex-wrap">
              {link.prefix && <span>{link.prefix}</span>}
              <a
                className="inline-flex flex-row items-center gap-1.5 text-brand hover:text-brand/80 transition-colors underline"
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Link className="w-4 h-4" />
                <span>{link.label}</span>
              </a>
            </p>
          )}

          <h2 className="mt-2 -mb-3 font-bold">ABOUT NETWORK</h2>
          <Markdown>{about}</Markdown>

          {callToAction && (
            <ButtonLink
              href={callToAction.href}
              target="_blank"
              variant="brand"
              rel="noopener noreferrer"
              className="mb-2"
            >
              {callToAction.label}
            </ButtonLink>
          )}

          <h2 className="mt-2 -mb-3 font-bold">CRITERIA</h2>
          <Markdown>{criteria}</Markdown>

          <CreateAttestationModal network={network} className="mt-3" />
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
        <div className="flex flex-row justify-between items-center gap-x-8 gap-y-4 flex-wrap">
          <h2 className="font-bold">NETWORK MEMBERS</h2>

          {!isLoading && (
            <div className="flex flex-row items-stretch gap-2 flex-wrap">
              <Button
                onClick={refresh}
                variant="secondary"
                size="sm"
                className="text-xs"
                disabled={isLoading}
              >
                REFRESH
              </Button>

              <ExportButton
                size="sm"
                className="text-xs"
                data={networkData}
                filename={`TrustGraph_${name}_${new Date().toISOString()}`}
              />

              <Dropdown
                options={[
                  { value: 'validated', label: 'VALIDATED' },
                  { value: 'all', label: 'ALL MEMBERS' },
                ]}
                selected={filterMode}
                onSelect={(value) => setFilterMode(value)}
                icon={<ListFilter className="!w-4 !h-4" />}
                triggerSize="sm"
                triggerClassName="text-xs"
                optionClassName="text-xs"
              />
            </div>
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

        {/* Members Table */}
        {!isLoading &&
          networkData.length > 0 &&
          (filteredNetworkData.length > 0 ? (
            <Table
              columns={columns}
              data={filteredNetworkData}
              defaultSortDirection="asc"
              rowClassName="text-sm"
              rowCellClassName={(row) =>
                !isValueValidated(row.value) ? 'bg-accent/40' : ''
              }
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
          ) : (
            <div className="text-center py-8 border border-gray-300 bg-white rounded-sm shadow-sm">
              <div className="text-sm text-gray-600">NO MEMBERS FOUND</div>
              <div className="text-xs mt-2 text-gray-700">
                TRY ADJUSTING YOUR FILTER SETTINGS
              </div>
            </div>
          ))}

        {/* No Data Message */}
        {!isLoading && (!networkData || networkData.length === 0) && !error && (
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
