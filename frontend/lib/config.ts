import CONFIG from '../config.json'
import networks from '../networks.json'
import { Network } from './types'

export const NETWORKS = networks as Network[]

export const CHAIN = CONFIG.chain
export const APIS = CONFIG.apis
export const CONTRACT_CONFIG = CONFIG.contracts
