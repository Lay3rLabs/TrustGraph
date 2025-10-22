'use client'

import { usePonderQuery } from '@ponder/react'
import { useCallback } from 'react'
import { Hex } from 'viem'

import { useNetwork } from '@/hooks/useNetwork'
import { areAddressesEqual } from '@/lib/utils'
import { ponderQueryFns } from '@/queries/ponder'

import { useIntoAttestationsData } from './useAttestation'

interface AccountNetworkProfile {
  account: Hex
  /** The trust score of this account in the network. */
  trustScore: string
  /** The rank of this account in the network. */
  rank: number
  /** Just the attestations received by this account from in-network participants. */
  attestationsReceived: number
  /** All attestations given by this account (if they are in-network), or 0. */
  attestationsGiven: number
  /** Whether this account is a participant in the network. */
  networkParticipant: boolean
}

// Query keys for consistent caching
export const accountProfileKeys = {
  all: ['accountProfile'] as const,
  profile: (address: string) =>
    [...accountProfileKeys.all, 'profile', address] as const,
  attestationsGiven: (
    address: string,
    options?: { limit?: number; offset?: number }
  ) =>
    [...accountProfileKeys.all, 'attestationsGiven', address, options] as const,
  attestationsReceived: (
    address: string,
    options?: { limit?: number; offset?: number }
  ) =>
    [
      ...accountProfileKeys.all,
      'attestationsReceived',
      address,
      options,
    ] as const,
}

export function useAccountNetworkProfile(address: Hex) {
  const {
    accountData: networkData,
    attestationsData: networkAttestationsData,
    isLoading: networkLoading,
    error: networkError,
    refresh: refreshNetwork,
  } = useNetwork()

  // Find the account in the network data
  const accountNetworkData = networkData?.find(
    (entry) => entry.account.toLowerCase() === address.toLowerCase()
  )

  // Query for attestations given by this account (as attester), excluding revoked and self-attested ones
  const attestationsGivenQuery = usePonderQuery({
    queryFn: ponderQueryFns.getAttestationsGiven(address),
    select: useIntoAttestationsData(),
    enabled: !!address,
  })

  // Query for attestations received by this account (as recipient), excluding revoked and self-attested ones
  const attestationsReceivedQuery = usePonderQuery({
    queryFn: ponderQueryFns.getAttestationsReceived(address),
    select: useIntoAttestationsData(),
    enabled: !!address,
  })

  // Transform data into profile format
  const networkProfile: AccountNetworkProfile | null = accountNetworkData
    ? {
        account: accountNetworkData.account,
        trustScore: accountNetworkData.value,
        rank: accountNetworkData.rank,
        attestationsReceived: accountNetworkData.received,
        attestationsGiven: accountNetworkData.sent,
        networkParticipant: true,
      }
    : address
    ? {
        account: address,
        trustScore: '0',
        rank: 0,
        attestationsReceived: 0,
        attestationsGiven: 0,
        networkParticipant: false,
      }
    : null

  const networkAttestationsGiven =
    networkAttestationsData?.filter((attestation) =>
      areAddressesEqual(attestation.attester, address)
    ) || []
  const networkAttestationsReceived =
    networkAttestationsData?.filter((attestation) =>
      areAddressesEqual(attestation.recipient, address)
    ) || []

  // Combined loading state
  const isLoading =
    networkLoading ||
    attestationsGivenQuery.isLoading ||
    attestationsReceivedQuery.isLoading

  // Combined error state
  const error =
    networkError ||
    attestationsGivenQuery.error?.message ||
    attestationsReceivedQuery.error?.message ||
    null

  // Refresh function
  const refresh = useCallback(async () => {
    await Promise.all([
      refreshNetwork(),
      attestationsGivenQuery.refetch(),
      attestationsReceivedQuery.refetch(),
    ])
  }, [
    refreshNetwork,
    attestationsGivenQuery.refetch,
    attestationsReceivedQuery.refetch,
  ])

  return {
    // Loading states
    isLoading,
    error,

    // Network data
    networkProfile,
    networkAttestationsGiven,
    networkAttestationsReceived,

    // Attestation lists (not filtered by in-network status, nor de-duplicated)
    allAttestationsGiven: attestationsGivenQuery.data || [],
    allAttestationsReceived: attestationsReceivedQuery.data || [],

    // Individual loading states for more granular control
    isLoadingProfile: networkLoading,
    isLoadingAttestationsGiven: attestationsGivenQuery.isLoading,
    isLoadingAttestationsReceived: attestationsReceivedQuery.isLoading,

    // Actions
    refresh,
  }
}
