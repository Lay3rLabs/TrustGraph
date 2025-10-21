'use client'

import { useQueries } from '@tanstack/react-query'
import { FileText } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import type React from 'react'
import { Suspense, useEffect, useMemo } from 'react'
import { Hex } from 'viem'
import { useAccount } from 'wagmi'

import { Address, TableAddress } from '@/components/Address'
import { BreadcrumbRenderer } from '@/components/BreadcrumbRenderer'
import { Button, ButtonLink } from '@/components/Button'
import { CreateAttestationModal } from '@/components/CreateAttestationModal'
import { RankRenderer } from '@/components/RankRenderer'
import { StatisticCard } from '@/components/StatisticCard'
import { Column, Table } from '@/components/Table'
import { Tooltip } from '@/components/Tooltip'
import { useAccountProfile } from '@/hooks/useAccountProfile'
import { usePushBreadcrumb } from '@/hooks/usePushBreadcrumb'
import { AttestationData } from '@/lib/attestation'
import { LOCALISM_FUND, NETWORKS, Network, isTrustedSeed } from '@/lib/network'
import { cn, formatBigNumber } from '@/lib/utils'
import { ponderQueries } from '@/queries/ponder'

interface NetworkParticipant {
  network: Network
  rank: number
  score: string
  seed: boolean
  attestationsGiven: number
  attestationsReceived: number
}

// Uses web2gl, which is not supported on the server
const NetworkGraph = dynamic(
  () => import('@/components/NetworkGraph').then((mod) => mod.NetworkGraph),
  {
    ssr: false,
  }
)

