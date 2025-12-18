import { Network } from './types'
import { isHexEqual } from './utils'

export const isTrustedSeed = ({ pagerank }: Network, address: string) =>
  pagerank.trustedSeeds.some((seed) => isHexEqual(seed, address))

export const isValidatedInNetwork = (
  { validatedThreshold }: Network,
  value: string | number
) => Number(value) >= validatedThreshold
