'use client'

import { queryOptions } from '@tanstack/react-query'
import { hexToNumber } from 'viem'

import { APIS, WAVS_SERVICE_ID } from '@/lib/config'

// Query keys for consistent caching
export const pointsKeys = {
  all: ['points'] as const,
  events: (address: `0x${string}`) =>
    [...pointsKeys.all, 'events', address] as const,
}

export type PointsEvent = {
  id: string
  type: string
  timestamp?: Date
  points: number
  metadata?: Record<string, any>
}

export const pointsQueries = {
  events: (address: `0x${string}`) =>
    queryOptions({
      queryKey: pointsKeys.events(address),
      queryFn: async () => {
        const response = await fetch(
          `${APIS.wavs}/${WAVS_SERVICE_ID}/events/${address}.json`
        )

        if (response.ok) {
          const events = (await response.json()) as {
            type: string
            timestamp: number
            value: string
            metadata?: Record<string, any>
          }[]

          return events.map(
            (event, index): PointsEvent => ({
              id: index.toString(),
              type: event.type,
              timestamp: event.timestamp
                ? new Date(event.timestamp * 1000)
                : undefined,
              points: event.value.startsWith('0x')
                ? hexToNumber(event.value as `0x${string}`)
                : Number(event.value),
              metadata: event.metadata,
            })
          )
        }

        return []
      },
    }),
}
