'use client'

import { useQuery } from '@tanstack/react-query'
import { useReadContract } from 'wagmi'

import { easConfig, wavsIndexerConfig } from '@/lib/contracts'
import { schemas } from '@/lib/schemas'

export interface AttestationData {
  uid: string
  attester: string
  recipient: string
  time: bigint
  expirationTime: bigint
  revocationTime: bigint
  refUID: string
  data: string
  schema: string
}

// Query keys for consistent caching
export const attestationKeys = {
  all: ['attestations'] as const,
  schemas: () => [...attestationKeys.all, 'schemas'] as const,
  schema: (schemaUID: `0x${string}`) =>
    [...attestationKeys.schemas(), schemaUID] as const,
  schemaCount: (schemaUID: `0x${string}`) =>
    [...attestationKeys.schema(schemaUID), 'count'] as const,
  schemaUIDs: (schemaUID: `0x${string}`, limit: number) =>
    [...attestationKeys.schema(schemaUID), 'uids', limit] as const,
  attestation: (uid: string) =>
    [...attestationKeys.all, 'attestation', uid] as const,
}

// Hook to get schema attestation count with React Query
function useSchemaAttestationCount(schemaUID: `0x${string}`) {
  const {
    data: rawCount,
    error,
    isLoading,
  } = useReadContract({
    ...wavsIndexerConfig,
    functionName: 'getEventCountByTypeAndTag',
    args: ['attestation', `schema:${schemaUID}`],
    query: {
      enabled: !!schemaUID,
    },
  })

  return useQuery({
    queryKey: attestationKeys.schemaCount(schemaUID),
    queryFn: () => (rawCount ? Number(rawCount) : 0),
    enabled: !!rawCount && !error && !isLoading,
    staleTime: 60 * 1000, // Count changes less frequently
    gcTime: 10 * 60 * 1000, // Cache for 10 minutes
  })
}

// Hook to get schema attestation UIDs with React Query
function useSchemaAttestationUIDs(
  schemaUID: `0x${string}`,
  limit = 10,
  totalCount?: number
) {
  const {
    data: indexedAttestations,
    error,
    isLoading,
  } = useReadContract({
    ...wavsIndexerConfig,
    functionName: 'getEventsByTypeAndTag',
    args: [
      'attestation',
      `schema:${schemaUID}`,
      BigInt(0), // start
      BigInt(limit), // length
      false, // reverseOrder - newest first
    ],
    query: {
      enabled: !!schemaUID && !!totalCount && totalCount > 0,
    },
  })

  return useQuery({
    queryKey: attestationKeys.schemaUIDs(schemaUID, limit),
    queryFn: () =>
      indexedAttestations?.flatMap(
        (attestation) =>
          (attestation.tags
            .find((tag) => tag.startsWith('uid:'))
            ?.split(':')[1] as `0x${string}`) || []
      ) || [],
    enabled: !!indexedAttestations && !error && !isLoading,
    staleTime: 30 * 1000, // UIDs change more frequently
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
  })
}

// Hook to get individual attestation data with React Query
export function useIndividualAttestation(uid: `0x${string}`) {
  const {
    data: rawData,
    error,
    isLoading,
  } = useReadContract({
    ...easConfig,
    functionName: 'getAttestation',
    args: uid ? [uid] : undefined,
    query: {
      enabled: !!uid,
    },
  })

  return useQuery({
    queryKey: attestationKeys.attestation(uid),
    queryFn: () => rawData as AttestationData,
    enabled: !!rawData && !error && !isLoading,
    staleTime: 2 * 60 * 1000, // Individual attestations are relatively static once created
    gcTime: 10 * 60 * 1000, // Cache longer since they don't change often
  })
}

// Convenience hook that combines count and UIDs fetching
export function useSchemaAttestations(schemaUID: `0x${string}`, limit = 10) {
  const {
    data: totalCount = 0,
    isLoading: isLoadingCount,
    error: countError,
  } = useSchemaAttestationCount(schemaUID)

  const {
    data: attestationUIDs = [],
    isLoading: isLoadingUIDs,
    error: uidsError,
  } = useSchemaAttestationUIDs(schemaUID, limit, totalCount)

  return {
    totalCount,
    attestationUIDs,
    isLoadingUIDs: isLoadingCount || isLoadingUIDs,
    countError,
    uidsError,
  }
}

// Vouching-specific hook
export function useVouchingAttestations(limit = 10) {
  return useSchemaAttestationUIDs(schemas.vouching, limit)
}
