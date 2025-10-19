import { TRUSTED_SEEDS } from './config'
import { merkleSnapshotAddress } from './contracts'

export type Network = {
  id: string
  name: string
  url: string
  about: string
  criteria: string
  trustedSeeds: string[]
  merkleSnapshotContract: string
}

export const NETWORKS: Network[] = [
  {
    id: 'localism-fund',
    name: 'Localism Fund',
    url: 'https://localism.fund',
    about:
      'The Localism Fund is an experimental governance system that uses attestations to map trust relationships between community members. Participants can vouch for others through attestations, building a web of trust that informs funding decisions. The fund aims to distribute resources effectively to those who are trusted by the community.',
    criteria:
      "Attestations should speak to a participant's track record of responsible resource allocation, community building, and alignment with regenerative values. Higher trust scores are earned through consistent positive attestations from well-connected members over time. Members are expected to actively participate by both giving and receiving attestations to strengthen the network. The program emphasizes quality of relationships over quantity of connections.",
    trustedSeeds: TRUSTED_SEEDS,
    merkleSnapshotContract: merkleSnapshotAddress,
  },
]

export const EXAMPLE_NETWORK = NETWORKS[0]

export const isTrustedSeed = ({ trustedSeeds }: Network, address: string) =>
  trustedSeeds.some((s) => s.toLowerCase() === address.toLowerCase())

export interface NetworkGraphNode {
  href: string
  label: string
  x: number
  y: number
  size: number
  value: bigint
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
