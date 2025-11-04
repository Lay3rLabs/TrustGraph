import { Hex } from 'viem'

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

- **Application** — Has completed the application form and appears in the [**Expert Network Database**](https://www.localism.fund/expert-network-db).
- **Expertise** — Demonstrates relevant experience in at least one of the following areas: Grant-making, Web3 / Ethereum Tooling, Localism.
- **Professional Alignment** — Commits to upholding the [**OpenCivics Ethical Standards**](https://wiki.opencivics.co/OpenCivics+Network/Membership/Ethical+Standards).

By attesting, you're **vouching** that this person meets the above criteria, and using the slider to signal your **confidence in**:

- **Accuracy & Evidence**: Their _self-assessment is accurate, evidenced, and credible_ — with experience, expertise, and intentions that are verifiable through your direct experience with them or the evidence they've provided.
- **Fit & Alignment**: Their _experience, expertise, unique insight, and credibility_ in one or more relevant domains, as well as _professional alignment_ — including good-faith collaboration, honesty, feedback & accountability, efficacy over ego, and inclusion & listening.

Everyone helps **decentralize trust** by making honest, careful attestations.
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

export type NetworkEntry = {
  account: Hex
  ensName?: string
  value: string
  rank: number
  sent: number
  received: number
}
