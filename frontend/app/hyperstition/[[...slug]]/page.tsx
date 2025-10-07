'use client'

import { motion, useAnimation } from 'motion/react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useRef } from 'react'
import useLocalStorageState from 'use-local-storage-state'

import { Card } from '@/components/Card'
import { HyperstitionMarketList } from '@/components/prediction/HyperstitionMarketList'
import { PredictionMarketDetail } from '@/components/prediction/PredictionMarketDetail'
import { allMarkets, currentMarket } from '@/lib/hyperstition'

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
          <Card type="primary" size="lg" className="space-y-2 mb-8">
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

      <PredictionMarketDetail market={market} />

      <HyperstitionMarketList
        markets={allMarkets}
        excludeMarket={market}
        title="OTHER HYPERSTITIONS"
      />
    </div>
  )
}
