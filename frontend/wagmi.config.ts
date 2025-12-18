import { defineConfig } from '@wagmi/cli'

import { CONTRACT_CONFIG } from './lib/config'

export default defineConfig({
  out: 'lib/contracts.ts',
  contracts: Object.entries(CONTRACT_CONFIG)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, address]) => ({
      abi: require(`./abis/${name}.json`).abi,
      name,
      ...(address ? { address: address as `0x${string}` } : {}),
    })),
})
