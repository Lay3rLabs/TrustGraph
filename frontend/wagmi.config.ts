import { defineConfig } from '@wagmi/cli'

import { contracts } from './config.json'

export default defineConfig({
  out: 'lib/contracts.ts',
  contracts: Object.entries(contracts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, address]) => ({
      abi: require(`./abis/${name}.json`).abi,
      name,
      address: address as `0x${string}`,
    })),
})
