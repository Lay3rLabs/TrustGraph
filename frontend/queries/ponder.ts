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
}
