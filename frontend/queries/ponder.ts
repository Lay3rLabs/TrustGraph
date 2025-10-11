'use client'

import { queryOptions } from '@tanstack/react-query'

import { APIS } from '@/lib/config'

// Query keys for consistent caching
export const ponderKeys = {
  all: ['ponder'] as const,
  latestMerkleTree: () => [...ponderKeys.all, 'latestMerkleTree'] as const,
  merkleTree: (root?: string) =>
    [...ponderKeys.all, 'merkleTree', root] as const,
  attestationCounts: () => [...ponderKeys.all, 'attestationCounts'] as const,
  attestation: (uid: string) =>
    [...ponderKeys.all, 'attestation', uid] as const,
  attestations: (options: {
    limit: number
    offset?: number
    reverse?: boolean
    schema?: string
  }) => [...ponderKeys.all, 'attestations', options] as const,
  attestationCount: (schema?: string) =>
    [...ponderKeys.all, 'attestationCount', schema] as const,
}

export type FollowerCount = {
  timestamp: number
  twitterAccount: string
  followers: number
}

export type AttestationCount = {
  account: string
  sent: number
  received: number
}

export type MerkleMetadata = {
  root: string
  ipfsHash: string
  ipfsHashCid: string
  numAccounts: number
  totalValue: string
  sources: Array<{
    name: string
    metadata: any
  }>
  blockNumber: string
  timestamp: string
}

export type MerkleEntry = {
  account: string
  value: string
  proof: string[]
  sent?: number
  received?: number
}

export type MerkleTreeResponse = {
  tree: MerkleMetadata
  entries: MerkleEntry[]
}

export type AttestationData = {
  uid: `0x${string}`
  schema: `0x${string}`
  attester: `0x${string}`
  recipient: `0x${string}`
  data: `0x${string}`
  revocationTime: number
  expirationTime: number
  timestamp: number
  ref?: `0x${string}`
  revocable?: boolean
  blockNumber?: bigint
}

export type AttestationUID = {
  uid: `0x${string}`
  timestamp: number
}

export const ponderQueries = {
  latestMerkleTree: queryOptions({
    queryKey: ponderKeys.latestMerkleTree(),
    queryFn: async () => {
      const response = await fetch(`${APIS.ponder}/merkle/current`)

      if (response.ok) {
        const data = (await response.json()) as MerkleTreeResponse

        // Sort entries by value (descending) for ranking
        const sortedEntries = data.entries.sort((a, b) => {
          const aValue = BigInt(a.value)
          const bValue = BigInt(b.value)
          return bValue > aValue ? 1 : bValue < aValue ? -1 : 0
        })

        return {
          tree: data.tree,
          entries: sortedEntries,
        }
      } else {
        throw new Error(
          `Failed to fetch latest merkle tree: ${response.status} ${
            response.statusText
          } (${await response.text()})`
        )
      }
    },
    enabled: !!APIS.ponder,
  }),
  merkleTree: (root?: string) =>
    queryOptions({
      queryKey: ponderKeys.merkleTree(root),
      queryFn: async () => {
        if (!root) {
          throw new Error('Root is required for merkle tree query')
        }

        const response = await fetch(`${APIS.ponder}/merkle/${root}`)

        if (response.ok) {
          const data = (await response.json()) as MerkleTreeResponse

          // Sort entries by value (descending) for ranking
          const sortedEntries = data.entries.sort((a, b) => {
            const aValue = BigInt(a.value)
            const bValue = BigInt(b.value)
            return bValue > aValue ? 1 : bValue < aValue ? -1 : 0
          })

          return {
            tree: data.tree,
            entries: sortedEntries,
          }
        } else {
          throw new Error(
            `Failed to fetch merkle tree: ${response.status} ${
              response.statusText
            } (${await response.text()})`
          )
        }
      },
      enabled: !!root && !!APIS.ponder,
    }),
  attestationCounts: queryOptions({
    queryKey: ponderKeys.attestationCounts(),
    queryFn: async () => {
      const response = await fetch(`${APIS.ponder}/attestations/counts`)

      if (response.ok) {
        const data = (await response.json()) as {
          attestationCounts: AttestationCount[]
        }

        return data.attestationCounts
      } else {
        throw new Error(
          `Failed to fetch attestation counts: ${response.status} ${
            response.statusText
          } (${await response.text()})`
        )
      }
    },
    enabled: !!APIS.ponder,
  }),
  attestation: (uid: `0x${string}`) =>
    queryOptions({
      queryKey: ponderKeys.attestation(uid),
      queryFn: async () => {
        const response = await fetch(`${APIS.ponder}/attestations/${uid}`)

        if (response.ok) {
          const data = (await response.json()) as AttestationData
          return data
        } else {
          throw new Error(
            `Failed to fetch attestation: ${response.status} ${
              response.statusText
            } (${await response.text()})`
          )
        }
      },
      enabled: !!uid && !!APIS.ponder,
      staleTime: 2 * 60 * 1000, // Individual attestations are relatively static
      gcTime: 10 * 60 * 1000, // Cache longer since they don't change often
    }),
  attestations: (options: {
    limit: number
    offset?: number
    reverse?: boolean
    schema?: string
  }) =>
    queryOptions({
      queryKey: ponderKeys.attestations(options),
      queryFn: async () => {
        const searchParams = new URLSearchParams({
          limit: options.limit.toString(),
          offset: (options.offset || 0).toString(),
          reverse: (options.reverse || false).toString(),
        })

        if (options.schema) {
          searchParams.append('schema', options.schema)
        }

        const response = await fetch(
          `${APIS.ponder}/attestations?${searchParams}`
        )

        if (response.ok) {
          const data = (await response.json()) as AttestationUID[]
          return data
        } else {
          throw new Error(
            `Failed to fetch attestations: ${response.status} ${
              response.statusText
            } (${await response.text()})`
          )
        }
      },
      enabled: !!APIS.ponder,
      staleTime: 30 * 1000, // UIDs change more frequently
      gcTime: 5 * 60 * 1000, // Cache for 5 minutes
    }),
  attestationCount: (schema?: string) =>
    queryOptions({
      queryKey: ponderKeys.attestationCount(schema),
      queryFn: async () => {
        const searchParams = new URLSearchParams()
        if (schema) {
          searchParams.append('schema', schema)
        }

        const response = await fetch(
          `${APIS.ponder}/attestations/count?${searchParams}`
        )

        if (response.ok) {
          const data = (await response.json()) as { count: number }
          return data.count
        } else {
          throw new Error(
            `Failed to fetch attestation count: ${response.status} ${
              response.statusText
            } (${await response.text()})`
          )
        }
      },
      enabled: !!APIS.ponder,
      staleTime: 60 * 1000, // Count changes less frequently
      gcTime: 10 * 60 * 1000, // Cache for 10 minutes
    }),
}
