import { useEffect, useState } from 'react'

import * as pagerank from '@/lib/wasm/pagerank/pagerank'

export const usePageRankComputerModule = (): typeof pagerank | null => {
  const [pagerankModule, setPagerankModule] = useState<typeof pagerank | null>(
    null
  )

  useEffect(() => {
    const load = async () => {
      await pagerank.default()
      setPagerankModule(pagerank)
    }

    load()
  }, [])

  return pagerankModule
}
