'use client'

import { useRouter } from 'next/navigation'

import { Card } from '@/components/Card'

export default function WavsGovHome() {
  const router = useRouter()

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="max-w-4xl mx-auto space-y-12 px-6">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <h1 className="ascii-art-title text-4xl md:text-5xl lg:text-6xl">
            TRUST GRAPH
          </h1>
          <p className="terminal-dim text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Governance through emergent networks of trust
          </p>
        </div>

        {/* Problem Statement */}
        <Card type="primary" size="lg" className="space-y-6">
          <div className="space-y-4">
            <h2 className="terminal-bright text-xl md:text-2xl">
              The Challenge
            </h2>
            <p className="terminal-text text-sm md:text-base leading-relaxed">
              The current DAO governance landscape is often dependent on rigid,
              on-chain mechanisms such as token-based voting or static multi-sig
              wallets. This approach fails to capture the nuanced social
              dynamics and reputation within a network, making it susceptible to
              sybil attacks and hindering the organic growth of a trusted
              network beyond a small group of initial experts. The reliance on
              these fixed structures limits the ability to progressively
              decentralize authority and recognize the more emergent and fluid
              nature of online communities.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="terminal-bright text-xl md:text-2xl">The Context</h2>
            <p className="terminal-text text-sm md:text-base leading-relaxed">
              Gitcoin 3.0 is in the process of decentralizing its treasury
              allocation through dedicated domain allocation (DDA). This process
              involves community sense-making reports and the creation of
              specific domains and sub-rounds for funding. However, the initial
              governance of these domains remains largely centralized, overseen
              by a small group of Gitcoin core stewards and funders. This
              top-down approach, while providing structure, lacks a mechanism
              for progressively ceding authority to a broader, emergent network
              of participants and resource stewards.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="terminal-bright text-xl md:text-2xl">
              Our Approach
            </h2>
            <p className="terminal-text text-sm md:text-base leading-relaxed">
              This initiative aims to create an initial governance primitive
              based on a "web of trust" that evolves organically through
              attestations. This system will use verifiable off-chain
              computation to derive metrics such as voting power and rewards
              distribution from attestations. The long-term vision is for this
              primitive to evolve beyond simple voting, enabling more nuanced
              preference expression and collective decision-making. This system
              will allow participants to attest to their preferences, and a
              collective agent will use this data to determine outcomes.
            </p>
          </div>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={() => router.push('/attestations')}
            className="terminal-text text-base md:text-lg px-8 py-4 rounded-sm bg-accent hover:bg-accent/80 transition-all shadow-md hover:shadow-lg border border-border"
          >
            VIEW EXAMPLE NETWORK →
          </button>
        </div>

        {/* Footer Note */}
        <div className="text-center">
          <div className="system-message text-xs">
            ◆ PROGRESSIVE DECENTRALIZATION • WEB OF TRUST • ATTESTATION-BASED
            GOVERNANCE ◆
          </div>
        </div>
      </div>
    </div>
  )
}
