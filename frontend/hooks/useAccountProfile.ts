'use client'

import { useQuery } from '@tanstack/react-query'
import { useCallback } from 'react'

import { useNetwork } from '@/hooks/useNetwork'
import { APIS } from '@/lib/config'

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

export function useAccountProfile(address: string) {
  const {
    MerkleData,
    isLoading: networkLoading,
    error: networkError,
    refresh: refreshNetwork,
  } = useNetwork()

  // Find the account in the network data
  const accountNetworkData = MerkleData?.find(
    (entry) => entry.account.toLowerCase() === address.toLowerCase()
  )

  // Query for attestations given by this account (as attester)
  const attestationsGivenQuery = useQuery({
    queryKey: accountProfileKeys.attestationsGiven(address, { limit: 100 }),
    queryFn: async () => {
      if (!APIS.ponder) {
        throw new Error('Ponder API URL not configured')
      }

      const searchParams = new URLSearchParams({
        limit: '100',
        reverse: 'true',
        attester: address,
      })

      const response = await fetch(
        `${APIS.ponder}/attestations?${searchParams}`
      )

      if (!response.ok) {
        throw new Error(
          `Failed to fetch attestations given: ${response.status} ${response.statusText}`
        )
      }

      const attestations = await response.json()
      return attestations.map((attestation: any) => ({
        uid: attestation.uid,
        timestamp: attestation.timestamp,
      }))
    },
    enabled: !!address && !!APIS.ponder,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  // Query for attestations received by this account (as recipient)
  const attestationsReceivedQuery = useQuery({
    queryKey: accountProfileKeys.attestationsReceived(address, { limit: 100 }),
    queryFn: async () => {
      if (!APIS.ponder) {
        throw new Error('Ponder API URL not configured')
      }

      const searchParams = new URLSearchParams({
        limit: '100',
        reverse: 'true',
        recipient: address,
      })

      const response = await fetch(
        `${APIS.ponder}/attestations?${searchParams}`
      )

      if (!response.ok) {
        throw new Error(
          `Failed to fetch attestations received: ${response.status} ${response.statusText}`
        )
      }

      const attestations = await response.json()
      return attestations.map((attestation: any) => ({
        uid: attestation.uid,
        timestamp: attestation.timestamp,
      }))
    },
    enabled: !!address && !!APIS.ponder,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
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

    // Attestation lists (UIDs only)
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
