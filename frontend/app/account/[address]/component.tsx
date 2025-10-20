'use client'

import { useSetAtom } from 'jotai'
import { useRouter } from 'next/navigation'
import type React from 'react'
import { useEffect, useMemo } from 'react'
import { Hex } from 'viem'
import { useAccount } from 'wagmi'

import { Address, TableAddress } from '@/components/Address'
import { Button } from '@/components/Button'
import { CreateAttestationModal } from '@/components/CreateAttestationModal'
import { RankRenderer } from '@/components/RankRenderer'
import { StatisticCard } from '@/components/StatisticCard'
import { Column, Table } from '@/components/Table'
import { useAccountProfile } from '@/hooks/useAccountProfile'
import { useResolveEnsName } from '@/hooks/useEns'
import { AttestationData } from '@/lib/attestation'
import {
  EXAMPLE_NETWORK,
  NETWORKS,
  Network,
  isTrustedSeed,
} from '@/lib/network'
import { formatBigNumber, mightBeEnsName } from '@/lib/utils'
import { attestationBackAtom } from '@/state/nav'

interface NetworkParticipant {
  network: Network
  rank: number
  score: string
  seed: boolean
  attestationsGiven: number
  attestationsReceived: number
}

export const AccountProfilePage = ({
  address: _address,
}: {
  address: string
}) => {
  const router = useRouter()
  const { address: connectedAddress } = useAccount()

  // Resolve ENS name if it is a valid ENS name.
  const resolvedEns = useResolveEnsName(
    mightBeEnsName(_address) ? _address : ''
  )
  const address = (resolvedEns.address || _address) as Hex

  const setAttestationBack = useSetAtom(attestationBackAtom)

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
      router.prefetch(`/attestations/${attestation.uid}`)
    })
    attestationsReceived.forEach((attestation) => {
      router.prefetch(`/attestations/${attestation.uid}`)
    })
  }, [router, attestationsGiven, attestationsReceived])

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
    },
    {
      key: 'attestationsGiven',
      header: 'SENT',
      tooltip:
        'The number of attestations this member has given to other participants, indicating their level of engagement in building network trust.',
      sortable: true,
      accessor: (row) => row.attestationsGiven,
    },
    {
      key: 'score',
      header: 'SCORE',
      tooltip:
        "This member's calculated Trust Score using a PageRank-style algorithm. Higher scores indicate stronger endorsement from trusted peers in the network.",
      sortable: true,
      accessor: (row) => row.score,
    },
  ]

  // Define columns for attestations given
  const attestationsGivenColumns: Column<AttestationData>[] = [
    {
      key: 'recipient',
      header: 'RECIPIENT',
      tooltip: 'The account that received the attestation.',
      sortable: false,
      render: (row) => <TableAddress showNavIcon address={row.recipient} />,
    },
    {
      key: 'confidence',
      header: 'CONFIDENCE',
      tooltip: 'The strength of the attestation as specified by the attester.',
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

  // Define columns for attestations received
  const attestationsReceivedColumns: Column<AttestationData>[] = [
    {
      key: 'attester',
      header: 'ATTESTER',
      tooltip: 'The account that made the attestation.',
      sortable: false,
      render: (row) => <TableAddress address={row.attester} showNavIcon />,
    },
    {
      key: 'confidence',
      header: 'CONFIDENCE',
      tooltip: 'The strength of the attestation as specified by the attester.',
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-x-4 gap-y-2 mb-2">
        <Address
          address={address}
          className="[&>span]:!text-xl [&>span]:!font-bold"
          displayMode="full"
          showCopyIcon={true}
          noHighlight
        />

        <CreateAttestationModal
          network={EXAMPLE_NETWORK}
          defaultRecipient={
            connectedAddress?.toLowerCase() === address.toLowerCase()
              ? undefined
              : _address
          }
        />
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
            <div className="py-6 overflow-x-auto">
              <Table
                columns={networksColumns}
                data={networksData}
                defaultSortColumn="rank"
                defaultSortDirection="asc"
                getRowKey={(row) => row.network.id}
                onRowClick={(row) => router.push(`/network/${row.network.id}`)}
              />
            </div>
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
          <div className="border-y border-border py-12 space-y-6">
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
                value={formatBigNumber(totalAttestationsGiven, undefined, true)}
              />
            </div>
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
                <div className="overflow-x-auto">
                  <Table
                    columns={attestationsReceivedColumns}
                    data={attestationsReceived}
                    defaultSortColumn="time"
                    defaultSortDirection="desc"
                    onRowClick={(row) => {
                      setAttestationBack(`/account/${_address}`)
                      router.push(`/attestations/${row.uid}`)
                    }}
                    getRowKey={(row) => row.uid}
                  />
                </div>
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
              <div className="overflow-x-auto">
                <Table
                  columns={attestationsGivenColumns}
                  defaultSortColumn="time"
                  defaultSortDirection="desc"
                  data={attestationsGiven}
                  onRowClick={(row) => {
                    setAttestationBack(`/account/${_address}`)
                    router.push(`/attestations/${row.uid}`)
                  }}
                  getRowKey={(row) => row.uid}
                />
              </div>
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
