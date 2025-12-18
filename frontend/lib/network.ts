import { Network } from './types'
import { isHexEqual } from './utils'

export const isTrustedSeed = ({ trustedSeeds }: Network, address: string) =>
  trustedSeeds.some((seed) => isHexEqual(seed, address))

export const isValidatedInNetwork = (
  { validatedThreshold }: Network,
  value: string | number
) => Number(value) >= validatedThreshold
