import { Hex } from 'viem'

import CONFIG from '../config.json'

export const CHAIN = CONFIG.chain
export const APIS = CONFIG.apis
export const SCHEMA_CONFIG = CONFIG.schemas
export const CONTRACT_CONFIG = CONFIG.contracts
export const TRUSTED_SEEDS = CONFIG.trustedSeeds as Hex[]
