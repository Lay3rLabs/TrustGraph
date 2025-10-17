'use client'

import { usePonderQuery } from '@ponder/react'
import { useCallback } from 'react'
import { Hex } from 'viem'

import { useNetwork } from '@/hooks/useNetwork'

import { useIntoAttestationsData } from './useAttestation'

interface AccountProfileData {
  account: string
  trustScore: string
  rank: number
  attestationsReceived: number
  attestationsGiven: number
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

export function useAccountProfile(address: Hex) {
  const {
    merkleData,
    isLoading: networkLoading,
    error: networkError,
    refresh: refreshNetwork,
  } = useNetwork()

  // Find the account in the network data
  const accountNetworkData = merkleData?.find(
    (entry) => entry.account.toLowerCase() === address.toLowerCase()
  )

  // Query for attestations given by this account (as attester), excluding revoked and self-attested ones
  const attestationsGivenQuery = usePonderQuery({
    queryFn: (db) =>
      db.query.easAttestation.findMany({
        where: (t, { eq, ne, and }) =>
          and(
            eq(t.attester, address),
            // not self-attested
            ne(t.attester, t.recipient),
            // not revoked
            eq(t.revocationTime, 0n)
          ),
        orderBy: (t, { desc }) => desc(t.timestamp),
        limit: 100,
      }),
    select: useIntoAttestationsData(),
    enabled: !!address,
  })

  // Query for attestations received by this account (as recipient), excluding revoked and self-attested ones
  const attestationsReceivedQuery = usePonderQuery({
    queryFn: (db) =>
      db.query.easAttestation.findMany({
        where: (t, { eq, ne, and }) =>
          and(
            eq(t.recipient, address),
            // not self-attested
            ne(t.attester, t.recipient),
            // not revoked
            eq(t.revocationTime, 0n)
          ),
        orderBy: (t, { desc }) => desc(t.timestamp),
        limit: 100,
      }),
    select: useIntoAttestationsData(),
    enabled: !!address,
  })

  // Transform data into profile format
  const profileData: AccountProfileData | null = accountNetworkData
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
        attestationsReceived: attestationsReceivedQuery.data?.length || 0,
        attestationsGiven: attestationsGivenQuery.data?.length || 0,
        networkParticipant: false,
      }
    : null

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

    // Profile data
    profileData,

    // Attestation lists
    attestationsGiven: attestationsGivenQuery.data || [],
    attestationsReceived: attestationsReceivedQuery.data || [],

    // Individual loading states for more granular control
    isLoadingProfile: networkLoading,
    isLoadingAttestationsGiven: attestationsGivenQuery.isLoading,
    isLoadingAttestationsReceived: attestationsReceivedQuery.isLoading,

    // Actions
    refresh,
  }
}
