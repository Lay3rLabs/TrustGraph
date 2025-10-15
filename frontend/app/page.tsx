'use client'

import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

import { Button, ButtonLink } from '@/components/ui/button'
import { EXAMPLE_NETWORK } from '@/lib/network'
import { cn } from '@/lib/utils'

export default function WavsGovHome() {
  return (
    <div className="flex flex-col justify-start items-stretch md:flex-row md:items-start md:max-w-7xl md:mx-auto">
      <div className="flex flex-col items-start gap-6 max-w-full">
        <h1 className="text-2xl font-bold">
          Networks that grow at the speed of trust
        </h1>

        <p>
          TrustGraph is a governance tool that makes social trust visible and
          measurable. Participants give and receive attestations — digital
          vouches that build a trust graph. Calculated Trust Scores can be
          exported and used to inform governance decisions on external
          platforms, creating a foundation for legitimacy based on relationships
          rather than tokens.
        </p>

        <ButtonLink href={`/network/${EXAMPLE_NETWORK.id}`} size="lg">
          View Example Network
        </ButtonLink>

        <h2 className="mt-6 -mb-3">FREQUENTLY ASKED QUESTIONS</h2>
        <div className="flex flex-col items-stretch gap-3 self-stretch">
          <FrequentlyAskedQuestion
            question="What are attestations?"
            answer="Attestations are digital vouches — signed statements from one participant about another person, project, or claim. Each attestation adds to the collective trust graph, shaping reputation and governance rights."
          />
          <FrequentlyAskedQuestion
            question="How does it work?"
            answer="Participants issue, receive, and revoke attestations. These build a graph of trust, analyzed through verifiable algorithms (like PageRank) to generate a Trust Score. That score unlocks permissions such as voting, proposal submission, or role claiming in a network or funding round."
          />
          <FrequentlyAskedQuestion
            question="Why use TrustGraph?"
            answer="Because legitimacy comes from relationships, not capital. Attestations make social credibility visible, portable, and measurable—reducing sybil risk and empowering real contributors."
          />
          <FrequentlyAskedQuestion
            question="Where can I learn more?"
            answer="Explore the open-source repository, read the GG24 case study, or join the upcoming pilots to co-create the next generation of trust-based governance."
          />
        </div>
      </div>

      <div className="flex flex-row justify-center items-center grow md:w-3/5 h-[50vh] max-h-full shrink-0">
        hey
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
      className="border-2 !px-4 !py-3 !h-auto shadow-md flex flex-col items-stretch gap-4 overflow-hidden !whitespace-normal"
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
        <p className="text-sm break-words text-left animate-in fade-in-0">
          {answer}
        </p>
      )}
    </Button>
  )
}
