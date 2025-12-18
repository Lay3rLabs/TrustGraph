'use client'

import { ChevronDown } from 'lucide-react'
import dynamic from 'next/dynamic'
import { Suspense, useState } from 'react'

import { Button, ButtonLink } from '@/components/Button'
import { Card } from '@/components/Card'
import { Markdown } from '@/components/Markdown'
import { NetworkProvider } from '@/contexts/NetworkContext'
import { NETWORKS } from '@/lib/config'
import { cn } from '@/lib/utils'

const firstNetwork = NETWORKS[0]
if (!firstNetwork) {
  throw new Error('No networks found')
}

// Uses web2gl, which is not supported on the server
const NetworkGraph = dynamic(
  () => import('@/components/NetworkGraph').then((mod) => mod.NetworkGraph),
  {
    ssr: false,
  }
)

export default function HomePage() {
  return (
    <div className="grid grid-cols-1 justify-start items-stretch lg:grid-cols-2 lg:items-stretch gap-12">
      <div className="flex flex-col items-start gap-6">
        <h1 className="text-3xl sm:text-5xl font-bold">
          Networks that grow at the speed of trust
        </h1>

        <p>
          TrustGraph is a governance tool that makes social trust visible and
          measurable. Participants give and receive attestations — digital
          endorsements that build a TrustGraph. Calculated TrustScores can be
          exported and used to inform governance decisions on external
          platforms, creating a foundation for legitimacy based on relationships
          rather than tokens.
        </p>

        <ButtonLink
          variant="brand"
          href={`/network/${firstNetwork.id}`}
          size="lg"
        >
          View Network: {firstNetwork.name}
        </ButtonLink>

        <h2 className="mt-6 -mb-3">FREQUENTLY ASKED QUESTIONS</h2>
        <div className="flex flex-col items-stretch gap-3 self-stretch">
          <FrequentlyAskedQuestion
            question="What are attestations?"
            answer="[Attestations](https://docs.attest.org/docs/core--concepts/attestations) are digital vouches — signed statements from one participant about another person, project, or claim. Each attestation adds to the collective TrustGraph, shaping reputation and governance rights."
          />
          <FrequentlyAskedQuestion
            question="How does it work?"
            answer="Participants issue, receive, and revoke attestations. These build a graph of trust, analyzed through verifiable algorithms (like [PageRank](https://en.wikipedia.org/wiki/PageRank)) to generate a TrustScore. That score unlocks permissions such as voting, proposal submission, or role claiming in a network or funding round."
          />
          <FrequentlyAskedQuestion
            question="Why use TrustGraph?"
            answer="Because legitimacy comes from relationships, not capital. Attestations make social credibility visible, portable, and measurable—reducing sybil risk and empowering real contributors."
          />
          <FrequentlyAskedQuestion
            question="Where can I learn more?"
            answer="Explore the [open-source repository](https://github.com/Lay3rLabs/TrustGraph) or [localism fund pilot documentation](https://www.localism.fund/expert-network). Join the [Telegram community](https://trustgraph.network/support) or fill out the [Open Interest Form](https://trustgraph.network/interest)."
          />
        </div>
      </div>

      <div className="space-y-10">
        <div className="h-[66vh] lg:h-4/5">
          <Suspense fallback={null}>
            <NetworkProvider network={firstNetwork}>
              <NetworkGraph />
            </NetworkProvider>
          </Suspense>
        </div>

        <Card type="accent" size="md" className="space-y-4">
          <p className="text-sm">
            TrustGraph is currently being piloted. If you're curious about how
            it works, interested in testing early prototypes, want to use it in
            your network, or just want to stay in the loop, fill out this short
            form.
          </p>

          <ButtonLink
            href="/interest"
            target="_blank"
            rel="noopener noreferrer"
            size="sm"
            variant="outline"
          >
            Open Interest Form
          </ButtonLink>
        </Card>
      </div>
    </div>
  )
}

const FrequentlyAskedQuestion = ({
  question,
  answer,
}: {
  question: string
  answer: string
}) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Button
      variant="outline"
      className="border-2 !px-4 !py-3 !h-auto shadow-md flex flex-col items-stretch gap-4 overflow-hidden !whitespace-normal text-left"
      size="lg"
      onClick={() => setIsOpen((o) => !o)}
    >
      <div className="flex flex-row items-center justify-between gap-6">
        <span>{question}</span>
        <ChevronDown
          className={cn(
            '!w-6 !h-6 transition-transform',
            isOpen ? '-rotate-180' : 'rotate-0'
          )}
        />
      </div>

      {isOpen && (
        <Markdown className="text-sm animate-in fade-in-0">{answer}</Markdown>
      )}
    </Button>
  )
}
