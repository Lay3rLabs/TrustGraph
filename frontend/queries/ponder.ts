import { Client, count } from '@ponder/client'
import { ResolvedSchema } from '@ponder/react'
import { queryOptions } from '@tanstack/react-query'
import { Hex } from 'viem'

import { AttestationData, intoAttestationsData } from '@/lib/attestation'
import { APIS } from '@/lib/config'
import { easAttestation } from '@/ponder.schema'

// Query keys for consistent caching
export const ponderKeys = {
  all: ['ponder'] as const,
  latestMerkleTree: (snapshot: string) =>
    [...ponderKeys.all, 'latestMerkleTree', snapshot] as const,
  merkleTree: (options?: { snapshot?: string; root?: string }) =>
    [...ponderKeys.all, 'merkleTree', options] as const,
  merkleTreeEntry: (options?: {
    snapshot?: string
    root?: string
    account?: string
  }) => [...ponderKeys.all, 'merkleTreeEntry', options] as const,
  attestation: (uid: string) =>
    [...ponderKeys.all, 'attestation', uid] as const,
  attestations: (options: {
    limit: number
    offset?: number
    reverse?: boolean
    schema?: string
    attester?: string
    recipient?: string
  }) => [...ponderKeys.all, 'attestations', options] as const,
  attestationCount: (options?: {
    schema?: string
    attester?: string
    recipient?: string
  }) => [...ponderKeys.all, 'attestationCount', options] as const,
  network: (snapshot: string) =>
    [...ponderKeys.all, 'network', snapshot] as const,
  localismFundApplicationUrl: (address: string) =>
    [...ponderKeys.all, 'localismFundApplicationUrl', address] as const,
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

export type MerkleTreeEntryResponse = {
  entry: {
    account: string
    value: string
    proof: string[]
  }
}

export type AttestationUID = {
  uid: `0x${string}`
  timestamp: number
}

export type NetworkData = {
  accounts: {
    account: Hex
    value: string
    sent: number
    received: number
  }[]
  attestations: AttestationData[]
}

export const ponderQueries = {
  latestMerkleTree: (snapshot: string) =>
    queryOptions({
      queryKey: ponderKeys.latestMerkleTree(snapshot),
      queryFn: async () => {
        const response = await fetch(
          `${APIS.ponder}/merkle/${snapshot}/current`
        )

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
  merkleTree: (options?: { snapshot?: string; root?: string }) =>
    queryOptions({
      queryKey: ponderKeys.merkleTree(options),
      queryFn: async () => {
        if (!options?.root) {
          throw new Error('Root is required for merkle tree query')
        }

        const response = await fetch(
          `${APIS.ponder}/merkle/${options.snapshot}/${options.root}`
        )

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
          if (response.status === 404) {
            return null
          }

          throw new Error(
            `Failed to fetch merkle tree: ${response.status} ${
              response.statusText
            } (${await response.text()})`
          )
        }
      },
      enabled: !!options?.snapshot && !!options?.root && !!APIS.ponder,
    }),
  merkleTreeEntry: (options?: {
    snapshot?: string
    root?: string
    account?: string
  }) =>
    queryOptions({
      queryKey: ponderKeys.merkleTreeEntry(options),
      queryFn: async () => {
        if (!options?.root) {
          throw new Error('Root is required for merkle tree query')
        }
        if (!options?.account) {
          throw new Error('Account is required for merkle tree entry query')
        }

        const response = await fetch(
          `${APIS.ponder}/merkle/${options.snapshot}/${options.root}/${options.account}`
        )

        if (response.ok) {
          const { entry } = (await response.json()) as MerkleTreeEntryResponse
          return entry
        } else {
          if (response.status === 404) {
            return null
          }

          throw new Error(
            `Failed to fetch merkle tree entry: ${response.status} ${
              response.statusText
            } (${await response.text()})`
          )
        }
      },
      enabled:
        !!options?.snapshot &&
        !!options?.root &&
        !!options?.account &&
        !!APIS.ponder,
    }),
  network: (snapshot: string) =>
    queryOptions({
      queryKey: ponderKeys.network(snapshot),
      queryFn: async (): Promise<NetworkData> => {
        const response = await fetch(`${APIS.ponder}/network/${snapshot}`)

        if (response.ok) {
          const data = await response.json()

          return {
            accounts: data.accounts,
            attestations: intoAttestationsData(
              data.attestations as (typeof easAttestation.$inferSelect)[]
            ),
          }
        } else {
          throw new Error(
            `Failed to fetch network: ${response.status} ${
              response.statusText
            } (${await response.text()})`
          )
        }
      },
      enabled: !!APIS.ponder,
    }),
  localismFundApplicationUrl: (address: string) =>
    queryOptions({
      queryKey: ponderKeys.localismFundApplicationUrl(address),
      queryFn: async () => {
        const response = await fetch(
          `${APIS.ponder}/localism-fund/applications/${address}`
        )

        if (response.ok) {
          const { url } = (await response.json()) as {
            url: string
          }
          return url
        } else {
          if (response.status === 404) {
            return null
          }

          throw new Error(
            `Failed to fetch Localism Fund application: ${response.status} ${
              response.statusText
            } (${await response.text()})`
          )
        }
      },
      enabled: !!address && !!APIS.ponder,
    }),
}

export const ponderQueryFns = {
  getAttestation: (uid: Hex) => (db: Client<ResolvedSchema>['db']) =>
    db.query.easAttestation.findFirst({
      where: (t, { eq }) => eq(t.uid, uid),
    }),
  getAttestationsGiven: (address: Hex) => (db: Client<ResolvedSchema>['db']) =>
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
  getAttestationsReceived:
    (address: Hex) => (db: Client<ResolvedSchema>['db']) =>
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
  getAttestationCount: (db: Client<ResolvedSchema>['db']) =>
    db.select({ count: count(easAttestation.uid) }).from(easAttestation),
  getAttestations:
    (options: { schema?: Hex; order?: 'asc' | 'desc'; limit?: number }) =>
    (db: Client<ResolvedSchema>['db']) =>
      db.query.easAttestation.findMany({
        where: (t, { eq }) =>
          options.schema ? eq(t.schema, options.schema) : undefined,
        orderBy: (t, { asc, desc }) =>
          options.order === 'asc' ? asc(t.timestamp) : desc(t.timestamp),
        limit: options.limit ?? 100,
      }),
  getFundDistributions:
    (distributor: Hex, limit: number = 100) =>
    (db: Client<ResolvedSchema>['db']) =>
      db.query.merkleFundDistribution.findMany({
        where: (t, { eq }) => eq(t.distributor, distributor),
        orderBy: (t, { desc }) => desc(t.timestamp),
        limit,
      }),
  getFundDistributionClaims:
    (options: { distributor: Hex; account?: Hex; limit?: number }) =>
    (db: Client<ResolvedSchema>['db']) =>
      db.query.merkleFundDistributionClaim.findMany({
        where: (t, { and, eq }) =>
          and(
            eq(t.merkleFundDistributor, options.distributor),
            options.account ? eq(t.account, options.account) : undefined
          ),
        orderBy: (t, { desc }) => desc(t.timestamp),
        limit: options.limit ?? 100,
      }),
  getLatestMerkleSnapshot:
    (snapshot: Hex) => (db: Client<ResolvedSchema>['db']) =>
      db.query.merkleSnapshot.findFirst({
        where: (t, { eq }) => eq(t.address, snapshot),
        orderBy: (t, { desc }) => desc(t.timestamp),
      }),
  getFundDistributor:
    (distributor: Hex) => (db: Client<ResolvedSchema>['db']) =>
      db.query.merkleFundDistributor.findFirst({
        where: (t, { eq }) => eq(t.address, distributor),
      }),
  getGovModule: (address: Hex) => (db: Client<ResolvedSchema>['db']) =>
    db.query.merkleGovModule.findFirst({
      where: (t, { eq }) => eq(t.address, address),
    }),
  getGovModuleProposals:
    (address: Hex, limit: number = 100) =>
    (db: Client<ResolvedSchema>['db']) =>
      db.query.merkleGovModuleProposal.findMany({
        where: (t, { eq }) => eq(t.module, address),
        orderBy: (t, { desc }) => desc(t.id),
        limit,
      }),
  getGovModuleVotes:
    (options: { address: Hex; voter?: Hex; limit?: number }) =>
    (db: Client<ResolvedSchema>['db']) =>
      db.query.merkleGovModuleVote.findMany({
        where: (t, { and, eq }) =>
          and(
            eq(t.module, options.address),
            options.voter ? eq(t.voter, options.voter) : undefined
          ),
        orderBy: (t, { desc }) => desc(t.timestamp),
        limit: options.limit ?? 100,
      }),
}
