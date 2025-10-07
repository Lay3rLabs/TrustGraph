'use client'

import type { Client as PonderClient } from '@ponder/client'
import { ResolvedSchema } from '@ponder/react'
import { queryOptions } from '@tanstack/react-query'
import { readContract } from '@wagmi/core'
import { formatUnits } from 'viem'
import { readContractQueryOptions } from 'wagmi/query'

import { conditionalTokensAbi, erc20Abi } from '@/lib/contracts'
import { allMarkets } from '@/lib/hyperstition'
import { config } from '@/lib/wagmi'
import { HyperstitionMarket } from '@/types'

// Query keys for consistent caching
export const hyperstitionKeys = {
  all: ['hyperstition'] as const,
  pendingRedemptions: (address: `0x${string}`) =>
    [...hyperstitionKeys.all, 'pendingRedemptions', address] as const,
}

export const hyperstitionQueries = {
  pendingRedemptions: (
    ponderClient: PonderClient<ResolvedSchema>,
    address: `0x${string}`
  ) =>
    queryOptions({
      queryKey: hyperstitionKeys.pendingRedemptions(address),
      queryFn: async ({ client }) => {
        const resolvedMarkets =
          await ponderClient.db.query.predictionMarket.findMany({
            where: (t, { inArray, eq }) =>
              eq(t.isMarketResolved, true) &&
              inArray(
                t.marketMaker,
                allMarkets.map((m) => m.marketMakerAddress)
              ),
          })

        const pendingRedemptions: {
          market: HyperstitionMarket
          amount: number
          symbol: string
        }[] = []

        // Check if the user has any unredeemed shares in the resolved markets.
        for (const {
          conditionalTokens,
          collateralToken,
          marketMaker,
          result,
          yesPositionId,
          noPositionId,
        } of resolvedMarkets) {
          const market = allMarkets.find(
            (m) =>
              m.marketMakerAddress.toLowerCase() === marketMaker.toLowerCase()
          )

          if (!market) {
            continue
          }

          const [accountShares, symbol, decimals] = await Promise.all([
            // Don't cache the balanceOf call so it refreshes every time.
            readContract(config, {
              abi: conditionalTokensAbi,
              address: conditionalTokens,
              functionName: 'balanceOf',
              args: [address, result ? yesPositionId : noPositionId],
            }),

            // Cache the symbol and decimals via the query client since these do not change.
            client.fetchQuery(
              readContractQueryOptions(config, {
                abi: erc20Abi,
                address: collateralToken,
                functionName: 'symbol',
              })
            ),
            client.fetchQuery(
              readContractQueryOptions(config, {
                abi: erc20Abi,
                address: collateralToken,
                functionName: 'decimals',
              })
            ),
          ])

          if (accountShares > 0n) {
            pendingRedemptions.push({
              market,
              amount: Number(formatUnits(accountShares, decimals)),
              symbol,
            })
          }
        }

        return pendingRedemptions
      },
    }),
}
