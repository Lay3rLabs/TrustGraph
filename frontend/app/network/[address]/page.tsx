'use client'

import { useParams, useRouter } from 'next/navigation'
import type React from 'react'
import { useMemo, useState } from 'react'
import { useAccount, useConnect } from 'wagmi'
import { injected } from 'wagmi/connectors'

import { CreateAttestationModal } from '@/components/CreateAttestationModal'
import { Address, TableAddress } from '@/components/ui/address'
import { Button } from '@/components/ui/button'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import { useAccountProfile } from '@/hooks/useAccountProfile'
import { TRUSTED_SEEDS } from '@/lib/config'
import { AttestationData, SchemaManager } from '@/lib/schemas'
import { formatTimeAgo } from '@/lib/utils'

type AttestationSortColumn = 'time' | 'confidence'
type SortDirection = 'asc' | 'desc'

// Extended attestation data for table display
interface AttestationTableData extends AttestationData {
  confidence?: string
  schemaName: string
  formattedTime: string
  timeAgo: string
}

export default function AccountProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { isConnected, address: connectedAddress } = useAccount()
  const { connect } = useConnect()

  const address = params.address as string

  // Sorting state for attestations given
  const [givenSortColumn, setGivenSortColumn] =
    useState<AttestationSortColumn>('time')
  const [givenSortDirection, setGivenSortDirection] =
    useState<SortDirection>('desc')

  // Sorting state for attestations received
  const [receivedSortColumn, setReceivedSortColumn] =
    useState<AttestationSortColumn>('time')
  const [receivedSortDirection, setReceivedSortDirection] =
    useState<SortDirection>('desc')

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

  const formatTimestamp = (timestamp: number) => {
    if (!timestamp || isNaN(timestamp) || timestamp < 0) {
      return 'Invalid timestamp'
    }

    const date = new Date(timestamp * 1000)
    if (isNaN(date.getTime())) {
      return 'Invalid date'
    }

    return date.toISOString().replace('T', ' ').split('.')[0]
  }

  const processAttestationData = (
    attestations: any[]
  ): AttestationTableData[] => {
    return attestations.map((attestation) => {
      const schemaName =
        SchemaManager.maybeSchemaForUid(attestation.schema)?.name || 'Unknown'
      const confidence = attestation.decodedData?.confidence || '0'

      return {
        ...attestation,
        confidence,
        schemaName,
        formattedTime: formatTimestamp(Number(attestation.time)),
        timeAgo: formatTimeAgo(Number(attestation.time) * 1000),
      }
    })
  }

  // Handle sorting for given attestations
  const handleGivenSort = (column: AttestationSortColumn) => {
    if (givenSortColumn === column) {
      setGivenSortDirection(givenSortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setGivenSortColumn(column)
      setGivenSortDirection('desc')
    }
  }

  // Handle sorting for received attestations
  const handleReceivedSort = (column: AttestationSortColumn) => {
    if (receivedSortColumn === column) {
      setReceivedSortDirection(receivedSortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setReceivedSortColumn(column)
      setReceivedSortDirection('desc')
    }
  }

  // Sort attestations given
  const sortedAttestationsGiven = useMemo(() => {
    const processedData = processAttestationData(attestationsGiven)

    return [...processedData].sort((a, b) => {
      let aValue: number, bValue: number

      switch (givenSortColumn) {
        case 'time':
          aValue = Number(a.time)
          bValue = Number(b.time)
          break
        case 'confidence':
          aValue = Number(a.confidence || '0')
          bValue = Number(b.confidence || '0')
          break
        default:
          return 0
      }

      return givenSortDirection === 'asc' ? aValue - bValue : bValue - aValue
    })
  }, [attestationsGiven, givenSortColumn, givenSortDirection])

  // Sort attestations received
  const sortedAttestationsReceived = useMemo(() => {
    const processedData = processAttestationData(attestationsReceived)

    return [...processedData].sort((a, b) => {
      let aValue: number, bValue: number

      switch (receivedSortColumn) {
        case 'time':
          aValue = Number(a.time)
          bValue = Number(b.time)
          break
        case 'confidence':
          aValue = Number(a.confidence || '0')
          bValue = Number(b.confidence || '0')
          break
        default:
          return 0
      }

      return receivedSortDirection === 'asc' ? aValue - bValue : bValue - aValue
    })
  }, [attestationsReceived, receivedSortColumn, receivedSortDirection])

  // Helper function to render sort indicator
  const getSortIndicator = (
    column: AttestationSortColumn,
    currentColumn: AttestationSortColumn,
    direction: SortDirection
  ) => {
    if (currentColumn !== column) {
      return <span className="text-gray-400 ml-1">↕</span>
    }
    return direction === 'asc' ? (
      <span className="text-gray-900 ml-1">↑</span>
    ) : (
      <span className="text-gray-900 ml-1">↓</span>
    )
  }

  const isTrustedSeed = TRUSTED_SEEDS.includes(address)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-700 pb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Address
                address={address}
                className="ascii-art-title [&>span]:!text-xl [&>span]:!font-bold"
                displayMode="full"
                showCopyIcon={true}
                clickable={false}
              />
              {isTrustedSeed && (
                <div className="flex items-center gap-1">
                  <span title="Trusted Seed">⚡</span>
                  <InfoTooltip content="This account is a trusted seed member with enhanced network privileges." />
                </div>
              )}
            </div>
            <div
              className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer transition-colors"
              onClick={() => router.push('/network')}
            >
              ← Back to Network
            </div>
          </div>
          {connectedAddress &&
            connectedAddress.toLowerCase() === address.toLowerCase() && (
              <CreateAttestationModal />
            )}
        </div>
      </div>

      {/* Wallet Connection */}
      {!isConnected && (
        <div className="border border-gray-300 bg-white p-6 rounded-sm text-center space-y-4 shadow-sm">
          <div className="terminal-text text-lg text-gray-900">
            WALLET CONNECTION REQUIRED
          </div>
          <div className="terminal-dim text-sm text-gray-600">
            Connect your wallet to view profile details
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
              {/* Profile Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="border border-gray-300 bg-white p-4 rounded-sm shadow-sm">
                  <div className="space-y-2">
                    <div className="terminal-dim text-xs text-gray-600 flex items-center gap-1">
                      TRUST SCORE
                      <InfoTooltip content="The account's reputation score in the trust network." />
                    </div>
                    <div className="terminal-bright text-2xl text-gray-900">
                      {formatAmount(profileData.trustScore)}
                    </div>
                  </div>
                </div>

                <div className="border border-gray-300 bg-white p-4 rounded-sm shadow-sm">
                  <div className="space-y-2">
                    <div className="terminal-dim text-xs text-gray-600 flex items-center gap-1">
                      NETWORK RANK
                      <InfoTooltip content="The account's ranking in the trust network by reputation." />
                    </div>
                    <div className="terminal-bright text-2xl text-gray-900">
                      {profileData.networkParticipant
                        ? `#${profileData.rank}`
                        : 'N/A'}
                    </div>
                  </div>
                </div>

                <div className="border border-gray-300 bg-white p-4 rounded-sm shadow-sm">
                  <div className="space-y-2">
                    <div className="terminal-dim text-xs text-gray-600 flex items-center gap-1">
                      ATTESTATIONS RECEIVED
                      <InfoTooltip content="Number of attestations this account has received from others." />
                    </div>
                    <div className="terminal-bright text-2xl text-gray-900">
                      {profileData.attestationsReceived}
                    </div>
                  </div>
                </div>

                <div className="border border-gray-300 bg-white p-4 rounded-sm shadow-sm">
                  <div className="space-y-2">
                    <div className="terminal-dim text-xs text-gray-600 flex items-center gap-1">
                      ATTESTATIONS GIVEN
                      <InfoTooltip content="Number of attestations this account has made to others." />
                    </div>
                    <div className="terminal-bright text-2xl text-gray-900">
                      {profileData.attestationsGiven}
                    </div>
                  </div>
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
              <div className="space-y-4">
                <div className="border border-gray-300 bg-white rounded-sm shadow-sm">
                  <div className="border-b border-gray-300 p-4">
                    <div className="ascii-art-title text-lg mb-1 text-gray-900">
                      ATTESTATIONS GIVEN
                    </div>
                    <div className="terminal-dim text-sm text-gray-600">
                      ◢◤ Attestations made by this account ◢◤
                    </div>
                  </div>

                  {isLoadingAttestationsGiven && (
                    <div className="text-center py-8">
                      <div className="terminal-bright text-sm text-gray-900">
                        ◉ LOADING ATTESTATIONS ◉
                      </div>
                    </div>
                  )}

                  {!isLoadingAttestationsGiven &&
                    sortedAttestationsGiven.length === 0 && (
                      <div className="text-center py-8">
                        <div className="terminal-dim text-sm text-gray-600">
                          NO ATTESTATIONS GIVEN
                        </div>
                        <div className="system-message text-xs mt-2 text-gray-700">
                          ◆ THIS ACCOUNT HAS NOT MADE ANY ATTESTATIONS YET ◆
                        </div>
                      </div>
                    )}

                  {!isLoadingAttestationsGiven &&
                    sortedAttestationsGiven.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-300">
                              <th className="text-left p-4 terminal-dim text-xs text-gray-600">
                                RECIPIENT
                              </th>
                              <th
                                className="text-left p-4 terminal-dim text-xs text-gray-600 cursor-pointer hover:text-gray-900 transition-colors select-none"
                                onClick={() => handleGivenSort('confidence')}
                              >
                                <div className="flex items-center gap-1">
                                  CONFIDENCE
                                  <InfoTooltip content="The strength of the attestation as specified by the attester." />
                                  {getSortIndicator(
                                    'confidence',
                                    givenSortColumn,
                                    givenSortDirection
                                  )}
                                </div>
                              </th>
                              <th
                                className="text-left p-4 terminal-dim text-xs text-gray-600 cursor-pointer hover:text-gray-900 transition-colors select-none"
                                onClick={() => handleGivenSort('time')}
                              >
                                <div className="flex items-center">
                                  TIME
                                  {getSortIndicator(
                                    'time',
                                    givenSortColumn,
                                    givenSortDirection
                                  )}
                                </div>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {sortedAttestationsGiven.map((attestation) => (
                              <tr
                                key={attestation.uid}
                                className="border-b border-gray-200 cursor-pointer transition-colors hover:bg-gray-50"
                                onClick={() =>
                                  router.push(
                                    `/attestations/${attestation.uid}`
                                  )
                                }
                                title="Click to view attestation details"
                              >
                                <td className="p-4">
                                  <TableAddress
                                    address={attestation.recipient}
                                    onClick={(addr) =>
                                      router.push(`/network/${addr}`)
                                    }
                                  />
                                </td>
                                <td className="p-4">
                                  <div className="terminal-bright text-sm text-gray-900">
                                    {formatAmount(
                                      attestation.confidence || '0'
                                    )}
                                  </div>
                                </td>
                                <td className="p-4">
                                  <div className="terminal-text text-sm text-gray-800">
                                    <div>{attestation.formattedTime}</div>
                                    <div className="terminal-dim text-xs text-gray-600">
                                      {attestation.timeAgo}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                </div>
              </div>

              {/* Attestations Received Section */}
              <div className="space-y-4">
                <div className="border border-gray-300 bg-white rounded-sm shadow-sm">
                  <div className="border-b border-gray-300 p-4">
                    <div className="ascii-art-title text-lg mb-1 text-gray-900">
                      ATTESTATIONS RECEIVED
                    </div>
                    <div className="terminal-dim text-sm text-gray-600">
                      ◢◤ Attestations received by this account ◢◤
                    </div>
                  </div>

                  {isLoadingAttestationsReceived && (
                    <div className="text-center py-8">
                      <div className="terminal-bright text-sm text-gray-900">
                        ◉ LOADING ATTESTATIONS ◉
                      </div>
                    </div>
                  )}

                  {!isLoadingAttestationsReceived &&
                    sortedAttestationsReceived.length === 0 && (
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
                    sortedAttestationsReceived.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-300">
                              <th className="text-left p-4 terminal-dim text-xs text-gray-600">
                                ATTESTER
                              </th>
                              <th
                                className="text-left p-4 terminal-dim text-xs text-gray-600 cursor-pointer hover:text-gray-900 transition-colors select-none"
                                onClick={() => handleReceivedSort('confidence')}
                              >
                                <div className="flex items-center gap-1">
                                  CONFIDENCE
                                  <InfoTooltip content="The strength of the attestation as specified by the attester." />
                                  {getSortIndicator(
                                    'confidence',
                                    receivedSortColumn,
                                    receivedSortDirection
                                  )}
                                </div>
                              </th>
                              <th
                                className="text-left p-4 terminal-dim text-xs text-gray-600 cursor-pointer hover:text-gray-900 transition-colors select-none"
                                onClick={() => handleReceivedSort('time')}
                              >
                                <div className="flex items-center">
                                  TIME
                                  {getSortIndicator(
                                    'time',
                                    receivedSortColumn,
                                    receivedSortDirection
                                  )}
                                </div>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {sortedAttestationsReceived.map((attestation) => (
                              <tr
                                key={attestation.uid}
                                className="border-b border-gray-200 cursor-pointer transition-colors hover:bg-gray-50"
                                onClick={() =>
                                  router.push(
                                    `/attestations/${attestation.uid}`
                                  )
                                }
                                title="Click to view attestation details"
                              >
                                <td className="p-4">
                                  <TableAddress
                                    address={attestation.attester}
                                    onClick={(addr) =>
                                      router.push(`/network/${addr}`)
                                    }
                                  />
                                </td>
                                <td className="p-4">
                                  <div className="terminal-bright text-sm text-gray-900">
                                    {formatAmount(
                                      attestation.confidence || '0'
                                    )}
                                  </div>
                                </td>
                                <td className="p-4">
                                  <div className="terminal-text text-sm text-gray-800">
                                    <div>{attestation.formattedTime}</div>
                                    <div className="terminal-dim text-xs text-gray-600">
                                      {attestation.timeAgo}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                </div>
              </div>

              {/* Refresh Button */}
              <div className="flex justify-center pt-4">
                <Button
                  onClick={refresh}
                  className="mobile-terminal-btn !px-6 !py-2"
                  disabled={isLoading}
                >
                  <span className="terminal-command text-xs">
                    REFRESH PROFILE
                  </span>
                </Button>
              </div>
            </>
          )}

          {/* No Profile Data */}
          {!isLoading && !profileData && !error && (
            <div className="text-center py-12 border border-gray-300 bg-white rounded-sm shadow-sm">
              <div className="terminal-dim text-sm text-gray-600">
                INVALID ACCOUNT ADDRESS
              </div>
              <div className="system-message text-xs mt-2 text-gray-700">
                ◆ PLEASE PROVIDE A VALID ETHEREUM ADDRESS ◆
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
