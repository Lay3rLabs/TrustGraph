'use client'

import { useQuery } from '@tanstack/react-query'
import { readContract } from '@wagmi/core'

import { easConfig, wavsIndexerConfig } from '@/lib/contracts'
import { decodeAttestationData, schemas } from '@/lib/schemas'
import { config } from '@/lib/wagmi'

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
  return useQuery({
    queryKey: attestationKeys.schemaCount(schemaUID),
    queryFn: async () =>
      Number(
        await readContract(config, {
          ...wavsIndexerConfig,
          functionName: 'getEventCountByTypeAndTag',
          args: ['attestation', `schema:${schemaUID}`],
        })
      ),
    enabled: !!schemaUID,
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
  return useQuery({
    queryKey: attestationKeys.schemaUIDs(schemaUID, limit),
    queryFn: async () => {
      // Refetch the contract data when React Query refetches
      const result = await readContract(config, {
        ...wavsIndexerConfig,
        functionName: 'getEventsByTypeAndTag',
        args: [
          'attestation',
          `schema:${schemaUID}`,
          BigInt(0),
          BigInt(limit),
          false,
        ],
      })
      return result.flatMap((indexedEvent) => {
        const uid = indexedEvent.tags
          .find((tag) => tag.startsWith('uid:'))
          ?.split(':')[1] as `0x${string}`

        if (!uid) {
          return []
        }

        return {
          uid,
          timestamp: Number(indexedEvent.timestamp),
        }
      })
    },
    enabled: !!schemaUID && !!totalCount && totalCount > 0,
    staleTime: 30 * 1000, // UIDs change more frequently
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
  })
}

// Hook to get individual attestation data with React Query
export function useIndividualAttestation(uid: `0x${string}`) {
  return useQuery({
    queryKey: attestationKeys.attestation(uid),
    queryFn: async () => {
      const attestation = await readContract(config, {
        ...easConfig,
        functionName: 'getAttestation',
        args: [uid],
      })

      let decodedData
      try {
        decodedData = decodeAttestationData(attestation)
      } catch (error) {
        decodedData = {}
      }

      return {
        ...attestation,
        decodedData,
      }
    },
    enabled: !!uid,
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
