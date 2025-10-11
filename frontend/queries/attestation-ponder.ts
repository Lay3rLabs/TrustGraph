'use client'

import { queryOptions } from '@tanstack/react-query'
import { Hex } from 'viem'

import { APIS } from '@/lib/config'
import { SchemaManager } from '@/lib/schemas'

// Query keys for consistent caching
export const attestationPonderKeys = {
  all: ['attestations-ponder'] as const,
  get: (uid: `0x${string}`) =>
    [...attestationPonderKeys.all, 'attestation', uid] as const,
  uids: (options: { limit: number; offset?: number; reverse?: boolean }) =>
    [...attestationPonderKeys.all, 'uids', options] as const,
  count: () => [...attestationPonderKeys.all, 'count'] as const,
  schemas: () => [...attestationPonderKeys.all, 'schemas'] as const,
  schema: (schemaUID: `0x${string}`) =>
    [...attestationPonderKeys.schemas(), schemaUID] as const,
  schemaCount: (schemaUID: `0x${string}`) =>
    [...attestationPonderKeys.schema(schemaUID), 'count'] as const,
  schemaUIDs: (
    schemaUID: `0x${string}`,
    options: { limit: number; offset?: number; reverse?: boolean }
  ) => [...attestationPonderKeys.schema(schemaUID), 'uids', options] as const,
}

export const attestationPonderQueries = {
  get: (uid: `0x${string}`) =>
    queryOptions({
      queryKey: attestationPonderKeys.get(uid),
      queryFn: async () => {
        if (!APIS.ponder) {
          throw new Error('Ponder API URL not configured')
        }

        const response = await fetch(`${APIS.ponder}/attestations/${uid}`)

        if (!response.ok) {
          throw new Error(
            `Failed to fetch attestation: ${response.status} ${response.statusText}`
          )
        }

        const attestation = await response.json()

        // Decode the attestation data using SchemaManager
        let decodedData
        try {
          decodedData = SchemaManager.decode(
            attestation.schema,
            attestation.data
          )
        } catch (error) {
          console.error('Error decoding attestation data', attestation, error)
          decodedData = {}
        }

        return {
          uid: attestation.uid,
          schema: attestation.schema,
          attester: attestation.attester,
          recipient: attestation.recipient,
          data: attestation.data,
          refUID:
            attestation.ref ||
            '0x0000000000000000000000000000000000000000000000000000000000000000',
          revocable: attestation.revocable || false,
          expirationTime: BigInt(attestation.expirationTime || 0),
          revocationTime: BigInt(attestation.revocationTime || 0),
          decodedData,
        }
      },
      enabled: !!uid && !!APIS.ponder,
      staleTime: 2 * 60 * 1000, // Individual attestations are relatively static once created
      gcTime: 10 * 60 * 1000, // Cache longer since they don't change often
    }),

  uids: (options: { limit: number; offset?: number; reverse?: boolean }) =>
    queryOptions({
      queryKey: attestationPonderKeys.uids(options),
      queryFn: async () => {
        if (!APIS.ponder) {
          throw new Error('Ponder API URL not configured')
        }

        const searchParams = new URLSearchParams({
          limit: options.limit.toString(),
          offset: (options.offset || 0).toString(),
          reverse: (options.reverse || false).toString(),
        })

        const response = await fetch(
          `${APIS.ponder}/attestations?${searchParams}`
        )

        if (!response.ok) {
          throw new Error(
            `Failed to fetch attestation UIDs: ${response.status} ${response.statusText}`
          )
        }

        const attestations = await response.json()

        return attestations.map((attestation: any) => ({
          uid: attestation.uid,
          timestamp: attestation.timestamp,
        }))
      },
      enabled: !!APIS.ponder,
      staleTime: 30 * 1000, // UIDs change more frequently
      gcTime: 5 * 60 * 1000, // Cache for 5 minutes
    }),

  count: queryOptions({
    queryKey: attestationPonderKeys.count(),
    queryFn: async () => {
      if (!APIS.ponder) {
        throw new Error('Ponder API URL not configured')
      }

      const response = await fetch(`${APIS.ponder}/attestations/count`)

      if (!response.ok) {
        throw new Error(
          `Failed to fetch attestation count: ${response.status} ${response.statusText}`
        )
      }

      const data = await response.json()
      return data.count
    },
    enabled: !!APIS.ponder,
    staleTime: 60 * 1000, // Count changes less frequently
    gcTime: 10 * 60 * 1000, // Cache for 10 minutes
  }),

  schemaCount: (schemaUID: Hex) =>
    queryOptions({
      queryKey: attestationPonderKeys.schemaCount(schemaUID),
      queryFn: async () => {
        if (!APIS.ponder) {
          throw new Error('Ponder API URL not configured')
        }

        const searchParams = new URLSearchParams({
          schema: schemaUID,
        })

        const response = await fetch(
          `${APIS.ponder}/attestations/count?${searchParams}`
        )

        if (!response.ok) {
          throw new Error(
            `Failed to fetch schema attestation count: ${response.status} ${response.statusText}`
          )
        }

        const data = await response.json()
        return data.count
      },
      enabled: !!schemaUID && !!APIS.ponder,
      staleTime: 60 * 1000, // Count changes less frequently
      gcTime: 10 * 60 * 1000, // Cache for 10 minutes
    }),

  schemaUIDs: (
    schemaUID: Hex,
    options: { limit: number; offset?: number; reverse?: boolean }
  ) =>
    queryOptions({
      queryKey: attestationPonderKeys.schemaUIDs(schemaUID, options),
      queryFn: async () => {
        if (!APIS.ponder) {
          throw new Error('Ponder API URL not configured')
        }

        const searchParams = new URLSearchParams({
          limit: options.limit.toString(),
          offset: (options.offset || 0).toString(),
          reverse: (options.reverse || false).toString(),
          schema: schemaUID,
        })

        const response = await fetch(
          `${APIS.ponder}/attestations?${searchParams}`
        )

        if (!response.ok) {
          throw new Error(
            `Failed to fetch schema attestation UIDs: ${response.status} ${response.statusText}`
          )
        }

        const attestations = await response.json()

        return attestations.map((attestation: any) => ({
          uid: attestation.uid,
          timestamp: attestation.timestamp,
        }))
      },
      enabled: !!schemaUID && !!APIS.ponder,
      staleTime: 30 * 1000, // UIDs change more frequently
      gcTime: 5 * 60 * 1000, // Cache for 5 minutes
    }),
}
