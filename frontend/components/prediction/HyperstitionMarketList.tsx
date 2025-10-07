'use client'

import clsx from 'clsx'
import Link from 'next/link'

import { Card } from '@/components/Card'
import { PointsIcon } from '@/components/icons/PointsIcon'
import { formatBigNumber } from '@/lib/utils'
import { HyperstitionMarket } from '@/types'

import { HyperstitionDescriptionDisplay } from './HyperstitionDescriptionDisplay'
import { HyperstitionMarketStatus } from './HyperstitionMarketStatus'

export type HyperstitionMarketListProps = {
  title: string
  markets: HyperstitionMarket[]
  excludeMarket?: HyperstitionMarket
  className?: string
}

const formatDateRange = (startDate: Date, endDate: Date): string => {
  const formatOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }

  return `${startDate.toLocaleDateString(
    undefined,
    formatOptions
  )} - ${endDate.toLocaleDateString(undefined, formatOptions)}`
}

export const HyperstitionMarketList = ({
  title,
  markets,
  excludeMarket,
  className,
}: HyperstitionMarketListProps) => {
  const sortedMarkets = markets.filter((market) => market !== excludeMarket)
  if (sortedMarkets.length === 0) {
    return null
  }

  return (
    <Card type="detail" size="lg" className={clsx('space-y-4', className)}>
      <div className="terminal-command text-lg">{title}</div>
      <div className="space-y-3 max-h-[min(50vh,20rem)] overflow-y-auto -mr-4 pr-4">
        {sortedMarkets.map((market) => {
          return (
            <Link
              key={market.slug}
              href={`/hyperstition/${market.slug}`}
              className="block group"
            >
              <Card
                type="detail"
                size="sm"
                className="hover:border-accent transition-colors group-hover:bg-terminal-bg/50"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="terminal-command text-sm group-hover:text-accent transition-colors mb-1">
                      {market.title}
                    </h4>
                    <HyperstitionDescriptionDisplay
                      description={market.description}
                      className="terminal-dim text-xs"
                    />
                    <div className="terminal-dim text-xs">
                      {formatDateRange(market.startDate, market.endDate)}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 ml-4">
                    <HyperstitionMarketStatus market={market} />
                    <div className="flex items-center gap-1 terminal-dim text-xs">
                      <PointsIcon className="w-3 h-3" />
                      {formatBigNumber(market.incentivePool)}
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>
    </Card>
  )
}
