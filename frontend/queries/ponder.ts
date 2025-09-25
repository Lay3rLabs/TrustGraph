'use client'

import { queryOptions } from '@tanstack/react-query'

import { APIS } from '@/lib/config'

// Query keys for consistent caching
export const ponderKeys = {
  all: ['ponder'] as const,
  latestFollowerCount: () =>
    [...ponderKeys.all, 'latestFollowerCount'] as const,
  followerCounts: (options?: { minTimestamp?: number }) =>
    [...ponderKeys.all, 'followerCounts', options] as const,
}

export type FollowerCount = {
  timestamp: number
  twitterAccount: string
  followers: number
}

export const ponderQueries = {
  latestFollowerCount: queryOptions({
    queryKey: ponderKeys.latestFollowerCount(),
    queryFn: async () => {
      const response = await fetch(`${APIS.ponder}/latest-follower-count`)

      if (response.ok) {
        const { latestFollowerCount, timestamp } = (await response.json()) as {
          latestFollowerCount: number
          timestamp: number
        }

        return { latestFollowerCount, timestamp }
      } else {
        throw new Error(
          `Failed to fetch follower counts: ${response.status} ${
            response.statusText
          } (${await response.text()})`
        )
      }
    },
  }),
  followerCounts: (options?: { minTimestamp?: number }) =>
    queryOptions({
      queryKey: ponderKeys.followerCounts(options),
      queryFn: async () => {
        const response = await fetch(
          `${APIS.ponder}/followers?${new URLSearchParams(
            options?.minTimestamp
              ? { minTimestamp: BigInt(options.minTimestamp).toString() }
              : {}
          ).toString()}`
        )

        if (response.ok) {
          const { followers } = (await response.json()) as {
            followers: FollowerCount[]
          }

          const max = followers.reduce(
            (max, follower) => Math.max(max, follower.followers),
            0
          )

          return { followers, max }
        } else {
          throw new Error(
            `Failed to fetch follower counts: ${response.status} ${
              response.statusText
            } (${await response.text()})`
          )
        }
      },
    }),
}
