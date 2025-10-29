import { TRUSTED_SEEDS } from './config'
import { merkleSnapshotAddress } from './contracts'

export type Network = {
  id: string
  name: string
  link?: {
    prefix: string
    label: string
    href: string
  }
  about: string
  callToAction?: {
    label: string
    href: string
  }
  criteria: string
  trustedSeeds: string[]
  merkleSnapshotContract: string
}

export const LOCALISM_FUND: Network = {
  id: 'localism-fund',
  name: 'Localism Fund',
  link: {
    prefix: 'Learn more:',
    label: 'localism.fund',
    href: 'https://www.localism.fund',
  },
  about:
    'The **Localism Fund Expert Network** is a curated, peer-attested collective of practitioners advancing the intersection of **localism and Ethereum-based coordination**. Experts in the network bring proven experience across Grant-making, Web3 / Ethereum Tooling, or Localism.',
  callToAction: {
    label: 'Apply as Expert',
    href: 'https://www.localism.fund/expert-network',
  },
  criteria: `
Localism Fund Experts should meet the following criteria:

- **Expertise** — Demonstrates relevant experience or insight in at least one of the following areas: Grant-making, Web3 / Ethereum Tooling, Localism.
- **Ethical Alignment** — Commits to upholding the **[OpenCivics Ethical Standards](https://wiki.opencivics.co/OpenCivics+Network/Membership/Ethical+Standards).**
- **Contribution** — Intends to contribute constructively to the broader Localism Fund ecosystem.

By attesting, you are making **two signals of trust**. You're **vouching for inclusion**, meaning you believe this person meets the above criteria, has completed the onboarding form (appearing in the [**Expert Network Database**](https://www.localism.fund/expert-network-db)), and you believe they should be welcomed as a peer within the Localism Fund Expert Network. You're also **vouching for accuracy**, using the slider to express how confident you are in the **self-assessments** the applicant provided.
`.trim(),
  trustedSeeds: TRUSTED_SEEDS,
  merkleSnapshotContract: merkleSnapshotAddress,
}

export const NETWORKS: Network[] = [LOCALISM_FUND]

export const isTrustedSeed = ({ trustedSeeds }: Network, address: string) =>
  trustedSeeds.some((s) => s.toLowerCase() === address.toLowerCase())

export interface NetworkGraphNode {
  href: string
  label: string
  value: bigint
  x: number
  y: number
  size: number
  sent: number
  received: number
  color?: string
}

export type NetworkGraphEdge = {
  href: string
  label: string
  size: number
  type?: 'straight' | 'curved'
  curvature?: number
} & (
  | {
      parallelIndex: number
      parallelMinIndex?: number
      parallelMaxIndex: number
    }
  | {
      parallelIndex?: null
      parallelMinIndex?: null
      parallelMaxIndex?: null
    }
)
