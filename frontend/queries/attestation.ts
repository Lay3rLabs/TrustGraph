import { queryOptions } from '@tanstack/react-query'
import { readContract } from '@wagmi/core'
import { Hex } from 'viem'

import { easAbi, wavsIndexerAbi } from '@/lib/contract-abis'
import { easAddress, wavsIndexerAddress } from '@/lib/contracts'
import { SchemaManager } from '@/lib/schemas'
import { makeWagmiConfig } from '@/lib/wagmi'

// Query keys for consistent caching
export const attestationKeys = {
  all: ['attestations'] as const,
  get: (uid: `0x${string}`) =>
    [...attestationKeys.all, 'attestation', uid] as const,
  uids: (options: { limit: number; offset?: number; reverse?: boolean }) =>
    [...attestationKeys.all, 'uids', options] as const,
  count: () => [...attestationKeys.all, 'count'] as const,
  schemas: () => [...attestationKeys.all, 'schemas'] as const,
  schema: (schemaUID: `0x${string}`) =>
    [...attestationKeys.schemas(), schemaUID] as const,
  schemaCount: (schemaUID: `0x${string}`) =>
    [...attestationKeys.schema(schemaUID), 'count'] as const,
  schemaUIDs: (
    schemaUID: `0x${string}`,
    options: { limit: number; offset?: number; reverse?: boolean }
  ) => [...attestationKeys.schema(schemaUID), 'uids', options] as const,
  attestation: (uid: string) =>
    [...attestationKeys.all, 'attestation', uid] as const,
}

export const attestationQueries = {
  get: (uid: `0x${string}`) =>
    queryOptions({
      queryKey: attestationKeys.get(uid),
      queryFn: async () => {
        const attestation = await readContract(makeWagmiConfig(), {
          address: easAddress,
          abi: easAbi,
          functionName: 'getAttestation',
          args: [uid],
        })

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
          ...attestation,
          decodedData,
        }
      },
      staleTime: 2 * 60 * 1000, // Individual attestations are relatively static once created
      gcTime: 10 * 60 * 1000, // Cache longer since they don't change often
    }),
  uids: (options: { limit: number; offset?: number; reverse?: boolean }) =>
    queryOptions({
      queryKey: attestationKeys.uids(options),
      queryFn: async () => {
        const result = await readContract(makeWagmiConfig(), {
          address: wavsIndexerAddress,
          abi: wavsIndexerAbi,
          functionName: 'getEventsByType',
          args: [
            'attestation',
            BigInt(options.offset || 0),
            BigInt(options.limit),
            options.reverse || false,
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
      staleTime: 30 * 1000, // UIDs change more frequently
      gcTime: 5 * 60 * 1000, // Cache for 5 minutes
    }),
  count: queryOptions({
    queryKey: attestationKeys.count(),
    queryFn: async () =>
      Number(
        await readContract(makeWagmiConfig(), {
          address: wavsIndexerAddress,
          abi: wavsIndexerAbi,
          functionName: 'getEventCountByType',
          args: ['attestation'],
        })
      ),
    staleTime: 60 * 1000, // Count changes less frequently
    gcTime: 10 * 60 * 1000, // Cache for 10 minutes
  }),
  schemaCount: (schemaUID: Hex) =>
    queryOptions({
      queryKey: attestationKeys.schemaCount(schemaUID),
      queryFn: async () =>
        Number(
          await readContract(makeWagmiConfig(), {
            address: wavsIndexerAddress,
            abi: wavsIndexerAbi,
            functionName: 'getEventCountByTypeAndTag',
            args: ['attestation', `schema:${schemaUID}`],
          })
        ),
      staleTime: 60 * 1000, // Count changes less frequently
      gcTime: 10 * 60 * 1000, // Cache for 10 minutes
    }),
  schemaUIDs: (
    schemaUID: Hex,
    options: { limit: number; offset?: number; reverse?: boolean }
  ) =>
    queryOptions({
      queryKey: attestationKeys.schemaUIDs(schemaUID, options),
      queryFn: async () => {
        const result = await readContract(makeWagmiConfig(), {
          address: wavsIndexerAddress,
          abi: wavsIndexerAbi,
          functionName: 'getEventsByTypeAndTag',
          args: [
            'attestation',
            `schema:${schemaUID}`,
            BigInt(options.offset || 0),
            BigInt(options.limit),
            options.reverse || false,
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
      staleTime: 30 * 1000, // UIDs change more frequently
      gcTime: 5 * 60 * 1000, // Cache for 5 minutes
    }),
}
