'use client'

import { usePonderClient } from '@ponder/react'
import { useQuery } from '@tanstack/react-query'
import { motion, useAnimation } from 'motion/react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useRef } from 'react'
import useLocalStorageState from 'use-local-storage-state'
import { useAccount } from 'wagmi'

import { Card } from '@/components/Card'
import { UsdcIcon } from '@/components/icons/UsdcIcon'
import { HyperstitionMarketList } from '@/components/prediction/HyperstitionMarketList'
import { PredictionMarketDetail } from '@/components/prediction/PredictionMarketDetail'
import { allMarkets, currentMarket } from '@/lib/hyperstition'
import { formatBigNumber } from '@/lib/utils'
import { hyperstitionQueries } from '@/queries/hyperstition'

export default function HyperstitionSlugPage() {
  const { slug: slugs = [] } = useParams<{ slug: string[] }>()
  // Only take the first slug.
  const slug = slugs[0]

  const [headerDismissed, setHeaderDismissed] = useLocalStorageState(
    'hyperstition_header_dismissed',
    {
      defaultValue: false,
    }
  )

  const ponderClient = usePonderClient()
  const { address = '0x0' } = useAccount()
  const { data: pendingRedemptions } = useQuery({
    ...hyperstitionQueries.pendingRedemptions(ponderClient, address),
    enabled: address !== '0x0',
  })

  const headerAnimation = useAnimation()
  const headerRef = useRef<HTMLDivElement>(null)

  const handleDismiss = async () => {
    await headerAnimation.start({
      maxHeight: [headerRef.current?.getBoundingClientRect().height || 300, 0],
      opacity: [1, 0],
      transition: {
        duration: 0.2,
        ease: 'easeOut',
      },
    })
    setHeaderDismissed(true)
  }

  const market = !slug
    ? currentMarket
    : allMarkets.find((market) => market.slug === slug)

  if (!market) {
    return (
      <div className="flex flex-col justify-center items-center gap-6">
        <div className="terminal-dim text-center py-8">
          ∞ MARKET NOT FOUND ∞
        </div>
        <Link
          href="/hyperstition"
          className="terminal-command text-sm hover:terminal-bright"
        >
          GO BACK
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {!headerDismissed && (
        <motion.div
          animate={headerAnimation}
          ref={headerRef}
          className="overflow-hidden"
        >
          <Card type="primary" size="lg" className="space-y-2">
            <div className="flex flex-row items-start justify-between">
              <div className="terminal-command text-lg">
                HYPERSTITION MARKET
              </div>
              <button
                onClick={handleDismiss}
                className="text-xl text-accent transition-opacity hover:opacity-80 active:opacity-70 leading-2"
              >
                ×
              </button>
            </div>
            <div className="system-message">
              Manifest reality through coordinated belief. Achieve
              hyperstitions, earn points.
            </div>
          </Card>
        </motion.div>
      )}

      {!!pendingRedemptions?.length && (
        <Card type="detail" size="md" className="space-y-1">
          <div className="terminal-command text-lg">CLAIM YOUR WINNINGS</div>
          <div className="system-message text-sm">
            You have{' '}
            <span className="text-green">{pendingRedemptions.length}</span>{' '}
            pending redemption{pendingRedemptions.length === 1 ? '' : 's'}.
          </div>

          <div className="space-y-3 mt-4">
            {pendingRedemptions.map((redemption) => (
              <Link
                key={redemption.market.slug}
                href={`/hyperstition/${redemption.market.slug}`}
                className="transition-opacity hover:opacity-70 active:opacity-50"
              >
                <Card
                  type="primary"
                  size="sm"
                  className="flex flex-row justify-between items-center"
                >
                  <p>{redemption.market.title}</p>
                  <div className="flex flex-row items-center gap-2">
                    <UsdcIcon className="w-5 h-5" />
                    <p>
                      {formatBigNumber(redemption.amount)} {redemption.symbol}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </Card>
      )}

      <PredictionMarketDetail market={market} />

      <HyperstitionMarketList
        markets={allMarkets}
        excludeMarket={market}
        title="OTHER HYPERSTITIONS"
      />
    </div>
  )
}
