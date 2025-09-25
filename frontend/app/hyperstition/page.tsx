'use client'

import { motion, useAnimation } from 'motion/react'
import { useRef } from 'react'
import useLocalStorageState from 'use-local-storage-state'

import { Card } from '@/components/Card'
import { PredictionMarketDetail } from '@/components/prediction/PredictionMarketDetail'
import { lmsrMarketMakerAddress } from '@/lib/contracts'
import { HyperstitionMarket } from '@/types'

const deadline = new Date(1759514400 * 1e3)
const markets: HyperstitionMarket[] = [
  {
    title: 'EN0VA Twitter Ascension',
    description:
      '@0xEN0VA reaches 50 Twitter followers by ' +
      deadline.toLocaleString(undefined, {
        dateStyle: 'short',
        timeStyle: 'long',
      }),
    targetValue: 100,
    incentivePool: 10_000,
    deadline,
    marketMakerAddress: lmsrMarketMakerAddress,
  },
]

export default function HyperstitionPage() {
  const [headerDismissed, setHeaderDismissed] = useLocalStorageState(
    'hyperstitionHeaderDismissed',
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

  return (
    <div>
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

      <PredictionMarketDetail market={markets[0]} />
    </div>
  )
}
