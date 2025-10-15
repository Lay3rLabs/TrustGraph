'use client'

import { useParams, useRouter } from 'next/navigation'
import type React from 'react'
import { useMemo } from 'react'
import { Hex } from 'viem'
import { useAccount } from 'wagmi'

import { CreateAttestationModal } from '@/components/CreateAttestationModal'
import { StatisticCard } from '@/components/StatisticCard'
import { Column, Table } from '@/components/Table'
import { Address, TableAddress } from '@/components/ui/address'
import { Button } from '@/components/ui/button'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import { useAccountProfile } from '@/hooks/useAccountProfile'
import { AttestationData } from '@/lib/attestation'
import {
  EXAMPLE_NETWORK,
  NETWORKS,
  Network,
  isTrustedSeed,
} from '@/lib/network'
import { formatBigNumber } from '@/lib/utils'

interface NetworkParticipant {
  network: Network
  rank: string
  score: string
  attestationsGiven: number
  attestationsReceived: number
}

export default function AccountProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { address: connectedAddress } = useAccount()

  const address = params.address as Hex

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

  const trustedSeed = isTrustedSeed(EXAMPLE_NETWORK, address)

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
        rank: profileData?.rank?.toString() || '...',
        score: profileData?.trustScore || '...',
        attestationsReceived: profileData?.attestationsReceived || 0,
        attestationsGiven: profileData?.attestationsGiven || 0,
      })
    ).sort((a, b) => Number(b.score) - Number(a.score))

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
      key: 'rank',
      header: 'RANK',
      tooltip: 'The rank of the account in the network.',
      sortable: true,
      accessor: (row) => row.rank,
    },
    {
      key: 'score',
      header: 'SCORE',
      tooltip: 'The score of the account in the network.',
      sortable: true,
      accessor: (row) => row.score,
    },
    {
      key: 'attestationsReceived',
      header: 'ATTESTATIONS RECEIVED',
      tooltip: 'The number of attestations received by the account.',
      sortable: true,
      accessor: (row) => row.attestationsReceived,
    },
    {
      key: 'attestationsGiven',
      header: 'ATTESTATIONS MADE',
      tooltip: 'The number of attestations made by the account.',
      sortable: true,
      accessor: (row) => row.attestationsGiven,
    },
  ]

  // Define columns for attestations given
  const attestationsGivenColumns: Column<AttestationData>[] = [
    {
      key: 'recipient',
      header: 'RECIPIENT',
      tooltip: 'The account that received the attestation.',
      sortable: false,
      render: (row) => (
        <TableAddress
          address={row.recipient}
          onClick={(addr) => router.push(`/account/${addr}`)}
        />
      ),
    },
    {
      key: 'confidence',
      header: 'CONFIDENCE',
      tooltip: 'The strength of the attestation as specified by the attester.',
      sortable: true,
      accessor: (row) => Number(row.decodedData?.confidence || '0'),
      render: (row) => (
        <div className="terminal-bright text-sm text-gray-900">
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
        <div className="terminal-text text-sm text-gray-800">
          <div>{row.formattedTime}</div>
          <div className="terminal-dim text-xs text-gray-600">
            {row.formattedTimeAgo}
          </div>
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
      render: (row) => (
        <TableAddress
          address={row.attester}
          onClick={(addr) => router.push(`/account/${addr}`)}
        />
      ),
    },
    {
      key: 'confidence',
      header: 'CONFIDENCE',
      tooltip: 'The strength of the attestation as specified by the attester.',
      sortable: true,
      accessor: (row) => Number(row.decodedData?.confidence || '0'),
      render: (row) => (
        <div className="terminal-bright text-sm text-gray-900">
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
        <div className="terminal-text text-sm text-gray-800">
          <div>{row.formattedTime}</div>
          <div className="terminal-dim text-xs text-gray-600">
            {row.formattedTimeAgo}
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-x-4 gap-y-2 mb-2">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Address
                address={address}
                className="ascii-art-title [&>span]:!text-xl [&>span]:!font-bold"
                displayMode="full"
                showCopyIcon={true}
                clickable={false}
              />
              {trustedSeed && (
                <div className="flex items-center gap-1">
                  <span title="Trusted Seed">⚡</span>
                  <InfoTooltip title="This account is a trusted seed member with enhanced network privileges." />
                </div>
              )}
            </div>
          </div>

          {connectedAddress &&
            connectedAddress.toLowerCase() === address.toLowerCase() && (
              <CreateAttestationModal />
            )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="terminal-bright text-sm text-gray-900">
            ◉ LOADING PROFILE DATA ◉
          </div>
          <div className="terminal-dim text-xs mt-2 text-gray-600">
            Fetching account information...
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

      {/* Account Info */}
      {!isLoading && profileData && (
        <>
          {/* Networks */}
          <div className="pb-6 space-y-6">
            <div className="overflow-x-auto">
              <Table
                columns={networksColumns}
                data={networksData}
                getRowKey={(row) => row.network.id}
                onRowClick={(row) => router.push(`/network/${row.network.id}`)}
                rowClickTitle="Click to view network"
              />
            </div>
          </div>

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

          {/* Network Status */}
          {!profileData.networkParticipant && (
            <div className="border border-yellow-500 bg-yellow-50 p-4 rounded-sm">
              <div className="terminal-text text-sm text-yellow-700">
                ⚠️ This account is not currently a participant in the trust
                network merkle tree.
              </div>
              <div className="terminal-dim text-xs mt-1 text-yellow-600">
                Participate in attestations to appear in network rankings.
              </div>
            </div>
          )}

          {/* Attestations Given Section */}
          <div className="border-b border-border pt-6 pb-12 space-y-6">
            <h2 className="font-bold">ATTESTATIONS MADE</h2>

            {isLoadingAttestationsGiven && (
              <div className="text-center py-8">
                <div className="terminal-bright text-sm text-gray-900">
                  ◉ LOADING ATTESTATIONS ◉
                </div>
              </div>
            )}

            {!isLoadingAttestationsGiven && attestationsGiven.length === 0 && (
              <div className="text-center py-8">
                <div className="terminal-dim text-sm text-gray-600">
                  NO ATTESTATIONS MADE
                </div>
                <div className="system-message text-xs mt-2 text-gray-700">
                  ◆ THIS ACCOUNT HAS NOT MADE ANY ATTESTATIONS YET ◆
                </div>
              </div>
            )}

            {!isLoadingAttestationsGiven && attestationsGiven.length > 0 && (
              <div className="overflow-x-auto">
                <Table
                  columns={attestationsGivenColumns}
                  data={attestationsGiven}
                  onRowClick={(row) => router.push(`/attestations/${row.uid}`)}
                  getRowKey={(row) => row.uid}
                  rowClickTitle="Click to view attestation details"
                />
              </div>
            )}
          </div>

          {/* Attestations Received Section */}
          <div className="border-b border-border pt-6 pb-12 space-y-6">
            <h2 className="font-bold">ATTESTATIONS RECEIVED</h2>

            {isLoadingAttestationsReceived && (
              <div className="text-center py-8">
                <div className="terminal-bright text-sm text-gray-900">
                  ◉ LOADING ATTESTATIONS ◉
                </div>
              </div>
            )}

            {!isLoadingAttestationsReceived &&
              attestationsReceived.length === 0 && (
                <div className="text-center py-8">
                  <div className="terminal-dim text-sm text-gray-600">
                    NO ATTESTATIONS RECEIVED
                  </div>
                  <div className="system-message text-xs mt-2 text-gray-700">
                    ◆ THIS ACCOUNT HAS NOT RECEIVED ANY ATTESTATIONS YET ◆
                  </div>
                </div>
              )}

            {!isLoadingAttestationsReceived &&
              attestationsReceived.length > 0 && (
                <div className="overflow-x-auto">
                  <Table
                    columns={attestationsReceivedColumns}
                    data={attestationsReceived}
                    onRowClick={(row) =>
                      router.push(`/attestations/${row.uid}`)
                    }
                    getRowKey={(row) => row.uid}
                    rowClickTitle="Click to view attestation details"
                  />
                </div>
              )}
          </div>

          {/* Refresh Button */}
          <div className="flex justify-center pt-4">
            <Button
              onClick={refresh}
              className="mobile-terminal-btn !px-6 !py-2"
              disabled={isLoading}
            >
              <span className="terminal-command text-xs">REFRESH PROFILE</span>
            </Button>
          </div>
        </>
      )}

      {/* No Profile Data */}
      {!isLoading && !profileData && !error && (
        <div className="text-center py-12">
          <div className="terminal-dim text-sm text-gray-600">
            INVALID ACCOUNT ADDRESS
          </div>
          <div className="system-message text-xs mt-2 text-gray-700">
            ◆ PLEASE PROVIDE A VALID ETHEREUM ADDRESS ◆
          </div>
        </div>
      )}
    </div>
  )
}