export const AccountProfilePage = ({
  address,
  ensName,
}: {
  address: Hex
  ensName: string | null
}) => {
  const router = useRouter()

  const { address: connectedAddress } = useAccount()
  const pushBreadcrumb = usePushBreadcrumb({
    route: `/account/${ensName || address}`,
    title: ensName || undefined,
  })

  const {
    isLoading,
    error,
    profileData,
    attestationsGiven,
    attestationsReceived,
    isLoadingAttestationsGiven,
    isLoadingAttestationsReceived,
    refresh,
  } = useAccountProfile(address)

  useEffect(() => {
    NETWORKS.forEach((network) => {
      router.prefetch(`/network/${network.id}`)
    })
    attestationsGiven.forEach((attestation) => {
      router.prefetch(`/attestation/${attestation.uid}`)
    })
    attestationsReceived.forEach((attestation) => {
      router.prefetch(`/attestation/${attestation.uid}`)
    })
  }, [router, attestationsGiven, attestationsReceived])

  // Query for Localism Fund application URL via address and ENS name (if available), since the user may have used either one on the application.
  const localismFundApplicationUrl = useQueries({
    queries: [
      ponderQueries.localismFundApplicationUrl(address),
      ...(ensName ? [ponderQueries.localismFundApplicationUrl(ensName)] : []),
    ],
    // Get first valid URL.
    combine: (results) => results.find((r) => !!r.data)?.data || undefined,
  })

  const {
    networksData,
    maxScore,
    averageScore,
    medianScore,
    totalAttestationsReceived,
    totalAttestationsGiven,
  } = useMemo(() => {
    const networksData = NETWORKS.map(
      (network): NetworkParticipant => ({
        network,
        rank: profileData?.rank || 0,
        score: profileData?.trustScore || '...',
        seed: isTrustedSeed(network, address),
        attestationsReceived: profileData?.attestationsReceived || 0,
        attestationsGiven: profileData?.attestationsGiven || 0,
      })
    )
      .filter((network) => network.score !== '0')
      .sort((a, b) => Number(b.score) - Number(a.score))

    const maxScore = networksData.reduce(
      (max, network) => Math.max(max, Number(network.score)),
      0
    )
    const averageScore =
      networksData.length > 0
        ? networksData.reduce(
            (sum, network) => sum + Number(network.score),
            0
          ) / networksData.length
        : 0
    const medianScore =
      networksData.length > 1
        ? Number(networksData[Math.ceil(networksData.length / 2)].score)
        : Number(networksData[0]?.score || '0')

    const totalAttestationsReceived = networksData.reduce(
      (sum, network) => sum + network.attestationsReceived,
      0
    )
    const totalAttestationsGiven = networksData.reduce(
      (sum, network) => sum + network.attestationsGiven,
      0
    )

    return {
      networksData,
      maxScore,
      averageScore,
      medianScore,
      totalAttestationsReceived,
      totalAttestationsGiven,
    }
  }, [profileData])

  const networksColumns: Column<NetworkParticipant>[] = [
    {
      key: 'name',
      header: 'NETWORK',
      tooltip: 'The name of the network.',
      sortable: false,
      accessor: (row) => row.network.name,
    },
    {
      key: 'seed',
      header: 'SEED',
      tooltip:
        'Indicates if this account is part of the initial seed group that bootstrapped this network. Seed member influence is designed to diminish as the network grows.',
      sortable: false,
      render: (row) => (row.seed ? '🌱' : ''),
    },
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
      key: 'attestationsReceived',
      header: 'RECEIVED',
      tooltip:
        'The number of attestations this member has received from other participants in this network.',
      sortable: true,
      accessor: (row) => row.attestationsReceived,
      render: (row) =>
        formatBigNumber(row.attestationsReceived, undefined, true),
    },
    {
      key: 'attestationsGiven',
      header: 'SENT',
      tooltip:
        'The number of attestations this member has given to other participants, indicating their level of engagement in building network trust.',
      sortable: true,
      accessor: (row) => row.attestationsGiven,
      render: (row) => formatBigNumber(row.attestationsGiven, undefined, true),
    },
    {
      key: 'score',
      header: 'SCORE',
      tooltip:
        "This member's calculated Trust Score using a PageRank-style algorithm. Higher scores indicate stronger endorsement from trusted peers in the network.",
      sortable: true,
      accessor: (row) => row.score,
      render: (row) => formatBigNumber(row.score, undefined, true),
    },
  ]

  // Define columns for attestations received
  const attestationsReceivedColumns: Column<AttestationData>[] = [
    {
      key: 'attester',
      header: 'ATTESTER',
      tooltip: 'The account that made the attestation.',
      cellClassName: 'w-1/2 lg:w-2/5',
      sortable: false,
      render: (row) => <TableAddress address={row.attester} showNavIcon />,
    },
    {
      key: 'confidence',
      header: 'CONFIDENCE',
      tooltip: 'The strength of the attestation as specified by the attester.',
      cellClassName: 'w-1/5 lg:w-3/10',
      sortable: true,
      accessor: (row) => Number(row.decodedData?.confidence || '0'),
      render: (row) => (
        <div className="text-sm text-gray-900">
          {formatBigNumber(row.decodedData?.confidence || '0', undefined, true)}
        </div>
      ),
    },
    {
      key: 'time',
      header: 'TIME',
      tooltip: 'The time the attestation was made.',
      cellClassName: 'w-3/10',
      sortable: true,
      accessor: (row) => Number(row.time),
      render: (row) => (
        <div className="text-sm text-gray-800">
          <div>{row.formattedTime}</div>
          <div className="text-xs text-gray-600">{row.formattedTimeAgo}</div>
        </div>
      ),
    },
  ]

  // Define columns for attestations given
  const attestationsGivenColumns: Column<AttestationData>[] = [
    {
      key: 'recipient',
      header: 'RECIPIENT',
      tooltip: 'The account that received the attestation.',
      sortable: false,
      cellClassName: 'w-1/2 lg:w-2/5',
      render: (row) => <TableAddress showNavIcon address={row.recipient} />,
    },
    {
      key: 'confidence',
      header: 'CONFIDENCE',
      tooltip: 'The strength of the attestation as specified by the attester.',
      cellClassName: 'w-1/5 lg:w-3/10',
      sortable: true,
      accessor: (row) => Number(row.decodedData?.confidence || '0'),
      render: (row) =>
        formatBigNumber(row.decodedData?.confidence || '0', undefined, true),
    },
    {
      key: 'time',
      header: 'TIME',
      tooltip: 'The time the attestation was made.',
      cellClassName: 'w-3/10',
      sortable: true,
      accessor: (row) => Number(row.time),
      render: (row) => (
        <div className="text-gray-800">
          <div>{row.formattedTime}</div>
          <div className="text-xs text-gray-600">{row.formattedTimeAgo}</div>
        </div>
      ),
    },
  ]

  const hasAttestations =
    totalAttestationsReceived > 0 || totalAttestationsGiven > 0

  return (
    <div className="space-y-6">
      <BreadcrumbRenderer />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-x-4 gap-y-2 mb-2">
        <Address
          address={address}
          textClassName="text-xl text-primary font-bold"
          displayMode="full"
          showCopyIcon={true}
          noHighlight
        />

        <div className="flex flex-row gap-2">
          {!!localismFundApplicationUrl && (
            <Tooltip title="Open Application in Notion">
              <ButtonLink
                href={localismFundApplicationUrl}
                target="_blank"
                rel="noopener noreferrer"
                size="icon"
                variant="brand"
              >
                <FileText className="!w-4.5 !h-4.5" />
              </ButtonLink>
            </Tooltip>
          )}

          <CreateAttestationModal
            network={LOCALISM_FUND}
            defaultRecipient={
              connectedAddress?.toLowerCase() === address.toLowerCase()
                ? undefined
                : address
            }
            // variant={localismFundApplicationUrl ? 'outline' : 'default'}
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="text-sm text-gray-900">◉ LOADING PROFILE DATA ◉</div>
          <div className="text-xs mt-2 text-gray-600">
            Fetching account information...
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

      {/* Account Info */}
      {!isLoading && profileData && (
        <>
          {/* Network Status */}
          {networksData.length > 0 ? (
            <Table
              className="py-6"
              cellClassName="text-sm"
              columns={networksColumns}
              data={networksData}
              defaultSortColumn="rank"
              defaultSortDirection="asc"
              getRowKey={(row) => row.network.id}
              onRowClick={(row) => {
                pushBreadcrumb()
                router.push(`/network/${row.network.id}`)
              }}
            />
          ) : (
            <div className="my-6 border border-yellow-500 bg-yellow-50 p-4 rounded-md">
              <div className="text-sm text-yellow-700">
                ⚠️ This account is not currently a participant in any
                TrustNetworks.
              </div>
              <div className="text-xs mt-1 text-yellow-600">
                Participate in attestations to appear in Network rankings.
              </div>
            </div>
          )}

          {/* Statistics */}
          <div
            className={cn(
              'grid grid-cols-1 justify-start items-stretch gap-6 border-y border-border py-12',
              hasAttestations && 'lg:grid-cols-2 lg:items-start'
            )}
          >
            <div className="space-y-6">
              <h2 className="font-bold">STATISTICS</h2>
              <div className="flex flex-row gap-4 flex-wrap">
                <StatisticCard
                  title="NETWORKS"
                  tooltip="The number of networks this account is participating in."
                  value={formatBigNumber(networksData.length, undefined, true)}
                />
                <StatisticCard
                  title="HIGHEST SCORE"
                  tooltip="The account's highest Trust Score based on reputation in all their networks."
                  value={formatBigNumber(maxScore, undefined, true)}
                />
                {networksData.length > 1 && (
                  <StatisticCard
                    title="AVERAGE + MEDIAN TRUST SCORE"
                    tooltip="This account's typical Trust Scores in all their networks."
                    value={
                      averageScore === medianScore
                        ? formatBigNumber(averageScore, undefined, true)
                        : `${formatBigNumber(
                            Math.round(averageScore),
                            undefined,
                            true
                          )} / ${formatBigNumber(medianScore, undefined, true)}`
                    }
                  />
                )}
                <StatisticCard
                  title="ATTESTATIONS RECEIVED"
                  tooltip="Total number of attestations this account has received from others."
                  value={formatBigNumber(
                    totalAttestationsReceived,
                    undefined,
                    true
                  )}
                />
                <StatisticCard
                  title="ATTESTATIONS MADE"
                  tooltip="Total number of attestations this account has made to others."
                  value={formatBigNumber(
                    totalAttestationsGiven,
                    undefined,
                    true
                  )}
                />
              </div>
            </div>

            {hasAttestations && (
              <div className="h-[66vh] lg:h-full">
                <Suspense fallback={null}>
                  <NetworkGraph network={LOCALISM_FUND} onlyAddress={address} />
                </Suspense>
              </div>
            )}
          </div>

          {/* Attestations Received Section */}
          <div className="border-b border-border pt-6 pb-12 space-y-6">
            <h2 className="font-bold">
              {!isLoadingAttestationsReceived &&
              attestationsReceived.length === 0
                ? 'NO ATTESTATIONS RECEIVED'
                : 'ATTESTATIONS RECEIVED'}
            </h2>

            {isLoadingAttestationsReceived && (
              <div className="text-center py-8">
                <div className="text-sm text-gray-900">
                  LOADING ATTESTATIONS
                </div>
              </div>
            )}

            {!isLoadingAttestationsReceived &&
              attestationsReceived.length > 0 && (
                <Table
                  columns={attestationsReceivedColumns}
                  data={attestationsReceived}
                  cellClassName="text-sm"
                  defaultSortColumn="time"
                  defaultSortDirection="desc"
                  onRowClick={(row) => {
                    pushBreadcrumb()
                    router.push(`/attestation/${row.uid}`)
                  }}
                  getRowKey={(row) => row.uid}
                />
              )}
          </div>

          {/* Attestations Given Section */}
          <div className="border-b border-border pt-6 pb-12 space-y-6">
            <h2 className="font-bold">
              {!isLoadingAttestationsGiven && attestationsGiven.length === 0
                ? 'NO ATTESTATIONS MADE'
                : 'ATTESTATIONS MADE'}
            </h2>

            {isLoadingAttestationsGiven && (
              <div className="text-center py-8">
                <div className="text-sm text-gray-900">
                  LOADING ATTESTATIONS
                </div>
              </div>
            )}

            {!isLoadingAttestationsGiven && attestationsGiven.length > 0 && (
              <Table
                columns={attestationsGivenColumns}
                defaultSortColumn="time"
                cellClassName="text-sm"
                defaultSortDirection="desc"
                data={attestationsGiven}
                onRowClick={(row) => {
                  pushBreadcrumb()
                  router.push(`/attestation/${row.uid}`)
                }}
                getRowKey={(row) => row.uid}
              />
            )}
          </div>
        </>
      )}

      {/* No Profile Data */}
      {!isLoading && !profileData && !error && (
        <div className="text-center py-12">
          <div className="text-sm text-gray-600">INVALID ACCOUNT ADDRESS</div>
          <div className="text-xs mt-2 text-gray-700">
            ◆ PLEASE PROVIDE A VALID ETHEREUM ADDRESS ◆
          </div>
        </div>
      )}
    </div>
  )
}
